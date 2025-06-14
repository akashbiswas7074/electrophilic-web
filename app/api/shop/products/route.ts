import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/database/actions/product.actions';
import { getAllCategories } from '@/lib/database/actions/categories.actions';
import { getAllBrands } from '@/lib/database/actions/brands.actions';
import { getUniqueSubCategoryNames, getAllSubCategories } from '@/lib/database/actions/subCategory.actions';

// Helper function to calculate total sold count for a product
const calculateTotalSoldCount = (product: any) => {
  if (!product) return 0;
  
  // Main product sold count
  const mainProductSold = typeof product.sold === 'number' ? product.sold : 0;
  
  // If the main product sold count is already populated, use it directly
  if (mainProductSold > 0) {
    return mainProductSold;
  }
  
  // Otherwise, calculate from subproducts (if any)
  let subProductsSold = 0;
  if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
    subProductsSold = product.subProducts.reduce((total: number, subProduct: any) => {
      // First check if subProduct has a sold count
      if (typeof subProduct.sold === 'number' && subProduct.sold > 0) {
        return total + subProduct.sold;
      }
      
      // Otherwise calculate from sizes
      let sizesSold = 0;
      if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
        sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
          return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
        }, 0);
      }
      return total + sizesSold;
    }, 0);
  }
  
  // Use the most reliable value
  return subProductsSold > 0 ? subProductsSold : 0;
};

// Helper function to determine bestsellers
const markBestsellers = (products: any[]) => {
  if (!products || products.length === 0) return products;
  
  // Calculate sold count for each product and sort
  const productsWithSoldCount = products.map(product => ({
    ...product,
    totalSold: calculateTotalSoldCount(product)
  }));
  
  // Sort by sold count to find bestsellers
  const sortedBySales = [...productsWithSoldCount].sort((a, b) => b.totalSold - a.totalSold);
  
  // Mark top 20% or products with sales > threshold as bestsellers
  const threshold = Math.max(5, Math.ceil(products.length * 0.2)); // Top 20% or minimum 5 products
  const minSalesForBestseller = 10; // Minimum sales to be considered bestseller
  
  return productsWithSoldCount.map(product => ({
    ...product,
    isBestseller: product.totalSold >= minSalesForBestseller && 
                  sortedBySales.indexOf(sortedBySales.find(p => p._id === product._id)) < threshold
  }));
};

// Helper function to clean and transform product data for consistency 
const cleanProductData = (product: any) => {
  try {
    console.log(`Processing product: ${product.name} with ${product.subProducts?.length || 0} subProducts`);
    
    // Extract image from subProducts with better error handling
    let processedImages = [];
    let primaryImage = '';
    
    if (product.subProducts && Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      const firstSubProduct = product.subProducts[0];
      
      if (firstSubProduct && Array.isArray(firstSubProduct.images) && firstSubProduct.images.length > 0) {
        processedImages = firstSubProduct.images.map((img: any) => {
          if (typeof img === 'string') return img;
          if (img && typeof img === 'object' && img.url) return img.url;
          return '';
        }).filter(Boolean); // Remove empty strings
        
        primaryImage = processedImages[0] || '';
      }
    }
    
    // Fallback to product.image if no subProduct images
    if (!primaryImage && product.image) {
      primaryImage = typeof product.image === 'string' ? product.image : (product.image?.url || '');
      if (primaryImage) {
        processedImages = [primaryImage];
      }
    }
    
    // Final fallback to placeholder
    if (!primaryImage) {
      primaryImage = '/images/placeholder.png';
      processedImages = [primaryImage];
    }
    
    // Extract price information with better handling
    let price = 0;
    let originalPrice = 0;
    let discount = 0;
    
    if (product.subProducts && Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      const firstSubProduct = product.subProducts[0];
      
      if (firstSubProduct) {
        discount = firstSubProduct.discount || 0;
        
        // Check if subProduct has sizes for pricing
        if (firstSubProduct.sizes && Array.isArray(firstSubProduct.sizes) && firstSubProduct.sizes.length > 0) {
          const firstSize = firstSubProduct.sizes[0];
          originalPrice = firstSize.originalPrice || firstSize.price || 0;
        } else {
          // Use direct price from subProduct
          originalPrice = firstSubProduct.originalPrice || firstSubProduct.price || 0;
        }
        
        // Calculate discounted price
        price = discount > 0 
          ? originalPrice - (originalPrice * discount / 100)
          : originalPrice;
      }
    } else {
      // Fallback to main product price
      originalPrice = product.originalPrice || product.price || 0;
      price = originalPrice;
    }
    
    // Ensure category is properly formatted
    let processedCategory = product.category;
    if (typeof processedCategory === 'object' && processedCategory !== null) {
      // Keep it as is if it's already an object
    } else if (typeof processedCategory === 'string') {
      processedCategory = { _id: processedCategory };
    }
    
    // Calculate quantity from subProducts
    let totalQuantity = 0;
    if (product.subProducts && Array.isArray(product.subProducts)) {
      totalQuantity = product.subProducts.reduce((total: number, subProduct: any) => {
        if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
          return total + subProduct.sizes.reduce((sizeTotal: number, size: any) => {
            return sizeTotal + (size.qty || 0);
          }, 0);
        }
        return total + (subProduct.qty || 0);
      }, 0);
    }
    
    const cleanedProduct = {
      ...product,
      id: product._id || product.id,
      image: primaryImage,
      images: processedImages,
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      category: processedCategory,
      quantity: totalQuantity,
      // Ensure these flags are boolean
      isNew: !!product.isNew,
      isFeatured: !!(product.isFeatured || product.featured),
      isOnSale: !!(product.isOnSale || (discount && discount > 0)),
      isBestseller: !!product.isBestseller,
      // Add sold count
      sold: calculateTotalSoldCount(product),
      // Preserve subProducts for detailed view
      subProducts: product.subProducts || [],
    };
    
    console.log(`Processed product ${product.name}: price=${price}, image=${primaryImage}, quantity=${totalQuantity}`);
    return cleanedProduct;
    
  } catch (error) {
    console.error('Error cleaning product data for product:', product?.name || 'unknown', error);
    // Return a basic version of the product to avoid complete failure
    return {
      ...product,
      id: product._id || product.id,
      image: '/images/placeholder.png',
      price: 0,
      originalPrice: 0,
      discount: 0,
      quantity: 0,
      isNew: false,
      isFeatured: false,
      isOnSale: false,
      isBestseller: false,
      sold: 0,
    };
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching shop data...');
    
    // Fetch all shop data in parallel for better performance
    const [productsResult, categoriesResult, brandsResult, subcategoriesResult, allSubCategoriesResult] = await Promise.allSettled([
      getAllProducts(),
      getAllCategories(),
      getAllBrands(),
      getUniqueSubCategoryNames(),
      getAllSubCategories()
    ]);

    // Process products
    let products: any[] = [];
    if (productsResult.status === 'fulfilled') {
      console.log('Products fetched:', productsResult.value?.success ? 'success' : 'failed');
      
      if (productsResult.value?.success) {
        const rawProducts = productsResult.value.products || [];
        console.log(`Raw products count: ${rawProducts.length}`);
        
        // Clean and transform each product
        products = rawProducts.map(cleanProductData);
        
        // Mark bestsellers based on actual sales data
        products = markBestsellers(products);
        
        console.log(`Processed products count: ${products.length}`);
      }
    } else {
      console.error('Failed to fetch products:', productsResult.reason);
    }

    // Process categories
    let categories: any[] = [];
    if (categoriesResult.status === 'fulfilled') {
      const categoriesResponse = categoriesResult.value;
      console.log('Categories fetched');
      
      if (categoriesResponse?.success && Array.isArray(categoriesResponse.categories)) {
        categories = categoriesResponse.categories;
      } else if (Array.isArray(categoriesResponse)) {
        categories = categoriesResponse;
      }
      console.log(`Categories count: ${categories.length}`);
    }

    // Process brands
    let brands: any[] = [];
    if (brandsResult.status === 'fulfilled') {
      const brandsResponse = brandsResult.value;
      console.log('Brands fetched');
      
      if (brandsResponse?.success && Array.isArray(brandsResponse.brands)) {
        brands = brandsResponse.brands;
      } else if (Array.isArray(brandsResponse)) {
        brands = brandsResponse;
      }
      console.log(`Brands count: ${brands.length}`);
    }

    // Process subcategory names
    let subcategories: any[] = [];
    if (subcategoriesResult.status === 'fulfilled') {
      subcategories = subcategoriesResult.value || [];
      console.log(`Subcategory names count: ${subcategories.length}`);
    }

    // Process all subcategory details
    let allSubCategoryDetails: any[] = [];
    if (allSubCategoriesResult.status === 'fulfilled') {
      const allSubCategoriesResponse = allSubCategoriesResult.value;
      
      if (allSubCategoriesResponse?.success && Array.isArray(allSubCategoriesResponse.subCategories)) {
        allSubCategoryDetails = allSubCategoriesResponse.subCategories;
      } else if (Array.isArray(allSubCategoriesResponse)) {
        allSubCategoryDetails = allSubCategoriesResponse;
      }
      console.log(`SubCategory details count: ${allSubCategoryDetails.length}`);
    }

    // Return the complete shop data
    console.log('Returning complete shop data');
    return NextResponse.json({
      success: true,
      data: {
        products,
        categories,
        brands,
        subcategories,
        allSubCategoryDetails,
      }
    });

  } catch (error) {
    console.error('Error fetching shop data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch shop data',
        data: {
          products: [],
          categories: [],
          brands: [],
          subcategories: [],
          allSubCategoryDetails: [],
        }
      },
      { status: 500 }
    );
  }
}
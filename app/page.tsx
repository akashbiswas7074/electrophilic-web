// ISR(CACHE) - 1 HOUR
import React, { JSX } from "react"; // Modified to import JSX namespace
import StrengthTakesSweat from "@/components/shared/home/StrengthTakesSweat"; 
import BlogImages from "@/components/shared/home/BlogImages";
import NeedOfWebsite from "@/components/shared/home/NeedOfWebsite";
import Hero from "@/components/sections/Hero";
import DynamicHeroSection from "@/components/shared/home/DynamicHeroSection";
import ReviewSection from "@/components/shared/home/ReviewSection"; // Added import for ReviewSection
import {
  getAllHomeScreenOffers
} from "@/lib/database/actions/homescreenoffers.actions";
import {
  getAllFeaturedProducts,
  getNewArrivalProducts,
  getTopSellingProducts,
  getAllProducts,
} from "@/lib/database/actions/product.actions";
import { getAllSubCategories } from "@/lib/database/actions/subCategory.actions";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import ProductCarousel from "@/components/shared/home/ProductCarousel";
import { getPublicFeaturedVideos } from "@/lib/database/actions/featured.video.actions";
import { getCategorySectionsWithProducts } from "@/lib/database/actions/category-sections.actions";
import { getVisibleWebsiteSections } from "@/lib/database/actions/website.section.actions"; 
import { getActiveHeroSections } from "@/lib/database/actions/hero-section.actions";

// Import lazy loading components
import {
  LazyBestSellingProducts,
  LazyFeaturedProducts,
  LazyNewArrivals,
  LazyBannerCarousel,
  LazyCategoryShowcase,
  LazySpecialCombos,
  LazyCrazyDeals,
  LazyFeaturedShowcase,
  LazyFeaturedVideoSection,
  LazySubCategoryShowcase,
  LazyCategoryProductSection,
  LazyAllProductsSection,
  LazyToughShoeHero
} from "@/components/shared/home/LazySections";

// Define the type for an individual offer based on your HomeScreenOffer model
interface HomeScreenOfferType {
  _id: string;
  title: string;
  images: Array<{ url: string; public_id: string }>;
  offerType: "specialCombo" | "crazyDeal";
  createdAt: string; // Or Date, depending on how it's serialized
  updatedAt: string; // Or Date
}

// Add this serializer function
const serializeData = (data: any) => {
  // Handle undefined or null input gracefully
  if (data === undefined || data === null) {
    // Return null or an appropriate default (e.g., {} or []) depending on expected usage
    // Returning null is generally safer if the calling code checks for it.
    return null;
  }
  // Ensure data is not already a string that might cause issues
  // Although JSON.stringify handles most types, this adds a layer of safety.
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error during serialization:", error, "Input data:", data);
    // Return null or a default value if serialization fails
    return null;
  }
};

// Define the interface for transformed products first
interface TransformedProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  discount: number;
  isBestseller: boolean;
  isSale: boolean;
  slug: string;
  prices: number[];
  description: string;
  gallery: string[];
  sizes: { size: string; price: number; qty: number }[];
  subtitle?: string; // New: For "Sustainable Materials", "Coming Soon"
  colorCountText?: string; // New: For "1 Colour"
  sold?: number; // Add the sold property to fix the TypeScript error
  stock?: number;
  // isBestseller?: boolean; // Made optional to match ProductCard props
  isNew?: boolean; // Added optional isNew based on ProductCard props
  orderCount?: number; // Add order count for bestsellers
  isFeatured?: boolean; // Add featured property for compatibility with product components
  featured?: boolean; // Add featured property for compatibility with product components
}

// Robust product transformer that manually creates a plain object
const transformProductSafely = (product: any): TransformedProduct | null => {
  try {
    // Basic validation of the input product
    if (!product || typeof product !== 'object' || !product._id) {
      console.warn("[transformProductSafely - HomePage] Skipping invalid product data (missing product or _id):", product);
      return null;
    }

    let idString: string;
    const productIdField = product._id;

    if (typeof productIdField === 'string') {
      idString = productIdField;
    } else if (productIdField && typeof productIdField.toHexString === 'function') {
      idString = productIdField.toHexString(); // Standard for BSON/MongoDB ObjectId
    } else if (productIdField && typeof productIdField.toString === 'function') {
      idString = productIdField.toString();
      // Add a check to see if toString() returned a generic object string
      if (idString === '[object Object]') {
        console.warn(`[transformProductSafely - HomePage] Product _id.toString() resulted in '[object Object]'. ID: ${JSON.stringify(productIdField)}, Product Name: ${product.name}`);
        // Attempt to stringify the problematic ID or use a placeholder
        idString = `INVALID_ID_${JSON.stringify(productIdField)}`;
      }
    } else {
      console.error(`[transformProductSafely - HomePage] Product _id is in an unhandled format. ID: ${JSON.stringify(productIdField)}, Product Name: ${product.name}`);
      // Skip product if ID cannot be resolved
      return null;
    }
    
    if (!idString || idString.startsWith('INVALID_ID')) {
        console.error(`[transformProductSafely - HomePage] Failed to obtain a valid string ID for product. Original _id: ${JSON.stringify(product._id)}, Product Name: ${product.name}`);
        return null; // Skip product if ID is invalid
    }

    let slug = product.slug;
    if (!slug) {
      console.warn(`[transformProductSafely - HomePage] Product with ID ${idString} and name "${product.name}" is missing a slug. Generating one from name. This may cause linking issues if the database does not have a corresponding slug or if the generated slug is not unique/correct.`);
      slug = String(product.name || "").toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      if (!slug && idString) {
        console.warn(`[transformProductSafely - HomePage] Product with ID ${idString} also has no name to generate slug. Using ID as fallback slug, which will likely fail for product page navigation.`);
        slug = String(idString);
      }
    }
    if (!slug) {
        console.error(`[transformProductSafely - HomePage] Product (ID: ${idString}) is missing a slug and cannot generate one. Name: "${product.name}". Product data:`, product);
        return null;
    }

    // Use the first subProduct if available, otherwise use an empty object
    const subProduct = (Array.isArray(product.subProducts) && product.subProducts.length > 0)
      ? product.subProducts[0] || {}
      : {};

    // --- Enhanced Sizes and Price Calculation (Optional Sizes) --- 
    let sizes: { size: string; price: number; qty: number }[] = [];
    let price = 0;
    let defaultQuantity = 0;
    
    // Check if subProduct.sizes exists and is an array
    if (subProduct.sizes && Array.isArray(subProduct.sizes) && subProduct.sizes.length > 0) {
      // Process sizes if available - include sizes with empty strings but valid prices
      sizes = subProduct.sizes.map((size: any) => ({
        size: String(size?.size || ""),
        price: parseFloat(size?.price) || 0,
        qty: parseInt(size?.qty) || 0
      })).filter((size: any) => {
        // Keep sizes with valid price or quantity, even if size name is empty
        return size.price > 0 || size.qty > 0;
      });
      
      // Calculate price based on sizes
      if (sizes.length > 0) {
        const validPrices = sizes.map(s => s.price).filter(p => !isNaN(p) && p > 0);
        price = validPrices.length > 0 ? Math.min(...validPrices) : (parseFloat(subProduct.price) || parseFloat(product.price) || 0);
        // Calculate total quantity from all sizes
        defaultQuantity = sizes.reduce((total, size) => total + size.qty, 0);
      }
    } else {
      // No sizes available - use direct product/subProduct data
      const subProductPrice = typeof subProduct.price === 'number' || typeof subProduct.price === 'string' ? parseFloat(subProduct.price) : 0;
      const productPrice = typeof product.price === 'number' || typeof product.price === 'string' ? parseFloat(product.price) : 0;
      
      price = subProductPrice || productPrice || 0;
      
      // Use direct quantity/stock from product or subProduct
      const subProductQty = typeof subProduct.qty === 'number' ? subProduct.qty : 
                           typeof subProduct.qty === 'string' ? parseInt(subProduct.qty) : 0;
      const subProductStock = typeof subProduct.stock === 'number' ? subProduct.stock : 
                             typeof subProduct.stock === 'string' ? parseInt(subProduct.stock) : 0;
      const productStock = typeof product.stock === 'number' ? product.stock : 
                          typeof product.stock === 'string' ? parseInt(product.stock) : 0;
      const productQty = typeof product.qty === 'number' ? product.qty : 
                        typeof product.qty === 'string' ? parseInt(product.qty) : 0;
      
      defaultQuantity = subProductQty || subProductStock || productStock || productQty || 0;
    }

    // --- Image Handling --- 
    let mainImage = "/images/broken-link.png";
    // Determine the source of images (subProduct first, then product)
    const imagesSource = (subProduct.images && Array.isArray(subProduct.images) && subProduct.images.length > 0)
      ? subProduct.images
      : (product.images && Array.isArray(product.images) && product.images.length > 0)
      ? product.images
      : [];
    // Get the main image URL
    if (imagesSource.length > 0) {
       mainImage = typeof imagesSource[0] === 'string'
         ? imagesSource[0]
         : (imagesSource[0]?.url || "/images/broken-link.png");
    }
    // Create the gallery array
    const gallery = Array.isArray(imagesSource) ?
      imagesSource.map((img: any) => String(typeof img === 'string' ? img : (img?.url || ""))).filter(Boolean) : [];

    // --- Category Handling --- 
    let categoryValue = "";
    if (product.category) {
      // If category is an object (populated), use name or ID
      if (typeof product.category === 'object' && product.category !== null) {
        categoryValue = String(product.category.name || product.category._id || "");
      } 
      // If category is a primitive (likely an ID string)
      else {
        categoryValue = String(product.category);
      }
    }

    // Placeholder logic for subtitle and colorCountText
    // In a real scenario, these would come from product data
    let subtitle: string | undefined = undefined;
    if (product.tags?.includes("Sustainable")) {
      subtitle = "Sustainable Materials";
    } else if (product.status === "Coming Soon") {
      subtitle = "Coming Soon";
    }

    const colorCount = product.availableColors?.length || 1;
    const colorCountText = `${colorCount} Colour${colorCount > 1 ? 's' : ''}`;

    // --- Construct Plain Object --- 
    // Ensure all fields are converted to the expected primitive types
    const plainProduct: TransformedProduct = {
      id: idString, // Use the processed idString
      name: String(product.name || "Unnamed Product"),
      category: categoryValue, // Already processed string
      image: mainImage, // Already processed string
      rating: parseFloat(product.rating) || 0,
      reviews: parseInt(product.numReviews) || 0,
      price: price, // Already processed number
      originalPrice: parseFloat(subProduct.originalPrice) || price, // Fallback to calculated price
      discount: parseInt(subProduct.discount) || 0,
      isBestseller: !!product.isBestseller || (typeof product.sold === 'number' && product.sold > 5),
      isFeatured: !!product.featured, // Explicitly preserve featured status
      featured: !!product.featured, // Add both property names for compatibility
      isSale: !!subProduct.isSale,
      slug: slug, // Use the processed slug
      prices: (subProduct.sizes || [])
        .map((s: any) => parseFloat(s?.price) || 0)
        .filter((p: number) => !isNaN(p) && p > 0) // Ensure valid numbers
        .sort((a: number, b: number) => a - b),
      description: String(product.description || ""),
      gallery: gallery, // Already processed array of strings
      sizes: sizes, // Already processed array of plain objects
      subtitle: product.subtitle || subtitle, // Use direct product.subtitle if available, otherwise derived
      colorCountText: product.colorCountText || colorCountText, // Use direct if available
      sold: calculateTotalSoldCount(product), // Calculate total sold count across product, subproducts and sizes
      stock: parseInt(product.stock) || defaultQuantity, // Add the stock property
    };

    return plainProduct;

  } catch (error) {
    console.error("[transformProductSafely - HomePage] Error transforming product:", error, "Input product:", product);
    return null; // Return null on any unexpected error during transformation
  }
};

// Helper function to calculate total sold count across product, subproducts and sizes
function calculateTotalSoldCount(product: any): number {
  if (!product) return 0;
  
  // Main product sold count - handle all possible data types
  const mainProductSold = typeof product.sold === 'number' ? product.sold : 
                          typeof product.sold === 'string' ? parseInt(product.sold) : 
                          product.sold ? Number(product.sold) : 0;
  
  // If the main product sold count is already populated, use it directly
  if (mainProductSold > 0) {
    return mainProductSold;
  }
  
  // Otherwise, calculate from subproducts (if any)
  let subProductsSold = 0;
  if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
    // First check if any subProduct has a pre-calculated sold count
    const anySubProductHasSoldCount = product.subProducts.some(
      (subProduct: any) => {
        if (!subProduct) return false;
        const subProductSold = typeof subProduct.sold === 'number' ? subProduct.sold : 
                               typeof subProduct.sold === 'string' ? parseInt(subProduct.sold) : 
                               subProduct.sold ? Number(subProduct.sold) : 0;
        return subProductSold > 0;
      }
    );
    
    if (anySubProductHasSoldCount) {
      // If subProducts have their own sold counts, sum those up
      subProductsSold = product.subProducts.reduce((total: number, subProduct: any) => {
        if (!subProduct) return total;
        const subProductSold = typeof subProduct.sold === 'number' ? subProduct.sold : 
                               typeof subProduct.sold === 'string' ? parseInt(subProduct.sold) : 
                               subProduct.sold ? Number(subProduct.sold) : 0;
        return total + subProductSold;
      }, 0);
    } else {
      // If subProducts don't have sold counts, calculate from sizes
      subProductsSold = product.subProducts.reduce((total: number, subProduct: any) => {
        if (!subProduct) return total;
        let sizesSold = 0;
        if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
          sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
            if (!size) return sizesTotal;
            const sizeSold = typeof size.sold === 'number' ? size.sold : 
                            typeof size.sold === 'string' ? parseInt(size.sold) : 
                            size.sold ? Number(size.sold) : 0;
            return sizesTotal + sizeSold;
          }, 0);
        }
        return total + sizesSold;
      }, 0);
    }
  }
  
  // If there's an orderCount property available, use it as a fallback
  const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 
                     typeof product.orderCount === 'string' ? parseInt(product.orderCount) : 
                     product.orderCount ? Number(product.orderCount) : 0;
  
  // Use the most reliable value
  if (subProductsSold > 0) {
    return subProductsSold;
  } else if (orderCount > 0) {
    // Otherwise fall back to orderCount if available
    return orderCount;
  }
  
  // Default to 0 if no sold data available
  return 0;
}

// Define interface for hero sections
interface HeroSection {
  _id: string;
  title: string;
  subtitle: string;
  longDescription?: string;
  isActive: boolean;
  order: number;
  pattern: string;
  contentAlignment?: string;
  backgroundImage?: string;
  mediaUrl?: string;
  mediaType?: string;
  titleColor?: string;
  descriptionColor?: string;
  buttonTextColor?: string;
  buttonBackgroundColor?: string;
  buttons: Array<{
    _id?: string;
    label: string;
    link: string;
    variant: "primary" | "secondary" | "outline" | "ghost";
  }>;
}

// Define interface for website sections
interface WebsiteSection {
  _id: string;
  name: string;
  sectionId: string;
  isVisible: boolean;
  order: number;
  description?: string;
  categoryId?: any;
  heroSectionId?: string;
}

export default async function Home() {
  const fetchAndTransformProducts = async (fetchFunction: () => Promise<any>) => {
    const result = await fetchFunction();
    
    // Special handling for featured products which have a different structure
    if (result && result.success) {
      if (fetchFunction === getAllFeaturedProducts && Array.isArray(result.featuredProducts)) {
        return result.featuredProducts.map((product: any) => {
          // Transform product to match Hero component's expected format
          const subProduct = (Array.isArray(product.subProducts) && product.subProducts.length > 0) 
            ? product.subProducts[0] || {} : {};
          
          // Get sizes with proper format
          const sizes = (subProduct.sizes && Array.isArray(subProduct.sizes))
            ? subProduct.sizes.map((size: any) => ({
                size: String(size?.size || ""),
                price: parseFloat(size?.price) || 0,
                qty: parseInt(size?.qty) || 0
              }))
            : [];
          
          // Calculate price
          const price = sizes.length > 0 
            ? Math.min(...sizes.filter((s: { size: string; price: number; qty: number }) => s.price > 0).map((s: { size: string; price: number, qty: number }) => s.price)) || 0 
            : (parseFloat(subProduct.price) || parseFloat(product.price) || 0);
          
          // Get image
          const image = product.image || 
            (subProduct.images && Array.isArray(subProduct.images) && subProduct.images.length > 0 
              ? (typeof subProduct.images[0] === 'string' ? subProduct.images[0] : subProduct.images[0]?.url) 
              : "/placeholder.png");
          
          // Get gallery images
          const gallery = [];
          if (subProduct.images && Array.isArray(subProduct.images)) {
            for (const img of subProduct.images) {
              gallery.push(typeof img === 'string' ? img : (img?.url || ""));
            }
          }
          
          // Calculate total sold count (from main product and all subproducts)
          const mainProductSold = typeof product.sold === 'number' ? product.sold : 0;
          
          // Calculate total sold count from all subproducts (if any)
          let subProductsSold = 0;
          if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
            subProductsSold = product.subProducts.reduce((total: number, subP: any) => {
              const subProductSoldCount = typeof subP.sold === 'number' ? subP.sold : 0;
              
              // Get sold count from sizes in this subproduct
              let sizesSold = 0;
              if (subP.sizes && Array.isArray(subP.sizes)) {
                sizesSold = subP.sizes.reduce((sizesTotal: number, size: any) => {
                  return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
                }, 0);
              }
              
              return total + subProductSoldCount + sizesSold;
            }, 0);
          }
          
          // Total sold is the sum of main product sold and all subproducts (including their sizes)
          const totalSoldCount = mainProductSold + subProductsSold;
          
          return {
            id: product._id.toString(),
            name: product.name || "",
            slug: product.slug || "",
            image: image,
            price: price,
            originalPrice: parseFloat(subProduct.originalPrice) || price,
            discount: parseInt(subProduct.discount) || 0,
            rating: parseFloat(product.rating) || 0,
            reviews: parseInt(product.numReviews) || 0,
            description: product.description || "",
            gallery: gallery,
            sizes: sizes,
            color: subProduct.color || "",
            colorName: subProduct.color_name || "",
            sold: totalSoldCount, // Explicitly include the sold count
            isFeatured: true, // Explicitly set isFeatured for all products from getAllFeaturedProducts
            featured: true     // Add both property names for compatibility
          };
        }).filter(Boolean);
      }
      
      // Regular products (already have .products property)
      if (Array.isArray(result.products)) {
        return result.products.map(transformProductSafely).filter(Boolean);
      }
    }
    
    return []; // Return empty array if no results
  };

  const fetchOffers = async (fetchFunction: () => Promise<any>) => {
    const result = await fetchFunction();
    // Ensure result and result.offers are defined and result.offers are an array
    if (result && result.success && Array.isArray(result.offers)) {
      // Return the whole result object, not just serialized offers
      return result; 
    }
    // Return a default structure if fetching fails or offers are not as expected
    return { offers: [], message: result?.message || "Failed to fetch offers", success: result?.success || false };
  };

  const [
    allOffersData, 
    featuredProducts,
    newArrivals,
    topSelling,
    allProducts,
    allCategories,
    featuredVideosResult,
    subCategoriesResult,
    categorySectionsResult,
    websiteSectionsResult,
    heroSectionsResult // Add this to fetch dynamic hero sections
  ] = await Promise.all([
    fetchOffers(getAllHomeScreenOffers),
    fetchAndTransformProducts(getAllFeaturedProducts),
    fetchAndTransformProducts(getNewArrivalProducts),
    fetchAndTransformProducts(getTopSellingProducts),
    fetchAndTransformProducts(getAllProducts),
    getAllCategories().then(data => serializeData(data?.categories)),
    getPublicFeaturedVideos(),
    getAllSubCategories(),
    getCategorySectionsWithProducts(),
    getVisibleWebsiteSections(),
    getActiveHeroSections() // Add this call to fetch active hero sections
  ]);

  const featuredVideos = featuredVideosResult?.success && featuredVideosResult.videos ? serializeData(featuredVideosResult.videos) : [];
  
  // Process subcategories data
  const subCategories = subCategoriesResult?.success && subCategoriesResult.subCategories ? 
    serializeData(subCategoriesResult.subCategories) : [];

  // Process category sections data
  const categorySections = categorySectionsResult?.success && categorySectionsResult.sections ? 
    serializeData(categorySectionsResult.sections) : [];

  // Process website sections data
  const websiteSections = websiteSectionsResult?.success && websiteSectionsResult.sections ? 
    serializeData(websiteSectionsResult.sections) : [];

  // Process hero sections data
  const heroSections = heroSectionsResult?.success && heroSectionsResult.sections ? 
    serializeData(heroSectionsResult.sections) : [];

  // Filter offers for specific sections
  const specialComboOffers = Array.isArray(allOffersData?.offers)
    ? allOffersData.offers.filter((offer: HomeScreenOfferType) => offer.offerType === 'specialCombo')
    : [];
  const crazyDealOffers = Array.isArray(allOffersData?.offers)
    ? allOffersData.offers.filter((offer: HomeScreenOfferType) => offer.offerType === 'crazyDeal')
    : [];

  // Prepare props for the components
  const specialCombosData = allOffersData ? {
    ...allOffersData,
    offers: specialComboOffers,
  } : { offers: [], message: "Failed to load special combos", success: false };

  const crazyDealsData = allOffersData ? {
    ...allOffersData,
    offers: crazyDealOffers,
  } : { offers: [], message: "Failed to load crazy deals", success: false };

  // Map section IDs to their components
  const sectionComponents = {
    'banner-carousel': <LazyBannerCarousel />,
    'strength-takes-sweat': <StrengthTakesSweat />,
    'featured-products': featuredProducts.length > 0 ? (
      <LazyFeaturedProducts products={featuredProducts} />
    ) : null,
    'featured-showcase': featuredProducts.length > 0 ? (
      <LazyFeaturedShowcase
        featuredProducts={featuredProducts.slice(0, 3).map((product: TransformedProduct) => ({
          _id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.image,
        }))}
      />
    ) : null,
    'special-combos': <LazySpecialCombos comboData={specialCombosData} />,
    'category-showcase': allCategories?.length > 0 ? <LazyCategoryShowcase categories={allCategories} /> : null,
    'sub-category-showcase': subCategories?.length > 0 ? (
      <LazySubCategoryShowcase 
        subCategories={subCategories.slice(0, 3)}
        title="Shop By Collections" 
      />
    ) : null,
    'category-product-sections': categorySections.length > 0 ? (
      <>
        {categorySections.map((section: any) => (
          <LazyCategoryProductSection
            key={section._id}
            title={section.title}
            categoryName={section.category.name}
            categorySlug={section.category.slug}
            categoryImage={section.category.image}
            products={section.products}
          />
        ))}
      </>
    ) : null,
    'bestsellers': topSelling.length > 0 ? (
      <LazyBestSellingProducts />
    ) : (
      <LazyBestSellingProducts />
    ),
    'crazy-deals': <LazyCrazyDeals dealsData={crazyDealsData} />,
    'tough-shoe-hero': <LazyToughShoeHero />,
    'new-arrivals': newArrivals.length > 0 ? (
      <div id="new-arrivals">
        <LazyNewArrivals products={newArrivals} />
      </div>
    ) : (
      // Fallback: show all products as new arrivals if no specific new arrivals found
      allProducts.length > 0 ? (
        <div id="new-arrivals">
          <LazyNewArrivals products={allProducts.slice(0, 8)} />
        </div>
      ) : null
    ),
    'top-reviews': <ReviewSection />, // Added Top Reviews section component
    'featured-videos': featuredVideos && featuredVideos.length > 0 ? (
      <LazyFeaturedVideoSection videos={featuredVideos} />
    ) : null,
    'all-products': allProducts.length > 0 ? (
      <LazyAllProductsSection products={allProducts} />
    ) : null,
    'collection-highlights': (
      <div className="my-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Collection Highlights would go here */}
          </div> 
        </div>
      </div>
    ),
    // Dynamic hero sections - map each one by ID to make them individually placeable
    ...heroSections.reduce((acc: Record<string, JSX.Element>, section: any) => {
      // Create a unique section ID for each hero section (e.g., dynamic-hero-section-1)
      const uniqueSectionId = `dynamic-hero-section-${section._id}`;
      
      // Add the mapping for this specific hero section
      acc[uniqueSectionId] = <DynamicHeroSection key={section._id} data={section} />;
      
      return acc;
    }, {}),
    
    // Generic dynamic-hero-section that shows all active hero sections (for backward compatibility)
    'dynamic-hero-section': heroSections.length > 0 ? (
      <>
        {heroSections.map((section: any) => (
          <DynamicHeroSection key={section._id} data={section} />
        ))}
      </>
    ) : null,
  };

  // Render the components according to the order specified in websiteSections
  return (
    <div className="relative">
      <div className="relative z-10">
        {websiteSections && websiteSections.length > 0 ? (
          // Render sections according to configured order
          websiteSections.map((section: WebsiteSection) => {
            // Check if this is a specific hero section by ID
            if (section.sectionId.startsWith('dynamic-hero-section-') && section.heroSectionId) {
              const heroSection = heroSections.find((hs: HeroSection) => hs._id === section.heroSectionId);
              if (heroSection) {
                return (
                  <div key={section._id} id={section.sectionId}>
                    <DynamicHeroSection data={heroSection} />
                  </div>
                );
              }
              return null;
            }
            
            // Regular component rendering based on sectionId
            return (
              <div key={section._id} id={section.sectionId}>
                {sectionComponents[section.sectionId as keyof typeof sectionComponents]}
              </div>
            );
          })
        ) : (
          // Fallback to a default order if no sections are configured
          <>
            <LazyBannerCarousel />
            
            <StrengthTakesSweat />
            <div className="relative z-10">
              {featuredProducts.length > 0 ? (
                <LazyFeaturedShowcase
                  featuredProducts={featuredProducts.slice(0, 3).map((product: TransformedProduct) => ({
                    _id: product.id,
                    name: product.name,
                    slug: product.slug,
                    imageUrl: product.image,
                  }))}
                />
              ) : null}
            </div>

            <div className="relative z-0">
              <LazySpecialCombos comboData={specialCombosData} />
              {allCategories?.length > 0 && <LazyCategoryShowcase categories={allCategories} />}
              {subCategories?.length > 0 && (
                <LazySubCategoryShowcase 
                  subCategories={subCategories.slice(0, 3)}
                  title="Shop By Collections" 
                />
              )}
              
              {categorySections.length > 0 && categorySections.map((section: any) => (
                <LazyCategoryProductSection
                  key={section._id}
                  title={section.title}
                  categoryName={section.category.name}
                  categorySlug={section.category.slug}
                  categoryImage={section.category.image}
                  products={section.products}
                />
              ))}

              {topSelling.length > 0 && (
                <div id="bestsellers">
                  <LazyBestSellingProducts />
                </div>
              )}
              
              <LazyCrazyDeals dealsData={crazyDealsData} />
              <LazyToughShoeHero/>
              
              {newArrivals.length > 0 && (
                <div id="new-arrivals">
                  <LazyNewArrivals products={newArrivals} />
                </div>
              )}

              {/* Add Top Reviews Section */}
              <ReviewSection />

              {featuredVideos && featuredVideos.length > 0 && (
                <LazyFeaturedVideoSection videos={featuredVideos} />
              )}
              
              {allProducts.length > 0 && (
                <LazyAllProductsSection products={allProducts} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChevronRight, Grid, Rows3, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/utils";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import LazyProductCardSmall from "@/components/shared/product/LazyProductCardSmall";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useShop } from '../../layout'; // Import useShop from the shop layout
import { getCategoryBySlug } from "@/lib/database/actions/categories.actions";
import { getProductsByCategory } from "@/lib/database/actions/product.actions"; // Add this import

// Function to transform API product to match ProductCardSmall format
const transformProduct = (product: any) => {
  if (!product) return null;
  
  try {
    const id = product._id?.toString() || '';
    const name = product.name || 'Unnamed Product';
    const description = product.description || '';
    const category = product.category?.name || '';
    const categoryId = product.category?._id || '';
    const brandName = product.brand?.name || '';
    const brandId = product.brand?._id || '';
    const subcategory = product.subcategory?.name || product.subcategory || '';
    const slug = product.slug || name.toLowerCase().replace(/\s+/g, '-');
    
    const subProducts = Array.isArray(product.subProducts) ? product.subProducts : [];
    const firstSubProduct = subProducts.length > 0 ? subProducts[0] : null;
    
    // Calculate stock
    const stock = calculateStock(product);
    
    // Extract product image
    let image = '';
    if (product.image) {
      image = product.image;
    } else if (firstSubProduct?.images && Array.isArray(firstSubProduct.images) && firstSubProduct.images.length > 0) {
      const img = firstSubProduct.images[0];
      image = typeof img === 'string' ? img : (img?.url || '');
    } else if (firstSubProduct?.sizes && Array.isArray(firstSubProduct.sizes) && firstSubProduct.sizes.length > 0) {
      const size = firstSubProduct.sizes[0];
      if (size.images && Array.isArray(size.images) && size.images.length > 0) {
        const img = size.images[0];
        image = typeof img === 'string' ? img : (img?.url || '');
      }
    }
    if (!image) {
      image = '/images/broken-link.png';
    }
    
    // Calculate discount
    let discount = 0;
    if (firstSubProduct && typeof firstSubProduct.discount === 'number') {
      discount = firstSubProduct.discount;
    } else if (typeof product.discount === 'number') {
      discount = product.discount;
    }
    
    // Determine flags
    const isNew = product.isNew || 
      (product.createdAt && new Date().getTime() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000);
    const isBestseller = product.isBestseller || false;
    const isFeatured = product.isFeatured || product.featured || false;
    const isOnSale = discount > 0;
    
    // Calculate prices
    const { originalPrice, price } = calculatePrices(product, firstSubProduct, discount);
    
    return {
      id,
      _id: id,
      name,
      description,
      category,
      categoryId,
      subcategory,
      brandName,
      brandId,
      image,
      slug,
      price,
      originalPrice,
      discount,
      isNew,
      isBestseller,
      isFeatured,
      isOnSale,
      stock,
      sold: product.sold || 0,
    };
  } catch (error) {
    console.error("Error transforming product:", error);
    return {
      id: product._id?.toString() || '',
      _id: product._id?.toString() || '',
      name: product.name || 'Product',
      image: '/images/broken-link.png',
      price: 0,
      originalPrice: 0,
      stock: 0,
      slug: product.slug || 'product',
    };
  }
};

// Helper function to calculate product price
const calculatePrices = (product: any, firstSubProduct: any, discount: number) => {
  let originalPrice = 0;
  let price = 0;
  
  // Try to get price from subProduct sizes first
  if (firstSubProduct?.sizes && Array.isArray(firstSubProduct.sizes) && firstSubProduct.sizes.length > 0) {
    const firstSize = firstSubProduct.sizes[0];
    if (typeof firstSize.price === 'number') {
      originalPrice = firstSize.price;
    } else if (typeof firstSize.originalPrice === 'number') {
      originalPrice = firstSize.originalPrice;
    }
  } 
  
  // If no price found in sizes, try the subProduct price
  if (originalPrice === 0 && firstSubProduct) {
    if (typeof firstSubProduct.price === 'number') {
      originalPrice = firstSubProduct.price;
    } else if (typeof firstSubProduct.originalPrice === 'number') {
      originalPrice = firstSubProduct.originalPrice;
    }
  }
  
  // If still no price, try the product price
  if (originalPrice === 0) {
    if (typeof product.price === 'number') {
      originalPrice = product.price;
    } else if (typeof product.originalPrice === 'number') {
      originalPrice = product.originalPrice;
    }
  }
  
  // Calculate discounted price if there's a discount
  if (discount > 0 && originalPrice > 0) {
    price = originalPrice - (originalPrice * discount / 100);
  } else {
    price = originalPrice;
  }
  
  return { originalPrice, price };
};

// Helper function to calculate product stock
const calculateStock = (product: any) => {
  const subProducts = Array.isArray(product.subProducts) ? product.subProducts : [];
  const firstSubProduct = subProducts.length > 0 ? subProducts[0] : null;
  
  // Try to get stock from subProduct sizes first
  if (firstSubProduct?.sizes && Array.isArray(firstSubProduct.sizes) && firstSubProduct.sizes.length > 0) {
    return firstSubProduct.sizes.reduce((total: number, size: any) => total + (size.qty || 0), 0);
  }
  
  // If no sizes with stock, try the subProduct stock
  if (firstSubProduct && typeof firstSubProduct.qty === 'number') {
    return firstSubProduct.qty;
  } else if (firstSubProduct && typeof firstSubProduct.stock === 'number') {
    return firstSubProduct.stock;
  }
  
  // If no subProduct stock, try the product stock
  if (typeof product.qty === 'number') {
    return product.qty;
  } else if (typeof product.stock === 'number') {
    return product.stock;
  }
  
  return 0;
};

export default function CategoryPage() {
  const params = useParams();
  const { 
    filteredProducts, 
    loading, 
    setSelectedFilters, 
    selectedFilters,
    categories,
    setDirectProducts // Add setDirectProducts here
  } = useShop(); // Use the shop context
  
  const [category, setCategory] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const categorySlug = params?.slug as string;
  
  // Fetch category data and set the filter
  useEffect(() => {
    const loadCategory = async () => {
      try {
        if (!categorySlug) return;
        
        // Get category details
        const categoryData = await getCategoryBySlug(categorySlug);
        console.log("Category data fetched:", categoryData);
        
        if (categoryData && categoryData.success && categoryData.category) {
          setCategory(categoryData.category);
          
          // Set this category as the selected filter
          setSelectedFilters({
            ...selectedFilters,
            category: [categoryData.category._id]
          });
        } else {
          console.error("Failed to load category data:", categoryData?.message);
        }
      } catch (error) {
        handleError(error);
        console.error("Error loading category:", error);
      }
    };
    
    loadCategory();
  }, [categorySlug, setSelectedFilters, selectedFilters]);
  
  // Get products specifically for this category
  useEffect(() => {
    if (category && category._id) {
      console.log("Directly fetching products for category ID:", category._id);
      
      const fetchCategoryProducts = async () => {
        try {
          const result = await getProductsByCategory(category._id);
          if (result && result.success) {
            console.log(`Found ${result.products.length} products for category:`, category.name);
            
            // Transform products to ensure consistent interface
            const transformedProducts = result.products.map((product: any) => ({
              ...product,
              id: product._id,
            }));
            
            // Set the products directly in the shop context
            if (typeof setDirectProducts === 'function') {
              setDirectProducts(transformedProducts);
            } else {
              console.error("setDirectProducts function not available in Shop context");
            }
          } else {
            console.warn("No products found for this category:", category.name);
          }
        } catch (err) {
          console.error("Error fetching category products:", err);
        }
      };
      
      fetchCategoryProducts();
    }
  }, [category, setDirectProducts]);
  
  // Filter products specific to this category
  const categoryProducts = useMemo(() => {
    if (!category || !category._id) return [];
    
    console.log(`Filtering products for category ID: ${category._id}, name: ${category.name || 'unknown'}`);
    console.log(`Total products before filtering: ${filteredProducts.length}`);
    
    // Only return products that belong to this category
    const filtered = filteredProducts.filter(product => {
      // Skip if product is null/undefined
      if (!product) return false;
      
      // Check if product has category as an object with _id
      if (product.category && typeof product.category === 'object' && product.category._id === category._id) {
        return true;
      }
      
      // Check if the category id is directly on the product
      if (product.category === category._id) {
        return true;
      }
      
      // Check if category name is directly on the product
      const productCategory = product.category as any;
      if (typeof productCategory === 'string' && category.name) {
        if (productCategory.toLowerCase() === category.name.toLowerCase()) {
          return true;
        }
      }
      
      // Check if the category name is nested in an object
      if (productCategory && typeof productCategory === 'object' && 
          'name' in productCategory && typeof productCategory.name === 'string' && category.name) {
        if (productCategory.name.toLowerCase() === category.name.toLowerCase()) {
          return true;
        }
      }
      
      return false;
    });
    
    console.log(`Filtered ${filtered.length} products for category ${category.name || 'unknown'}`);
    return filtered;
  }, [filteredProducts, category]);
  
  // Sort products
  const sortedProducts = [...categoryProducts].sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return (a.price || 0) - (b.price || 0);
      case 'priceDesc':
        return (b.price || 0) - (a.price || 0);
      case 'nameAsc':
        return a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'newest':
      default:
        // Assuming newer products have higher IDs or you have a createdAt field
        return a._id > b._id ? -1 : 1;
    }
  });
  
  // Early return if no params - moved after all hooks
  if (!params || !categorySlug) {
    return <div>Loading...</div>;
  }
  
  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };
  
  // Get category name from slug if category object is not loaded yet
  const getCategoryName = () => {
    if (category && category.name) return category.name;
    
    // Try to find category from context
    const foundCategory = categories.find(c => c.slug === categorySlug);
    return foundCategory ? foundCategory.name : categorySlug.replace(/-/g, ' ');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight size={14} className="mx-1" />
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight size={14} className="mx-1" />
        <span className="text-gray-900 font-medium">{getCategoryName()}</span>
      </div>
      
      {/* Category Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{getCategoryName()}</h1>
        {category?.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
      </div>
      
      {/* Sorting and View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading products...' : `Showing ${sortedProducts.length} products`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="priceAsc">Price: Low to High</SelectItem>
              <SelectItem value="priceDesc">Price: High to Low</SelectItem>
              <SelectItem value="nameAsc">Name: A to Z</SelectItem>
              <SelectItem value="nameDesc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none border-r"
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode('list')}
            >
              <Rows3 size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Products Grid */}
      {loading ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="border rounded-lg p-4">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2 mb-4" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : currentProducts.length > 0 ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {currentProducts.map((product) => (
            <LazyProductCardSmall
              key={product._id}
              product={{
                ...product,
                id: product._id || product.id || '', // Ensure id is always present
                image: product.image || '/placeholder-product.png', // Ensure image is always defined
                price: product.price || 0, // Ensure price is always defined
              }}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
          <Link href="/shop">
            <Button>Browse All Products</Button>
          </Link>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Always show first and last page
                  if (page === 1 || page === totalPages) return true;
                  // Show pages around current page
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, i, arr) => {
                  // Add ellipsis
                  if (i > 0 && arr[i-1] !== page - 1) {
                    return (
                      <PaginationItem key={`ellipsis-${page}`}>
                        <span className="px-4">...</span>
                      </PaginationItem>
                    );
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => paginate(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, X, Rows3, Grid, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { type SelectedFiltersState } from "@/components/shared/shop/FilterButton";
import { getAllProducts } from "@/lib/database/actions/product.actions";
import { handleError } from "@/lib/utils";
import InfiniteProductGrid from "@/components/shared/InfiniteProductGrid";

// Define interfaces for product data structure
interface TransformedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount?: number;
  image: string;
  images: any[];
  slug: string;
  category?: string;
  categoryId: string;
  subcategory: string;
  brandId: string;
  brandName: string;
  stock: number;
  isOnSale: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  orderCount?: number;
  sold?: number;
}

// Safe product transformation function
const transformProductSafely = (product: any): TransformedProduct | null => {
  try {
    // Basic validation
    if (!product || typeof product !== 'object' || !product._id) {
      console.warn("[transformProductSafely - ShopPage] Skipping invalid product data:", product);
      return null;
    }

    // Safely convert MongoDB ObjectId to string
    const safeToString = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (value.toString) return value.toString();
      return '';
    };

    // Extract and safely convert category ID
    const getCategoryId = (category: any): string => {
      if (!category) return '';
      if (typeof category === 'string') return category;
      if (category._id) return safeToString(category._id);
      return safeToString(category);
    };

    // Extract and safely convert brand ID/name
    const getBrandInfo = (brand: any): { id: string, name: string } => {
      if (!brand) return { id: '', name: '' };
      if (typeof brand === 'string') return { id: brand, name: brand };
      if (brand._id) return { id: safeToString(brand._id), name: brand.name || '' };
      return { id: safeToString(brand), name: safeToString(brand) };
    };

    // Get the primary image from the first subproduct or any available images
    const getImageUrl = (p: any): string => {
      // Check for direct image URL in transformed product
      if (p.image && typeof p.image === 'string') return p.image;
      
      // Try to get first image from subProducts
      if (Array.isArray(p.subProducts) && p.subProducts.length > 0) {
        const firstSubProduct = p.subProducts[0];
        if (Array.isArray(firstSubProduct.images) && firstSubProduct.images.length > 0) {
          const firstImage = firstSubProduct.images[0];
          if (typeof firstImage === 'string') return firstImage;
          if (firstImage && firstImage.url) return firstImage.url;
        }
      }
      
      // Fallback to placeholder
      return '/placeholder-image.jpg';
    };

    // Calculate proper price based on discount
    const calculatePriceWithDiscount = (originalPrice: number, discount: number): number => {
      if (!originalPrice || !discount || discount <= 0) return originalPrice;
      // Fix: Round the discounted price to 2 decimal places to avoid floating point issues
      return Math.round((originalPrice * (1 - discount/100)) * 100) / 100;
    };

    // Generate a slug if not available, with logging for missing slugs
    const getSlug = (p: any): string => {
      if (p.slug && typeof p.slug === 'string' && p.slug.trim() !== '') return p.slug.trim();
      
      const name = p.name || '';
      if (name) {
        const generatedSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        console.warn(`[transformProductSafely - ShopPage] Product ID ${p._id} (Name: "${name}") missing slug. Generated: "${generatedSlug}"`);
        return generatedSlug;
      }
      // If no name and no slug, this is a critical issue.
      // Fallback to ID is unlikely to work for user-facing URLs but provides a non-empty string.
      console.error(`[transformProductSafely - ShopPage] Product ID ${p._id} missing slug and name. Cannot generate a proper slug. Falling back to ID.`);
      return safeToString(p._id); 
    };

    // Determine if the product is on sale
    const isOnSale = typeof product.discount === 'number' && product.discount > 0;

    // Correctly determine if the product is a bestseller (using isBestseller property)
    // instead of using the featured property
    const isBestseller = !!product.isBestseller;
    
    // Explicitly handle featured status by checking both possible property names
    // This ensures we properly bridge the featured flag between backend and frontend
    const isProductFeatured = 
      !!product.featured || 
      !!product.isFeatured ||
      (product._doc && (!!product._doc.featured || !!product._doc.isFeatured));
    
    const isNew = Date.now() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Get total sold count across all subproducts and the main product
    const mainProductSold = typeof product.sold === 'number' ? product.sold : 0;
    
    // If the main product sold count is already populated, use it directly
    let totalSoldCount = mainProductSold;
    
    // If main product doesn't have a sold count, calculate from subproducts
    if (mainProductSold === 0 && Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      // First check if any subProduct has a pre-calculated sold count
      const anySubProductHasSoldCount = product.subProducts.some(
        (subProduct: any) => typeof subProduct.sold === 'number' && subProduct.sold > 0
      );
      
      if (anySubProductHasSoldCount) {
        // If subProducts have their own sold counts, sum those up
        totalSoldCount = product.subProducts.reduce((total: number, subProduct: any) => {
          return total + (typeof subProduct.sold === 'number' ? subProduct.sold : 0);
        }, 0);
      } else {
        // If subProducts don't have sold counts, calculate from sizes
        totalSoldCount = product.subProducts.reduce((total: number, subProduct: any) => {
          let sizesSold = 0;
          if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
            sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
              return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
            }, 0);
          }
          return total + sizesSold;
        }, 0);
      }
    }
    
    // If there's an orderCount property available, use it as a fallback
    if (totalSoldCount === 0 && typeof product.orderCount === 'number' && product.orderCount > 0) {
      totalSoldCount = product.orderCount;
    }
    
    // Map category info
    const categoryId = getCategoryId(product.category);
    const categoryName = product.category?.name || '';
    
    // Map brand info
    const brandInfo = getBrandInfo(product.brand);

    const slug = getSlug(product);
    if (!slug) {
      console.error(`[transformProductSafely - ShopPage] Failed to obtain a slug for product ID ${product._id}. Skipping product.`);
      return null;
    }

    // Get base product price
    const basePrice = typeof product.price === 'number' ? product.price : 
             (product.subProducts && product.subProducts[0]?.sizes && product.subProducts[0].sizes[0]?.price) || 
             (product.subProducts && product.subProducts[0]?.price) || 0;
           
    // Get discount percentage
    const discountPercentage = typeof product.discount === 'number' ? product.discount : 0;
    
    // Calculate final price with discount, properly rounded
    const finalPrice = calculatePriceWithDiscount(basePrice, discountPercentage);

    return {
      id: safeToString(product._id),
      name: product.name || '',
      description: product.description || '',
      price: finalPrice,
      originalPrice: basePrice, // Add original price field
      discount: discountPercentage,
      image: getImageUrl(product),
      images: Array.isArray(product.images) ? product.images : [], // Pass images array if available
      slug: slug, // Use the processed slug
      category: categoryName,
      categoryId: categoryId,
      subcategory: Array.isArray(product.subCategories) && product.subCategories.length > 0 
        ? (product.subCategories[0]?.name || '') 
        : '',
      brandId: brandInfo.id,
      brandName: brandInfo.name,
      stock: typeof product.stock === 'number' ? product.stock : 
             (product.subProducts && product.subProducts[0]?.sizes && product.subProducts[0].sizes[0]?.qty) || 
             (product.subProducts && product.subProducts[0]?.stock) ||
             (product.subProducts && product.subProducts[0]?.qty) || 0,
      isOnSale: isOnSale,
      isBestseller: isBestseller,
      isNew: isNew,
      featured: isProductFeatured, // Add the featured property to the returned object
      isFeatured: isProductFeatured, // Add isFeatured for compatibility with other components
      sold: totalSoldCount, // Combined sold count from main product and all subproducts
      orderCount: totalSoldCount, // For backward compatibility
    };
  } catch (error) {
    console.error("[transformProductSafely - ShopPage] Error transforming product:", product, error);
    return null;
  }
};

const InfiniteShopPage = () => {
  // State for all product data
  const [initialProducts, setInitialProducts] = useState<TransformedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState<boolean>(true);
  const [itemsPerPage] = useState<number>(16); // More items per page for infinite scroll
  
  // Use these state variables to get values from URL or context when needed
  const [selectedFilters] = useState<SelectedFiltersState>({
    category: [],
    subcategory: [],
    sale: [],
    brand: [],
    bestSelling: [],
    isNew: [],
    isFeatured: [],
    inStock: [],
    price: [0, 20000],
    rating: [],
    color: [], // Add missing color property
    size: [], // Add missing size property
  });
  const [priceRange] = useState<number[]>([0, 20000]);

  // Fetch initial products only (not filter categories)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Only fetch products
        const productsResponse = await getAllProducts();
        
        // Handle products
        if (productsResponse?.success && Array.isArray(productsResponse.products)) {
          const transformedProducts = productsResponse.products
            .filter((p: any) => p && typeof p === 'object')
            .map(transformProductSafely)
            .filter((p: TransformedProduct | null) => p !== null) as TransformedProduct[];
          
          setInitialProducts(transformedProducts);
        } else {
          console.error("[InfiniteShopPage] Failed to fetch products:", productsResponse?.message || "Unknown error");
          setInitialProducts([]);
        }
      } catch (error) {
        console.error("[InfiniteShopPage] Error fetching initial data:", error);
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Function to fetch more products for infinite scroll
  const fetchMoreProducts = async (page: number, limit: number): Promise<TransformedProduct[]> => {
    try {
      // In a real implementation, you would call your API with pagination parameters
      // For now, we're simulating pagination by filtering the already loaded products
      
      // First apply all filters to get the filtered product set
      let filteredProducts = [...initialProducts];
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.description?.toLowerCase().includes(query) ||
          p.brandName?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.subcategory?.toLowerCase().includes(query)
        );
      }
      
      // Apply category filter
      if (selectedFilters.category.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedFilters.category.includes(p.categoryId));
      }
      
      // Apply subcategory filter
      if (selectedFilters.subcategory.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          p.subcategory && selectedFilters.subcategory.includes(p.subcategory)
        );
      }
      
      // Apply brand filter
      if (selectedFilters.brand.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedFilters.brand.includes(p.brandId));
      }
      
      // Apply sale filter
      if (selectedFilters.sale.includes('sale')) {
        filteredProducts = filteredProducts.filter(p => p.isOnSale);
      }
      
      // Apply bestseller filter
      if (selectedFilters.bestSelling.includes('bestseller')) {
        filteredProducts = filteredProducts.filter(p => p.isBestseller);
      }
      
      // Apply price range filter
      filteredProducts = filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
      
      // Apply sorting
      switch (sortOption) {
        case 'price-asc':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'newest':
          filteredProducts.sort((a, b) => {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            return 0;
          });
          break;
      }
      
      // Calculate pagination slice
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Return the paginated slice
      return filteredProducts.slice(startIndex, endIndex);
      
    } catch (error) {
      console.error("Error fetching more products:", error);
      return [];
    }
  };

  // Handle removing a single filter
  const handleRemoveFilter = (type: keyof SelectedFiltersState, value: string) => {
    // This would need to be connected to the layout's state management
    console.log('Remove filter:', type, value);
    // In a real implementation, this would update the URL params or a context
  };

  // Get display names for filtered values
  const getDisplayName = (type: keyof SelectedFiltersState, value: string): string => {
    // Simplify to just return the value since we don't have the category/brand data anymore
    switch (type) {
      case 'sale':
        return 'On Sale';
      case 'bestSelling':
        return 'Best Selling';
      default:
        return value;
    }
  };

  // Render active filters badges
  const renderActiveFilters = () => {
    const hasActiveFilters = 
      Object.values(selectedFilters).some(values => values.length > 0) || 
      priceRange[0] > 0 || 
      priceRange[1] < 20000;
    
    if (!hasActiveFilters) return null;
    
    return (
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {/* Render category filters */}
          {selectedFilters.category.map(value => (
            <Badge 
              key={`category-${value}`} 
              variant="outline"
              className="flex items-center gap-1 pl-3"
            >
              {getDisplayName('category', value)}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={() => handleRemoveFilter('category', value)}
              >
                <X size={14} />
              </Button>
            </Badge>
          ))}
          
          {/* Render subcategory filters */}
          {selectedFilters.subcategory.map(value => (
            <Badge 
              key={`subcategory-${value}`} 
              variant="outline"
              className="flex items-center gap-1 pl-3"
            >
              {getDisplayName('subcategory', value)}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={() => handleRemoveFilter('subcategory', value)}
              >
                <X size={14} />
              </Button>
            </Badge>
          ))}
          
          {/* Render brand filters */}
          {selectedFilters.brand.map(value => (
            <Badge 
              key={`brand-${value}`} 
              variant="outline"
              className="flex items-center gap-1 pl-3"
            >
              {getDisplayName('brand', value)}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={() => handleRemoveFilter('brand', value)}
              >
                <X size={14} />
              </Button>
            </Badge>
          ))}
          
          {/* Render sale filter */}
          {selectedFilters.sale.map(value => (
            <Badge 
              key={`sale-${value}`} 
              variant="outline"
              className="flex items-center gap-1 pl-3"
            >
              {getDisplayName('sale', value)}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={() => handleRemoveFilter('sale', value)}
              >
                <X size={14} />
              </Button>
            </Badge>
          ))}
          
          {/* Render bestselling filter */}
          {selectedFilters.bestSelling.map(value => (
            <Badge 
              key={`bestSelling-${value}`} 
              variant="outline"
              className="flex items-center gap-1 pl-3"
            >
              {getDisplayName('bestSelling', value)}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={() => handleRemoveFilter('bestSelling', value)}
              >
                <X size={14} />
              </Button>
            </Badge>
          ))}
          
          {/* Price range filter */}
          {(priceRange[0] > 0 || priceRange[1] < 20000) && (
            <Badge 
              variant="outline"
              className="flex items-center gap-1 pl-3"
            >
              ${priceRange[0]} - ${priceRange[1]}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={() => {
                  // This would be handled by the parent layout in a real implementation
                  console.log('Reset price range');
                }}
              >
                <X size={14} />
              </Button>
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Get filtered products for initial render
  const getFilteredInitialProducts = () => {
    // Similar logic to fetchMoreProducts but just for the first batch
    let filteredProducts = [...initialProducts];
    
    // Apply all filters
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.brandName?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.subcategory?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (selectedFilters.category.length > 0) {
      filteredProducts = filteredProducts.filter(p => selectedFilters.category.includes(p.categoryId));
    }
    
    // Subcategory filter
    if (selectedFilters.subcategory.length > 0) {
      filteredProducts = filteredProducts.filter(p => 
        p.subcategory && selectedFilters.subcategory.includes(p.subcategory)
      );
    }
    
    // Brand filter
    if (selectedFilters.brand.length > 0) {
      filteredProducts = filteredProducts.filter(p => selectedFilters.brand.includes(p.brandId));
    }
    
    // Sale filter
    if (selectedFilters.sale.includes('sale')) {
      filteredProducts = filteredProducts.filter(p => p.isOnSale);
    }
    
    // Bestseller filter
    if (selectedFilters.bestSelling.includes('bestseller')) {
      filteredProducts = filteredProducts.filter(p => p.isBestseller);
    }
    
    // Price range filter
    filteredProducts = filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    // Apply sorting
    switch (sortOption) {
      case 'price-asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filteredProducts.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
    }
    
    return filteredProducts.slice(0, itemsPerPage);
  };

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-black">Home</Link>
        <ChevronRight size={14} className="mx-1" />
        <span className="font-medium text-black">Shop</span>
      </div>
      
      {/* Title and results count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shop All Products</h1>
          <p className="text-gray-500 mt-1">
            Explore our collection
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>
      
      {/* Products area */}
      <div className="flex-1">
        {/* Sort controls and view options */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={sortOption}
              onValueChange={setSortOption}
            >
              <SelectTrigger className="w-full md:w-[200px] gap-2">
                <ArrowUpDown size={16} />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* View mode switcher */}
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500 hidden sm:block">View:</p>
            <div className="flex border rounded overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                aria-label="List view"
              >
                <Rows3 size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Active filters */}
        {renderActiveFilters()}
        
        {/* Products with infinite scroll */}
        {loading ? (
          // Loading skeleton
          <div className={`grid ${viewMode === 'grid' 
            ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'} gap-6`}
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex flex-col space-y-3">
                <Skeleton className="h-60 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            ))}
          </div>
        ) : (
          <InfiniteProductGrid
            initialProducts={getFilteredInitialProducts()}
            fetchMoreProducts={fetchMoreProducts}
            className="w-full"
            gridClassName="gap-x-4 gap-y-8"
            cols={{ 
              sm: viewMode === 'grid' ? 2 : 1, 
              md: viewMode === 'grid' ? 3 : 1, 
              lg: viewMode === 'grid' ? 3 : 1, 
              xl: viewMode === 'grid' ? 4 : 1 
            }}
            emptyMessage="No products match your filters"
            loadingMessage="Loading more products..."
            endMessage="You've seen all products"
            itemsPerPage={itemsPerPage}
            cardType="small"
          />
        )}
      </div>
    </div>
  );
};

export default InfiniteShopPage;
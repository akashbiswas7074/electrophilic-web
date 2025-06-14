'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Search, Grid, List, ArrowUpDown, Loader2, Filter, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import LazyProductCardSmall from "@/components/shared/product/LazyProductCardSmall";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useShop, ShopPageType } from "./layout";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getAllProducts } from "@/lib/database/actions/product.actions";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from 'next/navigation';

const ShopPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { 
    filteredProducts, 
    loading, 
    totalProducts,
    pageType,
    categories,
    currentCategorySlug,
    currentSubCategoryName,
    searchQuery,
    setSearchQuery,
    selectedFilters,
    clearAllFilters,
    brands,
    subcategories,
    setDirectProducts,
    removeFilter // Make sure we're extracting removeFilter from context
  } = useShop();

  // Local state for page-specific features
  const [sortOption, setSortOption] = useState<string>(searchParams?.get('sort') || 'featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(searchParams?.get('view') === 'list' ? 'list' : 'grid');
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams?.get('page') || '1', 10));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery || '');
  const productsPerPage = 12;

  // Debug logging to track what's happening
  useEffect(() => {
    console.log('Shop Page State:', {
      filteredProducts: filteredProducts?.length || 0,
      loading,
      totalProducts,
      pageType,
      selectedFilters
    });
  }, [filteredProducts, loading, totalProducts, pageType, selectedFilters]);

  // Load all products on initial render if needed
  useEffect(() => {
    let isMounted = true;
    
    const loadAllProducts = async () => {
      // Only load all products if we're on the main shop page and don't have products
      if ((!filteredProducts || filteredProducts.length === 0) && !loading && !isLoading) {
        console.log("Loading all products for shop page");
        setIsLoading(true);
        
        try {
          const result = await getAllProducts();
          
          // Check if component is still mounted before updating state
          if (!isMounted) return;
          
          if (result && result.success && result.products && result.products.length > 0) {
            console.log(`Loaded ${result.products.length} products for shop page`);
            
            // Transform products to ensure consistent format and avoid duplicates
            const transformedProducts = result.products
              .filter(Boolean) // Remove any null/undefined products
              .map((product: any) => ({
                ...product,
                id: product._id || product.id || '',
              }));
            
            // Use the context function to update products if available
            if (typeof setDirectProducts === 'function') {
              setDirectProducts(transformedProducts);
            } else {
              console.error("setDirectProducts function is not available");
            }
          } else {
            console.warn("No products were returned from getAllProducts");
          }
        } catch (error) {
          console.error('Error loading all products:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };
    
    // Debounce the API call to prevent multiple requests
    const timeoutId = setTimeout(() => {
      loadAllProducts();
    }, 300); // 300ms delay
    
    // Cleanup function to handle component unmount
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    
  }, []); // Empty dependency array to run only once on mount

  // Sort products based on selected option
  const sortedProducts = useMemo(() => {
    if (!Array.isArray(filteredProducts)) {
      console.log('filteredProducts is not an array:', filteredProducts);
      return [];
    }
    
    const result = [...filteredProducts];
    
    try {
      switch (sortOption) {
        case 'price-low-high':
          result.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
          break;
        case 'price-high-low':
          result.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
          break;
        case 'name-a-z':
          result.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
          break;
        case 'name-z-a':
          result.sort((a, b) => (b?.name || '').localeCompare(a?.name || ''));
          break;
        case 'newest':
          // First try to sort by createdAt date if available
          if ((result[0] as any)?.createdAt) {
            result.sort((a, b) => {
              const dateA = (a as any)?.createdAt ? new Date((a as any).createdAt).getTime() : 0;
              const dateB = (b as any)?.createdAt ? new Date((b as any).createdAt).getTime() : 0;
              return dateB - dateA;
            });
          } else {
            // Fall back to isNew flag
            result.sort((a, b) => {
              if (a?.isNew && !b?.isNew) return -1;
              if (!a?.isNew && b?.isNew) return 1;
              return 0;
            });
          }
          break;
        case 'bestseller':
          // Try to sort by sold count if available
          if (typeof (result[0] as any)?.sold === 'number') {
            result.sort((a, b) => ((b as any)?.sold || 0) - ((a as any)?.sold || 0));
          } else {
            // Fall back to isBestseller flag
            result.sort((a, b) => {
              if (a?.isBestseller && !b?.isBestseller) return -1;
              if (!a?.isBestseller && b?.isBestseller) return 1;
              return 0;
            });
          }
          break;
        case 'discount':
          result.sort((a, b) => (b?.discount || 0) - (a?.discount || 0));
          break;
        case 'featured':
        default:
          result.sort((a, b) => {
            if (a?.isFeatured && !b?.isFeatured) return -1;
            if (!a?.isFeatured && b?.isFeatured) return 1;
            return 0;
          });
          break;
      }
    } catch (e) {
      console.error('Error sorting products:', e);
    }
    
    console.log(`Sorted ${result.length} products by ${sortOption}`);
    return result;
  }, [filteredProducts, sortOption]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, productsPerPage]);

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedFilters.category.length > 0 ||
      selectedFilters.subcategory.length > 0 ||
      selectedFilters.brand.length > 0 ||
      selectedFilters.sale.length > 0 ||
      selectedFilters.bestSelling.length > 0 ||
      selectedFilters.isNew.length > 0 ||
      selectedFilters.isFeatured.length > 0
    );
  }, [searchQuery, selectedFilters]);

  // Generate pagination items
  const paginationItems = useMemo(() => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
          aria-label="Go to page 1"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue;
      
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
            aria-label={`Go to page ${i}`}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
            aria-label={`Go to page ${totalPages}`}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  }, [currentPage, totalPages]);

  // Format filters for display
  const getFilterLabel = (type: keyof typeof selectedFilters, value: string) => {
    switch (type) {
      case 'category':
        return categories.find(c => c._id === value)?.name || value;
      case 'subcategory':
        return value;
      case 'brand':
        return brands.find(b => b._id === value)?.name || value;
      case 'sale':
        return 'On Sale';
      case 'bestSelling':
        return 'Best Selling';
      case 'isNew':
        return 'New Arrival';
      case 'isFeatured':
        return 'Featured';
      default:
        return value;
    }
  };

  // Update URL when sort, view, or page changes
  useEffect(() => {
    if (!searchParams) return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (sortOption && sortOption !== 'featured') {
      params.set('sort', sortOption);
    } else {
      params.delete('sort');
    }
    
    if (viewMode === 'list') {
      params.set('view', 'list');
    } else {
      params.delete('view');
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    } else {
      params.delete('page');
    }
    
    const newQuery = params.toString();
    const path = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
    router.replace(path, { scroll: false });
  }, [sortOption, viewMode, currentPage, searchParams, router]);

  // Get title based on page type
  const getPageTitle = () => {
    if (pageType === ShopPageType.CATEGORY && currentCategorySlug) {
      const category = categories.find(c => c.slug === currentCategorySlug);
      return category?.name || 'Category';
    } else if (pageType === ShopPageType.SUBCATEGORY && currentSubCategoryName) {
      return currentSubCategoryName;
    } else {
      return 'All Products';
    }
  };

  // Get description based on page type
  const getPageDescription = () => {
    if (pageType === ShopPageType.CATEGORY && currentCategorySlug) {
      const category = categories.find(c => c.slug === currentCategorySlug);
      return (category as any)?.description || '';
    } else if (pageType === ShopPageType.SUBCATEGORY && currentSubCategoryName) {
      return `Browse our collection of ${currentSubCategoryName} products`;
    } else {
      return 'Explore our complete collection of products';
    }
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <ChevronRight size={14} className="mx-1" />
        <span className="font-medium text-gray-900">Shop</span>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{getPageTitle()}</h1>
        <p className="text-gray-600 mb-4">
          {getPageDescription()}
        </p>
        
        <p className="text-gray-600">
          {loading || isLoading ? 'Loading products...' : `${sortedProducts.length} products found`}
        </p>
      </div>

      {/* Sort and View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-gray-500" />
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-36 sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                <SelectItem value="name-a-z">Name: A to Z</SelectItem>
                <SelectItem value="name-z-a">Name: Z to A</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="bestseller">Best Sellers</SelectItem>
                <SelectItem value="discount">Highest Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <span className="text-sm text-gray-600 hidden sm:block">
            Showing {paginatedProducts.length} of {sortedProducts.length} products
          </span>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none border-r"
              aria-label="Grid view"
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
              aria-label="List view"
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Products grid/list */}
      {loading || isLoading ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className={cn(
              "bg-white rounded-lg border overflow-hidden",
              viewMode === 'list' ? "flex flex-row" : "flex flex-col"
            )}>
              <Skeleton className={cn(
                "rounded-lg",
                viewMode === 'list' ? "h-36 w-36 flex-shrink-0" : "h-60 w-full"
              )} />
              
              <div className={cn(
                "p-4 flex flex-col",
                viewMode === 'list' ? "flex-1" : ""
              )}>
                <Skeleton className="h-5 w-4/5 rounded mb-2" />
                <Skeleton className="h-4 w-2/5 rounded mb-4" />
                <div className="flex justify-between items-center mt-auto">
                  <Skeleton className="h-6 w-20 rounded" />
                  <Skeleton className="h-9 w-24 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-gray-900">No products found</h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters 
                ? "We couldn't find any products matching your search criteria. Try clearing some filters."
                : "There are no products available at the moment. Please check back later."}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} variant="outline">
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 max-w-full'
          }`}>
            {paginatedProducts.map((product) => {
              if (!product) return null;
              return (
                <LazyProductCardSmall 
                  key={product._id || product.id || product.slug} 
                  product={{
                    ...product,
                    id: product._id || product.id || '', // Ensure id property is set
                    image: product.image || '/images/placeholder.png', // Ensure image is always a string
                    price: product.price || 0, // Ensure price is always a number
                  }}
                  viewMode={viewMode}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      aria-disabled={currentPage === 1}
                      aria-label="Go to previous page"
                    />
                  </PaginationItem>
                  
                  {paginationItems}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      aria-disabled={currentPage === totalPages}
                      aria-label="Go to next page"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            {sortedProducts.length > 0 && (
              <>
                Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, sortedProducts.length)} of {sortedProducts.length} products
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default ShopPage;

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChevronRight, Grid, Rows3, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/utils";
import LazyProductCardSmall from "@/components/shared/product/LazyProductCardSmall";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useShop, ShopPageType } from '../../../layout'; // Import useShop from the shop layout
import { getCategoryBySlug } from "@/lib/database/actions/categories.actions";

export default function SubcategoryPage() {
  const params = useParams();
  const categorySlug = params?.slug as string;
  const subcategorySlug = params?.subslug as string;
  
  const { 
    filteredProducts, 
    loading, 
    setSelectedFilters, 
    selectedFilters,
    categories,
    allSubCategoryDetails,
    pageType,
    setDirectProducts
  } = useShop();
  
  const [category, setCategory] = useState<any>(null);
  const [subcategory, setSubcategory] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Convert slug to a more readable format for display
  const formatSlugToName = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Fetch category and subcategory data and set the filters
  useEffect(() => {
    const loadCategoryAndSubcategory = async () => {
      try {
        if (!categorySlug || !subcategorySlug) return;
        
        // First, get the category details
        const categoryData = await getCategoryBySlug(categorySlug);
        if (categoryData && categoryData.success && categoryData.category) {
          setCategory(categoryData.category);
          
          // Find the subcategory that matches the slug using multiple matching strategies
          const formattedSubName = formatSlugToName(subcategorySlug);
          
          // Multiple matching strategies for subcategory
          let matchingSubcategory = null;
          
          // Strategy 1: Exact match on subcategory name (case-insensitive)
          matchingSubcategory = allSubCategoryDetails.find(sub => 
            sub.name.toLowerCase() === formattedSubName.toLowerCase() && 
            (sub.parent === categoryData.category?._id || !sub.parent)
          );
          
          // Strategy 2: Check if subcategory name is contained within the slug or vice versa
          if (!matchingSubcategory) {
            matchingSubcategory = allSubCategoryDetails.find(sub => {
              const subNameLower = sub.name.toLowerCase();
              const slugLower = subcategorySlug.toLowerCase();
              return (subNameLower.includes(slugLower) || slugLower.includes(subNameLower)) && 
                     (sub.parent === categoryData.category?._id || !sub.parent);
            });
          }
          
          // Strategy 3: Find any subcategory associated with this category
          if (!matchingSubcategory) {
            matchingSubcategory = allSubCategoryDetails.find(sub => 
              sub.parent === categoryData.category?._id
            );
          }
          
          // If we found a matching subcategory, use it
          if (matchingSubcategory) {
            console.log("Found matching subcategory:", matchingSubcategory);
            setSubcategory(matchingSubcategory);
            
            // Set both category and subcategory filters
            setSelectedFilters({
              ...selectedFilters,
              category: [categoryData.category._id],
              subcategory: [matchingSubcategory.name]
            });
          } else {
            // If still no match, create a placeholder subcategory using the slug
            console.log("No matching subcategory found, creating placeholder with name:", formattedSubName);
            const placeholderSubcategory = {
              _id: 'placeholder',
              name: formattedSubName,
              slug: subcategorySlug,
              parent: categoryData.category._id
            };
            setSubcategory(placeholderSubcategory);
            setSelectedFilters({
              ...selectedFilters,
              category: [categoryData.category._id],
              subcategory: [formattedSubName]
            });
          }
        } else {
          console.error("Failed to load category data:", categoryData?.message);
        }
      } catch (error) {
        handleError(error);
        console.error("Error loading category and subcategory:", error);
      }
    };
    
    loadCategoryAndSubcategory();
  }, [categorySlug, subcategorySlug, setSelectedFilters, selectedFilters, allSubCategoryDetails]);
  
  // Filter products specific to this subcategory
  const subcategoryProducts = useMemo(() => {
    if (!subcategory || !subcategory.name) return [];
    
    // Only return products that belong to this subcategory
    return filteredProducts.filter(product => {
      // Skip if product is null/undefined
      if (!product) return false;
      
      const subcategoryName = subcategory.name.toLowerCase();
      
      // Check if subcategory is stored as an object with name
      if (product.subcategory && typeof product.subcategory === 'object' && product.subcategory.name) {
        return product.subcategory.name.toLowerCase() === subcategoryName;
      }
      
      // Check if subcategory name is stored as string
      if (typeof product.subcategory === 'string') {
        return product.subcategory.toLowerCase() === subcategoryName;
      }
      
      // Check if subcategory is in an array
      if (Array.isArray(product.subCategories)) {
        return product.subCategories.some((sc: any) => {
          if (typeof sc === 'string') return sc.toLowerCase() === subcategoryName;
          if (typeof sc === 'object' && sc.name) return sc.name.toLowerCase() === subcategoryName;
          return false;
        });
      }
      
      return false;
    });
  }, [filteredProducts, subcategory]);
  
  // Sort products
  const sortedProducts = useMemo(() => {
    return [...subcategoryProducts].sort((a, b) => {
      switch (sortBy) {
        case 'priceAsc':
          return (a.price || 0) - (b.price || 0);
        case 'priceDesc':
          return (b.price || 0) - (a.price || 0);
        case 'nameAsc':
          return (a.name || '').localeCompare(b.name || '');
        case 'nameDesc':
          return (b.name || '').localeCompare(a.name || '');
        case 'newest':
        default:
          // Assuming newer products have higher IDs or you have a createdAt field
          if ((a as any).createdAt && (b as any).createdAt) {
            return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
          }
          return a._id > b._id ? -1 : 1;
      }
    });
  }, [subcategoryProducts, sortBy]);
  
  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };
  
  // Get category and subcategory names
  const getCategoryName = () => {
    if (category && category.name) return category.name;
    return formatSlugToName(categorySlug);
  };
  
  const getSubcategoryName = () => {
    if (subcategory && subcategory.name) return subcategory.name;
    return formatSlugToName(subcategorySlug);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight size={14} className="mx-1" />
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight size={14} className="mx-1" />
        <Link 
          href={`/shop/category/${categorySlug}`} 
          className="hover:text-primary"
        >
          {getCategoryName()}
        </Link>
        <ChevronRight size={14} className="mx-1" />
        <span className="text-gray-900 font-medium">{getSubcategoryName()}</span>
      </div>
      
      {/* Subcategory Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{getSubcategoryName()}</h1>
        <p className="text-gray-600">Browse our collection of {getSubcategoryName()} products</p>
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
                price: product.price || 0, // Ensure price is always a number
                image: product.image || '/placeholder-product.png' // Use the existing image field or fallback
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
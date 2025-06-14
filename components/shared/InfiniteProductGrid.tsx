"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import LazyProductCardSmall from '@/components/shared/product/LazyProductCardSmall';
import { ProductCardSmall } from '@/components/shared/product/ProductCardSmall';
import { Skeleton } from '@/components/ui/skeleton';

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

interface InfiniteProductGridProps {
  initialProducts: TransformedProduct[];
  fetchMoreProducts: (page: number, limit: number) => Promise<TransformedProduct[]>;
  itemsPerPage: number;
  className?: string;
  gridClassName?: string;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  emptyMessage?: string;
  loadingMessage?: string;
  endMessage?: string;
  cardType?: 'small' | 'large';
}

const InfiniteProductGrid: React.FC<InfiniteProductGridProps> = ({
  initialProducts,
  fetchMoreProducts,
  itemsPerPage = 12,
  className = '',
  gridClassName = '',
  cols = { sm: 2, md: 3, lg: 4, xl: 4 },
  emptyMessage = 'No products found',
  loadingMessage = 'Loading more products...',
  endMessage = 'No more products to load',
  cardType = 'small',
}) => {
  const [products, setProducts] = useState<TransformedProduct[]>(initialProducts);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);
  const pageRef = useRef(page);

  // Update refs when state changes
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Reset when initial products change (usually due to filter changes)
  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
    setHasMore(true);
    setIsInitialized(true);
  }, [initialProducts]);

  // Function to load more products - memoized to prevent recreation
  const loadMoreProducts = useCallback(async () => {
    if (!hasMoreRef.current || loadingRef.current) return;
    
    try {
      setLoading(true);
      const nextPage = pageRef.current + 1;
      const newProducts = await fetchMoreProducts(nextPage, itemsPerPage);
      
      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchMoreProducts, itemsPerPage]);

  // Last element ref callback for infinite scrolling - stable callback
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loadingRef.current) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
        loadMoreProducts();
      }
    }, { threshold: 0.1 });
    
    if (node) {
      observer.current.observe(node);
    }
  }, []); // Remove loadMoreProducts from dependencies

  // Generate responsive grid columns - memoized
  const gridColsClass = useMemo(() => {
    const colClasses = [];
    if (cols.sm) colClasses.push(`grid-cols-${cols.sm}`);
    if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) colClasses.push(`xl:grid-cols-${cols.xl}`);
    return colClasses.join(' ');
  }, [cols]);

  // Make sure each product has the required properties to avoid errors - memoized
  const safeProducts = useMemo(() => products.map(product => ({
    ...product,
    id: product.id || '',
    name: product.name || 'Product',
    price: typeof product.price === 'number' ? product.price : 0,
    originalPrice: typeof product.originalPrice === 'number' ? product.originalPrice : 0,
    image: product.image || '/placeholder-image.jpg',
    slug: product.slug || '',
    categoryId: product.categoryId || '',
    brandId: product.brandId || '',
    brandName: product.brandName || '',
    stock: typeof product.stock === 'number' ? product.stock : 0,
    isOnSale: !!product.isOnSale,
    subcategory: product.subcategory || ''
  })), [products]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // If no products and not loading, show empty message
  if (isInitialized && products.length === 0 && !loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`grid ${gridColsClass} ${gridClassName}`}>
        {safeProducts.map((product, index) => {
          const isLastElement = index === safeProducts.length - 1;
          
          if (isLastElement) {
            return (
              <div key={product.id} ref={lastElementRef}>
                {cardType === 'small' ? (
                  <LazyProductCardSmall product={product} />
                ) : (
                  <ProductCardSmall product={product} />
                )}
              </div>
            );
          }
          
          return (
            <div key={product.id}>
              {cardType === 'small' ? (
                <LazyProductCardSmall product={product} />
              ) : (
                <ProductCardSmall product={product} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">{loadingMessage}</p>
          <div className={`grid ${gridColsClass} ${gridClassName}`}>
            {Array.from({ length: Math.min(itemsPerPage, 4) }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex flex-col space-y-3">
                <Skeleton className="h-40 sm:h-48 md:h-56 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* End of results message */}
      {!loading && !hasMore && products.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">{endMessage}</p>
        </div>
      )}
    </div>
  );
};

export default InfiniteProductGrid;
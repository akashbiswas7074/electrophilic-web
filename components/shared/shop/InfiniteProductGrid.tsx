'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProductCardSmall } from '@/components/shared/product/ProductCardSmall';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  rating: number;
  brand: string;
  isBestSelling?: boolean;
  isOnSale?: boolean;
  category: string;
  subcategory: string;
}

interface InfiniteProductGridProps {
  products: Product[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  className?: string;
  error?: string | null;
}

const InfiniteProductGrid: React.FC<InfiniteProductGridProps> = ({
  products,
  isLoading,
  hasMore,
  onLoadMore,
  className = '',
  error = null,
}) => {
  // Set up intersection observer to detect when user scrolls to bottom
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
    // Don't observe if there's an error, no more products, or loading
    skip: !!error || !hasMore || isLoading,
  });

  // When bottom of grid becomes visible, trigger load more
  useEffect(() => {
    if (inView && hasMore && !isLoading && !error) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore, error]);

  // Generate loading skeletons
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="w-full">
        <Skeleton className="w-full aspect-[3/4] rounded-md mb-2" />
        <Skeleton className="w-3/4 h-4 rounded-md mb-2" />
        <Skeleton className="w-1/2 h-4 rounded-md mb-2" />
        <Skeleton className="w-1/4 h-4 rounded-md" />
      </div>
    ));
  };

  // Transform product data to match ProductCardSmall interface
  const transformProduct = (product: Product) => ({
    id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.salePrice || product.price,
    originalPrice: product.salePrice ? product.price : undefined,
    image: product.images?.[0] || '/placeholder.png',
    category: product.category,
    isBestseller: product.isBestSelling,
    isNew: false, // You can add logic here based on creation date
    discount: product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : undefined,
  });

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Display products */}
      {products.map((product) => (
        <ProductCardSmall key={product._id} product={transformProduct(product)} />
      ))}
      
      {/* Loading state */}
      {isLoading && renderSkeletons()}
      
      {/* Error state */}
      {error && (
        <div className="col-span-full h-40 flex items-center justify-center text-red-500">
          {error}
        </div>
      )}
      
      {/* Load more trigger element */}
      {hasMore && !isLoading && !error && (
        <div ref={ref} className="col-span-full h-20 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading more products...</div>
        </div>
      )}
      
      {/* No more products */}
      {!hasMore && products.length > 0 && !error && (
        <div className="col-span-full h-20 flex items-center justify-center text-gray-500">
          No more products to load
        </div>
      )}
      
      {/* No products found */}
      {!isLoading && products.length === 0 && !error && (
        <div className="col-span-full h-40 flex items-center justify-center text-gray-500">
          No products found matching your criteria
        </div>
      )}
    </div>
  );
};

export default InfiniteProductGrid;
"use client";

import React, { useState, useEffect } from 'react';
import InfiniteScroll from '@/components/shared/InfiniteScroll';
import { LazyProductCard } from '@/components/shared/product/LazyProductCard';

interface RelatedProductsProps {
  productId: string;
  category?: string;
  initialProducts: any[];
  fetchMoreRelatedProducts: (page: number, limit: number, productId: string, category?: string) => Promise<any[]>;
  title?: string;
}

const LazyRelatedProducts: React.FC<RelatedProductsProps> = ({
  productId,
  category,
  initialProducts,
  fetchMoreRelatedProducts,
  title = "You May Also Like"
}) => {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(initialProducts.length >= 4);
  const [loading, setLoading] = useState<boolean>(false);

  const loadMoreProducts = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      const newProducts = await fetchMoreRelatedProducts(nextPage, 4, productId, category);
      
      if (newProducts && Array.isArray(newProducts) && newProducts.length > 0) {
        setProducts(prevProducts => [...prevProducts, ...newProducts]);
        setPage(nextPage);
        setHasMore(newProducts.length >= 4);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more related products:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // If there are no products, don't render anything
  if (!initialProducts || initialProducts.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-10">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      
      <InfiniteScroll
        loadMore={loadMoreProducts}
        hasMore={hasMore}
        loading={loading}
        className="w-full"
        loadingText="Loading more products..."
        endMessage=""
        threshold={200}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <LazyProductCard
              key={product.id || `related-product-${index}`}
              product={product}
              index={index}
            />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default LazyRelatedProducts;
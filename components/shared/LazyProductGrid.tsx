"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import LazyLoad from './LazyLoad';
import ProductCard from './ProductCard'; // Fixed to use default import

interface LazyProductGridProps {
  products: any[];
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gridClassName?: string;
  productClassName?: string;
}

const LazyProductGrid: React.FC<LazyProductGridProps> = ({
  products,
  cols = { sm: 2, md: 3, lg: 3, xl: 4 },
  gridClassName = '',
  productClassName = '',
}) => {
  // Generate responsive grid classes based on cols prop
  const gridCols = cn(
    `grid`,
    `grid-cols-${cols.sm || 2}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    gridClassName
  );

  return (
    <div className={gridCols}>
      {products.map((product, index) => (
        <LazyLoad
          key={product.id || `product-${index}`}
          height={400}
          loadingAnimation="skeleton"
          className={cn("product-card-container", productClassName)}
        >
          <ProductCard product={product} />
        </LazyLoad>
      ))}
    </div>
  );
};

export default LazyProductGrid;
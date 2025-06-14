"use client";

import React from 'react';
import LazyLoad from '@/components/shared/LazyLoad';
import { ProductCardSmall } from './ProductCardSmall';
import { cn } from '@/lib/utils';

interface LazyProductCardSmallProps {
  product: {
    id: string;
    name: string;
    category?: string | any; // Updated to handle object category
    image: string;
    rating?: number;
    slug: string;
    reviews?: number;
    price: number | string;
    originalPrice?: number | string;
    discount?: number | string;
    isBestseller?: boolean;
    isNew?: boolean;
    isFeatured?: boolean;
    featured?: boolean;
    createdAt?: string | Date;
    orderCount?: number;
    sold?: number;
    stock?: number;
    subProducts?: any[];
    sizes?: any[] | null;
    description?: string;
    _id?: string;
    _doc?: any;
  };
  index?: number; // For staggered loading effect
  className?: string;
  loadingAnimation?: 'spinner' | 'pulse' | 'skeleton' | 'fade';
  priority?: boolean; // Whether to load with priority (above the fold)
  viewMode?: 'grid' | 'list'; // Add support for grid or list view
}

export const LazyProductCardSmall: React.FC<LazyProductCardSmallProps> = ({
  product,
  index = 0,
  className = '',
  loadingAnimation = 'skeleton',
  priority = false,
  viewMode = 'grid', // Default to grid view
}) => {
  // Calculate animation delay for staggered effect
  const animationDelay = `${Math.min(index * 0.1, 0.8)}s`;

  // Adjust height based on view mode
  const componentHeight = viewMode === 'list' ? 200 : 350;

  return (
    <LazyLoad
      height={componentHeight}
      className={cn(
        "w-full", 
        viewMode === 'list' ? "flex" : "", 
        className
      )}
      loadingAnimation={loadingAnimation}
      loadingClassName={cn(
        "rounded-lg",
        viewMode === 'list' ? "flex" : ""
      )}
      skipLazyLoad={priority} // Skip lazy loading for priority items (above the fold)
    >
      <div 
        className="animate-fade-in w-full"
        style={{ animationDelay }}
      >
        <ProductCardSmall product={product} viewMode={viewMode} />
      </div>
    </LazyLoad>
  );
};

export default LazyProductCardSmall;
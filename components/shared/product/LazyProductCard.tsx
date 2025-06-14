"use client";

import React from 'react';
import LazyLoad from '@/components/shared/LazyLoad';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LazyProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    isFeatured?: boolean;
    isBestseller?: boolean;
    isNew?: boolean;
  };
  index?: number; // For staggered loading effect
  imageHeight?: string;
  className?: string;
}

export const LazyProductCard: React.FC<LazyProductCardProps> = ({
  product,
  index = 0,
  imageHeight = 'h-[250px]',
  className = '',
}) => {
  // Calculate animation delay for staggered effect
  const animationDelay = `${Math.min(index * 0.1, 0.8)}s`;

  return (
    <LazyLoad
      height={350}
      className={cn("w-full", className)}
      loadingAnimation="skeleton"
    >
      <div 
        className="animate-fade-in group relative flex flex-col w-full overflow-hidden rounded-lg transition-all duration-300 hover:shadow-md"
        style={{ animationDelay }}
      >
        <Link href={`/product/${product.slug}`} className="relative block overflow-hidden">
          <div className={`relative w-full ${imageHeight} bg-gray-100 rounded-t-lg`}>
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {product.discount && product.discount > 0 && (
              <span className="bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                {product.discount}% OFF
              </span>
            )}
            {product.isBestseller && (
              <span className="bg-amber-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                Bestseller
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-purple-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                Featured
              </span>
            )}
            {product.isNew && (
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                New
              </span>
            )}
          </div>
        </Link>

        <div className="p-3 flex-grow flex flex-col">
          <Link href={`/product/${product.slug}`} className="hover:underline">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
              {product.name}
            </h3>
          </Link>
          
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-gray-500 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </LazyLoad>
  );
};
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    slug: string;
    discount?: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { _id, name, price, images, slug, discount } = product;
  
  const discountedPrice = discount ? price - (price * discount / 100) : price;
  const hasDiscount = discount && discount > 0;

  return (
    <Link 
      href={`/product/${slug}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden">
        {images && images.length > 0 ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">{name}</h3>
        
        <div className="mt-auto">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
              <span className="text-sm text-gray-500 line-through">{formatPrice(price)}</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-gray-900">{formatPrice(price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
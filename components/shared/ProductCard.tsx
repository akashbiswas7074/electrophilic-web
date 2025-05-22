'use client';

import Link from 'next/link';
import Image from 'next/image'; // Import Image from next/image
import { cn } from '@/lib/utils';

// Interface matching props from shopPage.tsx
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
    discount?: number;
    originalPrice?: number;
    category?: string; // e.g., "Men's Shoes"
    // Removed colors
    isBestseller?: boolean;
    isNew?: boolean; // Or similar tag like "Just In"
  };
  layout?: 'grid' | 'list'; // Added layout prop to support grid or list view
}

const ProductCard = ({ product, layout = 'grid' }: ProductCardProps) => {
  const { 
    id, 
    name, 
    price, 
    image, 
    slug, 
    discount, 
    originalPrice, 
    category = "Shoes", // Simplified default category
    // Removed colors
    isBestseller,
    isNew
  } = product;

  const displayPrice = `₹ ${price.toLocaleString('en-IN')}`;
  const displayOriginalPrice = originalPrice && originalPrice > price ? `₹ ${originalPrice.toLocaleString('en-IN')}` : null;

  // Grid layout (default)
  if (layout === 'grid') {
    return (
      <Link href={`/product/${slug}`} className="group block overflow-hidden">
        {/* Image container with aspect ratio */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100"> 
          <Image
            src={image || '/placeholder-product.jpg'}
            alt={name || "Product image"}
            width={300}
            height={400}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
          {(isBestseller || isNew) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isNew && (
                <span className="bg-white text-black text-xs font-medium px-2 py-0.5 rounded-sm">Just In</span>
              )}
              {isBestseller && (
                <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-sm">Bestseller</span>
              )}
            </div>
          )}
        </div>

        {/* Text details below the image */}
        <div className="mt-3 px-1"> 
          <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 mt-1">{category}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-sm font-semibold text-gray-900">{displayPrice}</p>
            {displayOriginalPrice && (
              <p className="text-xs text-gray-500 line-through">{displayOriginalPrice}</p>
            )}
            {discount && discount > 0 && (
              <p className="text-xs text-red-600 font-medium">{discount}% off</p>
            )}
          </div>
        </div>
      </Link>
    );
  }
  
  // List layout
  return (
    <Link href={`/product/${slug}`} className="group flex gap-4 border rounded-md p-3 hover:shadow-md transition-shadow">
      {/* Image on the left */}
      <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 overflow-hidden"> 
        <Image
          src={image || '/placeholder-product.jpg'}
          alt={name || "Product image"}
          fill
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        {(isBestseller || isNew) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && (
              <span className="bg-white text-black text-xs font-medium px-2 py-0.5 rounded-sm">Just In</span>
            )}
            {isBestseller && (
              <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-sm">Bestseller</span>
            )}
          </div>
        )}
      </div>

      {/* Details on the right */}
      <div className="flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900">{name}</h3>
        <p className="text-xs text-gray-500 mt-1">{category}</p>
        <div className="flex items-baseline gap-2 mt-auto">
          <p className="font-semibold text-gray-900">{displayPrice}</p>
          {displayOriginalPrice && (
            <p className="text-xs text-gray-500 line-through">{displayOriginalPrice}</p>
          )}
          {discount && discount > 0 && (
            <p className="text-xs text-red-600 font-medium">{discount}% off</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

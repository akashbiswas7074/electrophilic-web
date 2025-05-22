import React from 'react';
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductProps {
  product: {
    id: string;
    name: string;
    category: string;
    image: string;
    rating: number;
    slug: string;
    reviews: number;
    price: number;
    originalPrice?: number;
    discount?: number;
    isBestseller?: boolean;
  };
}

export const ProductCardSmall: React.FC<ProductProps> = ({ product }) => {
  // Add defensive check to handle undefined product
  if (!product) {
    return null; // Return nothing if product is undefined
  }
  
  const { 
    id, 
    name, 
    price, 
    image, 
    slug, 
    discount, 
    originalPrice,
    category = "Product",
  } = product;

  // Calculate the final price after discount
  let computedDiscount = discount;
  if ((discount === undefined || discount === null) && originalPrice && originalPrice > price) {
    computedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  const finalPrice = computedDiscount ? price * (1 - computedDiscount / 100) : price;
  // Display MRP as the original price if available and different, otherwise use calculated price
  const displayMrp = originalPrice && originalPrice > finalPrice ? originalPrice : price;
  const displayPrice = `₹${finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const displayOriginalPrice = `₹${displayMrp.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  
  // Check if there's a discount to show
  const showDiscount = computedDiscount && computedDiscount > 0;
  
  return (
    <Link href={`/product/${slug}`} className="group block overflow-hidden text-black no-underline">
      <div className="relative aspect-square w-full overflow-hidden"> 
        {/* Use proper Next.js Image with proper error handling */}
        <Image
          src={image || "/images/broken-link.png"}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite loop
            target.src = "/images/broken-link.png";
          }}
        />
        {/* Discount Badge - Enhanced and more prominent */} 
        {showDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            {computedDiscount}% OFF
          </div>
        )}
      </div>
      
      <div className="mt-3 px-1"> 
        <h3 className="text-base font-normal text-gray-900 truncate">{name}</h3>
        <p className="text-sm text-gray-600 mt-1">{category}</p> 
        
        {/* Enhanced Price Display with better visual hierarchy */}
        <div className="mt-2 flex items-baseline gap-x-2">
          {showDiscount ? (
            <>
              <p className="text-base font-medium text-black">{displayPrice}</p>
              <p className="text-sm text-gray-500 line-through">{displayOriginalPrice}</p>
              <p className="text-sm font-medium text-red-600">{computedDiscount}% off</p>
            </>
          ) : (
            <p className="text-base font-medium text-black">{displayPrice}</p>
          )}
        </div>
        
        {/* MRP label now shown separately for clarity */}
        {showDiscount && (
          <p className="text-xs text-gray-500 mt-1">MRP: {displayOriginalPrice} (Inclusive of all taxes)</p>
        )}
      </div>
    </Link>
  );
};

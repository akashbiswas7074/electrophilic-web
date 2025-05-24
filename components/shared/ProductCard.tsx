'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

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
    isBestseller,
    isNew
  } = product;
  
  const [isHovering, setIsHovering] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isProductInWishlist = isInWishlist(id);
  
  const displayPrice = `₹ ${price.toLocaleString('en-IN')}`;
  const displayOriginalPrice = originalPrice && originalPrice > price ? `₹ ${originalPrice.toLocaleString('en-IN')}` : null;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Stop event propagation
    
    if (status !== "authenticated") {
      toast.error("Please log in to add items to your wishlist");
      return;
    }
    
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Pass the product details for better optimistic updates
      await toggleWishlist(id, {
        name,
        slug,
        image,
        price,
        originalPrice,
        discount
      });
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Grid layout (default)
  if (layout === 'grid') {
    return (
      <div 
        className="group relative block overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Link href={`/product/${slug}`} className="block">
          {/* Image container with aspect ratio */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100"> 
            <Image
              src={image || '/placeholder.png'}
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
        
        {/* Wishlist button */}
        <button
          onClick={handleWishlistClick}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm z-10 transition-all duration-200",
            (isHovering || isProductInWishlist) ? "opacity-100" : "opacity-0",
            isProcessing ? "cursor-wait" : "hover:bg-white"
          )}
          disabled={isProcessing}
        >
          <Heart 
            size={18}
            className={cn(
              "transition-colors duration-200",
              isProductInWishlist ? "fill-red-500 text-red-500" : "fill-transparent text-gray-600 hover:text-red-500"
            )}
          />
        </button>
      </div>
    );
  }
  
  // List layout
  return (
    <div 
      className="group relative flex gap-4 border rounded-md p-3 hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link href={`/product/${slug}`} className="flex gap-4 flex-1">
        {/* Image on the left */}
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 overflow-hidden"> 
          <Image
            src={image || '/placeholder.png'}
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
      
      {/* Wishlist button */}
      <button
        onClick={handleWishlistClick}
        className={cn(
          "self-start p-2 rounded-full bg-white/80 shadow-sm z-10 transition-all duration-200",
          isProcessing ? "cursor-wait" : "hover:bg-gray-100"
        )}
        disabled={isProcessing}
      >
        <Heart 
          size={18}
          className={cn(
            "transition-colors duration-200",
            isProductInWishlist ? "fill-red-500 text-red-500" : "fill-transparent text-gray-600 hover:text-red-500"
          )}
        />
      </button>
    </div>
  );
};

export default ProductCard;

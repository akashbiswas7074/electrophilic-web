'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProductOrderCountsContext } from '@/contexts/ProductOrderCountsContext';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import EnhancedImage from '@/components/shared/EnhancedImage';
import { cn } from '@/lib/utils'; // Add missing cn import

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
    featured?: boolean; // Add featured property
    isFeatured?: boolean; // Support legacy property name too
    orderCount?: number; // Add order count for bestsellers
    sold?: number; // Add sold property that comes from database
    subProducts?: any[]; // Add subProducts property to fix TypeScript error
    sizes?: any[]; // Add sizes property for completeness
  };
  layout?: 'grid' | 'list'; // Added layout prop to support grid or list view
}

const ProductCard = ({ product, layout = 'grid' }: ProductCardProps) => {
  // Get the order counts from context
  const { orderCounts } = useProductOrderCountsContext();
  
  const { 
    id, 
    name, 
    price, 
    image, 
    slug, 
    discount, 
    originalPrice, 
    category = "Shoes", // Simplified default category
    isNew,
    featured,
    isFeatured,
    sold
  } = product;
  
  // Get accurate sold count from all possible sources
  const soldCount = (() => {
    // Direct sold count from product data
    const mainProductSold = typeof sold === 'number' ? sold : 0;
    
    // Fallback to order counts from context if available
    const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 0;
    
    // If product has subProducts with sizes, calculate total from there
    let subProductsSold = 0;
    if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      subProductsSold = product.subProducts.reduce((total, subProduct) => {
        // Get sold count from subproduct
        const subProductSoldCount = typeof subProduct.sold === 'number' ? subProduct.sold : 0;
        
        // Get sold count from sizes
        let sizesSold = 0;
        if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
          sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
            return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
          }, 0);
        }
        
        return total + subProductSoldCount + sizesSold;
      }, 0);
    }
    
    // Combine all sources of sold counts
    const combinedSoldCount = mainProductSold + subProductsSold;
    
    // Use combined count if available, otherwise fall back to orderCount
    return combinedSoldCount > 0 ? combinedSoldCount : orderCount;
  })();
  
  // A product is a bestseller if it's marked as such or has significant sales
  const isBestseller = product.isBestseller || soldCount > 5;
  
  // Check both featured properties to ensure compatibility
  const isProductFeatured = featured || isFeatured;
  
  const [isHovering, setIsHovering] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isProductInWishlist = isInWishlist(id);
  
  // Handle price safely with fallbacks for undefined, null, or zero values
  // Improved handling for empty size field case
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 
                   typeof price === 'string' && !isNaN(parseFloat(price)) ? parseFloat(price) : 0;
                   
  const safeOriginalPrice = typeof originalPrice === 'number' && !isNaN(originalPrice) ? originalPrice : 
                           typeof originalPrice === 'string' && !isNaN(parseFloat(originalPrice)) ? parseFloat(originalPrice) : 0;
                           
  const displayPrice = safePrice > 0 ? `₹ ${safePrice.toLocaleString('en-IN')}` : 'Price unavailable';
  const displayOriginalPrice = safeOriginalPrice > 0 && safeOriginalPrice > safePrice 
    ? `₹ ${safeOriginalPrice.toLocaleString('en-IN')}` 
    : null;

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

  // Check if product is sold out
  const isSoldOut = (() => {
    // Check if all sizes are out of stock
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.every((size: any) => (size.qty || 0) <= 0);
    }
    
    // Check if any subProducts are available
    if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      return product.subProducts.every((subProduct: any) => {
        if (Array.isArray(subProduct.sizes) && subProduct.sizes.length > 0) {
          return subProduct.sizes.every((size: any) => (size.qty || 0) <= 0);
        }
        return (subProduct.quantity || 0) <= 0;
      });
    }
    
    return false;
  })();

  // Grid layout (default)
  if (layout === 'grid') {
    return (
      <div 
        className={cn(
          "group relative bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200 hover:border-gray-300",
          isSoldOut && "opacity-75"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Link href={`/product/${slug}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
            <EnhancedImage
              src={image || ""}
              alt={name || "Product image"}
              fill
              placeholderType="product"
              objectFit="cover"
              showLoadingSpinner={true}
              className="transition-transform duration-300 ease-in-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />

            {/* Sold Out Overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-black/70 text-white font-bold px-4 py-2 rounded-md transform -rotate-12 text-lg shadow-lg">
                  SOLD OUT
                </div>
              </div>
            )}

            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isNew && (
                <span className="bg-white text-black text-xs font-medium px-2 py-0.5 rounded-sm">Just In</span>
              )}
              
              {/* Featured Product Badge - Always show if product is featured */}
              {isProductFeatured && (
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium px-2 py-0.5 rounded-sm">FEATURED</span>
              )}
              
              {/* Bestseller Badge - Show if product is bestseller */}
              {isBestseller && (
                <div className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <span>Bestseller</span>
                  <span className="bg-white text-orange-600 text-[10px] px-1 py-0.5 rounded-sm font-semibold ml-1">
                    {soldCount.toLocaleString()}+ sold
                  </span>
                </div>
              )}
            </div>
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
            
            {/* Display sold count */}
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <ShoppingBag className="w-3 h-3 mr-1" />
              <span>{soldCount} sold</span>
            </div>
          </div>
        </Link>
        
        {/* Wishlist button */}
        <button
          onClick={handleWishlistClick}
          className={cn(
            "absolute top-2 right-2 p-0 m-0 border-none bg-transparent cursor-pointer z-10",
            isProcessing ? "cursor-wait" : "hover:bg-white"
          )}
          disabled={isProcessing}
          aria-label={isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm",
            "transition-all duration-200",
            "group-hover:opacity-100",
            isProductInWishlist ? "opacity-100" : "opacity-0 lg:opacity-0",
            "hover:bg-white hover:shadow-md"
          )}>
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin text-gray-600" />
            ) : (
              <Heart 
                size={16}
                className={cn(
                  "transition-colors duration-200",
                  isProductInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
                )}
              />
            )}
          </div>
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
          <EnhancedImage
            src={image || ""}
            alt={name || "Product image"}
            fill
            placeholderType="product"
            objectFit="cover"
            showLoadingSpinner={true}
            className="transition-transform duration-300 ease-in-out group-hover:scale-105"
            sizes="128px"
          />
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
          
          {/* Display sold count */}
          <div className="flex items-center text-xs text-gray-600 mt-1">
            <ShoppingBag className="w-3 h-3 mr-1" />
            <span>{soldCount} sold</span>
          </div>
        </div>
      </Link>
      
      {/* Wishlist button */}
      <button
        onClick={handleWishlistClick}
        className={cn(
          "p-0 m-0 border-none bg-transparent cursor-pointer",
          isProcessing ? "cursor-wait" : "hover:bg-white"
        )}
        disabled={isProcessing}
        aria-label={isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm",
          "transition-all duration-200",
          "group-hover:opacity-100",
          isProductInWishlist ? "opacity-100" : "opacity-0 lg:opacity-0",
          "hover:bg-white hover:shadow-md"
        )}>
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin text-gray-600" />
          ) : (
            <Heart 
              size={16}
              className={cn(
                "transition-colors duration-200",
                isProductInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
              )}
            />
          )}
        </div>
      </button>
    </div>
  );
};

export default ProductCard;

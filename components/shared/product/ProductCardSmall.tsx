import React, { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useWishlist } from '@/contexts/WishlistContext';
import { useProductOrderCountsContext } from '@/contexts/ProductOrderCountsContext';
import { Eye, Heart, Loader2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductProps {
  product: {
    id: string;
    name: string;
    category?: string;
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
    sizes?: any[] | null; // Add direct sizes property which might be empty
    description?: string;
    _id?: string; // MongoDB ID
    _doc?: any; // Add missing _doc property for MongoDB documents
  };
}

export const ProductCardSmall: React.FC<ProductProps> = ({ product }) => {
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  // Use wishlist context to check if this product is in the wishlist
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  // Get the order counts from context
  const { orderCounts } = useProductOrderCountsContext();
  
  // Add defensive check to handle undefined product
  if (!product) {
    console.warn("ProductCardSmall received undefined product");
    return null; // Return nothing if product is undefined
  }
  
  const productId = product.id || product._id || '';
  const isProductInWishlist = productId ? isInWishlist(productId) : false;
  
  const { 
    id = product._id || '', 
    name = 'Product', 
    price, 
    image = "/images/broken-link.png", 
    slug = '', 
    discount, 
    originalPrice,
    category = "Product",
    isNew,
    isFeatured,
    featured,
    createdAt,
    stock,
    description
  } = product;

  // Get the sold count by combining all possible sources to ensure accuracy
  const soldCount = (() => {
    try {
      // Direct sold count from product data - ensure it's a number
      const mainProductSold = typeof product.sold === 'number' ? product.sold : 
                             (typeof product.sold === 'string' ? parseInt(product.sold, 10) : 0);
      
      // Fallback to orderCount if available 
      const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 0;
      
      // Check direct sizes property first (for products with direct sizes array)
      let directSizesSold = 0;
      if (product.sizes && Array.isArray(product.sizes)) {
        directSizesSold = product.sizes.reduce((sizesTotal: number, size: any) => {
          if (!size) return sizesTotal;
          return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
        }, 0);
      }
      
      // If product has subProducts with sizes, calculate total from there
      let subProductsSold = 0;
      if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
        subProductsSold = product.subProducts.reduce((total, subProduct) => {
          if (!subProduct) return total;
          
          // Get sold count from subproduct
          const subProductSoldCount = typeof subProduct.sold === 'number' ? subProduct.sold : 0;
          
          // Get sold count from sizes
          let sizesSold = 0;
          if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
            sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
              if (!size) return sizesTotal;
              return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
            }, 0);
          }
          
          return total + Math.max(subProductSoldCount, sizesSold);
        }, 0);
      }
      
      // Get context order count for this product ID
      const contextOrderCount = id && orderCounts ? orderCounts[id] || 0 : 0;
      
      // Use the highest value from all sources to avoid double-counting
      // This is better than summing all values which could lead to inflated numbers
      return Math.max(mainProductSold, directSizesSold, subProductsSold, orderCount, contextOrderCount);
    } catch (error) {
      // Handle errors silently without console logs in production
      return 0; // Return 0 if calculation fails
    }
  })();
  
  // A product is a bestseller if it's explicitly marked as bestseller or has sold a significant number
  const isBestseller = product.isBestseller || soldCount > 5; 

  // Determine if the product is newly arrived (within the last 7 days)
  const isNewlyArrived = isNew || 
    (createdAt && (new Date().getTime() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000));
    
  // Enhanced featured product detection for the featured bridge
  // Check all possible property variations to ensure consistency
  const isProductFeatured = Boolean(
    isFeatured || 
    featured ||
    (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
    (typeof product._id !== 'undefined' && (Boolean(product.featured) || Boolean(product.isFeatured)))
  );

  // Format product name to show truncated with ellipsis if too long
  const formatProductName = (productName: string, maxLength: number = 25) => {
    if (!productName) return 'Product';
    return productName.length > maxLength 
      ? `${productName.substring(0, maxLength)}...`
      : productName;
  };
  
  const displayName = formatProductName(name);

  // Enhanced price calculation with better error handling
  const safePrice = (() => {
    try {
      if (typeof price === 'number' && !isNaN(price) && price > 0) return price;
      if (typeof price === 'string' && !isNaN(parseFloat(price)) && parseFloat(price) > 0) return parseFloat(price);
      
      // Try to get price from sizes if the direct price is not available
      if (Array.isArray(product.sizes) && product.sizes.length > 0 && product.sizes[0]) {
        const firstSizePrice = product.sizes[0].price;
        if (typeof firstSizePrice === 'number' && !isNaN(firstSizePrice) && firstSizePrice > 0) {
          return firstSizePrice;
        }
      }
      
      // Try to get price from subProducts if available
      if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
        const subProduct = product.subProducts[0];
        if (subProduct) {
          // Try direct price on subProduct
          if (typeof subProduct.price === 'number' && !isNaN(subProduct.price)) {
            return subProduct.price;
          }
          
          // Try size price on subProduct
          if (Array.isArray(subProduct.sizes) && subProduct.sizes.length > 0 && subProduct.sizes[0]) {
            const firstSizePrice = subProduct.sizes[0].price;
            if (typeof firstSizePrice === 'number' && !isNaN(firstSizePrice)) {
              return firstSizePrice;
            }
          }
        }
      }
      
      return 0;
    } catch (error) {
      console.error("Error parsing price:", error);
      return 0;
    }
  })();
  
  const safeOriginalPrice = (() => {
    try {
      if (typeof originalPrice === 'number' && !isNaN(originalPrice) && originalPrice > 0) return originalPrice;
      if (typeof originalPrice === 'string' && !isNaN(parseFloat(originalPrice)) && parseFloat(originalPrice) > 0) return parseFloat(originalPrice);
      return 0;
    } catch (error) {
      console.error("Error parsing original price:", error);
      return 0;
    }
  })();
  
  // Calculate discount value with error handling
  const computedDiscount = (() => {
    try {
      if (typeof discount === 'number' && !isNaN(discount) && discount > 0) return discount;
      if (typeof discount === 'string' && !isNaN(parseFloat(discount)) && parseFloat(discount) > 0) return parseFloat(discount);
      
      // Calculate discount from prices if not explicitly provided
      if (safeOriginalPrice > 0 && safePrice > 0 && safeOriginalPrice > safePrice) {
        return Math.round(((safeOriginalPrice - safePrice) / safeOriginalPrice) * 100);
      }
      
      return 0;
    } catch (error) {
      console.error("Error calculating discount:", error);
      return 0;
    }
  })();
  
  // Calculate final price correctly - if we have original price and discount, use that calculation
  // otherwise fall back to the provided price
  let finalPrice = safePrice;
  if (safeOriginalPrice > 0 && computedDiscount > 0) {
    // Fix: Round the discounted price to 2 decimal places to avoid floating point issues
    finalPrice = Math.round((safeOriginalPrice * (1 - computedDiscount/100)) * 100) / 100;
  } else if (safeOriginalPrice > 0) {
    finalPrice = safePrice; // If we have original price but no discount, use the current price
  }
  
  const displayMrp = safeOriginalPrice > 0 ? safeOriginalPrice : safePrice;
  
  // Format prices for display
  const displayPrice = finalPrice > 0
    ? `₹${finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'Price unavailable';
  
  const displayOriginalPrice = displayMrp > 0
    ? `₹${displayMrp.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '';
  
  // Check if there's a discount to show - only if prices are valid
  const showDiscount = safePrice > 0 && computedDiscount && computedDiscount > 0;
  
  // Get sold count or default to "0" for products with no sales yet
  const displaySoldCount = soldCount > 0 
    ? soldCount.toLocaleString()
    : "0";

  // Function to handle wishlist toggle
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Stop event propagation
    
    if (status !== "authenticated") {
      toast.error("Please log in to manage your wishlist");
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
  
  // Determine if product is sold out
  const isSoldOut = typeof stock === 'number' && stock <= 0;
  
  return (
    <div 
      className="group relative block overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200 hover:border-gray-300"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link href={`/product/${slug}`} className="block text-black no-underline">
        <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-gray-100"> 
          <Image
            src={image || "/images/broken-link.png"}
            alt={name}
            fill
            className={cn(
              "object-cover transition-transform duration-500 ease-in-out group-hover:scale-105",
              isSoldOut && "opacity-60"
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = "/images/broken-link.png";
            }}
          />
          
          {/* Sold Out Overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/70 text-white font-bold px-4 py-2 rounded-md transform -rotate-12 text-lg shadow-lg">
                SOLD OUT
              </div>
            </div>
          )}
          
          {/* Quick view and add to cart overlay on hover */}
          <div className={cn(
            "absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity duration-300",
            isHovering ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex gap-2">
              <button 
                className="bg-white text-black hover:bg-gray-100 rounded-full p-2 transition-transform duration-200 hover:scale-110"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/product/${slug}`;
                }}
                aria-label="Quick view"
              >
                <Eye size={18} />
              </button>
              <button 
                className="bg-black text-white hover:bg-gray-800 rounded-full p-2 transition-transform duration-200 hover:scale-110"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.success(`${name} added to cart!`);
                }}
                aria-label="Add to cart"
                disabled={isSoldOut}
              >
                <ShoppingCart size={18} />
              </button>
            </div>
          </div>
          
          {/* Product badges section in the top-left corner with modern monochrome styling */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {/* Discount Badge with improved visibility */}
            {showDiscount && (
              <div className="bg-slate-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md opacity-95 border border-white/30 flex items-center">
                <span className="mr-0.5 text-white/90">-</span>
                <span className="text-sm">{computedDiscount}%</span>
              </div>
            )}
            
            {/* Featured Product Badge - Show with highest priority if product is featured */}
            {isProductFeatured && (
              <div className="bg-gradient-to-r from-indigo-200 to-indigo-300 text-indigo-800 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm">
                 FEATURED
              </div>
            )}
            
            {/* New Arrival Badge - Only show if not featured to avoid badge overlap */}
            {isNewlyArrived && !isProductFeatured && (
              <div className="bg-black text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm">
                NEW
              </div>
            )}
            
            {/* Bestseller Badge with Order Count - Show if product is bestseller and not featured */}
            {isBestseller && !isProductFeatured && (
              <div className="bg-gray-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                <span>BESTSELLER</span>
                <span className="bg-white text-black text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-1">
                  {soldCount.toLocaleString()}+
                </span>
              </div>
            )}
          </div>
          
          {/* Wishlist heart icon with modern monochrome styling */}
          <button 
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 z-10 p-0 m-0 border-none bg-transparent cursor-pointer"
            aria-label={isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-md",
              "transition-all duration-300",
              "md:group-hover:opacity-100 md:group-hover:scale-100",
              isProductInWishlist ? "opacity-100 scale-100" : "opacity-100 md:opacity-70 scale-100 md:scale-90",
              "hover:bg-white hover:shadow-lg"
            )}>
              {isProcessing ? (
                <Loader2 size={18} className="animate-spin text-gray-800" />
              ) : (
                <Heart 
                  size={18} 
                  className={cn(
                    "transition-all duration-300",
                    isProductInWishlist ? "fill-black text-black scale-110" : "text-gray-700"
                  )} 
                />
              )}
            </div>
          </button>
        </div>
        
        <div className="p-3"> 
          {/* Category tag with modern monochrome pill design */}
          <div className="mb-1">
            <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{category}</span>
          </div>
          
          {/* Product name with improved typography */}
          <h3 className="text-sm md:text-base font-medium text-gray-900 line-clamp-2 h-[2.5rem] mb-1" title={name}>
            {displayName}
          </h3>
          
          {/* Enhanced Price Display with modern monochrome styling */}
          <div className="mt-1.5 flex items-baseline flex-wrap gap-x-2">
            {showDiscount ? (
              <>
                <p className="text-base md:text-lg font-semibold text-black">{displayPrice}</p>
                <p className="text-sm text-gray-500 line-through">{displayOriginalPrice}</p>
                <p className="text-sm font-medium text-black bg-indigo-100  px-1.5 rounded">{computedDiscount}% off</p>
              </>
            ) : (
              <p className="text-base md:text-lg font-semibold text-black">{displayPrice}</p>
            )}
          </div>
          
          {/* Bottom info row with rating and sold count */}
          <div className="mt-2 flex items-center justify-between">
            {/* Display sold count with modern monochrome styling */}
            <div className="flex items-center text-xs text-gray-600">
              <ShoppingBag className="w-3.5 h-3.5 mr-1 text-gray-700" />
              <span className="font-medium">{displaySoldCount} sold</span>
            </div>
            
            {/* Free shipping tag with modern monochrome styling */}
            {finalPrice >= 499 && (
              <span className="text-[10px] text-black bg-gray-100 px-1.5 py-0.5 rounded-sm font-medium">
                FREE DELIVERY
              </span>
            )}
          </div>
          
          {/* MRP label with modern monochrome styling */}
          {showDiscount && (
            <p className="text-xs text-gray-500 mt-1.5">MRP: {displayOriginalPrice} (Incl. all taxes)</p>
          )}
        </div>
      </Link>
    </div>
  );
};

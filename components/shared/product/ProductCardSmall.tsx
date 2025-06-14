import React, { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useWishlist } from '@/contexts/WishlistContext';
import { useProductOrderCountsContext } from '@/contexts/ProductOrderCountsContext';
import { Eye, Heart, Loader2, ShoppingBag, ShoppingCart, Star, Tag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductProps {
  product: {
    id: string;
    name: string;
    category?: string | any; // Handle object category
    subcategory?: string | any; // Handle object subcategory
    image: string;
    rating?: number;
    numReviews?: number; // Add numReviews property to match backend data
    reviews?: number; // Keep reviews for backward compatibility
    slug: string;
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
    _id?: string; // MongoDB ID
    _doc?: any; // MongoDB document property
  };
  viewMode?: 'grid' | 'list';
}

export const ProductCardSmall: React.FC<ProductProps> = ({ product, viewMode = 'grid' }) => {
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
  
  // Ensure we have a valid product ID by checking all possible sources
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
    subcategory,
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

  // Format category to ensure it's always a string - Enhanced to handle nested objects better
  const displayCategory = (() => {
    try {
      // If category is undefined, return default
      if (!category) return 'Category';
      
      // If category is a string, use it directly
      if (typeof category === 'string') return category;
      
      // If category is an object
      if (typeof category === 'object' && category !== null) {
        // First try to get the name property - most common format
        if (category.name) return category.name;
        
        // Try legacy _id property for MongoDB documents
        if (category._id) {
          // If subcategory has a string _id, use it
          if (typeof category._id === 'string') {
            // Try to look up the category name from product data or just return the ID
            return category._id;
          }
        }
      }
      
      return 'Category';
    } catch (error) {
      console.error("Error formatting category:", error);
      return 'Category';
    }
  })();
  
  // Format subcategory with enhanced logic similar to category
  const displaySubcategory = (() => {
    try {
      // If subcategory is undefined or null, return empty string
      if (!subcategory) return '';
      
      // If subcategory is a string, use it directly
      if (typeof subcategory === 'string') return subcategory;
      
      // If subcategory is an array, try to extract first item's name
      if (Array.isArray(subcategory)) {
        if (subcategory.length === 0) return '';
        const firstItem = subcategory[0];
        
        if (typeof firstItem === 'string') return firstItem;
        if (typeof firstItem === 'object' && firstItem !== null && firstItem.name) {
          return firstItem.name;
        }
        
        // Try to get _id as last resort for array items
        if (typeof firstItem === 'object' && firstItem !== null && firstItem._id) {
          return typeof firstItem._id === 'string' ? firstItem._id : 'Subcategory';
        }
        
        return 'Subcategory';
      }
      
      // If subcategory is an object
      if (typeof subcategory === 'object' && subcategory !== null) {
        // First try to get the name property
        if (subcategory.name) return subcategory.name;
        
        // Try legacy _id property for MongoDB documents
        if (subcategory._id) {
          return typeof subcategory._id === 'string' ? subcategory._id : 'Subcategory';
        }
      }
      
      return '';
    } catch (error) {
      console.error("Error formatting subcategory:", error);
      return '';
    }
  })();
  
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
  
  // Check if there's a discount to show - only if prices are valid and discount is greater than 0
  const showDiscount = safePrice > 0 && computedDiscount > 0;
  
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
  
  // Get sold count or default to "0" for products with no sales yet
  const displaySoldCount = soldCount > 0 
    ? soldCount.toLocaleString()
    : "0";

  // Check if product has reviews to display rating
  const hasReviews = typeof product.reviews === 'number' && product.reviews > 0;
  const hasRating = typeof product.rating === 'number' && product.rating > 0;
  const shouldShowRating = hasReviews || hasRating;
  
  // Format the rating for display with one decimal place if available
  const displayRating = (() => {
    if (!hasRating) return 0;
    return typeof product.rating === 'number' 
      ? Math.round(product.rating * 10) / 10
      : 0;
  })();
  
  // Format review count for display
  const displayReviews = (() => {
    if (!hasReviews) return 0;
    return typeof product.reviews === 'number'
      ? product.reviews
      : 0;
  })();

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
  
  // Format product ID for display - Show truncated ID with first and last few characters
  const displayProductId = (() => {
    try {
      if (!productId) return '';
      if (productId.length <= 12) return productId;
      // Show first 6 and last 4 chars with ellipsis in between
      return `${productId.substring(0, 6)}...${productId.substring(productId.length - 4)}`;
    } catch (error) {
      return '';
    }
  })();

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200 hover:border-gray-300",
        viewMode === 'list' ? "flex" : "block"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link href={`/product/${slug}`} className={cn(
        "text-black no-underline",
        viewMode === 'list' ? "flex w-full" : "block"
      )}>
        <div className={cn(
          "relative overflow-hidden bg-gray-100",
          viewMode === 'list' 
            ? "w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0 rounded-l-lg" 
            : "aspect-square w-full rounded-t-lg"
        )}> 
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
            {showDiscount && computedDiscount > 0 && (
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
        
        <div className={cn(
          "p-3",
          viewMode === 'list' && "flex-1"
        )}> 
          {/* Product ID badge with modern styling */}
          {displayProductId && (
            <div className="mb-1 flex items-center">
              <Tag size={12} className="text-gray-500 mr-1" />
              <span className="text-xs text-gray-500">ID: {displayProductId}</span>
            </div>
          )}
          
          {/* Category and subcategory tags with modern monochrome pill design */}
          <div className="mb-1 flex flex-wrap gap-1">
            <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{displayCategory}</span>
            {displaySubcategory && (
              <>
                <span className="inline-block text-xs text-gray-400">•</span>
                <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{displaySubcategory}</span>
              </>
            )}
          </div>
          
          {/* Product name with improved typography */}
          <h3 className={cn(
            "font-medium text-gray-900 mb-1", 
            viewMode === 'list' ? "text-lg line-clamp-1" : "text-sm md:text-base line-clamp-2 h-[2.5rem]"
          )} title={name}>
            {displayName}
          </h3>
          
          {/* Product description in list view */}
          {viewMode === 'list' && description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
          )}
          
          {/* Enhanced Price Display with modern monochrome styling */}
          <div className="mt-1.5 flex items-baseline flex-wrap gap-x-2">
            {showDiscount && computedDiscount > 0 ? (
              <>
                <p className="text-base md:text-lg font-semibold text-black">{displayPrice}</p>
                <p className="text-sm text-gray-500 line-through">{displayOriginalPrice}</p>
                <p className="text-sm font-medium text-black bg-indigo-100 px-1.5 rounded">{computedDiscount}% off</p>
              </>
            ) : (
              <p className="text-base md:text-lg font-semibold text-black">{displayPrice}</p>
            )}
          </div>
          
          {/* Bottom info row with rating and sold count */}
          <div className={cn(
            "mt-2 flex items-center",
            viewMode === 'list' ? "justify-between mt-auto" : "justify-between"
          )}>
            {/* Display star rating - only show if product has ratings/reviews */}
            {shouldShowRating && (
              <div className="flex items-center gap-1 mr-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={cn(
                        "text-gray-300",
                        displayRating >= star && "text-yellow-400 fill-yellow-400"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {displayRating.toFixed(1)}
                  {displayReviews > 0 && (
                    <span className="text-gray-500 ml-1">({displayReviews})</span>
                  )}
                </span>
              </div>
            )}

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
            
            {/* Add to cart button for list view */}
            {viewMode === 'list' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto" 
                disabled={isSoldOut}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.success(`${name} added to cart!`);
                }}
              >
                <ShoppingCart size={16} className="mr-2" />
                Add to Cart
              </Button>
            )}
          </div>
          
          {/* MRP label with modern monochrome styling */}
          {showDiscount && computedDiscount > 0 && (
            <p className="text-xs text-gray-500 mt-1.5">MRP: {displayOriginalPrice} (Incl. all taxes)</p>
          )}
        </div>
      </Link>
    </div>
  );
};

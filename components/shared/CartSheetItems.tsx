"use client";

import { useCartStore } from "@/store/cart";
import { Minus, Plus, X, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";

// Helper to safely convert to string for display
const safeToString = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  // Avoid rendering complex objects directly
  if (typeof value === 'object') {
    // Check for empty objects first
    if (Object.keys(value).length === 0) {
      return ""; // Return empty string for empty objects
    }
    // Attempt to get a meaningful string representation if possible
    if (value.toString && value.toString !== Object.prototype.toString) {
      try {
        return value.toString();
      } catch (err) {
        console.error("Error calling toString():", err);
        return "[Object]";
      }
    }
    // Fallback for generic objects - log error and return placeholder
    console.error("Attempted to render non-primitive value:", value);
    return "[Object]"; 
  }
  return ""; // Fallback for other types
};

const CartSheetItems = ({ product }: { product: any }) => {
  const { data: session } = useSession(); 
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if ((useCartStore as any).persist?.rehydrate) {
      (useCartStore as any).persist.rehydrate();
    }
  }, []);

  const updateCart = useCartStore((state: any) => state.updateCart);
  const cartItems = useCartStore((state: any) => state.cart.cartItems);

  const updateQty = (type: string) => {
    setIsUpdating(true);
    const currentQty = Number(product.qty || product.quantity || 0);
    const newQty = type === "plus" ? currentQty + 1 : currentQty - 1;

    if (newQty < 1) {
      setIsUpdating(false);
      return; 
    }

    const updatedCartItems = cartItems.map((p: any) => {
      if (p._uid === product._uid) {
        return {
          ...p,
          qty: newQty,
          quantity: newQty, 
        };
      }
      return p;
    });

    updateCart(updatedCartItems);
    toast.success("Quantity updated");

    setTimeout(() => setIsUpdating(false), 300); 
  };

  const removeProduct = async () => {
    setIsRemoving(true);
    const toastId = toast.loading("Removing item...");

    const updatedCartItems = cartItems.filter((p: any) => p._uid !== product._uid);

    updateCart(updatedCartItems);

    toast.success("Item removed from cart", { id: toastId });
    setIsRemoving(false);
  };

  const getImageUrl = () => {
    if (!product) return "/placeholder-product.png";
    if (product.image) return product.image;
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'string') return firstImage;
      if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
    }
    return "/placeholder-product.png";
  };

  const currentQuantity = Number(product.qty || product.quantity || 0);
  const productName = safeToString(product.name); // Use helper
  const productSize = product.size ? safeToString(product.size) : null; // Use helper
  const productId = safeToString(product._id); // Use helper
  
  // Ensure price is a valid number
  const productPrice = typeof product.price === 'number' ? product.price : 
                      typeof product.price === 'string' ? parseFloat(product.price) : 0;

  // Pre-compute any derived data to avoid calculations in render
  const formattedPrice = productPrice > 0 ? (productPrice * currentQuantity).toFixed(2) : "Price unavailable";
  const imageUrl = getImageUrl();

  return (
    <div className={`relative ${isUpdating || isRemoving ? 'opacity-70 pointer-events-none' : ''}`}>
      {(isUpdating || isRemoving) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      <div
        key={product._uid || product._id} 
        className="flex items-start space-x-3 sm:space-x-4 border-b pb-3"
      >
        <Image
          src={imageUrl}
          alt={productName || 'Product Image'} // Use safe string
          width={70} 
          height={70}
          className="w-16 h-16 sm:w-[70px] sm:h-[70px] object-cover rounded-md border"
        />
        <div className="flex-1 min-w-0"> 
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-medium text-xs sm:text-sm tracking-tight line-clamp-2 mr-1"> 
              {productName} {/* Use safe string */}
              {productSize && ( // Check if size exists
                <span className="text-gray-600 font-normal"> ({productSize})</span> // Use safe string
              )}
            </h3>
            <button
              onClick={removeProduct}
              disabled={isRemoving}
              className="text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 p-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">ID: {productId}</p> {/* Use safe string */}
          
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => updateQty("minus")}
                disabled={currentQuantity <= 1 || isUpdating || isRemoving}
                className="px-1.5 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 py-1 text-sm font-medium min-w-[30px] text-center">
                {currentQuantity}
              </span>
              <button
                onClick={() => updateQty("plus")}
                disabled={isUpdating || isRemoving} 
                className="px-1.5 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="font-semibold text-sm sm:text-base whitespace-nowrap ml-2">
              ₹{formattedPrice} 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSheetItems;

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
     // Attempt to get a meaningful string representation if possible
     if (value.toString && value.toString !== Object.prototype.toString) {
       return value.toString();
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

  const updateCart = useCartStore((state: any) => state.updateCart);
  const cartItems = useCartStore((state: any) => state.cart.cartItems);

  const updateQty = (type: string) => {
    setIsUpdating(true);
    let newCart = cartItems.map((p: any) => {
      if (p._uid == product._uid) {
        return {
          ...p,
          qty: type == "plus" ? product.qty + 1 : product.qty - 1,
        };
      }
      return p;
    });
    updateCart(newCart);
    toast.success("Cart updated successfully");
    setIsUpdating(false);
  };
  const removeProduct = (id: string) => {
    setIsRemoving(true);
    let newCart = cartItems.filter((p: any) => {
      return p._uid != id;
    });
    updateCart(newCart);
    toast.success("Item deleted successfully");
    setIsRemoving(false);
  };

  return (
    <div>
      <div
        key={product._uid}
        className="flex items-start space-x-4 border-b-2 pb-3"
      >
        <img
          src={product.images[0].url}
          alt={product.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
        />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-xs sm:text-sm tracking-wide ">
              {product.name}{" "}
              {product.size && (
                <span className="font-[600]">({product.size})</span>
              )}
            </h3>
            {product.discount > 0 && (
              <span className="text-green-500 text-xs sm:text-sm px-[1px] justify-end">
                -{product.discount}%
              </span>
            )}
          </div>
          {/* --- Added Product ID Display --- */}
          {product._id && (
            <p className="text-xs text-gray-400 mt-0.5">ID: {product._id}</p>
          )}
          {/* --- End Added Product ID Display --- */}
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Buy More Save More
          </p>{" "}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <button
                disabled={product.qty < 2}
                onClick={() => updateQty("minus")}
                className=""
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="mx-2">{product.qty}</span>
              <button
                disabled={product.qty == product.quantity}
                onClick={() => updateQty("plus")}
                className="px-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="font-semibold text-xs sm:text-base">
              ₹{product.price}
            </p>
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={() => removeProduct(product._uid)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSheetItems;

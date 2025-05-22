"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose, // Make sure SheetClose is imported
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react"; // Make sure X is imported
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import CartSheetItems from "../CartSheetItems";
import { useCartStore } from "@/store/cart";
import { getSavedCartForUser } from "@/lib/database/actions/cart.actions";

// Define cart item type
type ColorType = {
  color?: string;
  name?: string;
};

type CartItem = {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  qty?: number; // Add optional qty property
  size?: string;
  color?: string | ColorType;
  style?: any; // Add style property
  _uid?: string; // Make _uid optional
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const cartItems = useCartStore((state: any) => state.cart.cartItems || []);
  const setCartDrawerOpen = useCartStore((state: any) => state.setCartDrawerOpen);

  const subtotal = cartItems.reduce((acc: number, item: CartItem) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity || item.qty || 0);
    return acc + price * quantity;
  }, 0);

  const handleCheckout = () => {
    if (!session) {
      toast.error("Please sign in to proceed to checkout.");
      setCartDrawerOpen(false); // Close drawer
      router.push("/auth/signin?callbackUrl=/checkout");
    } else {
      setCartDrawerOpen(false); // Close drawer
      router.push("/checkout");
    }
  };

  // Close drawer function using store action
  const handleClose = () => {
    setCartDrawerOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
  if (!open) onClose();
}}>
      {/* Add backdrop-blur for background blur effect */}
      <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col z-50 bg-white p-0 ">
        {/* Header with explicit padding and close button */}
        <SheetHeader className="px-4 sm:px-6 py-4 border-b">
          <SheetTitle className="flex items-center justify-between text-lg font-medium">
            Shopping Cart ({cartItems.length})
            {/* Explicit Close Button using SheetClose */}
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="-mr-2 text-gray-500 hover:text-gray-800">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span> {/* Accessibility */}
              </Button>
            </SheetClose>
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Your cart is empty</p>
            <p className="text-sm text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
            <SheetClose asChild>
              <Button onClick={() => router.push('/')}>
                Continue Shopping
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* Scrollable area with padding */}
            <ScrollArea className="flex-1 px-4 sm:px-6 py-4">
              <div className="space-y-4">
                {cartItems.map((item: CartItem) => (
                  <CartSheetItems key={item._uid || item._id} product={item} />
                ))}
              </div>
            </ScrollArea>

            {/* Footer with border, padding, and background */}
            <SheetFooter className="px-4 sm:px-6 py-4 space-y-4 border-t bg-gray-50">
              <div className="flex justify-between items-center font-semibold text-base">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  disabled={cartItems.length === 0}
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
                <SheetClose asChild>
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;

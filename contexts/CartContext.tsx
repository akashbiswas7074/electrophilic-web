"use client";

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import CartDrawer from '@/components/shared/navbar/CartDrawer';
import { useCartStore } from "@/store/cart"; // Import the Zustand store

// Define types (keep CartItem type if needed by CartDrawer)
type CartItem = {
  style?: any;
  _uid: string; // Changed from _uid?: string;
  _id: string;
  name: string;
  price: number;
  originalPrice?: number; // Add originalPrice as optional property
  image: string;
  quantity: number; // Quantity in cart
  size?: string;
  color?: string; // Note: 'style' seems to be used more consistently later
  qty?: number; // This seems redundant with 'quantity', consider consolidating
  availableQty?: number; // Quantity available in stock
};

type CartContextType = {
  // Get these from the store
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, uniqueId?: string) => void;
  updateItemQuantity: (id: string, quantity: number, uniqueId?: string, size?: string, style?: any) => void;
  clearCart: () => void;
  // Get drawer state/action from the store
  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (isOpen: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Get state and actions from Zustand store
  const cartItems = useCartStore((state) => state.cart.cartItems);
  const initializeCart = useCartStore((state) => state.initializeCart);
  const addItemStore = useCartStore((state) => state.addToCart);
  const updateCartStore = useCartStore((state) => state.updateCart);
  const emptyCartStore = useCartStore((state) => state.emptyCart);
  // Get drawer state and action from store
  const isCartDrawerOpen = useCartStore((state) => state.isCartDrawerOpen);
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen);

  // Initialize cart from store on mount (handles DB loading)
  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  // Expose setCartDrawerOpen to window object (Keep for now, evaluate if needed later)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.setCartDrawerOpen = setCartDrawerOpen; // Assign store action directly
    }
    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.setCartDrawerOpen;
      }
    };
  }, [setCartDrawerOpen]);

  // --- Context Actions --- 
  // These now mostly delegate to the Zustand store actions

  const addItem = (itemToAdd: CartItem) => {
    // Verify item has all required properties
    if (!itemToAdd || !itemToAdd._id) {
      console.error("Invalid item data:", itemToAdd);
      toast.error("Could not add item. Invalid data.");
      return;
    }

    // Check if the item has available stock (product quantity check)
    // If availableQty is 0 or undefined/null (and we treat undefined as potentially out of stock or data missing), prevent adding.
    // If availableQty is not provided, we might allow adding, but it's safer to require it for stock-aware cart.
    if (itemToAdd.availableQty !== undefined && itemToAdd.availableQty <= 0) {
      toast.error(`Sorry, "${itemToAdd.name}" (Size: ${itemToAdd.size}) is out of stock.`);
      return;
    }
    
    // If itemToAdd has a quantity property (e.g., user trying to add multiple directly)
    // ensure it does not exceed available stock. Typically, initial add is 1.
    if (itemToAdd.quantity && itemToAdd.availableQty !== undefined && itemToAdd.quantity > itemToAdd.availableQty) {
        toast.error(`Cannot add ${itemToAdd.quantity} of "${itemToAdd.name}" (Size: ${itemToAdd.size}). Only ${itemToAdd.availableQty} available.`);
        return;
    }

    // Generate a unique ID if not provided
    const itemWithUid = {
      ...itemToAdd,
      _uid: itemToAdd._uid || `${itemToAdd._id}_${itemToAdd.style || 0}_${itemToAdd.size || 'default'}`
    };

    try {
      // Call the addToCart function from the Zustand store
      addItemStore(itemWithUid);
      // The toast message is now handled by the store action
    } catch (error) {
      console.error("Error adding item via context:", error);
      toast.error("Failed to add item to cart");
    }

    // Open cart drawer after adding item
    setCartDrawerOpen(true);
  };

  const removeItem = (id: string, uniqueId?: string) => {
    try {
      const itemsToRemove = cartItems.filter((item: CartItem) => 
        (uniqueId && item._uid === uniqueId) || (!uniqueId && item._id === id)
      );
      if (itemsToRemove.length > 0) {
        const updatedItems = cartItems.filter((item: CartItem) => 
           !((uniqueId && item._uid === uniqueId) || (!uniqueId && item._id === id))
        );
        updateCartStore(updatedItems); // Update store which triggers debounced save
        // toast.success("Item removed from cart"); // Store action could handle toast
      } else {
        toast.warning("Item not found in cart");
      }
    } catch (error) {
      console.error("Error removing item via context:", error);
      toast.error("Failed to remove item from cart");
    }
  };

  const updateItemQuantity = (
    id: string,
    quantity: number, // This is the *desired* new total quantity for the item
    uniqueId?: string,
    size?: string,
    style?: any
  ) => {
    try {
      const updatedItems = cartItems.map((item: CartItem) => {
        const isMatch = (uniqueId && item._uid === uniqueId) ||
                        (!uniqueId && item._id === id &&
                         (!size || item.size === size) &&
                         (item.style === style || (item.style == null && style == null)));

        if (isMatch) {
          const stockLimit = typeof item.availableQty === 'number' ? item.availableQty : Infinity;
          let newQuantity = Math.max(0, quantity); // Allow quantity to be 0 for potential removal by setting qty to 0

          if (newQuantity > stockLimit) {
            newQuantity = stockLimit; // Cap at stock limit
            if (stockLimit > 0) {
              toast.info(`Quantity for "${item.name}" (Size: ${item.size}) has been adjusted to available stock: ${stockLimit}.`);
            } else {
              // This case means stockLimit is 0, and they tried to set quantity > 0
              toast.error(`"${item.name}" (Size: ${item.size}) is out of stock.`);
            }
          }
          
          // If stockLimit is 0 and the original desired quantity was > 0, newQuantity will be 0.
          // If newQuantity becomes 0 (either by user setting to 0, or capped to 0 due to stock),
          // the item will be filtered out later.
          if (stockLimit === 0 && quantity > 0) {
             toast.error(`"${item.name}" (Size: ${item.size}) is out of stock. Item will be removed if quantity is set to 0.`);
             // newQuantity is already 0 if stockLimit is 0 and quantity > stockLimit
          }

          return { ...item, quantity: newQuantity, qty: newQuantity }; // qty seems redundant, ensure it mirrors quantity
        }
        return item;
      }).filter((item: CartItem) => item.quantity > 0); // Remove items if their quantity becomes 0

      updateCartStore(updatedItems);
    } catch (error) {
      console.error("Error updating item quantity via context:", error);
      toast.error("Failed to update item quantity");
    }
  };

  const clearCart = () => {
    try {
      emptyCartStore(); // Call store action which handles state and DB save
      // toast.success("Cart cleared"); // Store action handles toast
    } catch (error) {
      console.error("Error clearing cart via context:", error);
      toast.error("Failed to clear cart");
    }
  };

  // --- Context Value ---
  const value = {
    cartItems, // From store
    addItem, // Context wrapper for store action
    removeItem, // Context wrapper for store action
    updateItemQuantity, // Context wrapper for store action
    clearCart, // Context wrapper for store action
    isCartDrawerOpen, // From store
    setCartDrawerOpen // From store
  };

  // console.log("Cart context value:", value);
  
  return (
    <CartContext.Provider value={value}>
      {children}
      {/* CartDrawer now gets state/action directly from store via context */}
      <CartDrawer 
        isOpen={isCartDrawerOpen} // Use store state
        onClose={() => setCartDrawerOpen(false)} // Use store action
      />
    </CartContext.Provider>
  );
}

// --- useCart Hook ---
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

import { create } from "zustand";
import { toast } from "sonner";
import { saveCartForUser, getSavedCartForUser } from "@/lib/database/actions/cart.actions";
import { getSession } from "next-auth/react";
import debounce from 'lodash/debounce';

// Define types
type CartItem = {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number; // Add originalPrice as optional
  image: string;
  quantity: number; // Frontend quantity state
  qty?: number; // Keep for potential backend mapping if needed, but prefer quantity
  size?: string;
  availableQty?: number; // Optional: Available stock quantity
  _uid: string; // Unique identifier for cart instance - NOW MANDATORY
};

// Define cart and actions types
type Cart = {
  cartItems: CartItem[];
};

type CartState = {
  cart: Cart;
  isInitialized: boolean;
  isCartDrawerOpen: boolean; // Add drawer state
};

type CartActions = {
  initializeCart: () => Promise<void>;
  addToCart: (item: CartItem) => void;
  updateCart: (items: CartItem[]) => void;
  emptyCart: () => void;
  setCartDrawerOpen: (isOpen: boolean) => void;
  ensureCartItemSizes: () => void; // New function to ensure all items have sizes
};

// Helper function to generate _uid
const generateUid = (item: { _id: string; size?: string }): string => {
  if (!item || !item._id) {
    console.error("Cannot generate UID: Missing _id", item);
    // Fallback UID, though this indicates an issue upstream
    return `unknown_${Date.now()}`;
  }
  // Handle items without size by using a default value
  const sizeValue = item.size !== undefined && item.size !== null ? item.size : 'default';
  return `${item._id}_${sizeValue}`;
};

// Debounced save function (outside the store definition)
const debouncedSave = debounce(async (itemsToSave: CartItem[]) => {
  const session = await getSession();
  if (session?.user?.id) {
    try {
      console.log("Debounced save triggered for user:", session.user.id);
      // Map items to backend structure (using qty)
      const backendCartItems = itemsToSave.map(item => ({
        ...item,
        qty: item.quantity, // Map frontend quantity to backend qty
        // Omit _uid if backend doesn't need it, or keep if it does
      }));
      await saveCartForUser(backendCartItems, session.user.id);
      console.log("Cart successfully saved to DB via debounce.");
      // toast.info("Cart saved."); // Optional: less intrusive background save notification
    } catch (error) {
      console.error("Error saving cart via debounce:", error);
      // Avoid showing error toast for background saves unless critical
    }
  } else {
    // No longer saving to localStorage if user is logged out
    console.log("User not logged in, cart not saved via debounce.");
  }
}, 1500); // Adjust debounce time as needed (e.g., 1500ms)

// Initial state
const initialState: CartState = {
  cart: {
    cartItems: [],
  },
  isInitialized: false,
  isCartDrawerOpen: false, // Initialize drawer state
};

export const useCartStore = create<CartState & CartActions>()((set, get) => ({
  ...initialState,

  // --- Drawer Action ---
  setCartDrawerOpen: (isOpen: boolean) => set({ isCartDrawerOpen: isOpen }),

  // --- Cart Actions ---
  initializeCart: async () => {
    if (get().isInitialized) return; // Prevent re-initialization

    console.log("Initializing cart: Checking session...");
    const session = await getSession();
    let initialCartItems: CartItem[] = []; // Start with empty cart

    if (session?.user?.id) {
      console.log("User logged in, attempting to load cart from DB for user:", session.user.id);
      try {
        const savedCartResult = await getSavedCartForUser(session.user.id);
        // Check if fetch was successful and cart data exists with products array
        if (savedCartResult.success && savedCartResult.cart && Array.isArray(savedCartResult.cart.products)) {
          initialCartItems = savedCartResult.cart.products.map((item: any) => ({
            ...item,
            _id: item.product, // Explicitly map DB 'product' field (ObjectId) to frontend '_id'
            product: undefined, // Remove the original 'product' field to avoid confusion
            quantity: item.qty || item.quantity || 1, // Map DB qty to frontend quantity
            // Ensure _uid uses the correct ID field (_id) after mapping
            _uid: generateUid({ ...item, _id: item.product }) 
          }));
          console.log("Loaded cart from DB:", initialCartItems);
        } else if (savedCartResult.success && !savedCartResult.cart) {
           console.log("No cart found in DB for this user.");
           // If DB cart is explicitly null/empty, start fresh
        } else {
           console.log("Received unexpected data or error from getSavedCartForUser:", savedCartResult);
           // Handle potential errors or unexpected structure from backend
        }
      } catch (error) {
        console.error("Error loading cart from DB:", error);
        // If DB load fails, start with an empty cart for the logged-in user
        initialCartItems = [];
      }
    } else {
      // Logged out: Always start with an empty cart
      console.log("User not logged in, initializing with empty cart.");
      initialCartItems = [];
    }

    set({
      cart: { cartItems: initialCartItems },
      isInitialized: true
    });
    console.log("Cart initialized with items:", initialCartItems);
  },

  addToCart: (itemToAdd) => {
    // Ensure itemToAdd has essential properties before generating UID
    if (!itemToAdd || !itemToAdd._id) {
        console.error("addToCart: Invalid item data received", itemToAdd);
        toast.error("Could not add item. Invalid data.");
        return;
    }

    const itemWithUid = {
        ...itemToAdd,
        _uid: generateUid(itemToAdd) // Generate UID consistently
    };

    const cart = get().cart;
    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item._uid === itemWithUid._uid // Find by unique identifier
    );

    let updatedCartItems;

    if (existingItemIndex > -1) {
      // Item exists, update quantity
      updatedCartItems = [...cart.cartItems];
      const existingItem = updatedCartItems[existingItemIndex];
      // Ensure quantity is treated as a number
      const currentQuantity = Number(existingItem.quantity) || 0;
      const quantityToAdd = Number(itemWithUid.quantity) || 1;
      
      // Check if there's enough quantity available
      const availableQty = itemWithUid.availableQty !== undefined ? 
        Number(itemWithUid.availableQty) : 
        Infinity;
      
      if (availableQty < currentQuantity + quantityToAdd) {
        toast.error(`Sorry, "${existingItem.name}" (Size: ${existingItem.size}) has insufficient quantity (requested ${currentQuantity + quantityToAdd}, only ${availableQty} available).`);
        return;
      }
      
      existingItem.quantity = currentQuantity + quantityToAdd;
      // Update qty as well if needed, though quantity is primary in frontend
      existingItem.qty = existingItem.quantity;
      // Make sure to keep track of the available quantity
      existingItem.availableQty = availableQty;

      console.log(`Updated quantity for item UID: ${existingItem._uid} to ${existingItem.quantity}`);
      toast.success(`${existingItem.name} quantity updated in cart`);

    } else {
      // Item does not exist, check if we can add it
      const newQuantity = Math.max(1, Number(itemWithUid.quantity) || 1);
      const availableQty = itemWithUid.availableQty !== undefined ? 
        Number(itemWithUid.availableQty) : 
        Infinity;
      
      if (availableQty < newQuantity) {
        toast.error(`Sorry, "${itemWithUid.name}" (Size: ${itemWithUid.size}) has insufficient quantity (requested ${newQuantity}, only ${availableQty} available).`);
        return;
      }
      
      // Add new item if we have sufficient stock
      const newItem = {
          ...itemWithUid,
          quantity: newQuantity
      };
      // Set qty for consistency if needed
      newItem.qty = newItem.quantity;

      updatedCartItems = [...cart.cartItems, newItem];
      console.log(`Added new item UID: ${newItem._uid}`);
      toast.success(`${newItem.name} added to cart`);
    }

    set({ cart: { cartItems: updatedCartItems } });
    get().setCartDrawerOpen(true); // Open drawer after adding/updating
    debouncedSave(updatedCartItems); // Trigger debounced save
  },

  updateCart: (items) => {
    // Ensure all items have _uid before updating state
    const itemsWithUid = items.map(item => ({
        ...item,
        _uid: item._uid || generateUid(item) // Generate UID if missing (shouldn't happen ideally)
    }));
    set({ cart: { cartItems: itemsWithUid } });
    debouncedSave(itemsWithUid); // Trigger debounced save
  },

  emptyCart: async () => {
    set({ cart: { cartItems: [] } });
    // Clear cart in DB only if user is logged in
    const session = await getSession();
    if (session?.user?.id) {
        try {
            // Assuming you have a clearUserCart action
            // await clearUserCart(session.user.id); // Uncomment if you have this action
            // Alternatively, save an empty array
            await saveCartForUser([], session.user.id);
            console.log("Cart cleared in DB for user:", session.user.id);
            toast.success("Cart cleared");
        } catch (error) {
            console.error("Error clearing cart in DB:", error);
            toast.error("Failed to clear cart in database.");
            // Optionally revert local state or handle error differently
        }
    } else {
        console.log("User not logged in, cart cleared locally.");
        toast.success("Cart cleared");
    }
    // Cancel any pending debounced saves of the old cart
    debouncedSave.cancel();
  },

  // --- Utility Actions ---
  ensureCartItemSizes: () => {
    const cart = get().cart;
    let itemsUpdated = false;
    
    const updatedCartItems = cart.cartItems.map(item => {
      if (!item.size) {
        console.warn(`Item ${item.name} (ID: ${item._id}) is missing a size. Setting default size.`);
        itemsUpdated = true;
        
        // Set a default size, can be customized based on your inventory logic
        const defaultSize = 'M'; // Default to Medium size or most common size in your inventory
        
        // Create an updated item with the default size
        return {
          ...item,
          size: defaultSize,
          // Regenerate UID to reflect size change
          _uid: `${item._id}_${defaultSize}`
        };
      }
      return item;
    });

    if (itemsUpdated) {
      set({ cart: { cartItems: updatedCartItems } });
      console.log("Updated cart items with default sizes:", updatedCartItems);
      // Save the updated cart to the database
      debouncedSave(updatedCartItems);
      toast.info("Some items in your cart were missing sizes. Default sizes have been applied.", {
        duration: 4000,
      });
    }
    
    return itemsUpdated; // Return whether any items were updated
  },
}));

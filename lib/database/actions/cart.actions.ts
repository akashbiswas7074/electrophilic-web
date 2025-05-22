"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Product from "../models/product.model";
import User from "../models/user.model";
import Cart from "../models/cart.model";

// Create a helper function to safely serialize cart data
function serializeCartData(cart: any) {
  if (!cart) return null;
  
  // Create a new object to avoid modifying the original
  const serializedCart = { ...cart };
  
  // Convert ObjectId to string for the main cart ID
  if (serializedCart._id) {
    serializedCart._id = serializedCart._id.toString();
  }
  
  // Convert user ObjectId to string
  if (serializedCart.user) {
    // If user is an ObjectId with buffer
    if (typeof serializedCart.user === 'object' && serializedCart.user.buffer) {
      serializedCart.user = serializedCart.user.toString();
    } 
    // If user is already an object with _id
    else if (typeof serializedCart.user === 'object' && serializedCart.user._id) {
      serializedCart.user = {
        ...serializedCart.user,
        _id: serializedCart.user._id.toString()
      };
    }
  }
  
  // Convert dates to ISO strings
  if (serializedCart.createdAt instanceof Date) {
    serializedCart.createdAt = serializedCart.createdAt.toISOString();
  }
  if (serializedCart.updatedAt instanceof Date) {
    serializedCart.updatedAt = serializedCart.updatedAt.toISOString();
  }
  
  // Serialize products array
  if (Array.isArray(serializedCart.products)) {
    serializedCart.products = serializedCart.products.map((productItem: any) => { // Renamed variable for clarity
      const serializedProductItem = { ...productItem };

      // Convert productItem _id (subdocument ID) to string if it exists
      if (serializedProductItem._id) {
        serializedProductItem._id = serializedProductItem._id.toString();
      }

      // Handle 'product' field (reference to Product model)
      if (serializedProductItem.product) {
        // If populated
        if (typeof serializedProductItem.product === 'object' && serializedProductItem.product._id) {
          serializedProductItem.product = {
            ...serializedProductItem.product,
            _id: serializedProductItem.product._id.toString() // Serialize populated product's ID
            // Add other fields from populated product if needed, ensuring they are serializable
          };
        }
        // If just an ObjectId
        else if (typeof serializedProductItem.product === 'object' && serializedProductItem.product.toString) {
          serializedProductItem.product = serializedProductItem.product.toString();
        }
      }

      // *** ADDED: Serialize the nested user ObjectId ***
      if (serializedProductItem.user) {
         // If it's an ObjectId
         if (typeof serializedProductItem.user === 'object' && serializedProductItem.user.toString) { 
            serializedProductItem.user = serializedProductItem.user.toString(); // Convert ObjectId to string
         }
         // Handle if populated (less likely based on schema, but good practice)
         else if (typeof serializedProductItem.user === 'object' && serializedProductItem.user._id) {
            serializedProductItem.user = {
                ...serializedProductItem.user,
                _id: serializedProductItem.user._id.toString()
            };
         }
      }
      // *** END ADDED SECTION ***

      // Ensure price is a valid number
      serializedProductItem.price = typeof serializedProductItem.price === 'number'
        ? serializedProductItem.price
        : parseFloat(String(serializedProductItem.price || 0));

      return serializedProductItem;
    });
  }

  return serializedCart;
}

// Cart operations for user:
export async function saveCartForUser(cartItems: any[], userId: string) {
  console.log(`[saveCartForUser] Attempting to save cart for userId: ${userId}`); // Log entry
  try {
    // Fix: use the correct database connection function
    console.log("[saveCartForUser] Connecting to database..."); // Log connection attempt
    await connectToDatabase();
    console.log("[saveCartForUser] Database connected."); // Log connection success
    
    if (!userId) {
      console.error("[saveCartForUser] Error: User ID is required"); // Log error
      return { success: false, message: "User ID is required" };
    }
    
    // Validate cart items to ensure they have the required fields
    if (!Array.isArray(cartItems)) {
      console.error("[saveCartForUser] Error: Invalid cart items - not an array", cartItems); // Log error
      return { success: false, message: "Invalid cart items: not an array" };
    }
    
    console.log("[saveCartForUser] Raw cartItems received:", JSON.stringify(cartItems, null, 2)); // Log raw items

    // Normalize cart items to ensure consistent format AND MATCH SCHEMA
    const normalizedCartItems = cartItems.map(item => {
      // Ensure qty/quantity is consistent
      const quantity = item.qty || item.quantity || 1;
      
      // Ensure price is a number
      let price = 0;
      if (typeof item.price === 'number') {
        price = item.price;
      } else if (typeof item.price === 'string') {
        price = parseFloat(item.price) || 0;
      }
      
      // Ensure essential fields are present for the DB schema
      return {
        product: item._id || item.product, // Maps to schema's 'product' (ObjectId)
        name: item.name,
        price: price,
        qty: quantity,
        size: item.size,
        // Map frontend 'style' object to backend 'color' object
        // Assuming item.style is structured like { color: '...', image: '...' }
        // If item.style is just a string, this needs adjustment or schema change.
        color: typeof item.style === 'object' ? item.style : undefined, 
        image: item.image,
        user: userId, // *** ADDED: Include userId in each product item as per schema ***
        // vendor: item.vendor, // Include if available and needed
      };
    }).filter(item => item.product && item.user); // Filter out items missing product OR user ID

    console.log("[saveCartForUser] Normalized cartItems for DB:", JSON.stringify(normalizedCartItems, null, 2)); // Log normalized items
    
    // Calculate cart total based on normalized items *before* saving
    const cartTotal = normalizedCartItems.reduce((acc, item) => {
      return acc + (item.price * (item.qty || 1));
    }, 0);
    console.log(`[saveCartForUser] Calculated Cart Total: ${cartTotal}`);

    // First check if the user already has a cart
    console.log(`[saveCartForUser] Finding existing cart for user: ${userId}`); // Log find attempt
    const existingCart = await Cart.findOne({ user: userId });
    
    let cart;
    try {
      if (existingCart) {
        console.log(`[saveCartForUser] Found existing cart (${existingCart._id}). Updating...`); // Log update attempt
        cart = await Cart.findOneAndUpdate(
          { user: userId },
          { 
            products: normalizedCartItems, 
            cartTotal: cartTotal, // Update cartTotal as well
            updatedAt: new Date() 
          },
          { new: true } // Return the updated document
        );
        console.log(`[saveCartForUser] Cart updated successfully. ID: ${cart?._id}`); // Log update success
      } else {
        console.log(`[saveCartForUser] No existing cart found. Creating new cart for user: ${userId}`); // Log create attempt
        cart = await Cart.create({
          user: userId,
          products: normalizedCartItems,
          cartTotal: cartTotal, // Set initial cartTotal
        });
        console.log(`[saveCartForUser] New cart created successfully. ID: ${cart?._id}`); // Log create success
      }
      
      if (!cart) {
        console.error("[saveCartForUser] Error: Failed to create/update cart document in DB for user:", userId); // Log failure
        return { success: false, message: "Failed to save cart to database" };
      }
      
      console.log(`[saveCartForUser] Cart save successful for user: ${userId}.`); // Log overall success
      // Convert ObjectId to string before returning to client
      return { 
        success: true, 
        message: "Cart saved successfully", 
        cartId: cart._id.toString(), // Convert ObjectId to string
        cartTotal // Return the calculated total
      };
    } catch (dbError) {
      console.error("[saveCartForUser] Database operation error (update/create):", dbError); // Log specific DB error
      return { 
        success: false, 
        message: `Database error: ${dbError instanceof Error ? dbError.message : "Unknown error"}` 
      };
    }
  } catch (error) {
    console.error("[saveCartForUser] General error saving cart:", error); // Log general error
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to save cart" 
    };
  }
}

export async function getSavedCartForUser(userId: string) {
  try {
    // Fix: use the correct database connection function
    await connectToDatabase();
    
    if (!userId) {
      return { success: false, message: "User ID is required" };
    }
    
    let cart;
    try {
      cart = await Cart.findOne({ user: userId })
        .populate('products.product')
        .lean();
    } catch (dbError) {
      console.error("Error fetching cart from database:", dbError);
      return { 
        success: false, 
        message: `Database error: ${dbError instanceof Error ? dbError.message : "Unknown error"}`
      };
    }
    
    if (!cart) {
      return { success: true, message: "No cart found for this user", cart: null };
    }
    
    // Use the serialization helper function to safely convert the cart data
    const serializedCart = serializeCartData(cart);
    
    return { 
      success: true, 
      cart: serializedCart
    };
  } catch (error) {
    console.error("Error getting cart:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to get cart" 
    };
  }
}

// update cart for user - handles product updates and availability
export async function updateCartForUser(products: any) {
  try {
    await connectToDatabase();
    
    const updatedProducts = await Promise.all(products.map(async (p: any) => {
      const dbProduct: any = await Product.findById(p._id).lean();
      if (!dbProduct) return null;

      const subProduct = dbProduct.subProducts[p.style];
      if (!subProduct) return null;

      const sizeData = subProduct.sizes.find((x: any) => x.size == p.size);
      if (!sizeData) return null;

      return {
        ...p,
        priceBefore: sizeData.price,
        price: subProduct.discount > 0
          ? sizeData.price - (sizeData.price * subProduct.discount / 100)
          : sizeData.price,
        discount: subProduct.discount,
        quantity: sizeData.qty,
        shippingFee: dbProduct.shipping,
      };
    }));

    const filteredProducts = updatedProducts.filter(p => p !== null);

    return {
      success: true,
      message: "Successfully updated the cart",
      data: JSON.parse(JSON.stringify(filteredProducts)),
    };
  } catch (error) {
    console.error("Update cart error:", error);
    return { success: false, message: (error as Error).message };
  }
}

// Clear user's cart from database
export async function clearUserCart(userId: string) {
  try {
    await connectToDatabase();
    
    // Use findById
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    await Cart.deleteOne({ user: user._id });
    
    return { success: true, message: "Cart cleared successfully" };
  } catch (error) {
    console.error('Error clearing user cart:', error);
    return { success: false, message: "Failed to clear cart" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../connect";
import Cart from "../models/cart.model";
import Coupon from "../models/coupon.model";
import Order from "../models/order.model";
import User from "../models/user.model";
import { handleError } from "@/lib/utils";

// create user
export async function createUser(user: any) {
  try {
    await connectToDatabase();
    
    if (!user.email) {
      console.error("Missing email in user data for createUser"); // Added more specific log
      return null;
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: user.email });
    if (existingUser) {
      console.log("User already exists with this email, returning existing user:", existingUser._id); // Log existing user ID
      // Optionally, update existing user if new data is provided (e.g., from OAuth)
      // For now, just return the existing user
      return JSON.parse(JSON.stringify(existingUser));
    }

    // Prepare user data with fallbacks for required fields
    const userData = {
      email: user.email,
      // Ensure firstName and lastName are provided, with fallbacks
      firstName: user.firstName || user.name?.split(' ')[0] || user.email.split('@')[0] || "User",
      lastName: user.lastName || user.name?.split(' ')[1] || "Name",
      username: user.username || `${user.firstName || user.email.split('@')[0]}${Date.now().toString().slice(-4)}`, // More robust fallback username
      image: user.image || "",
      provider: user.provider || "credentials", // Ensure provider is set
      emailVerified: user.emailVerified || (user.provider !== 'credentials' ? new Date() : null), // Auto-verify for OAuth
      // Add any other fields that are part of your User model and might come from `user` object
    };

    console.log("Creating new user with data:", userData);
    
    // Create new user with validated data
    const newUser = await User.create(userData);
    console.log("New user created successfully with ID:", newUser._id);
    
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.error("Error creating user:", error);
    // Check for duplicate key errors specifically for username or email if not caught by findOne
    if ((error as any).code === 11000) {
        console.error("Duplicate key error:", (error as any).keyValue);
        // Potentially try to find the user again if it was a race condition, or return specific error
    }
    handleError(error);
    return null;
  }
}

// get user by id
export async function getUserById(userId: string) {
  try {
    await connectToDatabase();
    if (!userId) {
      console.log("[getUserById] No userId provided.");
      return null;
    }
    
    console.log(`[getUserById] Fetching user with ID: ${userId}`);
    // Ensure all necessary fields are selected if there are any `select: false` in the model
    // By default, findById selects all fields not explicitly excluded.
    const user = await User.findById(userId); 
    
    if (!user) {
      console.log(`[getUserById] User not found with ID: ${userId}`);
      return null;
    }
    console.log(`[getUserById] User found: ${user.email}, Name: ${user.firstName} ${user.lastName || ''}`);
    
    const formattedAddresses = user.address || [];
      
    // Add debug logs to track data flow
    console.log(`[getUserById] User data being returned:`, {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || (user.address && user.address.length > 0 ? user.address[0].phoneNumber : ''),
      addressCount: formattedAddresses.length
    });
    
    // Return all fields needed by the checkout component
    return JSON.parse(JSON.stringify({
      _id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      image: user.image,
      phone: user.phone || (user.address && user.address.length > 0 ? user.address[0].phoneNumber : ''),
      // Include addresses if needed by checkout
      addresses: formattedAddresses
    }));
  } catch (error) {
    console.error(`[getUserById] Error fetching user ${userId}:`, error);
    handleError(error);
    return null;
  }
}

// update user
export async function updateUser(userId: string, userData: any) {
  try {
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(userId, userData, { new: true });
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

// delete user
export async function deleteUser(userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findByIdAndDelete(userId);
    if (user) revalidatePath("/");
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

// Address operations of user:
export async function changeActiveAddress(id: any, user_id: any) {
  try {
    await connectToDatabase();
    const user = await User.findById(user_id);
    let user_addresses = user.address;
    let addresses = [];

    for (let i = 0; i < user_addresses.length; i++) {
      let temp_address = {};
      if (user_addresses[i]._id == id) {
        temp_address = { ...user_addresses[i].toObject(), active: true };
        addresses.push(temp_address);
      } else {
        temp_address = { ...user_addresses[i].toObject(), active: false };
        addresses.push(temp_address);
      }
    }
    await user.updateOne(
      {
        address: addresses,
      },
      { new: true }
    );
    return JSON.parse(JSON.stringify({ addresses }));
  } catch (error) {
    handleError(error);
  }
}
export async function deleteAddress(id: any, user_id: any) {
  try {
    await connectToDatabase();
    const user = await User.findById(user_id);
    await user.updateOne(
      {
        $pull: {
          address: { _id: id },
        },
      },
      { new: true }
    );
    return JSON.parse(
      JSON.stringify({
        addresses: user.address.filter((a: any) => a._id != id),
      })
    );
  } catch (error) {
    handleError(error);
  }
}

// Get saved addresses for a user
export async function getUserAddresses(userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, message: "User not found", addresses: [] };
    }
    
    // Check if user has addresses
    if (!user.address || !Array.isArray(user.address)) {
      return { success: true, message: "No addresses found", addresses: [] };
    }
    
    return { 
      success: true, 
      message: "Addresses found", 
      addresses: JSON.parse(JSON.stringify(user.address))
    };
  } catch (error) {
    handleError(error);
    return { success: false, message: "Error fetching addresses", addresses: [] };
  }
}

export async function saveAddress(address: any, userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Initialize address array if it doesn't exist
    if (!user.address || !Array.isArray(user.address)) {
      user.address = [];
    }

    // If we're updating an existing address
    if (address._id) {
      const addressIndex = user.address.findIndex((addr: any) => 
        addr._id.toString() === address._id
      );
      
      if (addressIndex >= 0) {
        // Update existing address
        user.address[addressIndex] = { ...user.address[addressIndex], ...address };
      } else {
        // Add as new address if ID not found
        user.address.push(address);
      }
    } else {
      // Add new address
      user.address.push(address);
    }

    // Save the updated user
    await user.save();
    
    return { 
      success: true, 
      message: "Address saved successfully", 
      addresses: JSON.parse(JSON.stringify(user.address)) 
    };
  } catch (error) {
    handleError(error);
    return { success: false, message: "Error saving address" };
  }
}

// Coupon operations of user:
export async function applyCoupon(coupon: string, userId: string) {
  try {
    await connectToDatabase();
    // Make sure userId is the MongoDB user ID, not the auth provider's ID
    const user = await User.findById(userId);
    const checkCoupon = await Coupon.findOne({ coupon });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (checkCoupon == null) {
      return { message: "Invalid Coupon", success: false };
    }
    const { cartTotal } = await Cart.findOne({ user: userId });
    let totalAfterDiscount =
      cartTotal - (cartTotal * checkCoupon.discount) / 100;
    await Cart.findByIdAndUpdate(user._id, { totalAfterDiscount });
    return JSON.parse(
      JSON.stringify({
        totalAfterDiscount: totalAfterDiscount.toFixed(2),
        discount: checkCoupon.discount,
        message: "Successfully fetched Coupon",
        success: true,
      })
    );
  } catch (error) {}
}

// get all orders of user for their profile:
export async function getAllUserOrdersProfile(userId: string) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return [];

    const orders = await Order.find({ user: user._id })
      .populate({
        path: "orderItems.product",
        select: "name images"
      })
      .sort({ createdAt: -1 })
      .lean();

    return orders.map((order: any) => ({
      id: order._id.toString(),
      date: new Date(order.createdAt).toLocaleDateString(),
      status: order.status || 'processing',
      total: order.total || order.totalAmount || 0,
      items: (order.orderItems || []).map((item: any) => ({
        name: item.name || (item.product && item.product.name) || 'Product',
        quantity: item.quantity || item.qty || 1,
        price: item.price || 0,
        image: item.image || (item.product && item.product.images && item.product.images[0]?.url)
      }))
    }));
  } catch (error) {
    handleError(error);
    return [];
  }
}
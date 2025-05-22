// This script helps synchronize order status between admin and website models
import { connectToDatabase } from '../lib/database/connect';
import Order from '../lib/database/models/order.model';
import mongoose from 'mongoose';
// Import client-safe utilities
import { mapAdminStatusToWebsite, mapWebsiteStatusToAdmin } from '@/lib/order-status-utils';


/**
 * Fetches an order by ID and ensures all fields are properly formatted
 * @param {string} orderId - MongoDB ObjectId of the order to fetch
 * @returns {Promise<Object|null>} The order object or null if not found
 */
export async function fetchOrderById(orderId) {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    console.error("Invalid order ID format:", orderId);
    return null;
  }

  try {
    await connectToDatabase();
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('orderItems.product')
      .lean();

    if (!order) {
      console.log(`Order not found: ${orderId}`);
      return null;
    }

    // Ensure products array exists and has statuses
    if (order.products && Array.isArray(order.products)) {
      order.products.forEach(product => {
        if (!product.status) {
          product.status = "Not Processed"; // Default if missing
        }
        // Ensure trackingUrl and trackingId are at least empty strings if not present
        if (typeof product.trackingUrl === 'undefined') {
          product.trackingUrl = "";
        }
        if (typeof product.trackingId === 'undefined') {
          product.trackingId = "";
        }
      });
    } else {
      order.products = []; // Ensure it's an array
    }

    // Ensure orderItems array exists and has statuses (website representation)
    if (order.orderItems && Array.isArray(order.orderItems)) {
      order.orderItems.forEach(item => {
        if (!item.status) {
          // Map from a potential admin default or ensure a website default
          item.status = mapAdminStatusToWebsite("Not Processed"); 
        }
        // Ensure trackingUrl and trackingId are at least empty strings if not present
        if (typeof item.trackingUrl === 'undefined') {
          item.trackingUrl = "";
        }
        if (typeof item.trackingId === 'undefined') {
          item.trackingId = "";
        }
      });
    } else {
      order.orderItems = []; // Ensure it's an array
    }

    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    return null;
  }
}

/**
 * Updates an order's status and ensures compatibility between website and admin
 * @param {string} orderId - MongoDB ObjectId of the order to update
 * @param {string} newStatus - The new status to set (can be either admin or website format)
 * @returns {Promise<boolean>} Success or failure of the update
 */
export async function updateOrderStatus(orderId, newStatus) {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId) || !newStatus) {
    console.error("Invalid order ID or status:", orderId, newStatus);
    return false;
  }

  try {
    await connectToDatabase();
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log(`Order not found: ${orderId}`);
      return false;
    }
    
    // Convert status to website format if it's in admin format
    const websiteStatus = mapAdminStatusToWebsite(newStatus); // Use client-safe util
    order.status = websiteStatus; // Overall order status (might be less relevant if item-specific)
    
    // If there are orderItems, update their statuses too (Website format)
    if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
      order.orderItems.forEach(item => {
        // Assuming a general update, or could be item-specific if productId was passed
        item.status = websiteStatus; 
      });
    }
    
    // If there are products, update their statuses too (Admin format)
    if (order.products && Array.isArray(order.products) && order.products.length > 0) {
      const adminStatus = mapWebsiteStatusToAdmin(websiteStatus); // Use client-safe util
      order.products.forEach(item => {
        // Assuming a general update
        item.status = adminStatus;
      });
    }
    
    await order.save();
    console.log(`Order ${orderId} status updated to ${websiteStatus} (overall)`);
    return true;
  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
    return false;
  }
}

// Export these functions for use in both website and admin projects
export default {
  fetchOrderById,
  updateOrderStatus,
  mapWebsiteStatusToAdmin,
  mapAdminStatusToWebsite
};
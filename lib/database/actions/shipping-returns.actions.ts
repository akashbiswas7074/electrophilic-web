"use server";

import { connectToDatabase } from "@/lib/database/connect";
import ShippingReturns from "@/lib/database/models/shipping-returns.model";

// Get the active shipping & returns configuration for the website
export const getActiveShippingReturns = async () => {
  try {
    await connectToDatabase();
    
    const config = await ShippingReturns.findOne({ isActive: true }).lean();
    
    if (!config) {
      // Return a default configuration if none exists
      return {
        success: true,
        config: {
          title: "Shipping & Returns",
          subtitle: "Fast delivery and easy returns",
          shippingOptions: [
            {
              title: "Free Standard Shipping",
              description: "On all orders above ₹999. Orders typically arrive within 5-7 business days.",
              icon: "🚚",
              minOrderAmount: 999,
              deliveryTime: "5-7 business days",
              cost: 0,
              isActive: true,
              order: 0
            }
          ],
          returnInfo: [
            {
              title: "30-Day Returns",
              description: "Not completely satisfied? Return unworn items within 30 days for a full refund.",
              icon: "🔄",
              returnPeriodDays: 30,
              conditions: [
                "Items must be unworn and unwashed",
                "Original packaging and tags must be intact",
                "Return initiated within 30 days of purchase"
              ],
              isActive: true,
              order: 0
            }
          ],
          additionalInfo: "",
          customCSS: ""
        }
      };
    }
    
    return {
      success: true,
      config: JSON.parse(JSON.stringify(config))
    };
  } catch (error: any) {
    console.error("Error fetching shipping & returns config:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch shipping & returns configuration",
      config: null
    };
  }
};
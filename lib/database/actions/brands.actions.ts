"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Product from "../models/product.model";
import { unstable_cache } from "next/cache";

// Define the expected return type 
interface BrandResult {
  success: boolean;
  message: string;
  brands: Array<{ _id: string, name: string }>; // Array of brand objects
}

// Fetch all unique brand names from the Product collection
export const getAllBrands = unstable_cache(
  async (): Promise<BrandResult> => {
    try {
      await connectToDatabase();

      // Use distinct to get unique brand strings from the Product collection
      const brandNames: string[] = await Product.distinct("brand").exec();

      // Filter out any null or empty brand names and map to objects with _id and name
      const brands = brandNames
        .filter((name) => name && name.trim() !== "") // Ensure name is not null or empty
        .map((name) => ({
          _id: name, // Use the name itself as a unique identifier for filtering purposes
          name: name,
        }));

      return {
        success: true,
        message: "Successfully fetched brand names.",
        brands: brands,
      };
    } catch (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? 
                          String(error.message) : 
                          "An error occurred while fetching brands.";
      
      return {
        success: false,
        message: errorMessage,
        brands: [],  // Return empty array on error
      };
    }
  },
  ["get-all-brands"], // Cache key
  { revalidate: 3600 } // Revalidate every hour
);

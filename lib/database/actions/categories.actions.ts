"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Category from "../models/category.model";
import { unstable_cache } from "next/cache";

// Define more specific types for the category data
interface LeanImage {
  url?: string;
  public_id?: string;
  _id?: string; // Mongoose subdocuments often have an _id
}

interface LeanCategory {
  _id: string;
  name: string;
  slug: string;
  images?: LeanImage[];
  createdAt: string; // Dates will be stringified
  updatedAt: string; // Dates will be stringified
  // Add other fields like 'vendor' here if needed and selected
}

// Update the CategoryResult interface to use the more specific LeanCategory type
interface CategoryResult {
  success: boolean;
  message: string;
  categories: LeanCategory[];
}

export const getAllCategories = unstable_cache(
  async (): Promise<CategoryResult> => { // Ensure Promise<CategoryResult> not undefined
    try {
      await connectToDatabase();
      // Explicitly select the fields to be fetched
      const categories = await Category.find({})
        .sort({ updatedAt: -1 })
        .select('_id name slug images createdAt updatedAt') // Explicitly select fields
        .lean();

      // The result of lean() should be serializable, but JSON.parse(JSON.stringify()) ensures it
      // and handles any complex types like Mongoose ObjectIds or Dates correctly for Next.js server actions.
      const plainCategories: LeanCategory[] = JSON.parse(JSON.stringify(categories));

      return {
        success: true,
        message: "Successfully fetched all categories.",
        categories: plainCategories,
      };
    } catch (error) {
      const errorResult = handleError(error);
      const errorMessage = 
        typeof errorResult === 'object' && errorResult !== null && 'error' in errorResult && typeof errorResult.error === 'string'
          ? errorResult.error
          : "Failed to fetch categories due to an unexpected error.";
      
      return {
        success: false,
        message: errorMessage,
        categories: [],
      };
    }
  },
  ["all_categories"], // Cache key
  {
    revalidate: 1800, // Revalidate every 30 minutes (optional)
  }
);

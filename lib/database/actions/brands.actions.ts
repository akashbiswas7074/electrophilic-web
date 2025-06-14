"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Product from "../models/product.model";
import { unstable_cache } from "next/cache";

// Define brand interface
interface Brand {
  _id: string;
  name: string;
}

interface BrandResult {
  success: boolean;
  message: string;
  brands: Brand[];
}

export const getAllBrands = unstable_cache(
  async (): Promise<BrandResult> => {
    try {
      await connectToDatabase();
      
      // Get unique brands from products
      const brands = await Product.aggregate([
        {
          $group: {
            _id: "$brand",
            name: { $first: "$brand" }
          }
        },
        {
          $match: {
            _id: { $nin: [null, ""] }
          }
        },
        {
          $sort: { name: 1 }
        }
      ]);

      const formattedBrands: Brand[] = brands.map(brand => ({
        _id: brand._id,
        name: brand.name
      }));

      return {
        success: true,
        message: "Successfully fetched all brands.",
        brands: formattedBrands,
      };
    } catch (error) {
      const errorResult = handleError(error);
      const errorMessage = 
        typeof errorResult === 'object' && errorResult !== null && 'error' in errorResult && typeof errorResult.error === 'string'
          ? errorResult.error
          : "Failed to fetch brands due to an unexpected error.";
      
      return {
        success: false,
        message: errorMessage,
        brands: [],
      };
    }
  },
  ["all_brands"],
  {
    revalidate: 1800,
  }
);

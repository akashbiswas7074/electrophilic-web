"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import SubCategory from "../models/subCategory.model";
import Category from "../models/category.model";
import { unstable_cache } from "next/cache";

// get all subcategories regardless of parent
export const getAllSubCategories = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const allSubCategories = await SubCategory.find()
        .sort({ updatedAt: -1 })
        .populate('parent')
        .lean();
        
      return {
        message: "Successfully fetched all subcategories",
        subCategories: JSON.parse(JSON.stringify(allSubCategories)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "An error occurred while fetching subcategories",
        subCategories: [],
        success: false,
      };
    }
  },
  ["all_subcategories"],
  {
    revalidate: 1800,
  }
);

// get all sub categories by its parent(category) id
export const getAllSubCategoriesByParentId = unstable_cache(
  async (parentId: string) => {
    try {
      await connectToDatabase();
      const subCategoriesByParentId = await SubCategory.find({
        parent: parentId,
      }).lean();
      return {
        message:
          "Successfully fetched all sub categories related to it's parent ID",
        subCategories: JSON.parse(JSON.stringify(subCategoriesByParentId)),
        success: true,
      };
    } catch (error) {
      handleError(error);
    }
  },
  ["parent_subCategories"],
  {
    revalidate: 1800,
  }
);
// get all sub categories by its parent name
export const getAllSubCategoriesByName = unstable_cache(
  async (name: string) => {
    try {
      await connectToDatabase();

      // Step 1: Find the parent category by name
      const parentCategory: any = await Category.findOne({ name }).lean();
      if (!parentCategory) {
        return {
          message: "Parent category not found.",
          subCategories: [],
          success: false,
        };
      }

      const parentId = parentCategory._id;

      // Step 2: Find subcategories by parent ID
      const subCategoriesByParentId = await SubCategory.find({
        parent: parentId,
      }).lean();

      return {
        message:
          "Successfully fetched all subcategories related to the parent category name",
        subCategories: JSON.parse(JSON.stringify(subCategoriesByParentId)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "An error occurred while fetching subcategories",
        subCategories: [],
        success: false,
      };
    }
  },
  ["subCategories"],
  {
    revalidate: 1800,
  }
);

// Updated function to get distinct subcategory names
export const getUniqueSubCategoryNames = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      
      // Get all subcategories with their name field
      const subCategories = await SubCategory.find({}, 'name').lean();
      
      // Log the number of subcategories found
      console.log(`Found ${subCategories.length} subcategories`);
      
      // Extract and return unique names
      const uniqueNames = [...new Set(subCategories.map(sc => sc.name))];
      
      // Sort names alphabetically
      const sortedNames = uniqueNames.sort();
      
      console.log(`Returning ${sortedNames.length} unique subcategory names:`, sortedNames);
      
      return sortedNames;
    } catch (error) {
      console.error("Error fetching subcategory names:", error);
      handleError(error);
      return []; // Return empty array on error
    }
  },
  ["unique_subcategory_names"], // Cache key
  {
    tags: ["subcategories", "filters"], // Cache tags
    revalidate: 3600, // Revalidate every hour
  }
);

// Get subcategory by ID
export const getSubCategoryById = unstable_cache(
  async (id: string) => {
    try {
      await connectToDatabase();
      
      const subCategory = await SubCategory.findById(id)
        .populate('parent')
        .lean();
      
      if (!subCategory) {
        return {
          message: "Subcategory not found",
          subCategory: null,
          success: false,
        };
      }
      
      return {
        message: "Successfully fetched subcategory by ID",
        subCategory: JSON.parse(JSON.stringify(subCategory)),
        success: true,
      };
    } catch (error) {
      console.error("Error fetching subcategory by ID:", error);
      handleError(error);
      return {
        message: "An error occurred while fetching subcategory",
        subCategory: null,
        success: false,
      };
    }
  },
  ["subcategory_by_id"],
  {
    revalidate: 3600, // Revalidate every hour
  }
);

// Get subcategory by slug
export const getSubCategoryBySlug = unstable_cache(
  async (slug: string) => {
    try {
      await connectToDatabase();
      
      const subCategory = await SubCategory.findOne({ slug })
        .populate('parent')
        .lean();
      
      if (!subCategory) {
        return {
          message: "Subcategory not found",
          subCategory: null,
          success: false,
        };
      }
      
      return {
        message: "Successfully fetched subcategory by slug",
        subCategory: JSON.parse(JSON.stringify(subCategory)),
        success: true,
      };
    } catch (error) {
      console.error("Error fetching subcategory by slug:", error);
      handleError(error);
      return {
        message: "An error occurred while fetching subcategory",
        subCategory: null,
        success: false,
      };
    }
  },
  ["subcategory_by_slug"],
  {
    revalidate: 3600, // Revalidate every hour
  }
);

"use server";

import { connectToDatabase } from "../connect";
import FAQ from "../models/faq.model";
import { unstable_cache } from "next/cache";

// Get all active FAQs grouped by category
export const getAllFAQs = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      
      const faqs = await FAQ.find({ isActive: true })
        .sort({ category: 1, order: 1, createdAt: 1 })
        .lean();

      // Group FAQs by category
      const groupedFAQs = faqs.reduce((acc: any, faq: any) => {
        if (!acc[faq.category]) {
          acc[faq.category] = [];
        }
        acc[faq.category].push(faq);
        return acc;
      }, {});

      return {
        success: true,
        faqs: JSON.parse(JSON.stringify(groupedFAQs)),
        message: "FAQs fetched successfully",
      };
    } catch (error: any) {
      console.error("Error fetching FAQs:", error);
      return {
        success: false,
        faqs: {},
        message: error.message || "Failed to fetch FAQs",
      };
    }
  },
  ["faqs"],
  {
    revalidate: 3600, // Revalidate every hour
  }
);

// Get FAQs by category
export const getFAQsByCategory = unstable_cache(
  async (category: string) => {
    try {
      await connectToDatabase();
      
      const faqs = await FAQ.find({ 
        category: category, 
        isActive: true 
      })
        .sort({ order: 1, createdAt: 1 })
        .lean();

      return {
        success: true,
        faqs: JSON.parse(JSON.stringify(faqs)),
        message: "FAQs fetched successfully",
      };
    } catch (error: any) {
      console.error("Error fetching FAQs by category:", error);
      return {
        success: false,
        faqs: [],
        message: error.message || "Failed to fetch FAQs",
      };
    }
  },
  ["faqs_by_category"],
  {
    revalidate: 3600,
  }
);

// Search FAQs
export const searchFAQs = async (searchTerm: string) => {
  try {
    await connectToDatabase();
    
    const faqs = await FAQ.find({
      isActive: true,
      $text: { $search: searchTerm }
    })
      .sort({ score: { $meta: "textScore" } })
      .lean();

    return {
      success: true,
      faqs: JSON.parse(JSON.stringify(faqs)),
      message: "Search completed successfully",
    };
  } catch (error: any) {
    console.error("Error searching FAQs:", error);
    return {
      success: false,
      faqs: [],
      message: error.message || "Search failed",
    };
  }
};

// Get all FAQ categories
export const getFAQCategories = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      
      const categories = await FAQ.distinct("category", { isActive: true });

      return {
        success: true,
        categories: categories.sort(),
        message: "Categories fetched successfully",
      };
    } catch (error: any) {
      console.error("Error fetching FAQ categories:", error);
      return {
        success: false,
        categories: [],
        message: error.message || "Failed to fetch categories",
      };
    }
  },
  ["faq_categories"],
  {
    revalidate: 3600,
  }
);
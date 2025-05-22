"use server";

import { connectToDatabase } from "../connect";
import WebsiteSection, { IWebsiteSection } from "../models/website.section.model";

/**
 * Get all visible website sections sorted by order
 * Used by the homepage to determine which sections to show and in what order
 */
export async function getVisibleWebsiteSections() {
  try {
    await connectToDatabase();
    
    const sections = await WebsiteSection.find({ isVisible: true })
      .sort({ order: 1 })
      .populate('categoryId', 'name slug image');
    
    return {
      success: true,
      sections: JSON.parse(JSON.stringify(sections)),
    };
  } catch (error) {
    console.error("Error getting visible website sections:", error);
    return {
      success: false,
      message: "Failed to get website sections",
      sections: [],
    };
  }
}

/**
 * Get all website sections (visible and hidden) sorted by order
 * Used by admin interface
 */
export async function getAllWebsiteSections() {
  try {
    await connectToDatabase();
    
    const sections = await WebsiteSection.find()
      .sort({ order: 1 })
      .populate('categoryId', 'name slug image');
    
    return {
      success: true,
      sections: JSON.parse(JSON.stringify(sections)),
    };
  } catch (error) {
    console.error("Error getting website sections:", error);
    return {
      success: false,
      message: "Failed to get website sections",
      sections: [],
    };
  }
}
"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Banner from "@/lib/database/models/banner.model";

/**
 * Fetches website banners filtered by platform
 * @param platform - "desktop" or "mobile"
 * @returns Array of banner objects
 */
export const fetchAllWebsiteBanners = async (platform: "desktop" | "mobile"): Promise<any[]> => {
  try {
    await connectToDatabase();

    const banners = await Banner.find({
      type: "website", // Ensure we only get website banners
      platform: platform,  // Filter by the specified platform
    })
    .sort({ priority: 1, createdAt: -1 }) // Sort by priority (ascending), then by newest
    .lean(); // Use .lean() for plain JavaScript objects and performance

    // Convert Date objects to strings for client-side serialization
    return JSON.parse(JSON.stringify(banners));
  } catch (error) {
    console.error(`Error fetching website banners for platform ${platform}:`, error);
    return []; // Return an empty array in case of an error, as the calling component expects
  }
};

"use server";

import { connectToDatabase } from "@/lib/database/connect"; // Assuming connectToDatabase exists at this path
import FeaturedVideo, { IFeaturedVideo } from "@/lib/database/models/featured.video.model";

// Helper to handle errors
const handleError = (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
  console.error(`[PUBLIC_FEATURED_VIDEO_ACTION_ERROR${context ? ` - ${context}` : ''}]: ${errorMessage}`, error);
  // For public facing errors, we might not want to expose detailed error messages.
  return { success: false, message: "Could not fetch featured videos at this time." };
};

// Get all active featured videos for the public website
export async function getPublicFeaturedVideos(): Promise<{ success: boolean; videos: IFeaturedVideo[] | null; message?: string }> {
  try {
    await connectToDatabase();
    const videos = await FeaturedVideo.find({ isActive: true }).sort({ createdAt: -1 }); // Sort by newest first

    if (!videos || videos.length === 0) {
      return { success: true, videos: [], message: "No featured videos are currently available." };
    }

    return { success: true, videos: JSON.parse(JSON.stringify(videos)) };
  } catch (error) {
    const errResponse = handleError(error, "getPublicFeaturedVideos");
    return { ...errResponse, videos: null };
  }
}
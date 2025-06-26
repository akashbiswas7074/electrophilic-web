"use server";

import { connectToDatabase } from "@/lib/database/connect";
import SizeGuide from "@/lib/database/models/size-guide.model";

export async function getActiveSizeGuide() {
  try {
    await connectToDatabase();
    
    const activeConfig = await SizeGuide.findOne({ isActive: true }).lean();
    
    if (!activeConfig) {
      return {
        success: false,
        config: null,
        message: "No active size guide found",
      };
    }
    
    return {
      success: true,
      config: JSON.parse(JSON.stringify(activeConfig)),
    };
  } catch (error) {
    console.error("Error getting active size guide:", error);
    return {
      success: false,
      config: null,
      message: "Failed to fetch size guide",
    };
  }
}
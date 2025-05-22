import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteLogo from "@/lib/database/models/website.logo.model";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get the active logo
    const logo = await WebsiteLogo.findOne({ isActive: true });
    
    if (!logo) {
      return NextResponse.json({
        success: false,
        message: "No active logo found",
      });
    }
    
    return NextResponse.json({
      success: true,
      logo: JSON.parse(JSON.stringify(logo)),
    });
  } catch (error) {
    console.error("Error getting active logo:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get active logo",
      },
      { status: 500 }
    );
  }
}
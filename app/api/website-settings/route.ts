import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteSettings from "@/lib/database/models/website.settings.model";

export async function GET() {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOne({ isActive: true }).lean();
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        message: "No active website settings found",
        settings: null
      });
    }
    
    return NextResponse.json({
      success: true,
      settings: JSON.parse(JSON.stringify(settings))
    });
  } catch (error: any) {
    console.error("Error fetching website settings:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      settings: null
    }, { status: 500 });
  }
}
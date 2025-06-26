import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import { getActiveWebsiteSettings } from "@/lib/database/actions/website.settings.actions";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const result = await getActiveWebsiteSettings();
    
    if (result.success && result.settings) {
      return NextResponse.json({ 
        success: true, 
        settings: result.settings 
      });
    }

    // Return default settings if none found
    return NextResponse.json({ 
      success: true, 
      settings: {
        siteName: "Electrophilic",
        siteDescription: "Welcome to Electrophilic.in – Where Innovation Begins! Step into the world of electronics with the ultimate destination for makers, tinkerers, and tech enthusiasts.",
        siteKeywords: ["electronics", "components", "microcontrollers", "sensors", "DIY"],
        defaultTitle: "Electrophilic - Electronics Components Store",
        titleSeparator: " | ",
        ogType: "website",
        twitterCard: "summary_large_image",
        msTileColor: "#da532c",
        themeColor: "#ffffff",
        robots: "index, follow",
        organizationType: "Store"
      }
    });

  } catch (error) {
    console.error("Error fetching website settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch website settings" },
      { status: 500 }
    );
  }
}
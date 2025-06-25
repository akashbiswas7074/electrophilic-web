import { NextRequest, NextResponse } from "next/server";
import { getActiveHeroSections } from "@/lib/database/actions/hero-section.actions";

export async function GET(request: NextRequest) {
  try {
    const result = await getActiveHeroSections();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        sections: result.sections,
        message: "Hero sections fetched successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        sections: [],
        message: result.message || "Failed to fetch hero sections"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("API Error fetching hero sections:", error);
    return NextResponse.json({
      success: false,
      sections: [],
      message: error.message || "Internal server error"
    }, { status: 500 });
  }
}
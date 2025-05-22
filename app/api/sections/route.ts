import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteSection from "@/lib/database/models/website.section.model";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch only visible sections sorted by order
    const sections = await WebsiteSection.find({ isVisible: true })
      .sort({ order: 1 })
      .populate('categoryId', 'name slug image');

    return NextResponse.json({
      success: true,
      sections: JSON.parse(JSON.stringify(sections))
    });
  } catch (error) {
    console.error("Error fetching website sections:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch website sections" },
      { status: 500 }
    );
  }
}
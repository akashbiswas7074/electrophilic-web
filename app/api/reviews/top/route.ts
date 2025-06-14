import { NextRequest, NextResponse } from "next/server";
import { getTopProductReviews } from "@/lib/database/actions/review.actions";

export async function GET(req: NextRequest) {
  try {
    // Get limit from query parameter or use default (5)
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "5");
    
    console.log(`API: Fetching top ${limit} verified reviews`);
    
    // Fetch top reviews (already filtered for verified status in the action)
    const reviews = await getTopProductReviews(limit);
    
    console.log(`API: Successfully retrieved ${reviews.length} verified reviews`);
    
    return NextResponse.json({
      success: true,
      reviews,
      count: reviews.length,
      allVerified: true // Indicates all returned reviews are verified
    });
  } catch (error) {
    console.error("Error in top reviews API:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch top verified reviews",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
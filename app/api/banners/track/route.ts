import { connectToDatabase } from "@/lib/database/connect";
import Banner from "@/lib/database/models/banner.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let type: string = ''; // Declare type outside try/catch block
  
  try {
    const body = await request.json();
    const { bannerId } = body;
    type = body.type; // Assign to the outer variable
    
    if (!bannerId || !type || (type !== 'impression' && type !== 'click')) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Determine which field to increment based on type
    const updateField = type === 'impression' ? 'impressions' : 'clicks';
    
    // Use findOneAndUpdate to increment the appropriate counter
    const result = await Banner.findOneAndUpdate(
      { public_id: bannerId },
      { $inc: { [updateField]: 1 } }, // Increment by 1
      { new: true } // Return the updated document
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} tracked successfully`,
    });
  } catch (error) {
    console.error(`Error tracking banner ${type}:`, error);
    return NextResponse.json(
      { success: false, message: "Server error tracking banner" },
      { status: 500 }
    );
  }
}
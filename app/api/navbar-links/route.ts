import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import NavbarLink from "@/lib/database/models/navbar-link.model";

/**
 * GET /api/navbar-links
 * Fetches all navbar links
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch all navbar links, or filter based on query parameters if needed
    const navbarLinks = await NavbarLink.find().sort({ order: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      navbarLinks: JSON.parse(JSON.stringify(navbarLinks))
    });
  } catch (error: any) {
    console.error("Error fetching navbar links:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch navbar links",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/navbar-links
 * Creates a new navbar link
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Create a new navbar link
    const newLink = await NavbarLink.create(data);
    
    return NextResponse.json({
      success: true,
      navbarLink: JSON.parse(JSON.stringify(newLink))
    });
  } catch (error: any) {
    console.error("Error creating navbar link:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create navbar link",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
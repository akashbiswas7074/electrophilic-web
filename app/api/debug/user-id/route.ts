import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        message: "No user session found",
        sessionData: null
      });
    }
    
    await connectToDatabase();
    
    // Try to find the user with the ID from the session
    const user = await User.findById(session.user.id);
    
    return NextResponse.json({
      success: true,
      sessionUserId: session.user.id,
      userFound: !!user,
      userData: user ? {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        hasClerkId: !!user.clerkId,
      } : null
    });
  } catch (error) {
    console.error("Debug user-id error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to get user ID debug info",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

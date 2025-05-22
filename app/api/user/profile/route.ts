import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    await connectToDatabase();
    
    const user = await User.findById(userId).select("firstName lastName email username image address");
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        image: user.image,
      }
    });
    
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get profile data" },
      { status: 500 }
    );
  }
}

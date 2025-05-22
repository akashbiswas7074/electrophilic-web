import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { firstName, lastName, username, email } = await req.json();
    
    await connectToDatabase();
    
    // Find user by ID
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUserByUsername = await User.findOne({ username });
      if (existingUserByUsername) {
        return NextResponse.json(
          { success: false, message: "Username already taken" },
          { status: 400 }
        );
      }
      user.username = username;
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail && existingUserByEmail._id.toString() !== user._id.toString()) {
        return NextResponse.json(
          { success: false, message: "Email already taken" },
          { status: 400 }
        );
      }
      user.email = email;
    }
    
    // Update other user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
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
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

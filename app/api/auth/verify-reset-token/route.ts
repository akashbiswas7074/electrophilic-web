import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Hash token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token and non-expired timestamp
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Token is invalid or has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify token" },
      { status: 500 }
    );
  }
}

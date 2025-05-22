import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";
import { formatPhoneNumber } from "@/lib/sms";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    // Get request body
    const { phone, otp, userId } = await req.json();
    
    // Validate phone number and OTP
    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!otp || otp.trim() === '') {
      return NextResponse.json(
        { success: false, message: "OTP is required" },
        { status: 400 }
      );
    }

    // Format phone number to ensure consistency
    const formattedPhone = formatPhoneNumber(phone);
    
    // Find user by phone number or userId
    // Use proper typing for the query
    let query: { phone?: string; _id?: string | Types.ObjectId } = { phone: formattedPhone };
    if (userId) {
      query = { _id: userId };
    }
    
    const user = await User.findOne(query);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if OTP is valid
    if (user.phoneOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (user.phoneOtpExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpiry = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      userId: user._id.toString(),
      verified: true,
      // Include email to use for signin
      email: user.email
    });
    
  } catch (error: any) {
    console.error("Error verifying phone OTP:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Verification failed" 
      },
      { status: 500 }
    );
  }
}
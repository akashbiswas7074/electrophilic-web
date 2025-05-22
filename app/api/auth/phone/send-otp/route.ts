import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";
import { generateOTP, sendOTPviaFast2SMS, formatPhoneNumber } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    // Get request body
    const body = await req.json();
    const { phone, userId, resend = false } = body;

    // Validate phone number
    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number to ensure consistency
    const formattedPhone = formatPhoneNumber(phone);
    
    // Generate a new 6-digit OTP (generateOTP function doesn't take parameters)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    
    // Check if user exists with this phone number
    let user = await User.findOne({ phone: formattedPhone });
    
    if (!user) {
      // Create a new user if not found
      user = new User({
        phone: formattedPhone,
        phoneOtp: otp,
        phoneOtpExpiry: otpExpiry,
        isPhoneVerified: false,
      });
      await user.save();
    } else {
      // Update existing user with new OTP
      user.phoneOtp = otp;
      user.phoneOtpExpiry = otpExpiry;
      await user.save();
    }
    
    // Send OTP via SMS - only passing phone and otp as per function definition
    const smsSent = await sendOTPviaFast2SMS(formattedPhone, otp);
    
    if (!smsSent.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }
    
    // Return success with userId (needed for verification)
    return NextResponse.json({
      success: true,
      message: resend ? 'OTP resent successfully!' : 'OTP sent successfully!',
      userId: user._id.toString(),
      // OTP included only in development mode (handled by sendSmsOTP)
      ...(process.env.NODE_ENV !== 'production' && { otp: otp })
    });
    
  } catch (error: any) {
    console.error("Error sending phone verification code:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to send verification code" 
      },
      { status: 500 }
    );
  }
}
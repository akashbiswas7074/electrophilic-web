import { NextRequest, NextResponse } from 'next/server';
import { verifyPhoneOTP } from '@/lib/sms';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { signJwtToken } from '@/lib/auth-helpers';
import User from '@/lib/database/models/user.model';
import { connectToDatabase } from '@/lib/database/connect';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { phone, code, createAccount = false } = await req.json();
    
    if (!phone || !code) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phone number and verification code are required' 
      }, { status: 400 });
    }
    
    // Format the phone number consistently
    const formattedPhone = phone.trim().replace(/\s+/g, '');
    
    // Check if user is logged in
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // For debugging: Check if the user actually has an OTP stored
    try {
      await connectToDatabase();
      const userWithPhone = userId 
        ? await User.findById(userId).select('+phoneOTP +phoneOTPExpires')
        : await User.findOne({ phone: formattedPhone }).select('+phoneOTP +phoneOTPExpires');
      
      console.log(`API: Found user for verification: ${userWithPhone?._id || 'none'}`);
      console.log(`API: User has OTP set: ${!!userWithPhone?.phoneOTP}`);
      console.log(`API: OTP expires: ${userWithPhone?.phoneOTPExpires?.toISOString() || 'not set'}`);
    } catch (dbError) {
      console.error("API: Error checking user OTP:", dbError);
    }
    
    // Verify the OTP code
    const result = await verifyPhoneOTP(formattedPhone, code, userId);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to verify code'
      }, { status: 400 });
    }
    
    // If this is just phone verification for existing user, return success
    if (userId) {
      return NextResponse.json({ 
        success: true, 
        message: 'Phone number verified successfully',
      });
    }
    
    // If it's a phone login, generate authentication token
    if (result.userId) {
      const token = await signJwtToken(result.userId);
      
      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully',
        token,
        userId: result.userId
      });
    }
    
    // Fallback successful response
    return NextResponse.json({ 
      success: true, 
      message: 'Phone number verified successfully',
    });
    
  } catch (error: any) {
    console.error('Error verifying phone OTP:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while verifying the code'
    }, { status: 500 });
  }
}
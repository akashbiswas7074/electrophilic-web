import { NextRequest, NextResponse } from 'next/server';
import { sendPhoneOTP } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { phone, channel = 'sms', userId } = await req.json();
    
    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phone number is required' 
      }, { status: 400 });
    }
    
    // Validate channel type
    if (channel !== 'sms' && channel !== 'whatsapp') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid channel type. Use "sms" or "whatsapp"' 
      }, { status: 400 });
    }
    
    // Send OTP via the specified channel
    const result = await sendPhoneOTP(phone, channel, userId);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Verification code sent successfully via ${channel}`,
        otpId: result.otpId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || `Failed to send verification code via ${channel}`
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending phone OTP:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while sending the verification code'
    }, { status: 500 });
  }
}
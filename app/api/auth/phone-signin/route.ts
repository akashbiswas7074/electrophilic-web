import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import User from '@/lib/database/models/user.model';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { phone, token } = await req.json();
    
    if (!phone || !token) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phone number and token are required' 
      }, { status: 400 });
    }
    
    // Format the phone number - remove spaces, dashes, etc.
    const formattedPhone = phone.trim().replace(/\s+/g, '');
    
    // Verify the token (this would be a token received after OTP verification)
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ 
        success: false, 
        message: 'Server authentication error' 
      }, { status: 500 });
    }
    
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, secret);
      const { sub, email } = decoded as { sub: string; email: string };
      
      // Find the user by ID or email
      await connectToDatabase();
      const user = await User.findOne({
        $or: [
          { _id: sub },
          { email }
        ]
      });
      
      if (!user) {
        return NextResponse.json({ 
          success: false, 
          message: 'User not found' 
        }, { status: 404 });
      }
      
      // Check if phone matches (if user has a phone number)
      if (user.phone && user.phone !== formattedPhone) {
        return NextResponse.json({ 
          success: false, 
          message: 'Phone number does not match account' 
        }, { status: 400 });
      }
      
      // Return user information for frontend to complete sign-in
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || formattedPhone,
          role: user.role || 'user'
        }
      });
      
    } catch (tokenError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      }, { status: 401 });
    }
    
  } catch (error: any) {
    console.error('Error in phone sign-in:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Authentication failed' 
    }, { status: 500 });
  }
}
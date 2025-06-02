import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import User from '@/lib/database/models/user.model';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });
    }

    // Hash the token from the request to compare with the stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by hashed token and check expiry
    // Select password field to ensure pre-save hook works correctly if needed
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password'); // Select password explicitly if needed by hooks or logic

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired password reset token' }, { status: 400 });
    }

    // Only allow password reset for credential users
    // If the user is a Google user, don't change their provider
    if (user.provider === 'google') {
      // Set password but keep the provider as 'google'
      user.password = password;
      user.resetPasswordToken = undefined; // Clear the reset token fields
      user.resetPasswordExpires = undefined;
      // Do NOT change provider for Google users
    } else {
      // For credentials or other users, set password and ensure provider is credentials
      user.password = password;
      user.resetPasswordToken = undefined; // Clear the reset token fields
      user.resetPasswordExpires = undefined;
      if (!user.provider) {
        user.provider = 'credentials'; // Only set if provider is undefined
      }
    }

    await user.save();

    // Optionally: Log the user in automatically after password reset
    // You might need to implement logic here to create a session

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import User from '@/lib/database/models/user.model';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    // Only find users who signed up with credentials or potentially Google users who want to set a password?
    // For now, let's restrict to credential users or users without a password set yet.
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if the user exists or not for security reasons
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });
    }

    // Only allow password reset for credential users or potentially OAuth users without a password
    if (user.provider !== 'credentials' && user.password) {
        console.log(`Password reset requested for non-credential user: ${email}`);
        // Still return a generic success message
        return NextResponse.json({ message: 'If an account with that email exists and supports password reset, a link has been sent.' }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    // Save token and expiry to user document
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Send password reset email (using the original unhashed token)
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // If email fails, should we revert the token save? For now, log and return generic error.
      // The user won't get the email, but the token is still set.
      return NextResponse.json({ message: 'An error occurred while trying to send the reset email.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

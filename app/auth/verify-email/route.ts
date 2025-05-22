
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import User from '@/lib/database/models/user.model';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/error?error=MissingToken', req.url));
    }

    await connectToDatabase();

    // Hash the token received in the URL to match the stored hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth/error?error=InvalidOrExpiredToken', req.url));
    }

    user.emailVerified = new Date();
    user.verificationToken = undefined; // Clear the token
    user.verificationTokenExpires = undefined; // Clear token expiry
    await user.save();

    // Redirect to a success page, login page, or profile
    // For now, redirecting to signin, then to profile as per existing redirect logic
    return NextResponse.redirect(new URL('/auth/signin?verified=true', req.url));

  } catch (error) {
    console.error('[VERIFY_EMAIL_ERROR]', error);
    return NextResponse.redirect(new URL('/auth/error?error=VerificationFailed', req.url));
  }
}

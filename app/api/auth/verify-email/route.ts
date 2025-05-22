import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/error?error=Verification token missing', req.url));
    }

    await connectToDatabase();

    // Hash the token from the URL to compare with the stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user by hashed token and check expiry
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Token is invalid, expired, or already used
      return NextResponse.redirect(new URL('/auth/error?error=Invalid or expired verification link', req.url));
    }

    // Mark email as verified and clear verification token fields
    user.emailVerified = new Date();
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    // Redirect to sign-in page with a success message (or directly sign them in if desired)
    // Passing email helps pre-fill the sign-in form
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('verified', 'true');
    signInUrl.searchParams.set('email', user.email);
    return NextResponse.redirect(signInUrl);

  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL('/auth/error?error=Verification failed', req.url));
  }
}
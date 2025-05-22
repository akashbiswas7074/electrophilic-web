import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import User from '@/lib/database/models/user.model';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs'; // Import bcryptjs

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { firstName, lastName, username, email, password } = await req.json(); // Changed name to firstName, lastName

    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) { // Changed name to firstName, lastName
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists (email or username)
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email or username already exists' }, { status: 409 }); // 409 Conflict
    }

    // Note: Password hashing is handled by the pre-save hook in user.model.ts
    // We don't need to hash it here explicitly if the hook is set up correctly.

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    // Create new user
    const newUser = new User({
      firstName, // Changed from name
      lastName, // Added
      username,
      email,
      password, // Pass the plain password, the pre-save hook will hash it
      provider: 'credentials',
      verificationToken: hashedVerificationToken,
      verificationTokenExpires,
      emailVerified: null, // Explicitly set to null initially
    });

    await newUser.save();

    // Send verification email (using the original unhashed token)
    try {
      await sendVerificationEmail(newUser.email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email after user creation:", emailError);
      // Decide if user creation should be rolled back or just log the error
      // For now, we'll proceed but log it. Consider a more robust error handling strategy.
    }

    // Don't return the full user object, especially not tokens or password hash
    return NextResponse.json({ message: 'User registered successfully. Please check your email to verify your account.' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    // Handle potential duplicate key errors from MongoDB if the initial check somehow missed it
    if (error instanceof Error && 'code' in error && error.code === 11000) {
        return NextResponse.json({ message: 'User with this email or username already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}

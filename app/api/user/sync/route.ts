import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database/connect';
import User from '@/lib/database/models/user.model';

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionUser, userId } = await request.json();

    if (!sessionUser || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required data' },
        { status: 400 }
      );
    }

    console.log(`[UserSync] Attempting to sync user with ID: ${userId}`);

    await connectToDatabase();

    // First, try to find existing user by the session user ID
    let user = await User.findById(userId);

    if (!user) {
      // If not found by ID, try to find by email
      user = await User.findOne({ email: sessionUser.email });
    }

    if (!user) {
      // Create a new user if none exists
      console.log(`[UserSync] Creating new user for email: ${sessionUser.email}`);
      
      const userData = {
        email: sessionUser.email,
        firstName: sessionUser.firstName || sessionUser.name?.split(' ')[0] || '',
        lastName: sessionUser.lastName || sessionUser.name?.split(' ').slice(1).join(' ') || '',
        username: sessionUser.username || sessionUser.email?.split('@')[0] || `user_${Date.now()}`,
        image: sessionUser.image || '',
        provider: 'google', // Assuming Google OAuth since this typically happens with OAuth
        emailVerified: new Date(),
        // Initialize empty arrays for nested fields
        address: [],
        wishlist: []
      };

      user = await User.create(userData);
      console.log(`[UserSync] New user created with ID: ${user._id}`);
    } else {
      // Update existing user with any missing data from session
      console.log(`[UserSync] Found existing user, updating with session data`);
      
      let needsUpdate = false;
      
      if (!user.firstName && sessionUser.firstName) {
        user.firstName = sessionUser.firstName;
        needsUpdate = true;
      }
      
      if (!user.lastName && sessionUser.lastName) {
        user.lastName = sessionUser.lastName;
        needsUpdate = true;
      }
      
      if (!user.image && sessionUser.image) {
        user.image = sessionUser.image;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        console.log(`[UserSync] User updated with session data`);
      }
    }

    // Return the user data in the expected format
    const syncedUserData = {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      image: user.image || '',
      phone: user.phone || ''
    };

    console.log(`[UserSync] Sync successful for user: ${syncedUserData.email}`);

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: syncedUserData
    });

  } catch (error) {
    console.error('[UserSync] Error syncing user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync user data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
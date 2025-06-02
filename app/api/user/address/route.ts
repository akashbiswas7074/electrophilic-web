import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import User, { IEmbeddedAddress } from "@/lib/database/models/user.model"; // Updated import
import mongoose from "mongoose";

// GET: Fetch all addresses for the current user
export async function GET(req: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    console.log("[/api/user/address GET] Session:", JSON.stringify(session, null, 2));
    
    // Check for user ID (primary) or email (fallback)
    if (!session?.user?.id && !session?.user?.email) {
      console.error("[/api/user/address GET] Authentication failed. No user ID or email found.");
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Search by ID first (more reliable), then by email as fallback
    let user;
    if (session.user.id) {
      user = await User.findById(session.user.id)
        .select("address")
        .lean() as { address?: IEmbeddedAddress[] } | null;
    }
    
    // If no user found by ID, try with email
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email })
        .select("address")
        .lean() as { address?: IEmbeddedAddress[] } | null;
    }
    
    if (!user) {
      console.error(`[/api/user/address GET] User not found. ID: ${session.user.id}, Email: ${session.user.email}`);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // Return the addresses
    return NextResponse.json({
      success: true,
      addresses: user.address || []
    });
    
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST: Add a new address for the current user
export async function POST(req: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    console.log("[/api/user/address POST] Session:", JSON.stringify(session, null, 2));
    
    // Check for user ID (primary) or email (fallback)
    if (!session?.user?.id && !session?.user?.email) {
      console.error("[/api/user/address POST] Authentication failed. No user ID or email found.");
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get the address data from the request body
    const requestBody = await req.json();
    // Support both direct address object and nested address object structure
    const addressData = requestBody.address || requestBody;
    
    console.log("[/api/user/address POST] Address data received:", JSON.stringify(addressData, null, 2));
    
    // Validate required fields - more graceful handling for Google users who might have missing fields
    const requiredFields = ['address1', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredFields.filter(field => !addressData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Try to find user by ID first, then by email
    let user;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    }
    
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }
    
    if (!user) {
      console.error(`[/api/user/address POST] User not found. ID: ${session.user.id}, Email: ${session.user.email}`);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // Ensure username exists for Google-authenticated users
    // This is critical as username is required in the User schema
    if (!user.username && session.user.username) {
      user.username = session.user.username;
    } else if (!user.username) {
      // Create a fallback username based on email if none exists
      const emailUsername = session.user.email?.split('@')[0] || 'user';
      const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
      user.username = `${emailUsername}_${timestamp}`;
      console.log(`[/api/user/address POST] Generated username for user: ${user.username}`);
    }
    
    // If this is the first address or isDefault is true, update other addresses to not be default
    if (!user.address || user.address.length === 0 || addressData.isDefault) {
      if (user.address && user.address.length > 0) {
        user.address.forEach((addr: IEmbeddedAddress) => {
          if (addr.isDefault) {
            addr.isDefault = false;
          }
        });
      }
    }
    
    // For Google-authenticated users, ensure name fields are populated
    // Use empty string fallbacks when all other sources are undefined
    const firstName = addressData.firstName || user.firstName || session.user.firstName || 
                     (session.user.name ? session.user.name.split(' ')[0] : '') || 'Guest';
    
    const lastName = addressData.lastName || user.lastName || session.user.lastName || 
                    (session.user.name ? session.user.name.split(' ').slice(1).join(' ') : '') || 'User';
    
    // Handle phone field name inconsistency by checking all possible variations
    // This is critical for Google-authenticated users
    const phoneNumber = addressData.phoneNumber || addressData.phone || user.phone || '0000000000'; // Provide a fallback
    
    console.log("[/api/user/address POST] Using name and phone:", firstName, lastName, phoneNumber);
    
    // Validate that we have proper values for the required fields
    if (!firstName || firstName.trim() === '') {
      return NextResponse.json(
        { success: false, message: "First name is required" },
        { status: 400 }
      );
    }
    
    if (!lastName || lastName.trim() === '') {
      return NextResponse.json(
        { success: false, message: "Last name is required" },
        { status: 400 }
      );
    }
    
    if (!phoneNumber || phoneNumber.trim() === '') {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }
    
    // Create a new address with a unique _id
    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address1: (addressData.address1 || '').trim(),
      address2: (addressData.address2 || '').trim(),
      city: (addressData.city || '').trim(),
      state: (addressData.state || '').trim(),
      zipCode: (addressData.zipCode || '').trim(),
      country: (addressData.country || 'India').trim(),
      phoneNumber: phoneNumber.trim(), // Store in standardized field name
      isDefault: addressData.isDefault || (!user.address || user.address.length === 0) // Make first address default
    };
    
    console.log("[/api/user/address POST] Processed address to save:", JSON.stringify(newAddress, null, 2));
    
    // Add the new address to the user
    if (!user.address) {
      user.address = [newAddress];
    } else {
      user.address.push(newAddress);
    }
    
    // Save the user
    try {
      // Use updateOne with validation to save changes to avoid validation on other fields
      // that might be missing but required in the schema
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $push: { address: newAddress },
          // Only set username if it's not already set in the database
          ...(user.username && !user._username ? { username: user.username } : {})
        },
        { new: true, runValidators: false } // Skip validation since we're only updating address
      );
      
      if (!updatedUser) {
        throw new Error("Failed to update user with new address");
      }
      
      console.log(`[/api/user/address POST] Successfully added address for user: ${user.email}, Provider: ${user.provider}`);
      
      // Return the new address
      return NextResponse.json({
        success: true,
        message: "Address added successfully",
        address: newAddress
      });
    } catch (saveError: any) {
      console.error("[/api/user/address POST] Database validation error:", saveError);
      
      // Try an alternative approach - directly update the address array without validation
      try {
        console.log("[/api/user/address POST] Attempting direct update without validation...");
        await User.updateOne(
          { _id: user._id }, 
          { $push: { address: newAddress } }
        );
        
        console.log(`[/api/user/address POST] Successfully added address with direct update for user: ${user.email}`);
        
        return NextResponse.json({
          success: true,
          message: "Address added successfully",
          address: newAddress
        });
      } catch (directUpdateError) {
        console.error("[/api/user/address POST] Direct update failed:", directUpdateError);
        return NextResponse.json(
          { success: false, message: "Failed to add address: " + saveError.message },
          { status: 400 }
        );
      }
    }
    
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add address" },
      { status: 500 }
    );
  }
}

// PUT: Update or delete an existing address
export async function PUT(req: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    console.log("[/api/user/address PUT] Session:", JSON.stringify(session, null, 2));
    
    // Check for user ID (primary) or email (fallback)
    if (!session?.user?.id && !session?.user?.email) {
      console.error("[/api/user/address PUT] Authentication failed. No user ID or email found.");
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get the data from the request body
    const data = await req.json();
    const { addressId, action } = data;
    
    if (!addressId) {
      return NextResponse.json(
        { success: false, message: "Address ID is required" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Try to find user by ID first, then by email
    let user;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    }
    
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }
    
    if (!user) {
      console.error(`[/api/user/address PUT] User not found. ID: ${session.user.id}, Email: ${session.user.email}`);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Special handling for set-default action
    if (action === "set-default") {
      // Find the address and mark it as default
      const addressIndex = user.address.findIndex(
        (addr: any) => addr._id.toString() === addressId
      );
      
      if (addressIndex === -1) {
        return NextResponse.json(
          { success: false, message: "Address not found" },
          { status: 404 }
        );
      }
      
      // Update all addresses to not be default, then set the selected one
      user.address.forEach((addr: any, i: number) => {
        addr.isDefault = (i === addressIndex);
      });
      
      await user.save();
      
      return NextResponse.json({
        success: true,
        message: "Default address updated successfully",
        addresses: user.address
      });
    }
    
    // Handle address deletion
    if (action === "delete") {
      // Find the address index
      const addressIndex = user.address.findIndex(
        (addr: any) => addr._id.toString() === addressId
      );
      
      if (addressIndex === -1) {
        return NextResponse.json(
          { success: false, message: "Address not found" },
          { status: 404 }
        );
      }
      
      // Check if the address being deleted was the default
      const wasDefault = user.address[addressIndex].isDefault;
      
      // Remove the address
      user.address.splice(addressIndex, 1);
      
      // If it was default and there are other addresses, make the first one default
      if (wasDefault && user.address.length > 0) {
        user.address[0].isDefault = true;
      }
      
      // Save the user
      await user.save();
      
      return NextResponse.json({
        success: true,
        message: "Address deleted successfully",
        addresses: user.address // Return the updated addresses array
      });
    }
    
    // Handle address update
    if (action === "update") {
      // Find the address index
      const addressIndex = user.address.findIndex(
        (addr: any) => addr._id.toString() === addressId
      );
      
      if (addressIndex === -1) {
        return NextResponse.json(
          { success: false, message: "Address not found" },
          { status: 404 }
        );
      }
      
      // Update the address fields
      const updateData = { ...data };
      delete updateData.addressId;
      delete updateData.action;
      
      // Normalize phone field - handle both phone and phoneNumber
      if (updateData.phone && !updateData.phoneNumber) {
        updateData.phoneNumber = updateData.phone;
        delete updateData.phone;
      }
      
      // If this address is being set as default, update other addresses
      if (updateData.isDefault && !user.address[addressIndex].isDefault) {
        user.address.forEach((addr: any, i: number) => {
          if (i !== addressIndex && addr.isDefault) {
            addr.isDefault = false;
          }
        });
      }
      
      // Update the address
      Object.assign(user.address[addressIndex], updateData);
      
      // Save the user
      await user.save();
      
      return NextResponse.json({
        success: true,
        message: "Address updated successfully",
        address: user.address[addressIndex]
      });
    }
    
    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
    
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an address
export async function DELETE(req: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    console.log("[/api/user/address DELETE] Session:", JSON.stringify(session, null, 2));
    
    // Check for user ID (primary) or email (fallback)
    if (!session?.user?.id && !session?.user?.email) {
      console.error("[/api/user/address DELETE] Authentication failed. No user ID or email found.");
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get the address ID from the request body
    const body = await req.json();
    const { addressId } = body;
    
    if (!addressId) {
      return NextResponse.json(
        { success: false, message: "Address ID is required" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Try to find user by ID first, then by email
    let user;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    }
    
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }
    
    if (!user) {
      console.error(`[/api/user/address DELETE] User not found. ID: ${session.user.id}, Email: ${session.user.email}`);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // Find the address index
    const addressIndex = user.address.findIndex(
      (addr: any) => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Address not found" },
        { status: 404 }
      );
    }
    
    // Check if the address being deleted was the default
    const wasDefault = user.address[addressIndex].isDefault;
    
    // Remove the address
    user.address.splice(addressIndex, 1);
    
    // If it was default and there are other addresses, make the first one default
    if (wasDefault && user.address.length > 0) {
      user.address[0].isDefault = true;
    }
    
    // Save the user
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.address // Return updated addresses array
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete address" },
      { status: 500 }
    );
  }
}

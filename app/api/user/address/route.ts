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
    const addressData = requestBody.address; // Extract the nested address object

    if (!addressData) {
      return NextResponse.json(
        { success: false, message: "Address data is missing in the request body" },
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
    
    // If this is the first address or isDefault is true, update other addresses to not be default
    if (!user.address || user.address.length === 0 || addressData.isDefault) {
      if (user.address && user.address.length > 0) {
        user.address.forEach((addr: IEmbeddedAddress) => { // Typed addr
          if (addr.isDefault) {
            addr.isDefault = false;
          }
        });
      }
    }
    
    // Create a new address with a unique _id
    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      address1: addressData.address1,
      address2: addressData.address2 || "",
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
      country: addressData.country,
      phoneNumber: addressData.phoneNumber,
      isDefault: addressData.isDefault || (!user.address || user.address.length === 0) // Make first address default
    };
    
    // Add the new address to the user
    if (!user.address) {
      user.address = [newAddress];
    } else {
      user.address.push(newAddress);
    }
    
    // Save the user
    await user.save();
    
    // Return the new address
    return NextResponse.json({
      success: true,
      message: "Address added successfully",
      address: newAddress
    });
    
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
        message: "Address deleted successfully"
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

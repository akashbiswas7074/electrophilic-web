import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: "No image provided" }, { status: 400 });
    }
    
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    // Upload to Cloudinary with better error handling
    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: 'vibecart/users',
        resource_type: 'auto',
      });
      
      console.log("Cloudinary upload success:", uploadResult.public_id);
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      return NextResponse.json(
        { success: false, message: "Image upload failed" },
        { status: 500 }
      );
    }
    
    // Update user in database
    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { image: uploadResult.secure_url },
      { new: true } // Return updated user document
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to update user profile" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      image: uploadResult.secure_url,
      message: "Profile image updated successfully"
    });
    
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload image" },
      { status: 500 }
    );
  }
}

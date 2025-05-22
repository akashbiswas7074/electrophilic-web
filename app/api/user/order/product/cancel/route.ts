import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import Order, { IOrderItem } from "@/lib/database/models/order.model";
import mongoose from "mongoose";
import { updateOrderProductStatusAndSyncOrderItem } from '@/lib/database/actions/order.actions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    const { orderId, productId } = await req.json();
    
    // Validate IDs
    if (!orderId || !productId) {
      return NextResponse.json({ success: false, message: "Missing orderId or productId" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order ID format" }, { status: 400 });
    }
    
    await connectToDatabase();
      // Use robust sync util to update both product and orderItem status
    // First, check if product can be cancelled
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    
    // Find product by _id (subdocument ID)
    const productToUpdate = order.products.find((p: IOrderItem) => p._id && p._id.toString() === productId);
    if (!productToUpdate) {
      return NextResponse.json({ success: false, message: "Product not found in order" }, { status: 404 });
    }
    
    const cancellableStatuses = ["Not Processed", "Processing", "Confirmed"];
    if (!cancellableStatuses.includes(productToUpdate.status)) {
      return NextResponse.json({
        success: false,
        message: `Product cannot be cancelled. Current status: ${productToUpdate.status}. Product can only be cancelled if status is 'Not Processed', 'Processing', or 'Confirmed'.`
      }, { status: 400 });
    }
    // Use util to update both product and orderItem status
    await updateOrderProductStatusAndSyncOrderItem(orderId, productId, "Cancelled");
    return NextResponse.json({ 
      success: true, 
      message: "Product cancelled successfully",
      newStatus: "Cancelled"
    });
  } catch (error: any) {
    console.error("Cancel product error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Server error"
    });
  }
}

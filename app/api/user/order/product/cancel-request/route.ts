import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import Order, { IOrderItem } from "@/lib/database/models/order.model";
import mongoose from "mongoose";
import User from "@/lib/database/models/user.model";
import { sendAdminNotificationEmail } from "@/lib/email"; // Add this import for email notification

// This endpoint handles cancel requests for products that are already confirmed
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    const { orderId, productId, reason } = await req.json();
    
    // Validate IDs
    if (!orderId || !productId) {
      return NextResponse.json({ success: false, message: "Missing orderId or productId" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order ID format" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Get order with user info for notification
    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
      // Find product in order (by subdocument _id)
    const productToUpdate = order.products.find((p: IOrderItem) => p._id && p._id.toString() === productId);
    if (!productToUpdate) {
      return NextResponse.json({ success: false, message: "Product not found in order" }, { status: 404 });
    }
    
    // Update product with a cancel request flag
    productToUpdate.cancelRequested = true;
    productToUpdate.cancelReason = reason || "Customer requested cancellation";
    productToUpdate.cancelRequestedAt = new Date();
    
    // Also update corresponding item in orderItems array if it exists
    if (order.orderItems && Array.isArray(order.orderItems)) {
      const orderItemToUpdate = order.orderItems.find((item: IOrderItem) => item._id && item._id.toString() === productId);
      if (orderItemToUpdate) {
        orderItemToUpdate.cancelRequested = true;
        orderItemToUpdate.cancelReason = reason || "Customer requested cancellation";
        orderItemToUpdate.cancelRequestedAt = new Date();
      }
    }
    
    // Save the order
    await order.save();
    
    // Send email notification to admin
    try {
      // Find all admin users to notify
      const adminUsers = await User.find({ role: 'admin' }).select('email');
      
      // Get administrator email from environment variables as fallback
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || null;
      
      // Use first admin from DB or fallback to env var
      const adminToNotify = adminUsers.length > 0 ? adminUsers[0].email : adminEmail;
      
      if (adminToNotify) {
        await sendAdminNotificationEmail(adminToNotify, {
          type: 'cancellation_request',
          orderId: order._id.toString(),
          orderNumber: order.orderId || order._id.toString().substring(0, 8),
          productName: productToUpdate.name || productToUpdate.product?.name || 'Product',
          userName: order.user?.name || 'Customer',
          userEmail: order.user?.email || 'No email provided',
          reason: reason || 'Customer requested cancellation',
          timestamp: new Date().toISOString()
        });
        console.log(`Cancellation request notification email sent to admin: ${adminToNotify}`);
      } else {
        console.warn('No admin email found to send notification to');
      }
    } catch (emailError) {
      // Log error but don't fail the request if email sends fails
      console.error('Failed to send admin notification email:', emailError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Cancellation request submitted. Our team will review it shortly."
    });
  } catch (error: any) {
    console.error("Cancel request error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Server error"
    });
  }
}

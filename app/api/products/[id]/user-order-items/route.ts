import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import User from "@/lib/database/models/user.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: "Authentication required",
        userOrderItems: []
      }, { status: 401 });
    }

    const { id } = await params;
    const productId = id;

    await connectToDatabase();

    // Find user by session user ID instead of clerkId
    const user = await User.findOne({ _id: session.user.id });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
        userOrderItems: []
      }, { status: 404 });
    }

    // Find all user's orders that contain the product and are in delivered/completed status
    const orders = await Order.find({
      user: user._id,
      $or: [
        { "orderItems.product": productId },
        { "products.product": productId }
      ]
    }).select("orderItems products _id status");

    // Extract order items for this product
    const orderItems = [];
    
    for (const order of orders) {
      // Check orderItems array
      if (order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          const itemProductId = item.product?._id || item.product;
          if (
            itemProductId && 
            itemProductId.toString() === productId &&
            (item.status === "delivered" || item.status === "completed" || 
             item.status === "Delivered" || item.status === "Completed")
          ) {
            // Add order ID to each item for reference
            orderItems.push({
              ...item.toObject(),
              orderId: order._id
            });
          }
        }
      }
      
      // Check products array (for compatibility)
      if (order.products && order.products.length > 0) {
        for (const item of order.products) {
          const itemProductId = item.product?._id || item.product;
          if (
            itemProductId && 
            itemProductId.toString() === productId &&
            (item.status === "delivered" || item.status === "completed" || 
             item.status === "Delivered" || item.status === "Completed")
          ) {
            // Add order ID to each item for reference
            orderItems.push({
              ...item.toObject(),
              orderId: order._id
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      userOrderItems: orderItems
    });
  } catch (error: any) {
    console.error("Error fetching user order items:", error);
    return NextResponse.json({
      success: false,
      message: `An error occurred: ${error.message}`,
      userOrderItems: []
    }, { status: 500 });
  }
}
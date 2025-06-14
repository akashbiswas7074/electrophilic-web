import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const userId = session.user.id;
    const { orderId, itemId } = await params;

    if (!orderId || !itemId) {
      return NextResponse.json({ 
        success: false, 
        message: "Order ID and item ID are required" 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Find the order that belongs to the user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        message: "Order not found or access denied" 
      }, { status: 404 });
    }

    // Find the order item to mark as reviewed
    const orderItem = order.orderItems?.find(
      (item: any) => item._id.toString() === itemId || 
                     (item.product && item.product._id.toString() === itemId) ||
                     (item.productId && item.productId.toString() === itemId)
    );

    if (!orderItem) {
      return NextResponse.json({ 
        success: false, 
        message: "Order item not found" 
      }, { status: 404 });
    }

    // Check if the order item is in a state that can be reviewed (delivered/completed)
    const itemStatus = orderItem.status?.toLowerCase();
    if (itemStatus !== "delivered" && itemStatus !== "completed") {
      return NextResponse.json({ 
        success: false, 
        message: "This item cannot be reviewed yet as it hasn't been delivered" 
      }, { status: 400 });
    }

    // Mark the order item as reviewed
    orderItem.reviewed = true;
    orderItem.reviewDate = new Date();

    await order.save();

    return NextResponse.json({ 
      success: true, 
      message: "Order item marked as reviewed",
    });
  } catch (error: any) {
    console.error("Error marking order item as reviewed:", error);
    return NextResponse.json({ 
      success: false, 
      message: `An error occurred: ${error.message}` 
    }, { status: 500 });
  }
}
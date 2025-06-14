import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Get orders for the user with proper population and sorting
    const orders = await Order.find({ user: session.user.id })
      .populate({
        path: 'orderItems.product',
        select: 'name images price slug brand'
      })
      .populate({
        path: 'products.product', 
        select: 'name images price slug brand'
      })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Process orders to ensure they have the required fields
    const processedOrders = orders.map(order => {
      const orderObj = { ...order };
      
      // Ensure both orderItems and products arrays exist for compatibility
      if (orderObj.orderItems && orderObj.orderItems.length > 0 && (!orderObj.products || orderObj.products.length === 0)) {
        orderObj.products = orderObj.orderItems;
      } else if (orderObj.products && orderObj.products.length > 0 && (!orderObj.orderItems || orderObj.orderItems.length === 0)) {
        orderObj.orderItems = orderObj.products;
      }
      
      // Ensure status exists
      if (!orderObj.status) {
        orderObj.status = 'Not Processed';
      }
      
      // Ensure totalAmount exists
      if (!orderObj.totalAmount && orderObj.total) {
        orderObj.totalAmount = orderObj.total;
      }
      
      return orderObj;
    });

    return NextResponse.json({
      success: true,
      orders: JSON.parse(JSON.stringify(processedOrders))
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

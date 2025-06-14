import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import Order, { IOrder, IOrderItem } from "@/lib/database/models/order.model";
import mongoose from "mongoose";
import Vendor from "@/lib/database/models/vendor.model";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { orderId } = await req.json();

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order ID format" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if the user is a vendor
    const vendor = await Vendor.findOne({ userId });
    const isVendor = !!vendor;

    // For vendors, we need to fetch the order differently to check permissions
    let order;
    if (isVendor) {
      // For vendors, we don't filter by user since vendors need to see customer orders
      order = await Order.findById(orderId).populate({
        path: 'products.product',
        select: 'vendorId'
      });
      
      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }

      // Check if this vendor has permission for this order
      // A vendor can only cancel orders if all products in the order belong to them
      const vendorId = vendor._id.toString();
      const allProductsBelongToVendor = order.products.every((product: any) => 
        product.product && product.product.vendorId && 
        product.product.vendorId.toString() === vendorId
      );

      if (!allProductsBelongToVendor) {
        return NextResponse.json({ 
          success: false, 
          message: "You don't have permission to cancel this order. You can only cancel orders containing your products exclusively."
        }, { status: 403 });
      }
    } else {
      // For regular users, find their own order
      order = await Order.findOne({ _id: orderId, user: userId });
      
      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found or access denied" }, { status: 404 });
      }
    }

    // Check overall order status (website format)
    const nonCancellableOrderStatuses = ['shipped', 'delivered', 'completed', 'cancelled', 'refunded'];
    if (nonCancellableOrderStatuses.includes(order.status.toLowerCase())) {
      return NextResponse.json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}.`
      }, { status: 400 });
    }

    // Check individual item statuses (assuming Admin format: "Dispatched", "Delivered", "Completed")
    let canCancelOrderBasedOnItems = true;
    const itemsToCheck = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.products;

    if (itemsToCheck && itemsToCheck.length > 0) {
      for (const item of itemsToCheck) {
        if (item.status && ["Dispatched", "Delivered", "Completed"].includes(item.status)) {
          canCancelOrderBasedOnItems = false;
          break;
        }
      }
    }

    if (!canCancelOrderBasedOnItems) {
      return NextResponse.json({
        success: false,
        message: "Order cannot be cancelled as one or more items have been dispatched, delivered, or completed."
      }, { status: 400 });
    }

    order.status = 'cancelled'; // Set overall order status (website format)

    const updateItemStatusToCancelled = (item: IOrderItem) => {
      if (item.status !== "Cancelled") {
        item.status = "Cancelled"; // Admin format
      }
    };

    if (order.orderItems && order.orderItems.length > 0) {
      order.orderItems.forEach(updateItemStatusToCancelled);
    }
    // Also update products array if it exists and is used
    if (order.products && order.products.length > 0 && order.products !== order.orderItems) {
      order.products.forEach(updateItemStatusToCancelled);
    }
    
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully.",
      updatedOrderStatus: order.status,
    });

  } catch (error: any) {
    console.error("Cancel order error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Server error while cancelling order."
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import mongoose from 'mongoose';
// Import client-safe utilities
import { mapAdminStatusToWebsite } from '@/lib/order-status-utils';
import { updateOrderProductStatusAndSyncOrderItem } from '@/lib/database/actions/order.actions';

/**
 * API Route to update the status of an order
 * This works with both admin panel and website status formats
 */
export async function PATCH(
  req: Request,
  context: any
) {
  const id = context?.params?.id;
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Validate order ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }

    // Parse request body to get new status and productId
    const data = await req.json();
    const { status, productId } = data;
    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    // Use the robust sync util to update both product and orderItem status
    const updatedOrder = await updateOrderProductStatusAndSyncOrderItem(id, productId, status);
    if (!updatedOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // If status changed to 'delivered', update paidAt and isPaid if not already set
    const websiteStatus = mapAdminStatusToWebsite(status);
    if (websiteStatus === 'delivered' && !updatedOrder.paidAt) {
      updatedOrder.paidAt = new Date();
      updatedOrder.isPaid = true;
      await updatedOrder.save();
    }

    return NextResponse.json({
      message: 'Order status updated successfully',
      order: {
        id: updatedOrder._id,
        status: updatedOrder.status
      }
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { message: `Failed to update order status: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * API Route to get order details
 */
export async function GET(
  req: Request,
  context: any
) {
  const id = context?.params?.id;
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Validate order ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Order retrieved successfully',
      order: {
        id: order._id,
        status: order.status,
        // include other order details as needed
      }
    });
    
  } catch (error: any) {
    console.error('Error retrieving order:', error);
    return NextResponse.json(
      { message: `Failed to retrieve order: ${error.message}` },
      { status: 500 }
    );
  }
}
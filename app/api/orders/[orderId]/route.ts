import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import mongoose from 'mongoose';
import { sendOrderStatusUpdateEmail } from '@/lib/email'; // Add this import for email notification

// GET: Fetch a specific order by its ID 
// If user is authenticated, ensure it's their order or they're an admin
// If not authenticated, allow tracking by order ID for public tracking purposes
export async function GET(req: NextRequest, context: any) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    const orderId = context?.params?.orderId;
    const isTrackingRequest = req.nextUrl.searchParams.get('track') === 'true';

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ message: 'Invalid Order ID format' }, { status: 400 });
    }

    // Create query object for finding the order
    const query: any = { _id: orderId };
    
    // If authenticated and not admin, restrict to user's orders
    if (session?.user?.id && session.user.role !== 'admin') {
      query.user = session.user.id;
    } 
    // If not authenticated, verify this is explicitly a tracking request
    else if (!session?.user?.id && !isTrackingRequest) {
      return NextResponse.json({ message: 'Unauthorized. Use tracking endpoint to view order details.' }, { status: 401 });
    }

    const order = await Order.findOne(query)
      .populate('orderItems.product', 'name images price')
      .populate('user', 'name email'); // Populate product details

    if (!order) {
      return NextResponse.json({ message: 'Order not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });

  } catch (error) {
    console.error('[API/ORDERS/[ORDERID] GET] Error fetching order:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error fetching order', error: errorMessage }, { status: 500 });
  }
}

// PATCH: Update order status (Admin only)
export async function PATCH(req: NextRequest, context: any) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    // Verify admin permissions
    if (!session?.user?.id || session?.user?.role !== 'admin') { // Changed to check role
      return NextResponse.json({ message: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const orderId = context?.params?.orderId;
    const { status } = await req.json();    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ message: 'Invalid Order ID format' }, { status: 400 });
    }

    if (!status || !['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
    }

    // Find order and populate user information for email notification
    const order = await Order.findById(orderId).populate('user', 'email name');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Update order status
    order.status = status;
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Send email notification to customer about status change
    if (order.user && order.user.email) {
      try {
        // Construct order details for the email
        const orderDetails = {
          orderId: order._id.toString(),
          userName: order.user.name || 'Customer',
          status: status,
          orderItems: order.orderItems?.map((item: any) => ({
            name: item.name,
            quantity: item.qty || item.quantity,
            price: item.price
          })) || [],
          totalAmount: order.totalPrice || order.totalAmount,
          statusUpdateMessage: getStatusUpdateMessage(status),
        };
        
        await sendOrderStatusUpdateEmail(order.user.email, orderDetails);
        console.log(`[API/ORDERS/[ORDERID] PATCH] Status update email sent to ${order.user.email}`);
      } catch (emailError) {
        console.error('[API/ORDERS/[ORDERID] PATCH] Failed to send status update email:', emailError);
        // Continue since order status is updated, email failure shouldn't affect API response
      }
    } else {
      console.warn('[API/ORDERS/[ORDERID] PATCH] User email not available, cannot send status update email');
    }

    return NextResponse.json({ 
      message: `Order status updated to ${status}`,
      success: true,
      order: { 
        _id: order._id, 
        status: order.status,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('[API/ORDERS/[ORDERID] PATCH] Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error updating order status', error: errorMessage }, { status: 500 });
  }
}

// Helper function to generate appropriate status update messages
function getStatusUpdateMessage(status: string): string {
  switch (status) {
    case 'Processing':
      return 'Your order has been confirmed and is now being processed. We\\\'ll notify you when it ships.';
    case 'Confirmed':
      return 'Your order is confirmed and tracking information has been added. You can track your shipment soon.';
    case 'Shipped':
      return 'Great news! Your order has been shipped and is on the way to you.';
    case 'Delivered':
      return 'Your order has been delivered. We hope you enjoy your purchase!';
    case 'Cancelled':
      return 'Your order has been cancelled. If you have any questions, please contact our support team.';
    default:
      return `Your order status has been updated to: ${status}`;
  }
}

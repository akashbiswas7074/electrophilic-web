import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order, { IOrderItem } from '@/lib/database/models/order.model'; // Changed IOrderProduct to IOrderItem
import Cart from '@/lib/database/models/cart.model';
// import Razorpay from 'razorpay'; // Not directly used for instance, crypto is used
import crypto from 'crypto';
import mongoose from 'mongoose';
import { handleError } from '@/lib/utils';
import { sendOrderConfirmationEmail } from '@/lib/email'; // Added import

interface VerifyPaymentRequestBody {
  orderId: string; // Your internal order ID
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  paymentMethod: 'razorpay'; // To ensure this handler is specific
}

export async function POST(req: NextRequest) {
  console.log("[API /api/order/verify-payment] Received request");
  try {
    await connectToDatabase();
    console.log("[API /api/order/verify-payment] Database connected");

    const body: VerifyPaymentRequestBody = await req.json();
    console.log("[API /api/order/verify-payment] Request body parsed:", body);

    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentMethod } = body;

    if (paymentMethod !== 'razorpay') {
      console.warn("[API /api/order/verify-payment] Invalid payment method for this endpoint:", paymentMethod);
      return NextResponse.json({ success: false, message: 'Invalid payment method for verification.' }, { status: 400 });
    }

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      console.error("[API /api/order/verify-payment] Missing required payment verification details.");
      return NextResponse.json({ success: false, message: 'Missing required payment verification details.' }, { status: 400 });
    }

    const razorpay_key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpay_key_secret) {
      console.error("[API /api/order/verify-payment] Razorpay key secret is not configured on the server.");
      return NextResponse.json({ success: false, message: 'Server configuration error for payment verification.' }, { status: 500 });
    }

    // Verify the signature
    // The body should be: razorpayOrderId + "|" + razorpayPaymentId
    const generated_signature = crypto
      .createHmac('sha256', razorpay_key_secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');

    console.log("[API /api/order/verify-payment] Generated Signature:", generated_signature);
    console.log("[API /api/order/verify-payment] Received Signature:", razorpaySignature);

    if (generated_signature !== razorpaySignature) {
      console.warn("[API /api/order/verify-payment] Payment verification failed: Signature mismatch.");
      return NextResponse.json({ success: false, message: 'Payment verification failed. Invalid signature.' }, { status: 400 });
    }

    console.log("[API /api/order/verify-payment] Signature verified successfully.");

    // Start a session for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log("[API /api/order/verify-payment] Mongoose transaction started.");

    try {
      // Populate user's email and name for the confirmation email
      const order = await Order.findById(orderId)
        .session(session)
        .populate<{ user: { _id: mongoose.Types.ObjectId; email: string; name: string } }>('user', 'email name'); // Corrected populate to only fetch necessary user fields

      if (!order) {
        await session.abortTransaction();
        console.error("[API /api/order/verify-payment] Order not found with ID:", orderId);
        return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
      }

      if (order.isPaid) {
        // If already paid, commit transaction and return success (idempotency)
        await session.commitTransaction();
        console.log("[API /api/order/verify-payment] Order already marked as paid. Order ID:", orderId);
        return NextResponse.json({ success: true, message: 'Order already paid.' });
      }

      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'Processing'; // Or your desired status after payment
      order.paymentResult = {
        id: razorpayPaymentId,
        status: 'success', // Assuming success as signature is verified
        update_time: new Date().toISOString(),
        email_address: 'N/A' // Razorpay doesn't directly provide email in this specific client-side verification flow's response to server
      };
      order.paymentMethod = 'razorpay'; // Ensure payment method is correctly stored

      await order.save({ session });
      console.log("[API /api/order/verify-payment] Order updated to paid. Order ID:", orderId);

      // Clear the user's cart - use order.user._id
      // Ensure order.user is populated and has an _id
      if (order.user && order.user._id) {
        await Cart.deleteOne({ user: order.user._id }).session(session);
        console.log("[API /api/order/verify-payment] Cart cleared for user ID:", order.user._id);
      } else {
        console.warn("[API /api/order/verify-payment] User ID not found on order, cannot clear cart. Order user:", order.user);
        // Decide if this is a critical error that should abort the transaction
        // For now, we'll log and continue, as payment is verified.
      }

      await session.commitTransaction();
      console.log("[API /api/order/verify-payment] Transaction committed successfully.");

      // Send order confirmation email
      if (order.user && order.user.email) {
        try {
          // Construct a simplified orderDetails for the email
          // Ensure all product properties accessed are present on IOrderItem
          const orderDetailsForEmail = {
            id: order._id.toString(),
            userName: order.user.name || 'Customer',
            items: order.products.map((p: IOrderItem) => ({ // Changed to IOrderItem
              name: p.name,
              quantity: p.qty, // Mapped from qty
              price: p.price
            })),
            totalAmount: order.totalPrice,
          };
          await sendOrderConfirmationEmail(order.user.email, orderDetailsForEmail);
          console.log(`[API /api/order/verify-payment] Order confirmation email sent to ${order.user.email}`);
        } catch (emailError: any) {
          console.error("[API /api/order/verify-payment] Failed to send order confirmation email:", emailError.message);
          // Do not let email failure roll back the transaction or fail the API response for payment verification
        }
      } else {
        console.warn("[API /api/order/verify-payment] User email not available, cannot send order confirmation email. User object:", order.user);
      }

      return NextResponse.json({ success: true, message: 'Payment verified and order updated successfully.', orderId: order._id });

    } catch (dbError: any) {
      await session.abortTransaction();
      console.error("[API /api/order/verify-payment] Database error during transaction:", dbError);
      handleError(dbError); // Assuming handleError is a utility function
      return NextResponse.json({ success: false, message: `Error updating order: ${dbError.message}` }, { status: 500 });
    } finally {
      session.endSession();
      console.log("[API /api/order/verify-payment] Mongoose session ended.");
    }

  } catch (error: any) {
    console.error("[API /api/order/verify-payment] General error in POST handler:", error);
    handleError(error); // Assuming handleError is a utility function
    return NextResponse.json({ success: false, message: `Server error: ${error.message}` }, { status: 500 });
  }
}

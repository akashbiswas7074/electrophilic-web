import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import Cart from '@/lib/database/models/cart.model';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { handleError } from '@/lib/utils';

// You'll need to set this in your environment variables
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  console.log("[Webhook /api/webhooks/razorpay] Received request");

  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("[Webhook] Razorpay webhook secret is not configured.");
    return NextResponse.json({ success: false, message: "Webhook secret not configured." }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    console.warn("[Webhook] Missing X-Razorpay-Signature header.");
    return NextResponse.json({ success: false, message: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text(); // Get raw body for signature verification

  try {
    // Verify the webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn("[Webhook] Invalid signature.");
      return NextResponse.json({ success: false, message: "Invalid signature." }, { status: 400 });
    }
    console.log("[Webhook] Signature verified successfully.");

    const event = JSON.parse(rawBody); // Parse the body after signature verification
    console.log("[Webhook] Parsed Event:", event.event, "Payload Entity ID:", event.payload?.payment?.entity?.id);


    // Handle different event types
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const amountPaid = paymentEntity.amount / 100; // Amount is in paise

      // Find the order using the Razorpay Order ID stored in notes or directly if you store it
      // Assuming you stored your internal order ID in notes.order_id when creating Razorpay order
      const internalOrderId = paymentEntity.notes?.internal_order_id || paymentEntity.notes?.order_id;

      if (!internalOrderId) {
          console.error("[Webhook] 'payment.captured': Missing internal_order_id or order_id in payment notes. Razorpay Order ID:", razorpayOrderId);
          // If you can't link Razorpay order to your internal order, you might need to log this for manual reconciliation
          // or if you store razorpayOrderId directly on your Order model, you can use that.
          // For now, we'll return a 200 to Razorpay to acknowledge receipt, but log the issue.
          return NextResponse.json({ success: true, message: "Event received, but internal order ID missing in notes." });
      }
      
      console.log(`[Webhook] 'payment.captured': Processing for Internal Order ID: ${internalOrderId}, Razorpay Payment ID: ${razorpayPaymentId}`);

      const session = await mongoose.startSession();
      session.startTransaction();
      console.log("[Webhook] Mongoose transaction started for 'payment.captured'.");

      try {
        await connectToDatabase(); // Ensure DB connection
        const order = await Order.findById(internalOrderId).session(session);

        if (!order) {
          await session.abortTransaction();
          console.error(`[Webhook] 'payment.captured': Order not found with internal ID: ${internalOrderId}`);
          // Return 200 to Razorpay as the event itself is valid, but we couldn't process it.
          return NextResponse.json({ success: true, message: "Order not found for webhook processing." });
        }

        if (order.isPaid) {
          await session.commitTransaction();
          console.log(`[Webhook] 'payment.captured': Order ${internalOrderId} already marked as paid.`);
          return NextResponse.json({ success: true, message: "Order already paid." });
        }

        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'Processing'; // Or your desired status
        order.paymentResult = {
          id: razorpayPaymentId,
          status: 'success', // From Razorpay 'captured' status
          update_time: new Date(paymentEntity.created_at * 1000).toISOString(), // Convert Unix timestamp to ISO
          email_address: paymentEntity.email || 'N/A',
        };
        // Ensure paymentMethod is also set if it wasn't or to confirm
        if (order.paymentMethod !== 'razorpay') {
            order.paymentMethod = 'razorpay';
        }


        await order.save({ session });
        console.log(`[Webhook] 'payment.captured': Order ${internalOrderId} updated to paid.`);

        // Clear the user's cart
        await Cart.deleteOne({ user: order.user }).session(session);
        console.log(`[Webhook] 'payment.captured': Cart cleared for user ${order.user}.`);

        await session.commitTransaction();
        console.log("[Webhook] Transaction committed successfully for 'payment.captured'.");
        
        // Here you might trigger other post-payment actions like sending emails, updating inventory further, etc.

      } catch (dbError: any) {
        await session.abortTransaction();
        console.error(`[Webhook] 'payment.captured': Database error for order ${internalOrderId}:`, dbError);
        handleError(dbError);
        // Return 500 to Razorpay to signal an issue on our end, they might retry.
        return NextResponse.json({ success: false, message: `Error updating order: ${dbError.message}` }, { status: 500 });
      } finally {
        session.endSession();
        console.log("[Webhook] Mongoose session ended for 'payment.captured'.");
      }

    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const internalOrderId = paymentEntity.notes?.internal_order_id || paymentEntity.notes?.order_id;
      console.warn(`[Webhook] 'payment.failed': Payment failed for Razorpay Order ID: ${razorpayOrderId}, Internal Order ID: ${internalOrderId || 'N/A'}. Reason: ${paymentEntity.error_reason}`);
      // You might want to update your order status to 'Payment Failed' or log this.
      // No transaction needed usually for just logging a failed payment unless you update the order.
    } else {
      console.log(`[Webhook] Received unhandled event type: ${event.event}`);
    }

    // Acknowledge receipt of the event to Razorpay
    return NextResponse.json({ success: true, message: "Webhook received successfully." });

  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    handleError(error);
    // If parsing rawBody or initial signature check fails before body is parsed
    if (error.message.includes("JSON")) {
        return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: `Server error: ${error.message}` }, { status: 500 });
  }
}

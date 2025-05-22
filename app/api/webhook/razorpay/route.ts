// File: /home/akashbiswas7797/Desktop/vibecart/app/api/webhook/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { handlePaymentSuccess } from '@/lib/database/actions/order.actions';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  console.log('[Webhook /api/webhook/razorpay] Received POST request');

  try {
    const rawBody = await req.text(); // Razorpay sends JSON, read as text first for signature verification
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('[Webhook /api/webhook/razorpay] Missing x-razorpay-signature header');
      return NextResponse.json({ success: false, message: 'Missing Razorpay signature' }, { status: 400 });
    }

    if (!webhookSecret) {
        console.error('[Webhook /api/webhook/razorpay] Razorpay webhook secret is not configured.');
        return NextResponse.json({ success: false, message: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Webhook /api/webhook/razorpay] Invalid signature.');
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    console.log('[Webhook /api/webhook/razorpay] Signature verified successfully.');

    // Parse the JSON body *after* signature verification
    const event = JSON.parse(rawBody);
    console.log('[Webhook /api/webhook/razorpay] Event payload:', event);

    // Handle the event (e.g., payment.captured or order.paid)
    // Check the event type you configured in Razorpay dashboard
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity;
      const orderEntity = event.payload.order?.entity; // Order entity might be present

      // IMPORTANT: Ensure 'order_id' is passed in notes when creating the Razorpay order
      const orderId = orderEntity?.notes?.order_id || paymentEntity?.notes?.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const paymentStatus = paymentEntity.status; // e.g., 'captured'

      if (!orderId) {
        console.error('[Webhook /api/webhook/razorpay] Missing order_id in payment/order notes for payment:', razorpayPaymentId);
        return NextResponse.json({ success: false, message: 'Missing order_id in notes' }, { status: 400 });
      }

      console.log(`[Webhook /api/webhook/razorpay] Handling ${event.event} for Order ID: ${orderId}, Payment ID: ${razorpayPaymentId}`);

      try {
        // Prepare payment result data
        const paymentResult = {
          id: razorpayPaymentId,
          status: paymentStatus, // 'captured'
          // Add other relevant details if needed
          method: paymentEntity.method,
          email: paymentEntity.email,
          contact: paymentEntity.contact,
        };

        // Call the function to update the order status, mark as paid, and clear cart
        const updateResult = await handlePaymentSuccess(orderId, paymentResult, 'razorpay');

        if (updateResult.success) {
          console.log(`[Webhook /api/webhook/razorpay] Successfully processed payment for Order ID: ${orderId}`);
          // Razorpay expects a 200 OK response with an empty body or { status: 'ok' }
          return NextResponse.json({ status: 'ok' });
        } else {
          console.error(`[Webhook /api/webhook/razorpay] Failed to update order status for Order ID: ${orderId}. Reason: ${updateResult.message}`);
          // Return 500 to indicate a server-side issue processing the successful payment
          return NextResponse.json({ success: false, message: updateResult.message || 'Failed to update order' }, { status: 500 });
        }
      } catch (error: any) {
        console.error(`[Webhook /api/webhook/razorpay] Error calling handlePaymentSuccess for Order ID: ${orderId}:`, error);
        return NextResponse.json({ success: false, message: `Error processing payment: ${error.message}` }, { status: 500 });
      }
    } else {
      console.log(`[Webhook /api/webhook/razorpay] Unhandled event type: ${event.event}`);
    }

    // Acknowledge receipt for unhandled but verified events
    return NextResponse.json({ status: 'ok' });

  } catch (error: any) {
    console.error('[Webhook /api/webhook/razorpay] Error processing webhook:', error);
    return NextResponse.json({ success: false, message: `Webhook processing error: ${error.message}` }, { status: 500 });
  }
}

// Add a GET handler for basic testing or verification if needed
export async function GET() {
    return NextResponse.json({ message: "Razorpay Webhook Endpoint Active" });
}

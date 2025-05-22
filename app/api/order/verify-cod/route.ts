import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import PendingCodOrder from '@/lib/database/models/pending-cod-order.model';
import Product from '@/lib/database/models/product.model';
import Cart from '@/lib/database/models/cart.model';
import User from '@/lib/database/models/user.model';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { handleError } from '@/lib/utils';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface VerifyCodRequestBody {
  orderId: string;
  verificationCode: string;
}

export async function POST(request: NextRequest) {
  console.log('[API /api/order/verify-cod] Received POST request.');
  try {
    // Parse the request body and log it for debugging
    const requestText = await request.text();
    console.log(`[API /api/order/verify-cod] Raw request body: ${requestText}`);
    
    let body;
    try {
      body = JSON.parse(requestText) as VerifyCodRequestBody;
    } catch (parseError) {
      console.error(`[API /api/order/verify-cod] Failed to parse JSON body: ${parseError}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid JSON in request body',
        debug: { error: 'JSON_PARSE_ERROR', raw: requestText.substring(0, 100) }
      }, { status: 400 });
    }
    
    const { orderId, verificationCode } = body;

    if (!orderId || !verificationCode) {
      return NextResponse.json({ success: false, message: 'Order ID and verification code are required.' }, { status: 400 });
    }

    console.log(`[API /api/order/verify-cod] Attempting to verify COD for Pending Order ID: ${orderId}`);

    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log("[API /api/order/verify-cod] Transaction started.");

    try {
      // Look for the order in the PendingCodOrder collection instead of the Order collection
      const pendingOrder = await PendingCodOrder.findById(orderId)
        .populate('user') // Populate user to get email for confirmation
        .select('+codVerificationCode +codVerificationCodeExpires') // Explicitly select the secure fields
        .session(session);

      if (!pendingOrder) {
        await session.abortTransaction();
        console.error(`[API /api/order/verify-cod] Pending COD order not found: ${orderId}`);
        return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
      }

      // Print order details for debugging
      console.log(`[API /api/order/verify-cod] Pending order found: ${orderId}, Payment Method: ${pendingOrder.paymentMethod}`);

      // Verify the payment method is COD
      if (pendingOrder.paymentMethod !== 'cod') {
        await session.abortTransaction();
        console.warn(`[API /api/order/verify-cod] Order ${orderId} is not a COD order.`);
        return NextResponse.json({ success: false, message: 'Not a COD order.' }, { status: 400 });
      }

      // Ensure verification code is present
      if (!pendingOrder.codVerificationCode) {
        await session.abortTransaction();
        console.error(`[API /api/order/verify-cod] Verification code not found on pending order ${orderId}.`);
        return NextResponse.json({ success: false, message: 'Internal error: Verification data missing.' }, { status: 500 });
      }

      // Compare the provided code with the hashed code
      const isCodeMatch = await bcrypt.compare(verificationCode, pendingOrder.codVerificationCode);

      if (!isCodeMatch) {
        await session.abortTransaction();
        console.warn(`[API /api/order/verify-cod] Invalid verification code for order ${orderId}.`);
        return NextResponse.json({ success: false, message: 'Invalid verification code.' }, { status: 400 });
      }

      // Check if code has expired
      if (pendingOrder.codVerificationCodeExpires && new Date() > pendingOrder.codVerificationCodeExpires) {
        await session.abortTransaction();
        console.warn(`[API /api/order/verify-cod] Verification code expired for order ${orderId}.`);
        return NextResponse.json({ success: false, message: 'Verification code has expired.' }, { status: 400 });
      }

      // Verification successful - Create a real order from the pending order
      console.log(`[API /api/order/verify-cod] Creating confirmed order from pending order ${orderId}...`);
      
      // --- Normalize and ensure all required address and total fields for real order creation ---
      // Use shippingAddress if present, else deliveryAddress, and fill defaults for missing fields
      const requiredAddressFields = [
        'firstName', 'lastName', 'phoneNumber', 'address1', 'city', 'state', 'zipCode', 'country'
      ];
      let normalizedShippingAddress = { ...(pendingOrder.shippingAddress || pendingOrder.deliveryAddress || {}) };
      // If phone is present but not phoneNumber, map it
      if (!normalizedShippingAddress.phoneNumber && normalizedShippingAddress.phone) {
        normalizedShippingAddress.phoneNumber = normalizedShippingAddress.phone;
      }
      // Set defaults for missing fields
      for (const field of requiredAddressFields) {
        if (!normalizedShippingAddress[field]) {
          switch (field) {
            case 'firstName': normalizedShippingAddress.firstName = 'Guest'; break;
            case 'lastName': normalizedShippingAddress.lastName = 'User'; break;
            case 'phoneNumber': normalizedShippingAddress.phoneNumber = '0000000000'; break;
            case 'address1': normalizedShippingAddress.address1 = 'Default Address'; break;
            case 'city': normalizedShippingAddress.city = 'Default City'; break;
            case 'state': normalizedShippingAddress.state = 'Default State'; break;
            case 'zipCode': normalizedShippingAddress.zipCode = '000000'; break;
            case 'country': normalizedShippingAddress.country = 'Default Country'; break;
          }
        }
      }
      // Use normalizedShippingAddress for both shippingAddress and deliveryAddress if deliveryAddress is missing
      const normalizedDeliveryAddress = { ...normalizedShippingAddress, ...pendingOrder.deliveryAddress };
      // Ensure total is set
      const total = typeof pendingOrder.totalAmount === 'number' ? pendingOrder.totalAmount : 0;
      // --- End normalization ---

      // Convert the pending order to a regular order document
      const orderData = {
        user: pendingOrder.user,
        orderItems: pendingOrder.orderItems,
        shippingAddress: normalizedShippingAddress,
        deliveryAddress: normalizedDeliveryAddress,
        totalAmount: pendingOrder.totalAmount,
        total: total,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'processing', // Set directly to processing status
        couponApplied: pendingOrder.couponApplied,
        discountAmount: pendingOrder.discountAmount,
      };

      // Create and save the real order
      const newOrder = new Order(orderData);
      const savedOrder = await newOrder.save({ session });
      
      if (!savedOrder) {
        throw new Error("Failed to create confirmed order from pending COD order");
      }
      
      console.log(`[API /api/order/verify-cod] Successfully created confirmed order: ${savedOrder._id.toString()}`);

      // Update stock for each product in the order
      console.log(`[API /api/order/verify-cod] Updating product stock for order ${savedOrder._id.toString()}...`);

      const stockUpdatePromises = pendingOrder.orderItems.map(async (item: any) => {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          throw new Error(`Product ${item.product} (${item.name}) not found during stock update.`);
        }

        let updateApplied = false;
        if (product.subProducts && product.subProducts.length > 0) {
          const subProduct = product.subProducts[0]; 
          const sizeIndex = subProduct.sizes.findIndex(
            (s: any) => String(s.size).toLowerCase() === String(item.size).toLowerCase()
          );

          if (sizeIndex !== -1) {
            // Check if sufficient stock
            if (subProduct.sizes[sizeIndex].qty < item.qty) {
              throw new Error(`Insufficient stock for product ${item.name} (Size: ${item.size}). Requested: ${item.qty}, Available: ${subProduct.sizes[sizeIndex].qty}.`);
            }
            
            // Update stock quantity and sold counts
            subProduct.sizes[sizeIndex].qty -= item.qty;
            subProduct.sizes[sizeIndex].sold = (subProduct.sizes[sizeIndex].sold || 0) + item.qty;
            if (typeof subProduct.sold === 'number') {
                subProduct.sold += item.qty;
            } else {
                subProduct.sold = item.qty;
            }
            updateApplied = true;
          }
        }

        if (!updateApplied) {
          throw new Error(`Failed to find matching variant to update stock for product ${item.name} (Size: ${item.size}).`);
        }
        await product.save({ session });
      });

      await Promise.all(stockUpdatePromises);
      console.log(`[API /api/order/verify-cod] Product stock updated successfully.`);

      // Clear the customer's cart
      if (pendingOrder.user) {
        await Cart.deleteOne({ user: pendingOrder.user._id || pendingOrder.user }).session(session);
        console.log(`[API /api/order/verify-cod] Cart cleared for user ${pendingOrder.user._id || pendingOrder.user}.`);
      }

      // Delete the pending order now that it's been converted
      await PendingCodOrder.findByIdAndDelete(orderId).session(session);
      console.log(`[API /api/order/verify-cod] Deleted pending order ${orderId} after verification`);
      
      // Commit the transaction
      await session.commitTransaction();
      console.log(`[API /api/order/verify-cod] Transaction committed.`);

      // Send order confirmation email
      try {
        const user = pendingOrder.user as any;
        if (user && user.email) {
          await sendOrderConfirmationEmail(user.email, {
            userName: user.name || 'Customer',
            orderId: savedOrder._id.toString(), // Use the new actual order ID
            orderItems: pendingOrder.orderItems.map((p:any) => ({ 
              name: p.name, 
              quantity: p.qty || p.quantity, 
              price: p.price 
            })),
            totalAmount: pendingOrder.totalAmount,
            shippingAddress: pendingOrder.deliveryAddress,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          });
          console.log(`[API /api/order/verify-cod] Order confirmation email sent.`);
        } else {
          console.error(`[API /api/order/verify-cod] User email not available, cannot send confirmation email.`);
        }
      } catch (emailError: any) {
        console.error(`[API /api/order/verify-cod] Failed to send confirmation email:`, emailError);
        // Don't throw error here, order is already created and verified
      }

      return NextResponse.json({ 
        success: true, 
        message: 'COD order verified and created successfully. Your order is now processing.',
        orderId: savedOrder._id.toString() // Return the new actual order ID
      });

    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      console.error(`[API /api/order/verify-cod] Error during COD verification:`, error);
      if (error.message.includes("Insufficient stock") || error.message.includes("not found during stock update")) {
          return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: `Verification failed: ${error.message}` }, { status: 500 });
    } finally {
      if (session.inTransaction()) {
        console.warn("[API /api/order/verify-cod] Transaction was still active in finally block. Aborting.");
        try { await session.abortTransaction(); } catch (abortError) { console.error("[API /api/order/verify-cod] Error aborting transaction in finally block:", abortError); }
      }
      try { await session.endSession(); console.log("[API /api/order/verify-cod] Session ended."); } 
      catch (endSessionError: any) { if (!endSessionError.message.includes("Cannot leak session")) { console.error("[API /api/order/verify-cod] Error ending session in finally block:", endSessionError); } }
    }

  } catch (error: any) {
    console.error('[API /api/order/verify-cod] Outer error caught:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

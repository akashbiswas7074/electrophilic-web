"use server";

// Use relative path for connectToDatabase
import { connectToDatabase } from "../connect";
import Order, { IOrderItem } from "@/lib/database/models/order.model"; 
import User, { IEmbeddedAddress, IUser } from "@/lib/database/models/user.model"; // Import IEmbeddedAddress from user.model
import Cart from "@/lib/database/models/cart.model";
import Product from "@/lib/database/models/product.model"; // Import Product model for stock updates
import PendingCodOrder, { IPendingCodOrder } from "@/lib/database/models/pending-cod-order.model"; // Import the new PendingCodOrder model
import { handleError } from "@/lib/utils";
import mongoose from 'mongoose';
import crypto from 'crypto'; // Import crypto for generating verification code
import { sendCodVerificationEmail, sendOrderConfirmationEmail } from '@/lib/email'; // Import email functions
import bcrypt from 'bcryptjs'; // Added for hashing COD verification codes
import { mapAdminStatusToWebsite } from "@/lib/order-status-utils";

// Define the expected structure for checkout data
interface CheckoutData {
  userId: string;
  cartItems: any[]; // Consider defining a stricter CartItem type here
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string; // Added for consistency with IEmbeddedAddress
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;      // Added to allow 'phone' as input
    phoneNumber?: string; // Added to allow 'phoneNumber' as input and for internal assignment
  };
  paymentMethod: 'razorpay' | 'cod'; // Updated: Only Razorpay or COD
  itemsPrice: number;
  shippingPrice: number;
  taxPrice?: number; // Optional tax price
  totalPrice: number;
  couponCode?: string | null; // Optional coupon code
  discountAmount?: number; // Optional discount amount
}

// Define a simpler type for the input shipping address data
interface ShippingAddressData {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export async function processCheckoutSteps(data: CheckoutData): Promise<any> {
  await connectToDatabase();
  const session = await mongoose.startSession();
  session.startTransaction();
  let savedOrder: any = null;
  let savedPendingOrder: any = null;
  let plainVerificationCode: string | undefined; // Fix: declare at top for COD flow
  
  try {
    const {
      userId,
      cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice = 0,
      totalPrice,
      couponCode,
      discountAmount = 0,
    } = data;

    // 1. Validate User (within transaction)
    const user = await User.findById(userId).session(session);
    if (!user) {
      console.error("[processCheckoutSteps] User not found:", userId);
      await session.abortTransaction();
      return { success: false, message: "User not found." };
    }
    console.log("[processCheckoutSteps] User validated:", user.email);

    // 2. Validate Cart Items & Check Stock (within transaction)
    if (!cartItems || cartItems.length === 0) {
      console.error("[processCheckoutSteps] Cart is empty.");
      await session.abortTransaction();
      return { success: false, message: "Cannot place order with an empty cart." };
    }

    // --- Stock Check ---
    const productIds: string[] = [];
    for (const item of cartItems as any[]) {
        // Ensure item.product exists and is a string (or can be converted)
        if (!item.product || typeof item.product.toString !== 'function') {
            console.error(`[processCheckoutSteps] Invalid or missing product ID for cart item:`, item);
            await session.abortTransaction();
            return { success: false, message: `Invalid product data in cart for item: ${item.name || 'Unknown'}. Please refresh your cart.` };
        }
        productIds.push(item.product.toString());
    }

    console.log(`[processCheckoutSteps] Attempting to fetch stock for Product IDs: ${JSON.stringify(productIds)}`);

    // Fetch necessary fields including subProducts for stock check
    const productsInDb = await Product.find(
        { '_id': { $in: productIds } },
        'name subProducts.sku subProducts.sizes _id' // Fetch necessary fields, ensure _id is fetched
    ).session(session).lean();

    console.log(`[processCheckoutSteps] Found ${productsInDb.length} products in stock database matching query IDs.`);

    // Verify all requested product IDs were found
    const foundProductIds = new Set(productsInDb.map(p => (p as any)._id.toString()));
    const missingProductIds = productIds.filter(id => !foundProductIds.has(id));

    if (missingProductIds.length > 0) {
        console.error(`[processCheckoutSteps] Product ID(s) not found in database: ${missingProductIds.join(', ')}`);
        const missingProductNames = cartItems
            .filter(item => missingProductIds.includes(item.product.toString()))
            .map(item => item.name || `ID ${item.product}`)
            .join(', ');

        await session.abortTransaction();
        return {
            success: false,
            message: `Sorry, the following product(s) could not be found or are unavailable: ${missingProductNames || missingProductIds.join(', ')}.`,
            unavailableProductIds: missingProductIds
        };
    }

    const productDetailsMap = new Map(productsInDb.map((p) => [(p as any)._id.toString(), p]));
    console.log("[processCheckoutSteps] Fetched product details map created.");

    // Process cart items and automatically assign sizes if missing
    for (const item of cartItems as any[]) {
        const productId = item.product.toString();
        const productData = productDetailsMap.get(productId); // Rename to productData to avoid conflict
        
        // If size is missing, try to assign a default size
        if (!item.size) {
            console.log(`[processCheckoutSteps] Size is undefined for Product ID: ${productId}`);
            
            if (productData && productData.subProducts && productData.subProducts.length > 0) {
                const subProduct = productData.subProducts[0];
                if (subProduct && subProduct.sizes && subProduct.sizes.length > 0) {
                    item.size = subProduct.sizes[0].size; // Automatically set to the first available size
                    console.log(`[processCheckoutSteps] Automatically set size for ${item.name} to: ${item.size}`);
                } else {
                    console.error(`[processCheckoutSteps] No sizes available for Product ID: ${productId}`);
                    await session.abortTransaction();
                    return {
                        success: false,
                        message: `No sizes available for product: ${item.name || productId}.`,
                        productId,
                        size: item.size
                    };
                }
            } else {
                console.error(`[processCheckoutSteps] Product details or subProducts not found for Product ID: ${productId}`);
                await session.abortTransaction();
                return {
                    success: false,
                    message: `Product details not found for product: ${item.name || productId}.`,
                    productId,
                    size: item.size
                };
            }
        }

        console.log(`[processCheckoutSteps] Processing item loop for Product ID: ${productId}, Size: ${item.size}`);
        const productDetails = productDetailsMap.get(productId); // This is the conflicting declaration
        const requestedQty = (typeof item.quantity === 'number' && item.quantity > 0) ? item.quantity : ((typeof item.qty === 'number' && item.qty > 0) ? item.qty : 1);
        const productName = productDetails?.name || item.name || `Product ID ${productId}`;

        // Find the specific size variant stock (assuming first subProduct)
        let availableStock: number | undefined = undefined;
        let sizeFound = false;

        if (productDetails && productDetails.subProducts && productDetails.subProducts.length > 0) {
            // Assume the first subProduct is the relevant one
            const subProduct = productDetails.subProducts[0];

            if (subProduct && subProduct.sizes) {
                const sizeInfo = subProduct.sizes.find((s: any) => s.size === item.size);
                if (sizeInfo) {
                    availableStock = sizeInfo.qty;
                    sizeFound = true;
                    console.log(`[processCheckoutSteps] Found matching size '${item.size}' for Product ID ${productId}. Available stock: ${availableStock}`);
                } else {
                    console.log(`[processCheckoutSteps] Size '${item.size}' not found within the subProduct for Product ID ${productId}.`);
                }
            } else {
                console.log(`[processCheckoutSteps] First subProduct or its sizes not found for Product ID ${productId}.`);
            }
        } else {
            console.log(`[processCheckoutSteps] Product details or subProducts not found in map for Product ID ${productId}.`);
        }

        console.log(`[processCheckoutSteps] Stock Check for \"${productName}\" (ID: ${productId}, Size: ${item.size}): Requested Qty = ${requestedQty}, Available Stock = ${availableStock ?? 'N/A'}`);

        // Check if the specific size was found and if stock is sufficient
        if (!sizeFound || availableStock === undefined || availableStock < requestedQty) {
          const reason = !sizeFound ? `Size '${item.size}' not found` : `Insufficient stock (Requested: ${requestedQty}, Available: ${availableStock})`;
          console.error(`[processCheckoutSteps] Stock check failed for "${productName}" (Size: ${item.size}). Reason: ${reason}`);
          await session.abortTransaction();
          return {
            success: false,
            message: `Sorry, "${productName}" (Size: ${item.size}) is unavailable or has insufficient stock. ${reason}.`,
            productId: productId,
            size: item.size,
          };
        }
    }
    console.log("[processCheckoutSteps] Stock check passed for all items.");

    // 3. Prepare Order Products
    const orderProducts: any[] = cartItems.map((item: any) => {
        const productId = item.product.toString();
        const productDetails = productDetailsMap.get(productId);
        const requestedQty = (typeof item.quantity === 'number' && item.quantity > 0) ? item.quantity : ((typeof item.qty === 'number' && item.qty > 0) ? item.qty : 1);
        const productName = productDetails?.name || item.name || `Product ID ${productId}`;

        // Ensure originalPrice is captured from the cart item or product details
        // This assumes cart item has originalPrice, if not, fallback to productDetails or price itself
        const originalItemPrice = item.originalPrice || productDetails?.price || item.price;

        return {
            product: new mongoose.Types.ObjectId(productId),
            name: productName,
            // Set both quantity and qty fields for compatibility
            quantity: requestedQty,
            qty: requestedQty,
            price: item.price, // Selling price from cart item
            originalPrice: originalItemPrice, // Original price
            size: item.size,
            image: item.image,
        };
    });

    // Calculate totalOriginalItemsPrice
    const totalOriginalItemsPrice = orderProducts.reduce((acc, item) => {
      const price = item.originalPrice || 0; // Fallback to 0 if undefined
      const quantity = item.quantity || 0; // Fallback to 0 if undefined
      return acc + (price * quantity);
    }, 0);

    console.log("[processCheckoutSteps] Calculated totalOriginalItemsPrice:", totalOriginalItemsPrice);

    console.log("[processCheckoutSteps] Prepared order products:", orderProducts.length);

    // 4. Create the Order object (within transaction)
    // --- Address Normalization ---
    // Ensure all required fields for shippingAddress
    const requiredFields = [
      'firstName', 'lastName', 'phoneNumber', 'address1', 'city', 'state', 'zipCode', 'country'
    ];
    
    // Add type assertion to allow string indexing
    let normalizedShippingAddress = { ...shippingAddress } as { [key: string]: any };
    
    // If phone is present but not phoneNumber, map it
    if (!normalizedShippingAddress.phoneNumber && normalizedShippingAddress.phone) {
      normalizedShippingAddress.phoneNumber = normalizedShippingAddress.phone;
    }
    // Set defaults for missing fields
    for (const field of requiredFields) {
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
    const deliveryAddress = { ...normalizedShippingAddress };

    // Create base orderData with common fields for both payment methods
    const orderData: any = {
      user: new mongoose.Types.ObjectId(userId),
      orderItems: orderProducts,
      shippingAddress: normalizedShippingAddress,
      deliveryAddress: deliveryAddress,
      itemsPrice: itemsPrice,
      totalOriginalItemsPrice: totalOriginalItemsPrice,
      shippingPrice: shippingPrice,
      taxPrice: taxPrice,
      totalAmount: totalPrice,
      total: totalPrice,
      paymentMethod: paymentMethod,
      couponApplied: couponCode || undefined,
      discountAmount: discountAmount || 0,
    };

    // --- FIX: Ensure shippingAddress and total are included in orderData for COD verification (real order creation) ---
    // When converting a pending COD order to a real order (after verification), ensure both shippingAddress and total are set
    // This logic should be in your COD verification API, but if you create the real order here, do:
    //
    // const realOrderData = {
    //   ...existing fields,
    //   shippingAddress: pendingOrder.shippingAddress || pendingOrder.deliveryAddress,
    //   total: pendingOrder.totalAmount,
    // };
    //
    // Use realOrderData when creating the new Order.
    //
    // If you have a function or section for COD verification and real order creation, add this logic there.
    //
    // (No code change needed here if you already fixed pendingOrderData above. This is a reminder for the COD verification step.)

    // --- COD Order Handling ---
    if (paymentMethod === 'cod') {
      // Generate verification code
      const verificationCode = crypto.randomInt(100000, 999999).toString();
      plainVerificationCode = verificationCode; // Store plain code for email
      const codeExpiresInMinutes = 15;
      const hashedVerificationCode = await bcrypt.hash(verificationCode, 10); // Hash the code

      // For COD orders, create a pending order instead of a regular order
      const pendingOrderData: any = {
        user: new mongoose.Types.ObjectId(userId),
        orderItems: orderProducts,
        shippingAddress: normalizedShippingAddress, // <--- Ensure this is set
        deliveryAddress: deliveryAddress,
        itemsPrice: itemsPrice, // Sum of (selling price * qty)
        totalOriginalItemsPrice: totalOriginalItemsPrice, // Sum of (original price * qty)
        shippingPrice: shippingPrice,
        taxPrice: taxPrice,
        totalAmount: totalPrice, 
        total: totalPrice, // <--- Ensure this is set
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        codVerificationCode: hashedVerificationCode,
        codVerificationCodeExpires: new Date(Date.now() + codeExpiresInMinutes * 60 * 1000),
        couponApplied: couponCode || undefined,
        discountAmount: discountAmount || 0,
      };

      // Save to pending orders collection
      try {
        const pendingOrder = new PendingCodOrder(pendingOrderData);
        savedPendingOrder = await pendingOrder.save({ session });
        
        if (!savedPendingOrder) {
          throw new Error("Pending order save operation completed but did not return a document.");
        }
        
        console.log("[processCheckoutSteps] COD Pending order saved with ID:", savedPendingOrder._id.toString());
      } catch (saveError: any) {
        console.error("[processCheckoutSteps] Error saving pending COD order:", saveError);
        await session.abortTransaction();
        return { success: false, message: `Failed to create pending order: ${saveError.message}`, error: saveError };
      }
    } else if (paymentMethod === 'razorpay') {
      // For non-COD orders, continue with the regular order creation
      orderData.status = 'pending'; // For Razorpay, initial status is pending until payment
      orderData.paymentStatus = 'pending';
      
      const newOrder = new Order(orderData);
      try {
        savedOrder = await newOrder.save({ session });
        if (savedOrder) {
          console.log("[processCheckoutSteps] Order saved successfully. Order ID:", savedOrder._id.toString());
        } else {
          throw new Error("Order save operation completed but did not return a document.");
        }
      } catch (saveError: any) {
        console.error("[processCheckoutSteps] Error saving order document:", saveError);
        await session.abortTransaction();
        return { success: false, message: `Failed to save order: ${saveError.message}`, error: saveError };
      }
    } else {
      console.error("[processCheckoutSteps] Unsupported payment method in orderData setup:", paymentMethod);
      await session.abortTransaction();
      return { success: false, message: `Internal server error: Unsupported payment method.` };
    }

    // For Razorpay orders, check if saved properly and update stock
    if (paymentMethod !== 'cod') { // Defer stock update for COD until verification
      console.log("[processCheckoutSteps] Updating product stock for non-COD order...");
      // Fix: Use orderItems instead of products (which doesn't exist on savedOrder)
      const stockUpdatePromises = savedOrder!.orderItems.map(async (item: IOrderItem) => {
        try {
          const product = await Product.findById(item.product).session(session);
          if (!product) {
            throw new Error(`Product ${item.product} not found during stock update.`);
          }

          console.log(`[processCheckoutSteps] Updating stock for product \"${item.name}\", ID: ${item.product}, Size: ${item.size}`);

          let updateApplied = false;

          if (product.subProducts && product.subProducts.length > 0) {
            const subProduct = product.subProducts[0];
            const sizeIndex = subProduct.sizes.findIndex(
              (s: any) => String(s.size).toLowerCase() === String(item.size).toLowerCase()
            );

            if (sizeIndex !== -1) {
              subProduct.sizes[sizeIndex].qty -= item.qty!; // Added non-null assertion
              if (typeof subProduct.sizes[sizeIndex].sold === 'number') {
                subProduct.sizes[sizeIndex].sold += item.qty!; // Added non-null assertion
              } else {
                subProduct.sizes[sizeIndex].sold = item.qty!; // Added non-null assertion
              }
              if (typeof subProduct.sold === 'number') {
                subProduct.sold += item.qty!;
              }
              updateApplied = true;
              console.log(`[processCheckoutSteps] Successfully updated stock. New quantity: ${subProduct.sizes[sizeIndex].qty}`);
            }
          }

          if (!updateApplied) {
            console.error(`[processCheckoutSteps] Failed to find matching size/subProduct to update stock for product ${item.name} (Size: ${item.size})`);
            throw new Error(`Failed to find matching variant to update stock for product ${item.name} (Size: ${item.size})`);
          }

          await product.save({ session });
          return true;
        } catch (err) {
          console.error(`[processCheckoutSteps] Error updating stock:`, err);
          throw err;
        }
      });

      try {
        await Promise.all(stockUpdatePromises);
        console.log("[processCheckoutSteps] Product stock updated successfully for non-COD order.");
      } catch (stockUpdateError: any) {
        console.error("[processCheckoutSteps] Error during bulk stock update for non-COD order:", stockUpdateError);
        await session.abortTransaction();
        return { success: false, message: `Failed to update product stock: ${stockUpdateError.message}`, error: stockUpdateError };
      }
    } else {
      console.log("[processCheckoutSteps] COD order: Stock update deferred until verification.");
    }

    // Handle payment method specific logic
    if (paymentMethod === 'razorpay' && savedOrder) {
      console.log("[processCheckoutSteps] Razorpay payment selected. Order status: Pending Payment. Creating Razorpay order...");
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!
      });
      const rzrOrder = await razorpay.orders.create({
        amount: Math.round(totalPrice * 100), // Amount in paise
        currency: 'INR',
        receipt: savedOrder._id.toString(),
        notes: { order_id: savedOrder._id.toString() }
      });
      console.log("[processCheckoutSteps] Razorpay order created:", rzrOrder.id);
      await session.commitTransaction();
      console.log("[processCheckoutSteps] Transaction committed for Razorpay order.");
      return {
        success: true,
        message: "Order created, proceed to Razorpay payment.",
        orderId: savedOrder._id.toString(),
        razorpayOrderId: rzrOrder.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        amount: rzrOrder.amount, // This is amount in paise
        currency: rzrOrder.currency
      };
    }
    else if (paymentMethod === 'cod' && savedPendingOrder) {
      await session.commitTransaction();
      console.log("[processCheckoutSteps] Transaction committed for pending COD order. Order ID:", savedPendingOrder._id.toString());

      // Send COD verification email
      try {
        if (user.email && plainVerificationCode) {
          await sendCodVerificationEmail(user.email, {
            userName: user.name || 'Customer',
            verificationCode: plainVerificationCode, // Send plain code
            orderId: savedPendingOrder._id.toString(),
            expiresInMinutes: 15, // Should match the expiry set above
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          });
        } else {
          console.error("[processCheckoutSteps] User email or plain COD verification code missing for COD email.");
        }
      } catch (emailError: any) {
        console.error("[processCheckoutSteps] Failed to send COD verification email for order ID:", savedPendingOrder._id.toString(), emailError);
      }

      return {
        success: true,
        message: "COD Order placed. Please verify your email to confirm.",
        orderId: savedPendingOrder._id.toString(),
        requiresCodVerification: true
      };
    } else {
      console.error("[processCheckoutSteps] Order not saved properly");
      await session.abortTransaction();
      return { success: false, message: "Failed to process order" };
    }

  } catch (error: any) {
    console.error("[processCheckoutSteps] An error occurred during transaction:", error);
    if (session.inTransaction()) {
        await session.abortTransaction();
        console.log("[processCheckoutSteps] Transaction aborted due to general error.");
    }
    handleError(error);
    return { success: false, message: `An error occurred during checkout: ${error.message}`, error: error };
  } finally {
      if (session.inTransaction()) {
          console.warn("[processCheckoutSteps] Transaction was still active in finally block. Aborting.");
          try {
              await session.abortTransaction();
          } catch (abortError) {
              console.error("[processCheckoutSteps] Error aborting transaction in finally block:", abortError);
          }
      }
      try {
          await session.endSession();
          console.log("[processCheckoutSteps] Session ended in finally block.");
      } catch (endSessionError: any) {
          if (!endSessionError.message.includes("Cannot leak session")) {
             console.error("[processCheckoutSteps] Error ending session in finally block:", endSessionError);
          }
      }
  }
}

export async function handlePaymentSuccess(orderId: string, paymentResult: any, paymentMethod: 'razorpay' | 'cod') { // Updated paymentMethod type
  await connectToDatabase();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log(`[handlePaymentSuccess] Processing successful payment for Order ID: ${orderId}, Method: ${paymentMethod}`);

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.isPaid) {
      console.log(`[handlePaymentSuccess] Order ${orderId} is already marked as paid.`);
      await session.commitTransaction();
      session.endSession();
      return { success: true, message: "Order already paid." };
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'Processing';
    order.paymentResult = {
        id: paymentResult.id,
        status: paymentResult.status,
        update_time: new Date().toISOString(),
    };

    await order.save({ session });
    console.log(`[handlePaymentSuccess] Order ${orderId} updated to Paid and Processing.`);

    console.log(`[handlePaymentSuccess] Clearing cart for user ${order.user}...`);
    await Cart.deleteOne({ user: order.user }).session(session);
    console.log(`[handlePaymentSuccess] Cart cleared for user ${order.user}.`);

    await session.commitTransaction();
    session.endSession();
    console.log(`[handlePaymentSuccess] Transaction committed for Order ID: ${orderId}`);

    return { success: true, message: "Payment successful, order updated." };

  } catch (error: any) {
    console.error(`[handlePaymentSuccess] Error processing payment for Order ID: ${orderId}`, error);
    await session.abortTransaction();
    session.endSession();
    handleError(error);
    return { success: false, message: `Failed to process payment success: ${error.message}` };
  }
}

export async function getOrderById(orderId: string): Promise<any> {
  try {
    await connectToDatabase();

    const rawOrder = await Order.findById(orderId)
      .populate('user')
      .populate('orderItems.product')
      .lean();

    if (!rawOrder) {
      console.log(`[getOrderById] Order not found: ${orderId}`);
      return null;
    }
    const order = rawOrder;

    // --- Always map order.status to website format ---
    const orderAny = order as any;
    if (orderAny.status) {
      orderAny.status = mapAdminStatusToWebsite(orderAny.status);
    }
    
    // Map status for products array (admin compatibility)
    if (orderAny.products && Array.isArray(orderAny.products)) {
      orderAny.products = orderAny.products.map((item: any) => {
        if (item.status) {
          item.status = mapAdminStatusToWebsite(item.status);
        }
        return item;
      });
    }

    // --- Sync orderItems status with products status ---
    if (orderAny.orderItems && Array.isArray(orderAny.orderItems)) {
      const productStatusMap = new Map();
      
      // Build status map from products array (if it exists)
      if (orderAny.products && Array.isArray(orderAny.products)) {
        orderAny.products.forEach((prod: any) => {
          if (prod.product && prod.status) {
            // Store already mapped (website format) status
            productStatusMap.set(String(prod.product), prod.status);
          }
        });
      }
      
      // Apply status mapping to orderItems
      orderAny.orderItems = orderAny.orderItems.map((item: any) => {
        if (item.product && productStatusMap.has(String(item.product))) {
          // Always sync orderItem status to product status (already in website format)
          item.status = productStatusMap.get(String(item.product));
        } else if (item.status) {
          // Fallback: map orderItem's own status
          item.status = mapAdminStatusToWebsite(item.status);
        }
        return item;
      });
    }

    console.log(`[getOrderById] Order found: ${orderId}`);
    // Return the plain (casted) order object; JSON.parse(JSON.stringify()) is redundant with lean()
    return order; 

  } catch (error) {
    console.error(`[getOrderById] Error fetching order ${orderId}:`, error);
    handleError(error);
    return null;
  }
}

/**
 * Update the status of a product in an order and synchronize the corresponding order item's status.
 * Call this from admin when updating a product's status in an order.
 *
 * @param orderId - The ID of the order
 * @param productId - The ID of the product to update
 * @param newStatus - The new status to set (admin format)
 * @returns The updated order document, or null if not found
 */
export async function updateOrderProductStatusAndSyncOrderItem(orderId: string, productId: string, newStatus: string): Promise<any> {
  await connectToDatabase();
  const order = await Order.findById(orderId);
  if (!order) {
    return null;
  }
  
  let productUpdated = false;
  let orderItemUpdated = false;
  
  // Update product status in products array by subdocument _id
  if (order.products && Array.isArray(order.products)) {
    const productToUpdate = order.products.find((p: IOrderItem) => p._id && p._id.toString() === productId);
    if (productToUpdate) {
      productToUpdate.status = newStatus;
      productUpdated = true;
    }
  }
  
  // Update order item status in orderItems array by subdocument _id
  if (order.orderItems && Array.isArray(order.orderItems)) {
    const itemToUpdate = order.orderItems.find((item: IOrderItem) => item._id && item._id.toString() === productId);
    if (itemToUpdate) {
      itemToUpdate.status = newStatus;
      orderItemUpdated = true;
    }
  }
  
  // The pre-save hook in Order model will ensure both arrays are always in sync
  if (productUpdated || orderItemUpdated) {
    await order.save();
  } else {
    console.warn(`Product/item with ID ${productId} not found in order ${orderId}`);
  }
  
  return order;
}

/**
 * Batch utility: Synchronize all historical orders so that orderItems[].status always matches products[].status.
 * Use this to fix legacy data inconsistencies.
 */
export async function batchSyncOrderItemStatusesWithProducts(): Promise<{ updated: number, total: number }> {
  await connectToDatabase();
  console.log("[batchSyncOrderItemStatusesWithProducts] Starting batch synchronization of order statuses...");
  
  try {
    const orders = await Order.find({});
    console.log(`[batchSyncOrderItemStatusesWithProducts] Found ${orders.length} orders to process`);
    
    let updated = 0;
    let alreadyInSync = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      try {
        // Log progress every 10%
        if (i % Math.max(1, Math.floor(orders.length / 10)) === 0) {
          console.log(`[batchSyncOrderItemStatusesWithProducts] Processing ${i}/${orders.length} orders (${Math.round((i/orders.length)*100)}%)`);
        }
        
        // Skip orders without both arrays
        if (!order.products || !Array.isArray(order.products) || !order.orderItems || !Array.isArray(order.orderItems)) {
          skipped++;
          continue;
        }
        
        // Build a map of productId -> status from products array
        const productStatusMap = new Map();
        for (const prod of order.products) {
          if (prod.product && prod.status) {
            productStatusMap.set(String(prod.product), prod.status);
          }
        }
        
        // Build a map of productId -> status from orderItems array
        const orderItemStatusMap = new Map();
        for (const item of order.orderItems) {
          if (item.product && item.status) {
            orderItemStatusMap.set(String(item.product), item.status);
          }
        }
        
        let changed = false;
        
        // Sync from products to orderItems
        for (const item of order.orderItems) {
          if (item.product && productStatusMap.has(String(item.product))) {
            const prodStatus = productStatusMap.get(String(item.product));
            if (item.status !== prodStatus) {
              console.log(`[batchSyncOrderItemStatusesWithProducts] Updating orderItem status for order ${order._id}, product ${item.product}: ${item.status} -> ${prodStatus}`);
              item.status = prodStatus;
              changed = true;
            }
          }
        }
        
        // Sync from orderItems to products (bidirectional sync)
        for (const prod of order.products) {
          if (prod.product && orderItemStatusMap.has(String(prod.product))) {
            const itemStatus = orderItemStatusMap.get(String(prod.product));
            if (prod.status !== itemStatus) {
              console.log(`[batchSyncOrderItemStatusesWithProducts] Updating product status for order ${order._id}, product ${prod.product}: ${prod.status} -> ${itemStatus}`);
              prod.status = itemStatus;
              changed = true;
            }
          }
        }
        
        if (changed) {
          await order.save();
          updated++;
        } else {
          alreadyInSync++;
        }
      } catch (err) {
        console.error(`[batchSyncOrderItemStatusesWithProducts] Error processing order ${order._id}:`, err);
        errors++;
      }
    }
    
    console.log(`[batchSyncOrderItemStatusesWithProducts] Batch sync complete.
    - Total orders: ${orders.length}
    - Updated: ${updated}
    - Already in sync: ${alreadyInSync}
    - Skipped (missing arrays): ${skipped}
    - Errors: ${errors}`);
    
    return { updated, total: orders.length };
  } catch (err) {
    console.error('[batchSyncOrderItemStatusesWithProducts] Batch operation error:', err);
    throw err;
  }
}

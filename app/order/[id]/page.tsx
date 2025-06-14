import mongoose from "mongoose";
import { Metadata } from "next";
import IdInvalidError from "@/components/shared/IdInvalidError";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { getOrderById } from "@/lib/database/actions/order.actions"; // Assuming this is the correct function name based on previous context
import OrderedProductDetailedView from "@/components/shared/order/OrderProductDeatiledView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Phone, Clock, Truck, XCircle, PackageCheck as PackageCheckIcon, PackageOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // Import next/image

export const metadata: Metadata = {
  title: "Order Page | VibeCart",
  description: "View All of your Order Details.",
};

const OrderPage = async ({ params: paramsPromise }: { params: Promise<{ id: string }> }) => { // Renamed params to paramsPromise
  const params = await paramsPromise; // Await the params promise
  const { id } = params; // Destructure id directly

  // 1. Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error(`[OrderPage] Invalid ObjectId format: ${id}`);
    return <IdInvalidError message="Invalid order ID format." />;
  }

  let order: any = null; // Initialize order as null
  let fetchError: string | null = null;

  // 2. Fetch order data with proper error handling
  try {
    console.log(`[OrderPage] Fetching order details for ID: ${id}`);
    // Assuming getOrderById returns the order object directly or null/throws error
    order = await getOrderById(id);
    if (!order) {
      // Handle case where order is not found but no error was thrown
      console.warn(`[OrderPage] Order not found for ID: ${id}`);
      fetchError = "Order not found.";
    } else {
      console.log(`[OrderPage] Successfully fetched order: ${id}`);
    }
  } catch (err: any) {
    // Handle errors during the fetch operation
    console.error(`[OrderPage] Error fetching order ${id}:`, err);
    fetchError = err.message || "Failed to fetch order details.";
    // Do not use toast here - it's a Server Component
  }

  // 3. Render error component if fetch failed or order not found
  if (fetchError || !order) {
    return <IdInvalidError message={fetchError || "Could not load order details."} />;
  }

  // 4. Proceed with rendering if order data is available

  // Format date for display
  const date = new Date(order.createdAt);
  const formattedDate = date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  // Extract address from order data - use deliveryAddress instead of shippingAddress
  const deliveryAddress = order.deliveryAddress || {};
  // Extract user details (adjust based on actual population in getOrderById)
  const user = order.user || {};

  // Determine which array of items to display
  const itemsToDisplay = (order.orderItems && order.orderItems.length > 0) 
    ? order.orderItems 
    : (order.products && order.products.length > 0) 
      ? order.products 
      : [];

  // Calculate total saved amount correctly
  const couponDiscount = (order.discountAmount || 0);
  // Product discount is the difference between the sum of original prices and sum of selling prices
  const productDiscount = (order.totalOriginalItemsPrice || 0) - (order.itemsPrice || 0);
  const totalSaved = couponDiscount + productDiscount;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-full mx-auto bg-white shadow-md">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-4">
              <Link href="/" className="flex items-center hover:text-primary">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Home</span>
              </Link>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold capitalize">
                THANK YOU, {user.name || 'Customer'} {/* Use populated user name */}
              </h1>              <p className="text-gray-600">
                Order ID: {order._id.toString()}
              </p>
            </div>

            {/* Order Details Section */}
            <div className="mb-6 border rounded-lg overflow-hidden bg-white">
              <div className="flex flex-wrap">
                <div className="w-full sm:w-1/2 md:w-1/5 p-4 border-b sm:border-b-0 sm:border-r">                  <div className="font-semibold text-sm mb-1">
                    ORDER NUMBER:
                  </div>
                  <div>{order._id.toString()}</div>
                </div>
                <div className="w-full sm:w-1/2 md:w-1/4 p-4 border-b md:border-b-0 md:border-r">
                  <div className="font-semibold text-sm mb-1">DATE:</div>
                  <div>{formattedDate}</div>
                </div>
                <div className="w-full sm:w-1/2 md:w-1/4 p-4 sm:border-r">
                  <div className="font-semibold text-sm mb-1">EMAIL:</div>
                  <div className="truncate">
                    {user.email} {/* Use populated user email */}
                  </div>
                </div>
                <div className="w-full sm:w-1/2 md:w-1/4 p-4">
                  <div className="font-semibold text-sm mb-1">TOTAL:</div>
                  <div>₹{order.totalAmount.toFixed(2)}</div> {/* Use totalAmount instead of totalPrice */}
                </div>
              </div>
              <div className="border-t p-4">
                <div className="font-semibold text-sm mb-1">
                  PAYMENT METHOD:
                </div>
                <div>
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery (COD)"
                    : order.paymentMethod === "stripe"
                    ? "Stripe"
                    : order.paymentMethod === "razorpay" // Added Razorpay check
                    ? "Razorpay"
                    : order.paymentMethod}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                {/* Main Order status banner */}
                <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  {(() => {
                    const lowerStatus = order.status?.toLowerCase() || '';
                    
                    if (lowerStatus === 'cancelled') {
                      return (
                        <>
                          <XCircle className="w-[50px] h-[50px] text-red-500 mr-3 flex-shrink-0" />
                          <div>
                            <h2 className="text-xl font-semibold text-red-700">
                              Order Cancelled
                            </h2>
                            <p className="text-gray-600">
                              This order has been cancelled.
                            </p>
                          </div>
                        </>
                      );
                    } else if (lowerStatus === 'delivered' || lowerStatus === 'completed') {
                      return (
                        <>
                          <CheckCircle2 className="w-[50px] h-[50px] text-green-500 mr-3 flex-shrink-0" />
                          <div>
                            <h2 className="text-xl font-semibold text-green-700">
                              Order Delivered
                            </h2>
                            <p className="text-gray-600">
                              Thank you for shopping with us. We hope you enjoyed your purchase.
                            </p>
                          </div>
                        </>
                      );
                    } else if (lowerStatus === 'shipped' || lowerStatus === 'dispatched') {
                      return (
                        <>
                          <Truck className="w-[50px] h-[50px] text-indigo-500 mr-3 flex-shrink-0" />
                          <div>
                            <h2 className="text-xl font-semibold text-indigo-700">
                              Order Shipped
                            </h2>
                            <p className="text-gray-600">
                              Your order is on its way! You can track its progress below.
                            </p>
                          </div>
                        </>
                      );
                    } else if (lowerStatus === 'confirmed') {                      // Check if any products have tracking information (regardless of status except cancelled)
                      const productsWithTracking = (order.products || order.orderItems || [])
                        .filter((item: any) => item.status !== 'Cancelled' && (item.trackingId || item.trackingUrl));
                      
                      if (productsWithTracking.length > 0) {
                        // If all products have tracking, show a tracking-focused banner
                        const allProductsHaveTracking = productsWithTracking.length === (order.products || order.orderItems || []).length;
                        
                        if (allProductsHaveTracking) {
                          return (
                            <>
                              <PackageCheckIcon className="w-[50px] h-[50px] text-blue-500 mr-3 flex-shrink-0" />
                              <div className="flex-1">
                                <h2 className="text-xl font-semibold text-blue-700">
                                  Order Tracking Available
                                </h2>
                                <p className="text-gray-600 mb-2">
                                  Tracking information is available for all items in your order.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                  {productsWithTracking.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-md border border-blue-200">
                                      {item.trackingUrl ? (                                        <a
                                          href={item.trackingUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-between w-full text-blue-600 hover:text-blue-800"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            window.open(item.trackingUrl, '_blank', 'noopener,noreferrer');
                                          }}
                                        >
                                          <div className="flex items-center">
                                            <Truck className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <div className="text-sm">
                                              <div className="font-semibold">Track Package {idx + 1}</div>
                                              <div className="text-xs text-gray-500">{item.trackingId || "Click to track"}</div>
                                            </div>
                                          </div>
                                          <ArrowLeft className="h-4 w-4 transform rotate-180" />
                                        </a>
                                      ) : (
                                        <div className="flex items-center text-gray-700">
                                          <PackageOpen className="h-4 w-4 mr-2" />
                                          <div className="text-sm">
                                            <span className="font-semibold">Tracking ID: </span>
                                            {item.trackingId}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        } else {
                          // Some items have tracking
                          return (
                            <>
                              <div className="flex items-start w-full">
                                <PackageCheckIcon className="w-[50px] h-[50px] text-blue-500 mr-3 flex-shrink-0" />
                                <div className="flex-1">
                                  <h2 className="text-xl font-semibold text-blue-700">
                                    Order with Tracking
                                  </h2>
                                  <p className="text-gray-600 mb-2">
                                    {productsWithTracking.length} of {(order.products || order.orderItems || []).length} items in your order have tracking information.
                                  </p>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                    {productsWithTracking.map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-md border border-blue-200">
                                        {item.trackingUrl ? (                                          <a
                                            href={item.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between w-full text-blue-600 hover:text-blue-800"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              window.open(item.trackingUrl, '_blank', 'noopener,noreferrer');
                                            }}
                                          >
                                            <div className="flex items-center">
                                              <Truck className="h-4 w-4 mr-2 flex-shrink-0" />
                                              <div className="text-sm">
                                                <div className="font-semibold">{item.name || `Track Package ${idx + 1}`}</div>
                                                <div className="text-xs text-gray-500">{item.trackingId || "Click to track"}</div>
                                              </div>
                                            </div>
                                            <ArrowLeft className="h-4 w-4 transform rotate-180" />
                                          </a>
                                        ) : (
                                          <div className="flex items-center text-gray-700">
                                            <PackageOpen className="h-4 w-4 mr-2" />
                                            <div className="text-sm">
                                              <div className="font-medium">{item.name || `Item ${idx + 1}`}</div>
                                              <span className="text-xs">Tracking ID: {item.trackingId}</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        }
                      }
                      
                      // Default confirmed banner if no items have tracking
                      return (
                        <>
                          <PackageCheckIcon className="w-[50px] h-[50px] text-blue-500 mr-3 flex-shrink-0" />
                          <div>
                            <h2 className="text-xl font-semibold text-blue-700">
                              Order Confirmed
                            </h2>
                            <p className="text-gray-600">
                              We&apos;re preparing your package for dispatch. It will be on its way soon.
                            </p>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <Clock className="w-[50px] h-[50px] text-blue-500 mr-3 flex-shrink-0" />
                          <div>
                            <h2 className="text-xl font-semibold text-blue-700">
                              Your order is being processed
                            </h2>
                            <p className="text-gray-600">
                              We&apos;re working on your order and will notify you once it&apos;s confirmed.
                            </p>
                          </div>
                        </>
                      );
                    }
                  })()}
                </div>

                {/* Order Tracking Timeline */}
                <div className="mb-6 bg-white p-4 border rounded-lg">
                  <h3 className="font-medium mb-4">Order Tracking</h3>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gray-200"></div>
                    
                    {/* Timeline steps */}
                    {(() => {
                      const lowerStatus = order.status?.toLowerCase() || '';
                      const steps = [
                        { 
                          label: 'Order Placed', 
                          date: new Date(order.createdAt).toLocaleDateString(),
                          completed: true, 
                          icon: <Clock className="h-5 w-5" />
                        },
                        { 
                          label: 'Confirmed', 
                          date: lowerStatus === 'confirmed' || lowerStatus === 'shipped' || lowerStatus === 'dispatched' || lowerStatus === 'delivered' || lowerStatus === 'completed' ? 'Processing completed' : 'Awaiting confirmation', 
                          completed: lowerStatus === 'confirmed' || lowerStatus === 'shipped' || lowerStatus === 'dispatched' || lowerStatus === 'delivered' || lowerStatus === 'completed', 
                          icon: <PackageCheckIcon className="h-5 w-5" />
                        },
                        { 
                          label: 'Shipped', 
                          date: lowerStatus === 'shipped' || lowerStatus === 'dispatched' || lowerStatus === 'delivered' || lowerStatus === 'completed' ? 'On the way to you' : 'Not dispatched yet', 
                          completed: lowerStatus === 'shipped' || lowerStatus === 'dispatched' || lowerStatus === 'delivered' || lowerStatus === 'completed', 
                          icon: <Truck className="h-5 w-5" /> 
                        },
                        { 
                          label: 'Delivered', 
                          date: lowerStatus === 'delivered' || lowerStatus === 'completed' ? 'Package delivered' : 'Awaiting delivery', 
                          completed: lowerStatus === 'delivered' || lowerStatus === 'completed', 
                          icon: <CheckCircle2 className="h-5 w-5" /> 
                        }
                      ];
                      
                      // If cancelled, show only one step
                      if (lowerStatus === 'cancelled') {
                        return (
                          <div className="flex items-center pl-8 relative mb-4">
                            <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border-2 border-red-500">
                              <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium text-red-700">Order Cancelled</p>
                              <p className="text-sm text-gray-500">Your order has been cancelled</p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Otherwise show all steps
                      return steps.map((step, index) => (
                        <div key={index} className={`flex items-center pl-8 relative mb-4 ${index === steps.length - 1 ? '' : 'pb-4'}`}>
                          <div className={`absolute left-0 flex items-center justify-center w-8 h-8 rounded-full 
                            ${step.completed ? 
                              (step.label === 'Delivered' ? 'bg-green-100 border-2 border-green-500' : 'bg-blue-100 border-2 border-blue-500') : 
                              'bg-gray-100 border-2 border-gray-300'}`}>
                            <div className={step.completed ? 
                              (step.label === 'Delivered' ? 'text-green-500' : 'text-blue-500') : 
                              'text-gray-400'}>
                              {step.icon}
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className={`font-medium ${step.completed ? 
                              (step.label === 'Delivered' ? 'text-green-700' : 'text-blue-700') : 
                              'text-gray-500'}`}>
                              {step.label}
                            </p>
                            <p className="text-sm text-gray-500">{step.date}</p>
                              {/* Show tracking info in the timeline if any products have tracking info */}
                            {(() => {
                              // Find products with tracking information (any status except cancelled)
                              const productsWithTracking = (order.products || order.orderItems || [])
                                .filter((p: any) => p.status !== 'Cancelled' && (p.trackingId || p.trackingUrl));
                              
                              if (productsWithTracking.length > 0 && 
                                  ((step.label === 'Confirmed' && step.completed) || 
                                   (step.label === 'Shipped' && step.completed))) {
                                return (
                                  <div className="mt-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                                    <p className="text-xs font-medium text-blue-700 mb-2 flex items-center">
                                      <Truck className="w-3.5 h-3.5 mr-1.5" />
                                      Tracking Information Available
                                    </p>
                                    <div className="space-y-2.5">
                                      {productsWithTracking.map((p: any, idx: number) => (
                                        <div key={idx} className="text-xs border-b border-blue-100 pb-2 last:border-b-0 last:pb-0">
                                          <div className="font-medium mb-1 text-gray-700">
                                            {p.name || `Product ${idx + 1}`}
                                          </div>
                                          {p.trackingId && (
                                            <div className="mb-1.5">
                                              <span className="font-medium">ID:</span> {p.trackingId}
                                            </div>
                                          )}
                                          {p.trackingUrl && (
                                            <a
                                              href={p.trackingUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline inline-flex items-center px-2 py-1 bg-white rounded border border-blue-200"
                                            >
                                              <Truck className="w-3 h-3 mr-1.5" />
                                              Track Package
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Display delivery address with better formatting */}
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-lg">
                      {deliveryAddress.firstName} {deliveryAddress.lastName}
                    </span>
                    {deliveryAddress.phoneNumber && (
                      <span className="text-gray-700 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {deliveryAddress.phoneNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">{deliveryAddress.address1}</p>
                    {deliveryAddress.address2 && <p className="mb-1">{deliveryAddress.address2}</p>}
                    <p className="mb-1">{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}</p>
                    <p>{deliveryAddress.country}</p>
                  </div>

                  {/* Display address label if available - Assuming label exists */}
                  {/* {deliveryAddress.label && (
                    <div className="mt-3 inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                      {deliveryAddress.label} Address
                      {deliveryAddress.isDefault && " (Default)"}
                    </div>
                  )} */}
                </div>

                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <span className="font-medium">
                      {itemsToDisplay.length > 1
                        ? `${itemsToDisplay.length} Items`
                        : `${itemsToDisplay.length} Item`}
                    </span>
                    <span className="font-medium">
                      ₹ {order.itemsPrice ? order.itemsPrice.toFixed(2) : order.totalAmount.toFixed(2)} {/* Handle both itemsPrice and totalAmount */}
                    </span>
                  </div>
                  <div className="space-y-6">
                    {itemsToDisplay.map(
                      (item: any, index: number) => (
                        <div key={item._id || index} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-start mb-3">
                            <Image // Changed from img to Image
                              // Use first image if available, provide fallback
                              src={item.product?.images?.[0] || item.image || '/placeholder.png'}
                              alt={item.name || "Product image"} // Added fallback for alt
                              width={80} // Add width
                              height={80} // Add height
                              className="mr-4 object-cover rounded" // Removed w-[80px] h-[80px] as width/height props handle this
                            />
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <div className="flex flex-wrap text-sm text-gray-600 mt-1">
                                {item.size && <span className="mr-3">Size: {item.size}</span>}
                                <span>Qty: {item.qty}</span>
                              </div>                              <div className="mt-1">
                                <span className="font-medium">
                                  ₹{item.price.toFixed(2)} × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}
                                </span>
                              </div>
                              
                              {/* Track information is now only shown in OrderProductDetailedView */}
                            </div>
                          </div>
                          {/* Pass item.product._id if available and needed by OrderedProductDetailedView */}
                          <OrderedProductDetailedView item={item} orderId={order._id} />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                {totalSaved > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-green-700">
                        Yay! You have saved ₹{totalSaved.toFixed(2)} on this order.
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-gray-100 rounded-lg p-5">
                  <h2 className="text-lg font-semibold mb-4 border-b pb-2">Bill Details</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total MRP</span>
                      {/* Display Total MRP directly from totalOriginalItemsPrice */}
                      <span>₹{(order.totalOriginalItemsPrice || 0).toFixed(2)}</span>
                    </div>
                    {productDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Product Discount</span>
                        <span>- ₹{productDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Coupon Discount {order.couponApplied ? `(${order.couponApplied})` : ''}
                        </span>
                        <span>- ₹{couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                     <div className="flex justify-between">
                      <span>Shipping Fee</span>
                      {/* Display Shipping Fee */}
                      <span>{order.shippingPrice > 0 ? `₹${order.shippingPrice.toFixed(2)}` : 'Free'}</span>
                    </div>
                     {order.taxPrice > 0 && (
                       <div className="flex justify-between">
                         <span>Tax</span>
                         {/* Display Tax */}
                         <span>₹{order.taxPrice.toFixed(2)}</span>
                       </div>
                     )}

                    <div className="flex justify-between font-semibold pt-2 mt-2 border-t border-t-gray-300">
                      <span>Total Amount</span> {/* Changed from Subtotal */}
                      <span>₹{order.totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between pt-2 mt-2 border-t border-t-gray-300">
                      <span className="text-gray-500">Payment Status</span>
                      <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                        {order.isPaid ? "Paid" : (order.status === 'cancelled' ? 'Cancelled' : 'Pending')}
                      </span>
                    </div>                     <div className="flex justify-between pt-2 mt-2 border-t border-t-gray-300">
                      <span className="text-gray-500">Order Status</span>
                      <div className="flex items-center">
                        {(() => {
                          const lowerStatus = order.status?.toLowerCase() || '';
                          let icon = <Clock className="h-4 w-4 mr-1" />;
                          
                          if (lowerStatus === 'processing') icon = <Clock className="h-4 w-4 mr-1 text-blue-500" />;
                          else if (lowerStatus === 'confirmed') icon = <PackageCheckIcon className="h-4 w-4 mr-1 text-cyan-600" />;
                          else if (lowerStatus === 'shipped' || lowerStatus === 'dispatched') icon = <Truck className="h-4 w-4 mr-1 text-indigo-500" />;
                          else if (lowerStatus === 'delivered' || lowerStatus === 'completed') icon = <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />;
                          else if (lowerStatus === 'cancelled') icon = <XCircle className="h-4 w-4 mr-1 text-red-500" />;
                          
                          return (
                            <div className="flex items-center">
                              {icon}
                              <span className={`font-medium px-2 py-1 rounded-md text-sm ${
                                lowerStatus === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                lowerStatus === 'confirmed' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                                (lowerStatus === 'shipped' || lowerStatus === 'dispatched') ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                (lowerStatus === 'delivered' || lowerStatus === 'completed') ? 'bg-green-100 text-green-800 border border-green-200' :
                                lowerStatus === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-amber-100 text-amber-800 border border-amber-200' // Default for 'pending' or other unhandled statuses
                              }`}>
                                {lowerStatus === 'pending' ? 'Not Processed' :
                                lowerStatus === 'processing' ? 'Processing' :
                                lowerStatus === 'confirmed' ? 'Confirmed' :
                                (lowerStatus === 'shipped' || lowerStatus === 'dispatched') ? 'Dispatched' :
                                (lowerStatus === 'delivered' || lowerStatus === 'completed') ? 'Completed' :
                                lowerStatus === 'cancelled' ? 'Cancelled' :
                                order.status || 'Processing'} {/* Fallback to original status or 'Processing' */}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>                <div className="flex flex-col mt-6 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={"/"} className="col-span-1">
                      <Button className="w-full">CONTINUE SHOPPING</Button>
                    </Link>
                    <Link href={"/orders"} className="col-span-1">
                      <Button variant="outline" className="w-full">MY ORDERS</Button>
                    </Link>
                  </div>
                  
                  {/* Track Order button - only show for active orders */}
                  {(!order.status || (
                    order.status.toLowerCase() !== 'cancelled' && 
                    order.status.toLowerCase() !== 'delivered' && 
                    order.status.toLowerCase() !== 'completed'
                  )) && (
                    <Link href={`/track-order?id=${order._id}`}>
                      <Button className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center">
                        <Truck className="mr-2 h-5 w-5" />
                        TRACK ORDER
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;

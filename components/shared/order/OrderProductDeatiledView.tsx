"use client";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  PackageCheckIcon, // Added for Confirmed status
  StoreIcon, // Added for vendor information
  StarIcon, // Added for reviews
} from "lucide-react";
import React, { useState } from "react";
import { FaChevronCircleDown, FaChevronCircleUp } from "react-icons/fa";
import { toast } from "sonner";
// Corrected import: Use the client-safe utility
import { mapAdminStatusToWebsite } from "@/lib/order-status-utils";
// Import our new review component
import OrderItemReview from "./OrderItemReview";

type Props = {
  item: any;
  orderId: string;
};

const OrderedProductDetailedView = ({ item, orderId }: Props) => {
  const [open, setOpen] = useState(false);  
  const [status, setStatus] = useState(() => {
    // Handle both admin and website status formats
    if (item.status) {
      // Check if the status is in admin format and convert if needed
      if (['Not Processed', 'Processing', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled', 'Completed'].includes(item.status)) { // Added 'Confirmed'
        return mapAdminStatusToWebsite(item.status);
      }
      return item.status;
    }
    return "pending";
  });
  
  // State for cancel request modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update steps array to include visual treatment for cancelled items and Confirmed step
  const steps = [
    {
      name: "Not Processed",
      icon: <XCircleIcon className={`h-6 w-6 ${status === "cancelled" ? "text-gray-300" : "text-red-500"}`} />,
    },
    {
      name: "Processing",
      icon: <ClockIcon className={`h-6 w-6 ${status === "cancelled" ? "text-gray-300" : "text-blue-400"}`} />,
    },
    { // Added Confirmed step
      name: "Confirmed",
      icon: <PackageCheckIcon className={`h-6 w-6 ${status === "cancelled" ? "text-gray-300" : "text-cyan-500"}`} />,
    },
    {
      name: "Dispatched",
      icon: <TruckIcon className={`h-6 w-6 ${status === "cancelled" ? "text-gray-300" : "text-indigo-500"}`} />,
    },
    {
      name: "Cancelled",
      icon: <XCircleIcon className="h-6 w-6 text-red-500" />,
    },
    {
      name: "Completed", // This usually means delivered for a single item
      icon: <CheckCircleIcon className={`h-6 w-6 ${status === "cancelled" ? "text-gray-300" : "text-green-500"}`} />,
    },
  ];

  // Status mapping between website and admin formats for UI display
  const statusDisplayMap: { [key: string]: string } = {
    "pending": "Not Processed",
    "processing": "Processing",
    "confirmed": "Confirmed", // Added mapping for 'confirmed'
    "shipped": "Dispatched", 
    "delivered": "Completed", // Assuming 'delivered' on website maps to 'Completed' display
    "cancelled": "Cancelled",
    "refunded": "Processing Refund", // Though not in steps, good to have
    "completed": "Completed", // Admin's 'Completed'
  };

  // Helper function to convert website status format to match status display names
  const getEquivalentStatus = (status: string): string => {
    const mapping: { [key: string]: string } = {
      "pending": "not processed",
      "processing": "processing",
      "confirmed": "confirmed",
      "shipped": "dispatched",
      "delivered": "completed",
      "cancelled": "cancelled",
      "refunded": "processing", // Maps to processing for refund workflow
      "completed": "completed",
    };
    
    return mapping[status.toLowerCase()] || status.toLowerCase();
  };

  // Check if the item can be reviewed (delivered/completed and not already reviewed)
  const canReview = (status === "delivered" || status === "completed") && !item.reviewed;
  
  // Modified step index logic to handle cancelled state and website status format
  const currentStepIndex = status === "cancelled" 
    ? steps.findIndex(step => step.name === "Cancelled")
    : steps.findIndex(step => step.name.toLowerCase() === status.toLowerCase() || step.name === statusDisplayMap[status]);
  // Direct cancellation for products that are not confirmed yet
  const handleCancelProduct = async () => {
    if (!orderId || !item._id) {
      toast.error("Missing order or product information");
      return;
    }

    if (window.confirm("Are you sure you want to cancel this product?")) {
      try {
        const response = await fetch("/api/user/order/product/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderId,
            productId: item._id
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || "Failed to cancel product");
        }

        if (result.success) {
          setStatus("cancelled");
          toast.success(result.message || "Product cancelled successfully!");
        } else {
          throw new Error(result.message || "Failed to cancel product");
        }
      } catch (error: any) {
        console.error("Error cancelling product:", error);
        toast.error(error.message || "Failed to cancel product");
      }
    }
  };
  
  // For confirmed or shipped items, we send a cancellation request to admin
  const handleCancellationRequest = async () => {
    if (!orderId || !item._id) {
      toast.error("Missing order or product information");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/user/order/product/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          productId: item._id,
          reason: cancelReason || "Customer requested cancellation"
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to submit cancellation request");
      }

      if (result.success) {
        // Update the UI to show request is pending
        item.cancelRequested = true;
        setShowCancelModal(false);
        setCancelReason("");
        toast.success(result.message || "Cancellation request submitted successfully!");
      } else {
        throw new Error(result.message || "Failed to submit cancellation request");
      }
    } catch (error: any) {
      console.error("Error submitting cancellation request:", error);
      toast.error(error.message || "Failed to submit cancellation request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {open ? (
            <>
              <FaChevronCircleUp className="mr-1 h-4 w-4" />
              Hide Details
            </>
          ) : (
            <>
              <FaChevronCircleDown className="mr-1 h-4 w-4" />
              View Details
            </>
          )}
        </button>
        
        <div className="flex space-x-2">
          {/* Review button for delivered/completed products that haven't been reviewed yet */}
          {canReview && (
            <OrderItemReview
              productId={item.product?._id || item.productId || item._id}
              productName={item.name}
              productImage={item.image}
              orderId={orderId}
              orderItemId={item._id}
            />
          )}
          
          {/* "Reviewed" badge if product has been reviewed */}
          {(status === "delivered" || status === "completed") && item.reviewed && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <StarIcon className="h-3 w-3 mr-1" /> Reviewed
            </span>
          )}
          
          {/* Cancel button for products that are not yet confirmed or shipped */}
          {status !== "cancelled" && status !== "delivered" && status !== "completed" && status !== "shipped" && status !== "dispatched" && status !== "confirmed" && (
            <Button
              onClick={handleCancelProduct}
              variant="destructive"
              size="sm"
              className="text-xs"
            >
              Cancel Item
            </Button>
          )}
          
          {/* Request cancellation button for confirmed/shipped products */}
          {status !== "cancelled" && status !== "delivered" && status !== "completed" && 
           (status === "confirmed" || status === "shipped" || status === "dispatched") && 
           !item.cancelRequested && (
            <Button
              onClick={() => setShowCancelModal(true)}
              variant="outline"
              size="sm"
              className="text-xs border-red-200 text-red-600 hover:bg-red-50"
            >
              Request Cancel
            </Button>
          )}
          
          {/* Show "pending" badge if cancellation was already requested */}
          {item.cancelRequested && (
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-200">
              Cancellation Requested
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Status timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute top-0 left-3 h-full w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`relative flex items-start ${
                    (step.name === "Cancelled" && status !== "cancelled") ||
                    (step.name !== "Cancelled" && status === "cancelled" && index > 0)
                      ? "opacity-30"
                      : ""
                  }`}
                >
                  <div className="flex-shrink-0 h-6 w-6 z-10">{step.icon}</div>
                  <div className="ml-4">
                    <p className="font-medium">{step.name}</p>
                    {/* Display timestamp if status matches this step */}
                    {(getEquivalentStatus(status) === step.name.toLowerCase() ||
                      (status === "cancelled" && step.name === "Cancelled")) && (
                      <p className="text-sm text-gray-500">
                        {status === "cancelled"
                          ? item.cancelledAt
                            ? new Date(item.cancelledAt).toLocaleString()
                            : "Processing..."
                          : step.name === "Completed" && item.deliveredAt
                          ? new Date(item.deliveredAt).toLocaleString()
                          : "Processing..."}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Information - Enhanced */}
          {item.vendor && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-center mb-2">
                <StoreIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h5 className="font-medium text-gray-700">Vendor Information</h5>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-md border border-gray-200">
                  <span className="text-sm text-gray-700 mr-2 font-medium">Name:</span> 
                  <span className="text-sm font-semibold">
                    {typeof item.vendor === 'object' 
                      ? (item.vendor.businessName || item.vendor.name || 'Unknown Vendor')
                      : (typeof item.vendor === 'string' ? item.vendor : 'Unknown Vendor')}
                  </span>
                </div>
                
                {typeof item.vendor === 'object' && (
                  <>
                    {item.vendor.email && (
                      <div className="bg-white p-2 rounded-md border border-gray-200">
                        <span className="text-sm text-gray-700 mr-2 font-medium">Email:</span> 
                        <span className="text-sm font-semibold">{item.vendor.email}</span>
                      </div>
                    )}
                    
                    {(item.vendor.phoneNumber || item.vendor.phone) && (
                      <div className="bg-white p-2 rounded-md border border-gray-200">
                        <span className="text-sm text-gray-700 mr-2 font-medium">Phone:</span> 
                        <span className="text-sm font-semibold">{item.vendor.phoneNumber || item.vendor.phone}</span>
                      </div>
                    )}
                    
                    {item.vendor.address && (
                      <div className="bg-white p-2 rounded-md border border-gray-200 md:col-span-2">
                        <span className="text-sm text-gray-700 mr-2 font-medium">Address:</span> 
                        <span className="text-sm font-semibold">{item.vendor.address}</span>
                      </div>
                    )}
                    
                    {item.vendor.storeName && (
                      <div className="bg-white p-2 rounded-md border border-gray-200">
                        <span className="text-sm text-gray-700 mr-2 font-medium">Store:</span> 
                        <span className="text-sm font-semibold">{item.vendor.storeName}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Always display tracking information if available (except cancelled orders) */}
          {(item.trackingUrl || item.trackingId) && status !== "cancelled" && (
            <div className="mt-3 rounded-md bg-blue-50 border border-blue-100 p-3">
              <div className="flex items-center mb-2">
                <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h5 className="font-medium text-blue-700">Tracking Information</h5>
              </div>
              
              {item.trackingId && (
                <div className="flex items-center mb-2 bg-white p-2 rounded-md border border-blue-200">
                  <span className="text-sm text-gray-700 mr-2 font-medium">Tracking ID:</span> 
                  <span className="text-sm font-semibold">{item.trackingId}</span>
                </div>
              )}            {item.trackingUrl && (
                <div className="mb-1">
                  <a 
                    href={item.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-md px-3 py-1.5 w-full"
                  >
                    <TruckIcon className="h-4 w-4 mr-2" /> Track Your Package
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.trackingUrl.length > 50 ? `${item.trackingUrl.substring(0, 50)}...` : item.trackingUrl}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Cancellation reason if cancelled */}
          {status === "cancelled" && item.cancelReason && (
            <div className="p-3 rounded-md bg-red-50 border border-red-100">
              <p className="text-sm text-red-700 font-medium mb-1">Cancellation Reason</p>
              <p className="text-sm text-gray-700">
                {item.cancelReason}
              </p>
            </div>
          )}
          
          {/* Review information if already reviewed */}
          {item.reviewed && item.reviewId && (
            <div className="p-3 rounded-md bg-green-50 border border-green-100">
              <div className="flex items-center mb-2">
                <StarIcon className="h-5 w-5 text-green-600 mr-2" />
                <h5 className="font-medium text-green-700">Your Review</h5>
              </div>
              <div className="bg-white p-2 rounded-md border border-green-200">
                <div className="flex items-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-4 w-4 ${
                        (item.reviewRating || 0) >= star
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {new Date(item.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                {item.reviewComment && (
                  <p className="text-sm text-gray-700 mt-1">
                    "{item.reviewComment}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Cancellation Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Request Cancellation</h3>
            <p className="text-gray-600 text-sm mb-4">
              This item is already confirmed for processing or shipping. Please provide a reason for cancellation and we'll review your request.
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Reason for cancellation:
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you want to cancel this item..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancellationRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderedProductDetailedView;

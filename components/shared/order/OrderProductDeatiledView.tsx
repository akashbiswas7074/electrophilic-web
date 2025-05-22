"use client";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  PackageCheckIcon, // Added for Confirmed status
} from "lucide-react";
import React, { useState } from "react";
import { FaChevronCircleDown, FaChevronCircleUp } from "react-icons/fa";
import { toast } from "sonner";
// Corrected import: Use the client-safe utility
import { mapAdminStatusToWebsite } from "@/lib/order-status-utils";

type Props = {
  item: any;
  orderId: string;
};

const OrderedProductDetailedView = ({ item, orderId }: Props) => {
  const [open, setOpen] = useState(false);  const [status, setStatus] = useState(() => {
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
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              {/* Active step */}
              {i === currentStepIndex && (
                <div className="flex items-center">
                  {step.icon}
                  <span className="ml-1 text-sm font-medium">
                    {statusDisplayMap[status] || step.name}
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>        <div className="flex items-center space-x-3">
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
          
          <button
            onClick={() => setOpen(!open)}
            className="focus:outline-none"
          >
            {open ? (
              <FaChevronCircleUp className="text-gray-500" />
            ) : (
              <FaChevronCircleDown className="text-gray-500" />
            )}
          </button>
        </div>      </div>
      
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

      {open && (
        <div className="mt-4 border p-3 rounded-md bg-gray-50">
          <h4 className="font-medium mb-2">Order Progress Timeline</h4>
          <div className="space-y-3">
            {steps.map((step, i) => {
              // For cancelled orders, only show the cancelled step as active
              const isActive = status === "cancelled" 
                ? step.name === "Cancelled"
                : i <= currentStepIndex;
              
              // Skip the cancelled step if the order isn\'t cancelled
              if (status !== "cancelled" && step.name === "Cancelled") {
                return null;
              }
              // Skip "Completed" step if current status is "delivered" (as "delivered" is the final step for user)
              // Or more generally, skip steps that are beyond the current active step unless it\'s cancelled
              // if (status !== "cancelled" && i > currentStepIndex) { // Commented out to show future steps as inactive
              //    return null; 
              // }
              
              return (
                <div 
                  key={i} 
                  className={`flex items-center space-x-3 ${
                    isActive ? "text-black" : "text-gray-400"
                  }`}
                >
                  <div className="flex-shrink-0">{step.icon}</div>
                  <span className="text-sm">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default OrderedProductDetailedView;

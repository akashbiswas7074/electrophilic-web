"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ReviewSummary from "./ReviewSummary";
import ReviewList from "./ReviewList";
import OrderItemReview from "../order/OrderItemReview";
import { calculateReviewStatistics, canUserReviewProduct } from "@/lib/review-utils";

interface ProductReviewsProps {
  productId: string;
  productName: string;
  productImage: string;
  reviews: Array<{
    _id: string;
    rating: number;
    comment: string;
    user: string;
    name: string;
    createdAt: string;
    userImage?: string;
    verified?: boolean;
  }>;
  userOrderItems?: any[]; // Order items belonging to the current user
}

const ProductReviews = ({ 
  productId, 
  productName, 
  productImage, 
  reviews,
  userOrderItems = []
}: ProductReviewsProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  // Calculate review statistics
  const { averageRating, totalReviews, breakdown } = calculateReviewStatistics(reviews);
  
  // Check if user can review this product
  const { canReview, orderItem } = canUserReviewProduct(userOrderItems, productId);

  // Reviews to display (limit to 3 initially)
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  
  return (
    <div className="mt-12 space-y-8">
      <h2 className="text-2xl font-bold">Customer Reviews</h2>
      
      {/* Review Summary */}
      <ReviewSummary 
        rating={averageRating} 
        totalReviews={totalReviews} 
        breakdown={breakdown} 
      />
      
      {/* Write a Review Button */}
      <div>
        {session ? (
          canReview ? (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex-grow">
                <h3 className="font-medium text-blue-800">You purchased this product!</h3>
                <p className="text-sm text-blue-600">Share your experience with other customers</p>
              </div>
              <OrderItemReview
                productId={productId}
                productName={productName}
                productImage={productImage}
                orderId={orderItem?.orderId || orderItem?._id?.toString()}
                orderItemId={orderItem?._id?.toString()}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              {reviews.some(r => r.user === session.user?.id) 
                ? "You've already reviewed this product" 
                : "You can review this product after purchasing and receiving it"}
            </p>
          )
        ) : (
          <Button onClick={() => router.push("/auth/signin")} variant="outline">
            Sign in to write a review
          </Button>
        )}
      </div>
      
      {/* Reviews List */}
      <div className="mt-8">
        <ReviewList reviews={displayedReviews} productName={productName} />
        
        {/* Show More Button */}
        {!showAllReviews && reviews.length > 3 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => setShowAllReviews(true)}
            >
              Show All {reviews.length} Reviews
            </Button>
          </div>
        )}
        
        {/* No Reviews Message */}
        {reviews.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No reviews yet for this product.</p>
            <p className="text-gray-500 mt-2">Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
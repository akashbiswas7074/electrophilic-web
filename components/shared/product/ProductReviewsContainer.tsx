"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductReviews from "@/components/shared/product/ProductReviews";

interface ProductReviewsContainerProps {
  productId: string;
  productName: string;
  productImage: string;
}

export default function ProductReviewsContainer({ 
  productId, 
  productName, 
  productImage 
}: ProductReviewsContainerProps) {
  const [reviews, setReviews] = useState([]);
  const [userOrderItems, setUserOrderItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasReviews, setHasReviews] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch product reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/products/${productId}/reviews`);
        const data = await response.json();
        
        if (data.success) {
          const reviewsData = data.reviews || [];
          setReviews(reviewsData);
          // Set hasReviews flag based on whether there are any reviews
          setHasReviews(reviewsData.length > 0);
        } else {
          setError(data.message || "Failed to load reviews");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching reviews");
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  // Fetch user's order items for this product (if logged in)
  useEffect(() => {
    async function fetchUserOrderItems() {
      if (!session?.user) return;
      
      try {
        const response = await fetch(`/api/products/${productId}/user-order-items`);
        const data = await response.json();
        
        if (data.success) {
          setUserOrderItems(data.userOrderItems || []);
        }
      } catch (err) {
        console.error("Error fetching user order items:", err);
      }
    }

    if (productId && session?.user) {
      fetchUserOrderItems();
    }
  }, [productId, session]);

  // If there are no reviews and we've finished loading, don't render anything
  if (!isLoading && !hasReviews) {
    return null;
  }

  // While loading, show a placeholder
  if (isLoading) {
    return (
      <div className="border-t border-gray-200 py-8 mt-8">
        <div className="w-[90%] mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error, don't show anything
  if (error) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 py-8 mt-8">
      <div className="w-[90%] mx-auto px-4 sm:px-6">
        <ProductReviews
          productId={productId}
          productName={productName}
          productImage={productImage}
          reviews={reviews}
          userOrderItems={userOrderItems}
        />
      </div>
    </div>
  );
}
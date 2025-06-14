import React from 'react';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AllReviewsModal from './AllReviewsModal';

interface ReviewListProps {
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
  productName: string;
}

const ReviewList = ({ reviews, productName }: ReviewListProps) => {
  // Sort reviews to show newest first
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet for this product.</p>
      </div>
    );
  }

  // Only show the first 3 reviews initially
  const displayedReviews = sortedReviews.slice(0, 3);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{reviews.length} Reviews for {productName}</h3>
      
      {displayedReviews.map((review) => (
        <div key={review._id} className="border-b pb-5 last:border-0">
          <div className="flex items-start">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={review.userImage || ""} alt={review.name} />
              <AvatarFallback>
                {review.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium">{review.name}</span>
                {review.verified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    Verified Purchase
                  </Badge>
                )}
                <span className="text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex my-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              
              <p className="mt-1 text-gray-700">{review.comment}</p>
            </div>
          </div>
        </div>
      ))}
      
      {/* Add View All Reviews button if there are more than 3 reviews */}
      {reviews.length > 3 && (
        <AllReviewsModal productName={productName} reviews={reviews} />
      )}
    </div>
  );
};

export default ReviewList;
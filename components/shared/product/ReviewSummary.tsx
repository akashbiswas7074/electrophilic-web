import React from 'react';
import { Star } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface ReviewBreakdown {
  stars: number;
  percentage: number;
}

interface ReviewSummaryProps {
  rating: number;
  totalReviews: number;
  breakdown: ReviewBreakdown[];
}

const ReviewSummary = ({ rating, totalReviews, breakdown }: ReviewSummaryProps) => {
  // If there are no reviews, don't render anything
  if (totalReviews === 0) {
    return null;
  }
  
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
        {/* Overall Rating */}
        <div className="text-center md:text-left mb-6 md:mb-0 flex-shrink-0">
          <h3 className="text-xl font-semibold mb-1">Overall Rating</h3>
          <div className="flex items-center justify-center md:justify-start mb-2">
            <span className="text-3xl font-bold mr-2">{rating.toFixed(1)}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500">{totalReviews} reviews</p>
        </div>

        {/* Rating Breakdown */}
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-3">Rating Breakdown</h3>
          <div className="space-y-3">
            {breakdown.map((item) => (
              <div key={item.stars} className="flex items-center">
                <div className="w-24 flex items-center">
                  <span className="text-sm mr-1">{item.stars}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 mx-2">
                  <Progress value={item.percentage} className="h-2" />
                </div>
                <div className="w-14 text-right">
                  <span className="text-sm text-gray-500">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
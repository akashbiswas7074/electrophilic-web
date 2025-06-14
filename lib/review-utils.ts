/**
 * Helper functions for working with product reviews
 */

interface Review {
  rating: number;
  [key: string]: any;
}

interface ReviewBreakdown {
  stars: number;
  percentage: number;
}

/**
 * Calculate review statistics including average rating and star breakdown
 * @param reviews Array of review objects with rating property
 * @returns Object containing average rating, review count, and star breakdown
 */
export function calculateReviewStatistics(reviews: Review[]) {
  // If there are no reviews, return default values
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      breakdown: [5, 4, 3, 2, 1].map(stars => ({
        stars,
        percentage: 0
      }))
    };
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Count reviews for each star rating
  const ratingCount: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) {
    ratingCount[i] = 0;
  }

  reviews.forEach(review => {
    ratingCount[review.rating] = (ratingCount[review.rating] || 0) + 1;
  });

  // Calculate percentage for each star rating
  const breakdown: ReviewBreakdown[] = [];
  for (let i = 5; i >= 1; i--) {
    const count = ratingCount[i] || 0;
    const percentage = reviews.length > 0 
      ? Math.round((count / reviews.length) * 100) 
      : 0;
    
    breakdown.push({
      stars: i,
      percentage
    });
  }

  return {
    averageRating,
    totalReviews: reviews.length,
    breakdown
  };
}

/**
 * Format rating to be displayed with 1 decimal place
 * @param rating Rating number
 * @returns Formatted rating string
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Check if a user can review a product
 * @param orderItems Array of order items
 * @param productId ID of the product to check
 * @returns Object with canReview flag and order item if found
 */
export function canUserReviewProduct(orderItems: any[], productId: string) {
  if (!orderItems || !productId) {
    return { canReview: false, orderItem: null };
  }

  const orderItem = orderItems.find(item => {
    const itemProductId = item.product?._id || item.productId || item.product;
    return (
      // Check if this is the product we're looking for
      (itemProductId && itemProductId.toString() === productId) &&
      // Check if the item has been delivered/completed
      (item.status === 'delivered' || item.status === 'completed' || 
       item.status === 'Delivered' || item.status === 'Completed') &&
      // Check if it hasn't been reviewed yet
      !item.reviewed
    );
  });

  return {
    canReview: !!orderItem,
    orderItem
  };
}

// Export all functions
const reviewUtils = {
  calculateReviewStatistics,
  formatRating,
  canUserReviewProduct
};

export default reviewUtils;
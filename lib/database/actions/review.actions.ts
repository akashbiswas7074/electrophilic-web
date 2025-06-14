import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";

export async function getTopProductReviews(limit = 5) {
  try {
    await connectToDatabase();
    
    console.log("Connected to database, fetching verified reviews...");
    
    // Aggregate to find products with reviews, unwind the reviews array,
    // and sort by rating (highest first) and date (newest first)
    const topReviews = await Product.aggregate([
      // Only include products with reviews array that has at least one element
      { $match: { "reviews.0": { $exists: true } } },
      
      // Unwind to work with individual reviews
      { $unwind: "$reviews" },
      
      // Focus primarily on verified reviews
      { $match: { "reviews.verified": true } },
      
      // Look up user details for each review
      {
        $lookup: {
          from: "users",
          localField: "reviews.reviewBy",
          foreignField: "_id",
          as: "reviewUser"
        }
      },
      
      // Project only the fields we need with simplified structure
      {
        $project: {
          productId: "$_id",
          productName: "$name",
          productSlug: "$slug",
          productDescription: { $substr: ["$description", 0, 100] },
          
          // Extract product image with fallbacks
          productImage: {
            $let: {
              vars: {
                firstSubProduct: { $arrayElemAt: ["$subProducts", 0] }
              },
              in: {
                $cond: {
                  if: { $and: [
                    { $isArray: "$subProducts" },
                    { $gt: [{ $size: "$subProducts" }, 0] },
                    { $isArray: "$$firstSubProduct.images" },
                    { $gt: [{ $size: "$$firstSubProduct.images" }, 0] }
                  ]},
                  then: {
                    $let: {
                      vars: {
                        firstImage: { $arrayElemAt: ["$$firstSubProduct.images", 0] }
                      },
                      in: {
                        $cond: {
                          if: { $eq: [{ $type: "$$firstImage" }, "string"] },
                          then: "$$firstImage",
                          else: { $ifNull: ["$$firstImage.url", "/images/placeholder-product.png"] }
                        }
                      }
                    }
                  },
                  else: "/images/placeholder-product.png"
                }
              }
            }
          },
          
          // Extract review details
          review: {
            _id: "$reviews._id",
            rating: "$reviews.rating",
            comment: "$reviews.review",
            date: "$reviews.reviewCreatedAt",
            verified: "$reviews.verified", // Explicitly include verified status
            userName: { $ifNull: [{ $arrayElemAt: ["$reviewUser.firstName", 0] }, "Anonymous"] },
            userLastName: { $ifNull: [{ $arrayElemAt: ["$reviewUser.lastName", 0] }, ""] },
            userImage: { $ifNull: [{ $arrayElemAt: ["$reviewUser.image", 0] }, "/images/default-avatar.png"] }
          }
        }
      },
      
      // Sort by rating (highest first) and date (newest first)
      { $sort: { "review.rating": -1, "review.date": -1 } },
      
      // Limit to the requested number of reviews
      { $limit: limit }
    ]);
    
    console.log(`Found ${topReviews.length} verified reviews`);
    
    if (topReviews.length > 0) {
      console.log("Sample review:", {
        productName: topReviews[0].productName,
        reviewId: topReviews[0].review._id,
        rating: topReviews[0].review.rating,
        verified: topReviews[0].review.verified,
        userName: topReviews[0].review.userName
      });
    } else {
      console.log("No verified reviews found");
    }
    
    return JSON.parse(JSON.stringify(topReviews));
  } catch (error) {
    console.error("Error fetching top product reviews:", error);
    return [];
  }
}
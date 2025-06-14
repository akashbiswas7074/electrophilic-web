import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";
import User from "@/lib/database/models/user.model";
import Order from "@/lib/database/models/order.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const clerkId = session.user.id;
    const { id } = await params;
    const productId = id;
    const { rating, comment, orderId, orderItemId } = await req.json();

    // Validate inputs
    if (!rating || !comment) {
      return NextResponse.json(
        { success: false, message: "Rating and comment are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user by clerkId
    let user = await User.findOne({ clerkId });
    
    // If user not found by clerkId, try looking up by email
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }
    
    // If still no user found, create a new user record
    if (!user && session.user.email) {
      user = await User.create({
        clerkId: clerkId,
        email: session.user.email,
        firstName: session.user.name?.split(' ')[0] || 'User',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        image: session.user.image || '',
      });
      
      console.log("Created new user record for review:", user._id);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Could not find or create user account" },
        { status: 404 }
      );
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // If orderId is provided, verify the order belongs to this user
    // and that the product is part of the order
    let verifiedPurchase = false;
    let order = null;
    let orderItem = null;

    if (orderId) {
      order = await Order.findOne({
        _id: orderId,
        user: user._id
      });

      if (order) {
        // Find the ordered item either by orderItemId or productId
        orderItem = order.orderItems?.find(
          (item: any) => 
            (orderItemId && item._id.toString() === orderItemId) ||
            (item.product && item.product._id && item.product._id.toString() === productId) ||
            (item.productId && item.productId.toString() === productId)
        );

        if (orderItem) {
          // Verify the item has been delivered
          const itemStatus = orderItem.status?.toLowerCase();
          if (itemStatus === "delivered" || itemStatus === "completed") {
            verifiedPurchase = true;
          } else {
            return NextResponse.json(
              { success: false, message: "Product must be delivered before it can be reviewed" },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, message: "Product not found in the specified order" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Order not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find(
      (review: any) => review.reviewBy.toString() === user._id.toString()
    );

    let newReview;

    if (existingReview) {
      // Update existing review
      await Product.updateOne(
        {
          _id: productId,
          "reviews._id": existingReview._id
        },
        {
          $set: {
            "reviews.$.review": comment,
            "reviews.$.rating": rating,
            "reviews.$.reviewCreatedAt": new Date(),
            "reviews.$.verified": verifiedPurchase
          }
        }
      );

      // Get the updated product to recalculate rating
      const updatedProduct = await Product.findById(productId).populate("reviews.reviewBy");
      
      // Update overall product rating
      updatedProduct.numReviews = updatedProduct.reviews.length;
      updatedProduct.rating = updatedProduct.reviews.reduce(
        (acc: number, r: any) => acc + r.rating, 0
      ) / updatedProduct.reviews.length;
      
      await updatedProduct.save();

      // If there's an order associated, mark the item as reviewed
      if (order && orderItem) {
        orderItem.reviewed = true;
        orderItem.reviewId = existingReview._id;
        orderItem.reviewRating = rating;
        orderItem.reviewComment = comment;
        orderItem.reviewDate = new Date();
        await order.save();
      }

      newReview = {
        _id: existingReview._id,
        rating,
        review: comment,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: user._id.toString(),
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Anonymous",
        verified: verifiedPurchase
      };
    } else {
      // Create new review
      const reviewData = {
        reviewBy: user._id,
        rating,
        review: comment,
        reviewCreatedAt: new Date(),
        verified: verifiedPurchase
      };

      product.reviews.push(reviewData);
      product.numReviews = product.reviews.length;
      product.rating = product.reviews.reduce(
        (acc: number, r: any) => acc + r.rating, 0
      ) / product.reviews.length;
      
      await product.save();
      await product.populate("reviews.reviewBy");

      // If there's an order associated, mark the item as reviewed
      if (order && orderItem) {
        const addedReview = product.reviews[product.reviews.length - 1];
        orderItem.reviewed = true;
        orderItem.reviewId = addedReview._id;
        orderItem.reviewRating = rating;
        orderItem.reviewComment = comment;
        orderItem.reviewDate = new Date();
        await order.save();
      }

      const addedReview = product.reviews[product.reviews.length - 1];
      newReview = {
        _id: addedReview._id,
        rating,
        review: comment,
        createdAt: addedReview.reviewCreatedAt,
        updatedAt: addedReview.reviewCreatedAt,
        user: user._id.toString(),
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Anonymous",
        verified: verifiedPurchase
      };
    }

    // Revalidate product cache
    revalidateTag("product");

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review: newReview
    });
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { success: false, message: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const productId = id;

    await connectToDatabase();

    const product = await Product.findById(productId)
      .populate({
        path: "reviews.reviewBy",
        select: "firstName lastName image"
      })
      .select("reviews");

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Format reviews for client
    const formattedReviews = product.reviews.map((review: any) => ({
      _id: review._id.toString(),
      rating: review.rating,
      comment: review.review,
      createdAt: review.reviewCreatedAt,
      user: review.reviewBy._id.toString(),
      name: review.reviewBy.firstName 
        ? `${review.reviewBy.firstName} ${review.reviewBy.lastName || ''}`.trim() 
        : "Anonymous",
      userImage: review.reviewBy.image || "",
      verified: review.verified || false
    }));

    return NextResponse.json({
      success: true,
      reviews: formattedReviews
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, message: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
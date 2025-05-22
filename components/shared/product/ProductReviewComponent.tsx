"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StarRating from "@/components/shared/StarRating";
// Replace Clerk with NextAuth
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Review = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  user: string;
  createdAt: string;
  updatedAt: string;
  userImage?: string;
};

type ProductReviewProps = {
  product: {
    _id: string;
    name: string;
    numReviews: number;
    reviews: Review[];
  };
};

const ProductReviewComponent = ({
  product,
}: ProductReviewProps) => {
  const numOfReviews = product.numReviews;
  // Replace useClerk with useSession
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const [reviews, setReviews] = useState(product.reviews);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
  });
  
  // Check if user has already reviewed
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userReview = reviews.find(review => review.user === session.user.id);
      setHasReviewed(!!userReview);
    }
  }, [reviews, session, status]);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (value: string) => {
    setFormData((prev) => ({ ...prev, rating: parseInt(value) }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("Please sign in to leave a review");
      router.push("/auth/signin");
      return;
    }

    if (!formData.comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/products/${product._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: formData.rating,
          comment: formData.comment,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit review");
      }

      const data = await response.json();
      
      // Update reviews with the new review
      const newReview = {
        ...data.review,
        name: session.user.name || "Anonymous",
        userImage: session.user.image || "",
      };
      
      setReviews([newReview, ...reviews]);
      setHasReviewed(true);
      setShowReviewForm(false);
      setFormData({ rating: 5, comment: "" });
      
      toast.success("Review submitted successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Customer Reviews ({numOfReviews})
        </h2>

        {status === "authenticated" && !hasReviewed && (
          <Button onClick={() => setShowReviewForm(true)}>Write a Review</Button>
        )}
        
        {status === "authenticated" && hasReviewed && (
          <Button variant="outline" disabled>
            You've already reviewed this product
          </Button>
        )}
        
        {status === "unauthenticated" && (
          <Button onClick={() => router.push("/auth/signin")}>
            Sign in to Review
          </Button>
        )}
      </div>

      {showReviewForm && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <Select
                value={formData.rating.toString()}
                onValueChange={handleRatingChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Very Good</SelectItem>
                  <SelectItem value="3">3 - Good</SelectItem>
                  <SelectItem value="2">2 - Fair</SelectItem>
                  <SelectItem value="1">1 - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows={4}
                placeholder="Write your review here..."
                className="w-full"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="mt-6">
          {reviews.map((review) => (
            <div key={review._id} className="mb-6">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage
                    src={review.userImage || ""}
                    alt={review.name}
                  />
                  <AvatarFallback>
                    {review.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <p className="font-semibold">{review.name}</p>
                    <span className="text-gray-500 text-sm ml-2">
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="mt-1 text-gray-700">{review.comment}</p>
                </div>
              </div>
              <Separator className="mt-4" />
            </div>
          ))}

          {reviews.length > 3 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="mt-4">
                  View All Reviews
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[80vh] w-full overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>All Reviews for {product.name}</SheetTitle>
                  <SheetDescription>
                    {numOfReviews} customer reviews
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="mb-6">
                      <div className="flex items-start">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage
                            src={review.userImage || ""}
                            alt={review.name}
                          />
                          <AvatarFallback>
                            {review.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <p className="font-semibold">{review.name}</p>
                            <span className="text-gray-500 text-sm ml-2">
                              {formatDistanceToNow(new Date(review.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <StarRating rating={review.rating} />
                          <p className="mt-1 text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      ) : (
        <div className="mt-6 p-6 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  );
};

export default ProductReviewComponent;

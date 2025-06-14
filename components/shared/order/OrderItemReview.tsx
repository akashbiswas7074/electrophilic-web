"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";

interface OrderItemReviewProps {
  productId: string;
  productName: string;
  productImage: string;
  orderId: string;
  orderItemId?: string;
}

const OrderItemReview = ({
  productId,
  productName,
  productImage,
  orderId,
  orderItemId,
}: OrderItemReviewProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
  });

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
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: formData.rating,
          comment: formData.comment,
          orderId: orderId,
          orderItemId: orderItemId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit review");
      }

      // After successful review, mark the order item as reviewed
      await fetch(`/api/orders/${orderId}/items/${orderItemId || productId}/mark-reviewed`, {
        method: "POST",
      });

      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Your Purchase</DialogTitle>
          <DialogDescription>
            Share your experience with {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-4 py-4">
          {productImage && (
            <img 
              src={productImage} 
              alt={productName} 
              className="w-16 h-16 object-cover rounded-md"
            />
          )}
          <div>
            <p className="font-medium">{productName}</p>
            <p className="text-sm text-gray-500">Order ID: {orderId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmitReview}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex items-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      formData.rating >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                  />
                ))}
              </div>
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
            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows={4}
                placeholder="Share your experience with this product..."
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderItemReview;
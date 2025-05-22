"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext"; // Import context hook

interface WishlistButtonProps {
  productId: string;
  // Pass any other props needed for styling or context
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ productId, className }) => {
  const { data: session, status } = useSession();
  const { wishlist, isLoading: isWishlistLoading, toggleWishlist } = useWishlist(); // Use context

  const [isProcessing, setIsProcessing] = useState(false); // Local loading state for this button's action

  // Determine if the current product is in the wishlist from context
  const isInWishlist = useMemo(() => {
    return wishlist.some((item) => item._id === productId);
  }, [wishlist, productId]);

  const handleWishlistToggle = async () => {
    if (status !== "authenticated") {
      toast.error("Please log in to manage your wishlist.");
      // Optionally redirect to login or show modal
      return;
    }
    if (!productId) {
      toast.error("Product information is missing.");
      return;
    }

    setIsProcessing(true);
    try {
      await toggleWishlist(productId); // Call context function
      // Toast message is handled within the context now
    } catch (error: any) { // Context function might throw errors
      // Error toast is handled within the context now
      console.error("Wishlist toggle failed from button:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render a disabled placeholder if auth is loading or product ID is missing
  if (status === "loading" || !productId) {
    return (
      <Button variant="outline" size="icon" disabled className={cn("rounded-full", className)}>
        <Heart className="h-5 w-5 text-gray-300" />
      </Button>
    );
  }

  const isLoading = isProcessing || (status === 'authenticated' && isWishlistLoading && wishlist.length === 0); // Show loading if processing or initial context load is happening
  const isDisabled = isLoading || status !== 'authenticated';
  const title = status !== 'authenticated'
    ? "Log in to add to wishlist"
    : isInWishlist
    ? "Remove from wishlist"
    : "Add to wishlist";

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "rounded-full transition-colors duration-200",
        isLoading && "cursor-not-allowed opacity-70",
        isInWishlist && status === 'authenticated' && "bg-pink-100 border-pink-200 hover:bg-pink-200", // Style when in wishlist and logged in
        !isInWishlist && status === 'authenticated' && "hover:bg-gray-100", // Style when not in wishlist and logged in
        status !== 'authenticated' && "text-gray-400", // Style when logged out
        className
      )}
      onClick={handleWishlistToggle}
      disabled={isDisabled}
      aria-label={title}
      title={title}
    >
      {isLoading ? (
        <div className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <Heart
          className={cn(
            "h-5 w-5 transition-all duration-200",
            isInWishlist && status === 'authenticated' ? "text-pink-500 fill-pink-500" : "text-gray-500"
          )}
        />
      )}
    </Button>
  );
};

export default WishlistButton;

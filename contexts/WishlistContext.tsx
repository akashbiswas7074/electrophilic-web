"use client";

import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface WishlistItem {
  _id: string; // Product ID
  // Include other fields if needed by consumers of the context
  name?: string;
  slug?: string;
  image?: string;
  price?: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setWishlist([]); // Clear wishlist if not logged in
      setIsLoading(false);
      setError(null);
      return;
    }

    // Don't check wishlist.length here as it causes re-renders
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    console.log("WishlistContext: Fetching wishlist...");

    try {
      const response = await fetch("/api/wishlist");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch wishlist data");
      }

      if (Array.isArray(data.wishlist)) {
        setWishlist(data.wishlist);
        console.log(`WishlistContext: Fetched ${data.wishlist.length} items.`);
      } else {
        console.warn("WishlistContext: API response format unexpected:", data);
        setWishlist([]);
        setError("Could not load wishlist items due to unexpected format.");
      }
    } catch (err: any) {
      console.error("WishlistContext: Error fetching wishlist:", err);
      setError(err.message || "An unexpected error occurred while fetching wishlist.");
      setWishlist([]); // Clear wishlist on error
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status, isLoading]); // Remove wishlist.length from dependencies

  // Fetch wishlist when authentication status changes to authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchWishlist();
    } else if (status === "unauthenticated") {
      setWishlist([]); // Clear wishlist on logout
      setIsLoading(false);
      setError(null);
    }
    // Intentionally not including fetchWishlist in deps to avoid loops, control manually
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (status !== "authenticated" || !session?.user?.id) {
      toast.error("Please log in first.");
      throw new Error("User not authenticated");
    }

    const isInWishlistCurrently = wishlist.some(item => item._id === productId);
    const method = isInWishlistCurrently ? "DELETE" : "POST";
    const url = isInWishlistCurrently ? `/api/wishlist?productId=${productId}` : "/api/wishlist";
    const optimisticNewWishlist = isInWishlistCurrently
      ? wishlist.filter(item => item._id !== productId)
      : [...wishlist, { _id: productId }]; // Add a placeholder

    // Optimistic UI update
    setWishlist(optimisticNewWishlist);

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        ...(method === "POST" && { body: JSON.stringify({ productId }) }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${isInWishlistCurrently ? 'remove' : 'add'} item`);
      }

      toast.success(result.message || `Item ${isInWishlistCurrently ? 'removed' : 'added'}.`);
      // Optional: Refetch to ensure consistency, or rely on optimistic update
      // await fetchWishlist(); // Could cause flicker, use if optimistic fails often
      // If API returns the updated item/wishlist, update state with that instead
      if (method === 'POST' && result.item) { // Assuming API returns added item
         setWishlist(current => current.map(item => item._id === productId ? result.item : item));
      } else if (method === 'DELETE') {
         // Already handled optimistically
      } else {
         // Fallback refetch if needed
         await fetchWishlist();
      }

    } catch (error: any) {
      console.error("WishlistContext: Error toggling wishlist item:", error);
      toast.error(error.message || "Wishlist update failed.");
      // Revert optimistic update on failure
      setWishlist(wishlist);
      throw error; // Re-throw for the calling component to handle if needed
    }
  }, [session?.user?.id, status, wishlist, fetchWishlist]); // Include fetchWishlist

  const isInWishlist = useCallback((productId: string): boolean => {
      return wishlist.some(item => item._id === productId);
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading, error, fetchWishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use the WishlistContext
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

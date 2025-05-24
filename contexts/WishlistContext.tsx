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
  originalPrice?: number;
  discount?: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string, productDetails?: any) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    // Clear previous states
    setError(null);
    
    if (status !== "authenticated" || !session?.user?.id) {
      console.log("WishlistContext: User not authenticated, clearing wishlist");
      setWishlist([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log("WishlistContext: Fetching wishlist items...");

    try {
      const response = await fetch("/api/wishlist", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("WishlistContext: API response:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch wishlist");
      }

      // Ensure wishlist is an array
      if (Array.isArray(data.wishlist)) {
        console.log(`WishlistContext: Successfully fetched ${data.wishlist.length} items`);
        
        // Map the items to ensure all required properties are present
        const mappedItems = data.wishlist.map((item: any) => ({
          _id: item._id || "",
          name: item.name || "Product",
          slug: item.slug || "#",
          image: item.image || "/placeholder.png",
          price: typeof item.price === 'number' ? item.price : 0,
          originalPrice: item.originalPrice,
          discount: item.discount,
        }));
        
        setWishlist(mappedItems);
      } else {
        console.warn("WishlistContext: Unexpected response format", data);
        setWishlist([]);
      }
    } catch (error: any) {
      console.error("WishlistContext: Error fetching wishlist:", error);
      setError(error.message || "Failed to load wishlist");
      // Don't clear wishlist on error to maintain offline experience
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  // Fetch wishlist when authentication status changes to authenticated
  useEffect(() => {
    if (status === "authenticated") {
      console.log("Authentication status changed to authenticated, fetching wishlist");
      // Force a fresh fetch when authentication status changes
      setIsLoading(true); // Set loading state before fetch
      fetchWishlist();
    } else if (status === "unauthenticated") {
      setWishlist([]); // Clear wishlist on logout
      setIsLoading(false);
      setError(null);
    }
  }, [status]);

  // Separate effect to handle the initial fetch
  useEffect(() => {
    // This will run only once when the component mounts
    if (status === "authenticated" && wishlist.length === 0 && !isLoading && !error) {
      console.log("Initial wishlist fetch on component mount");
      setIsLoading(true);
      fetchWishlist();
    }
  }, []);

  const toggleWishlist = useCallback(async (productId: string, productDetails: any = null) => {
    if (status !== "authenticated" || !session?.user?.id) {
      toast.error("Please log in first.");
      throw new Error("User not authenticated");
    }

    const isInWishlistCurrently = wishlist.some(item => item._id === productId);
    const method = isInWishlistCurrently ? "DELETE" : "POST";
    const url = isInWishlistCurrently ? `/api/wishlist?productId=${productId}` : "/api/wishlist";
    
    // Create optimistic update with product details if available
    let newItem: WishlistItem = { _id: productId };
    if (productDetails) {
      newItem = {
        _id: productId,
        name: productDetails.name || "Product",
        slug: productDetails.slug || "#",
        image: productDetails.image || "/placeholder.png",
        price: typeof productDetails.price === 'number' ? productDetails.price : 0,
        originalPrice: productDetails.originalPrice,
        discount: productDetails.discount
      };
    }
    
    const optimisticNewWishlist = isInWishlistCurrently
      ? wishlist.filter(item => item._id !== productId)
      : [...wishlist, newItem];

    // Optimistic UI update immediately
    setWishlist(optimisticNewWishlist);

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        ...(method === "POST" && { body: JSON.stringify({ productId }) }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${isInWishlistCurrently ? 'remove from' : 'add to'} wishlist`);
      }

      toast.success(result.message || `Item ${isInWishlistCurrently ? 'removed from' : 'added to'} wishlist`);
      
      // No need to refetch the whole wishlist - we've already updated the UI optimistically
      // Only refetch if something unexpected happened
      if (result.needsRefresh) {
        fetchWishlist();
      }

    } catch (error: any) {
      console.error("WishlistContext: Error toggling wishlist item:", error);
      toast.error(error.message || "Wishlist update failed.");
      // Revert optimistic update on failure
      setWishlist(wishlist);
      throw error;
    }
  }, [session?.user?.id, status, wishlist, fetchWishlist]);

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

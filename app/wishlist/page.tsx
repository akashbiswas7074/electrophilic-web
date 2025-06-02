"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/contexts/WishlistContext"; // Import the context hook

// Skeleton for loading state
const WishlistSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <Skeleton className="aspect-square w-full rounded-md bg-gray-200" />
        <Skeleton className="h-5 w-3/4 rounded bg-gray-200" />
        <Skeleton className="h-6 w-1/2 rounded bg-gray-200" />
        <Skeleton className="h-10 w-full rounded-md bg-gray-200" />
      </div>
    ))}
  </div>
);

const WishlistPage = () => {
  const { status } = useSession();
  const router = useRouter();
  // Use state and functions from WishlistContext
  const { wishlist: wishlistItems, isLoading, error, fetchWishlist, toggleWishlist } = useWishlist();
  const [removingItemId, setRemovingItemId] = React.useState<string | null>(null);

  // Redirect if not authenticated (client-side)
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please log in to view your wishlist.");
      router.push("/login?callbackUrl=/wishlist"); // Redirect to login, then back to wishlist
    }
  }, [status, router]);

  // Show debug info in development - useful for troubleshooting
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('WishlistPage: Current state', { 
        wishlistItems, 
        isLoading, 
        error, 
        authStatus: status 
      });
    }
  }, [wishlistItems, isLoading, error, status]);

  // Initial fetch is handled by the context provider
  // But we also trigger a refetch when the user navigates to this page
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('WishlistPage: User is authenticated, fetching wishlist...');
      fetchWishlist();
    } else {
      console.log('WishlistPage: User not yet authenticated');
    }
  }, [status, fetchWishlist]);

  // Handle item removal using the context function
  const handleRemoveItem = async (productId: string) => {
    if (removingItemId) return; // Prevent double clicks

    setRemovingItemId(productId);
    try {
      await toggleWishlist(productId); // Use context function
      // Toast messages are handled within the context
    } catch (err: any) {
      // Error toast is handled within the context
      console.error("Error removing item from wishlist page:", err);
    } finally {
      setRemovingItemId(null);
    }
  };

  // --- Render Logic ---

  // Show skeleton while context is loading OR auth status is loading
  if (isLoading || status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <h1 className="text-3xl font-bold mb-8 text-center">My Wishlist</h1>
        <WishlistSkeleton />
      </div>
    );
  }

  // Show error message if context encountered an error
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">My Wishlist</h1>
        <p className="text-red-600 mb-4">Error loading wishlist: {error}</p>
        <Button onClick={fetchWishlist} disabled={isLoading}>Try Again</Button>
      </div>
    );
  }

  // Handle logged-out state (after loading is complete)
  if (status === 'unauthenticated') {
      // The redirect effect should handle this, but we can show a message
      return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16 text-center">
              <h1 className="text-3xl font-bold mb-4">My Wishlist</h1>
              <p className="text-gray-600 mb-6">Please log in to see your wishlist.</p>
              <Button asChild>
                  <Link href="/login?callbackUrl=/wishlist">Log In</Link>
              </Button>
          </div>
      );
  }

  // Handle empty wishlist state for authenticated users
  if (wishlistItems.length === 0 && status === 'authenticated') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">My Wishlist</h1>
        <p className="text-gray-600 mb-6">Your wishlist is currently empty.</p>
        <Button asChild>
          <Link href="/">Start Shopping</Link> {/* Link to homepage or shop */} 
        </Button>
      </div>
    );
  }

  // Render the wishlist items for authenticated users
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">My Wishlist ({wishlistItems.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {wishlistItems.map((item) => (
          <div key={item._id} className="border rounded-lg overflow-hidden shadow-sm bg-white flex flex-col relative group">
             {/* Remove Button */}
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-white/70 hover:bg-red-100 hover:text-red-600 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
                onClick={() => handleRemoveItem(item._id)}
                disabled={removingItemId === item._id}
                aria-label="Remove from wishlist"
                title="Remove from wishlist"
             >
                {removingItemId === item._id ? (
                   <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                   <X size={16} />
                )}
             </Button>

            {/* Product Image Link */}
            <Link href={`/product/${item.slug ?? '#'}`} className="block aspect-square relative bg-gray-100">
              <Image
                src={item.image || '/placeholder.png'} // Use available placeholder in your project
                alt={item.name ?? 'Product Image'}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 23vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} // Fallback on error
              />
               {/* Discount Badge */}
               {item.discount && item.discount > 0 && (
                 <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-sm">
                   {item.discount}% OFF
                 </div>
               )}
            </Link>

            {/* Product Details */}
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-semibold text-sm md:text-base mb-1 leading-tight flex-grow">
                <Link href={`/product/${item.slug ?? '#'}`} className="hover:underline line-clamp-2">
                  {item.name ?? 'Product Name Unavailable'}
                </Link>
              </h3>
              {/* Price Display */}
              <div className="flex items-baseline gap-2 mt-1 mb-3">
                 <p className="text-base md:text-lg font-bold text-gray-900">
                    ₹{item.price?.toLocaleString('en-IN') ?? 'N/A'}
                 </p>
                 {/* Optional: Original Price */}
                 {/* {item.originalPrice && item.originalPrice > item.price && ... } */}
              </div>
              {/* View Product Button */}
              <Button
                 variant="outline"
                 size="sm"
                 className="w-full mt-auto"
                 asChild
              >
                 <Link href={`/product/${item.slug ?? '#'}`}>View Product</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
  children: React.ReactNode;
  loadMore: () => Promise<any>;
  hasMore: boolean;
  loading?: boolean;
  className?: string;
  loadingText?: string;
  endMessage?: string | React.ReactNode;
  threshold?: number; // Distance from bottom to trigger loadMore (in pixels)
  loadOnMount?: boolean; // Whether to load more data when component mounts
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  loadMore,
  hasMore,
  loading = false,
  className = '',
  loadingText = 'Loading more items...',
  endMessage = 'No more items to load',
  threshold = 300,
  loadOnMount = false,
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Handle the loadMore function
  const handleLoadMore = async () => {
    if (localLoading || loading || !hasMore) return;
    
    try {
      setLocalLoading(true);
      await loadMore();
    } catch (error) {
      console.error("Error loading more items:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    // Only observe if we have more items to load
    if (!hasMore || loading || localLoading) return;

    const options = {
      root: null, // Use viewport as root
      rootMargin: `0px 0px ${threshold}px 0px`, // Bottom margin to trigger earlier
      threshold: 0, // Trigger as soon as the element is visible
    };

    // Create observer
    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading && !localLoading) {
        handleLoadMore();
      }
    }, options);

    // Start observing the loading element
    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, localLoading, threshold]);

  // Load initial items on mount if loadOnMount is true
  useEffect(() => {
    if (loadOnMount && hasMore && !loading && !localLoading) {
      handleLoadMore();
    }
  }, []);

  return (
    <div ref={scrollRef} className={className}>
      {children}
      
      <div ref={loadingRef} className="w-full py-6 flex justify-center">
        {(loading || localLoading) && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <span className="text-gray-500 text-sm">{loadingText}</span>
          </div>
        )}
        
        {!hasMore && !loading && !localLoading && (
          <div className="text-gray-500 text-sm">{endMessage}</div>
        )}
      </div>
    </div>
  );
};

export default InfiniteScroll;
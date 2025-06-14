"use client";

import { useState } from 'react';

interface UseInfiniteProductsProps<T> {
  initialItems: T[];
  fetchItems: (page: number, limit: number) => Promise<T[]>;
  itemsPerPage?: number;
}

interface UseInfiniteProductsReturn<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  error: Error | null;
}

export function useInfiniteProducts<T>({
  initialItems,
  fetchItems,
  itemsPerPage = 12
}: UseInfiniteProductsProps<T>): UseInfiniteProductsReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(initialItems.length >= itemsPerPage);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const nextPage = page + 1;
      const newItems = await fetchItems(nextPage, itemsPerPage);
      
      if (newItems && Array.isArray(newItems)) {
        if (newItems.length > 0) {
          setItems(prevItems => [...prevItems, ...newItems]);
          setPage(nextPage);
        }
        
        // If we got fewer items than requested, we've reached the end
        setHasMore(newItems.length >= itemsPerPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching more items:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    hasMore,
    loadMore,
    error
  };
}
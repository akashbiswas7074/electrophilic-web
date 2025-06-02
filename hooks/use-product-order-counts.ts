import { useState, useEffect } from 'react';

type OrderCountsResponse = {
  [productId: string]: number;
};

/**
 * Custom hook to fetch order counts for products
 * Uses the 'sold' field from product schema
 */
export function useProductOrderCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products/order-counts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch product order counts');
        }
        
        const data: OrderCountsResponse = await response.json();
        
        // Ensure we only include products with actual sold counts
        const filteredCounts = Object.entries(data).reduce((acc, [id, count]) => {
          if (count > 0) {
            acc[id] = count;
          }
          return acc;
        }, {} as Record<string, number>);
        
        setCounts(filteredCounts);
      } catch (err) {
        console.error('Error fetching product order counts:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCounts();
  }, []);

  return { counts, loading, error };
}
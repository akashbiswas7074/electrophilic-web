import { useState, useEffect, useCallback } from 'react';

export interface RecommendationProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  categoryId: string;
  rating: number;
  reviews: number;
  isFeatured: boolean;
  featured: boolean;
  stock: number;
  sold: number;
  createdAt: string;
}

export interface UseRecommendationsOptions {
  productId: string;
  type?: 'category' | 'brand' | 'similar' | 'trending' | 'hybrid';
  limit?: number;
  enabled?: boolean;
  trackAnalytics?: boolean;
}

export interface UseRecommendationsReturn {
  recommendations: RecommendationProduct[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackClick: (recommendedProductId: string) => void;
  trackView: () => void;
}

export function useRecommendations({
  productId,
  type = 'hybrid',
  limit = 8,
  enabled = true,
  trackAnalytics = true
}: UseRecommendationsOptions): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<RecommendationProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!enabled || !productId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/products/recommendations?productId=${productId}&type=${type}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
        
        // Track recommendation view
        if (trackAnalytics) {
          trackRecommendationView(productId, type, data.recommendations.length);
        }
      } else {
        setError(data.message || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [productId, type, limit, enabled, trackAnalytics]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const trackClick = useCallback((recommendedProductId: string) => {
    if (!trackAnalytics) return;
    
    trackRecommendationClick(productId, recommendedProductId, type);
  }, [productId, type, trackAnalytics]);

  const trackView = useCallback(() => {
    if (!trackAnalytics) return;
    
    trackRecommendationView(productId, type, recommendations.length);
  }, [productId, type, recommendations.length, trackAnalytics]);

  return {
    recommendations,
    loading,
    error,
    refresh: fetchRecommendations,
    trackClick,
    trackView
  };
}

// Analytics tracking functions
async function trackRecommendationView(productId: string, type: string, count: number) {
  try {
    await fetch('/api/analytics/recommendations/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        type,
        count,
        timestamp: new Date().toISOString()
      }),
    });
  } catch (error) {
    console.error('Error tracking recommendation view:', error);
  }
}

async function trackRecommendationClick(sourceProductId: string, targetProductId: string, type: string) {
  try {
    await fetch('/api/analytics/recommendations/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceProductId,
        targetProductId,
        type,
        timestamp: new Date().toISOString()
      }),
    });
  } catch (error) {
    console.error('Error tracking recommendation click:', error);
  }
}
import { serializeData } from '@/lib/utils/serialization';

/**
 * Fetches products by category slug with pagination
 */
export const fetchCategoryProducts = async (slug: string, page = 1, limit = 12) => {
  try {
    const response = await fetch(`/api/products/category/${slug}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Category '${slug}' not found`);
      }
      throw new Error(`Error fetching products: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      data: data.products || [],
      hasMore: data.hasMore || false,
      total: data.total || 0,
    };
  } catch (error) {
    console.error('Error fetching category products:', error);
    throw error;
  }
};
import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  image: string;
  images: any[];
  slug: string;
  category?: string;
  categoryId: string;
  subcategory: string;
  brandId: string;
  brandName: string;
  stock: number;
  isOnSale: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
}

const RecentlyViewedProducts = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const router = useRouter();
  
  useEffect(() => {
    // Get recently viewed products from localStorage
    const getRecentlyViewed = () => {
      try {
        const storedProducts = localStorage.getItem('recentlyViewedProducts');
        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);
          setRecentlyViewed(parsedProducts);
        }
      } catch (error) {
        console.error('Error loading recently viewed products:', error);
      }
    };
    
    getRecentlyViewed();
    
    // Set up an event listener to refresh the products when storage changes
    window.addEventListener('storage', getRecentlyViewed);
    
    // Custom event for same-tab updates
    window.addEventListener('recentlyViewedUpdated', getRecentlyViewed);
    
    return () => {
      window.removeEventListener('storage', getRecentlyViewed);
      window.removeEventListener('recentlyViewedUpdated', getRecentlyViewed);
    };
  }, []);
  
  if (recentlyViewed.length === 0) return null;
  
  return (
    <div className="mt-12 mb-6">
      <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recentlyViewed.slice(0, 5).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedProducts;
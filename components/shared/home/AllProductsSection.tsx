'use client';

import React from 'react';
import ProductCarousel from '@/components/shared/home/ProductCarousel';

interface Product {
  id: string;
  name: string;
  image: string;
  slug: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;  
  rating: number;    
  reviews: number; 
  isBestseller?: boolean;
  isNew?: boolean;
  orderCount?: number;
  sold?: number;
  isFeatured?: boolean | null;
  featured?: boolean | null;
  createdAt?: string | Date;
  stock?: number;
  // Add missing properties that might come from MongoDB
  _id?: string;
  _doc?: any;
}

interface AllProductsSectionProps {
  products: Product[];
}

const AllProductsSection: React.FC<AllProductsSectionProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  // Enhance products to preserve all badge types with proper priority
  const enhancedProducts = products.map(product => {
    const mainProductSold = typeof product.sold === 'number' ? product.sold : 0;
    const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 0;
    const totalSoldCount = mainProductSold > 0 ? mainProductSold : orderCount;
    
    // Check if product is featured - enhanced to detect all variations
    const isProductFeatured = Boolean(
      product.isFeatured || 
      product.featured ||
      (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
      (typeof product._id !== 'undefined' && (Boolean(product.featured) || Boolean(product.isFeatured)))
    );
    
    // Check if product is newly arrived (within the last 7 days)
    const isNewlyArrived = Boolean(
      product.isNew || 
      (product.createdAt && (new Date().getTime() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000))
    );
    
    // Bestseller logic: Only show if NOT featured and has good sales
    const shouldShowBestseller = !isProductFeatured && (product.isBestseller || totalSoldCount > 5);
    
    return {
      ...product,
      // Featured takes priority over bestseller - ensure both properties exist for compatibility
      isFeatured: isProductFeatured,
      featured: isProductFeatured,
      isNew: isNewlyArrived,
      // Only show bestseller if not featured
      isBestseller: shouldShowBestseller,
      sold: totalSoldCount,
      soldOut: product.stock !== undefined && product.stock <= 0
    };
  });

  return (
    <div id="all-products">
      <ProductCarousel
        heading="ALL PRODUCTS"
        products={enhancedProducts}
        viewAllLink="/shop"
        autoplay={true}
        showDiscount={true}
        showNew={true}
        showBestseller={true}
        showFeatured={true}
      />
    </div>
  );
};

export default AllProductsSection;
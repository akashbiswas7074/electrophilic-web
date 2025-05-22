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
  category: string;  // Added required property
  rating: number;    // Added required property  
  reviews: number;   // Added required property
}

interface AllProductsSectionProps {
  products: Product[];
}

const AllProductsSection: React.FC<AllProductsSectionProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div id="all-products">
      <ProductCarousel
        heading="ALL PRODUCTS"
        products={products}
      />
    </div>
  );
};

export default AllProductsSection;
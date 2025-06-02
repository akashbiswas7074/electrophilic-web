"use client";

import React from "react";
import ProductCarousel from "@/components/shared/home/ProductCarousel";
import { Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  slug: string;
  reviews: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  isBestseller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  featured?: boolean;
  createdAt?: string | Date;
  orderCount?: number;
  sold?: number;
  stock?: number;
  // Add missing properties that might come from MongoDB
  _id?: string;
  _doc?: any;
}

interface NewArrivalsSectionProps {
  products?: Product[];
  viewAllLink?: string;
}

const NewArrivalsSection = ({ 
  products = [], 
  viewAllLink = "/shop?sort=newest"
}: NewArrivalsSectionProps) => {
  // Log for debugging
  console.log("[NewArrivalsSection] Products received:", products?.length || 0);

  if (!Array.isArray(products) || products.length === 0) {
    console.log("[NewArrivalsSection] No products to display");
    return null;
  }

  // Sort products by creation date (newest first) and filter for recent arrivals
  const sortedNewArrivals = products
    .filter(product => {
      // Check if product was created in the last 30 days
      if (product.createdAt) {
        const productDate = new Date(product.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return productDate >= thirtyDaysAgo;
      }
      return true; // Include products without createdAt
    })
    .sort((a, b) => {
      // Sort by creation date (newest first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    })
    .slice(0, 8); // Limit to 8 newest products

  // If no new arrivals after filtering, use first 8 products
  const finalProducts = sortedNewArrivals.length > 0 ? sortedNewArrivals : products.slice(0, 8);

  // Enhance products to maintain featured status while also marking as new
  const enhancedProducts = finalProducts.map(product => {
    // Check for featured status using all possible property variations
    const isProductFeatured = Boolean(
      product.isFeatured || 
      product.featured ||
      (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
      (typeof product._id !== 'undefined' && (Boolean(product.featured) || Boolean(product.isFeatured)))
    );

    return {
      ...product,
      isNew: true, // Always show NEW badge for new arrivals if not featured
      // Preserve featured status to ensure the featured bridge works correctly
      isFeatured: isProductFeatured,
      featured: isProductFeatured
    };
  });

  console.log("[NewArrivalsSection] Final products to display:", enhancedProducts.length);

  return (
    <section className="relative">
      <div className=" rounded-lg py-6 sm:py-8 mb-4">
        <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 max-w-[90%] mx-auto mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">NEW ARRIVALS</h2>
        </div>
        
        <ProductCarousel
          heading=""
          products={enhancedProducts}
          viewAllLink={viewAllLink}
          autoplay={true}
          showDiscount={true}
          showNew={true}
          showBestseller={false}
          showFeatured={true} // Changed from false to true to enable the featured bridge
        />
        
        <div className="flex justify-center mt-2">
          <div className="bg-white/70 rounded-lg p-2 inline-flex items-center">
            <span className="text-xs text-gray-600">Newest products first • {enhancedProducts.length} items</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
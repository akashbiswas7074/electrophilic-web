"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

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
  subProducts?: {
    sizes?: { price?: number }[];
  }[];
}

interface BestsellingProps {
  products?: Product[];
  viewAllLink?: string;
}

const BestsellingSection = ({
  products = [],
  viewAllLink = "/shop?sort=bestselling",
}: BestsellingProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  // Sort products by their sold count in descending order
  const sortedProducts = [...products].sort((a, b) => {
    // Get the sold count for product A
    const aSold =
      typeof a.sold === "number"
        ? a.sold
        : typeof a.orderCount === "number"
        ? a.orderCount
        : 0;

    // Get the sold count for product B
    const bSold =
      typeof b.sold === "number"
        ? b.sold
        : typeof b.orderCount === "number"
        ? b.orderCount
        : 0;

    return bSold - aSold; // Sort in descending order
  });

  // Enhance products to show BESTSELLER badge and add rank information
  const enhancedProducts = sortedProducts.map((product) => {
    // Calculate accurate total sold count from all sources
    const mainProductSold = typeof product.sold === "number" ? product.sold : 0;

    // Use orderCount as a fallback if available
    const orderCount = typeof product.orderCount === "number" ? product.orderCount : 0;

    // Total sold is the direct sold count or orderCount, whichever is available
    const totalSoldCount = mainProductSold > 0 ? mainProductSold : orderCount;

    // Check if product has subProducts with sizes
    let hasValidSize = false;
    if (product.subProducts && Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      // Check first subProduct's sizes
      const subProduct = product.subProducts[0];
      if (subProduct.sizes && Array.isArray(subProduct.sizes) && subProduct.sizes.length > 0) {
        // Consider the product valid if any size has a price
        hasValidSize = subProduct.sizes.some(size => typeof size.price === 'number' && size.price > 0);
      }
    }
    
    // Product is valid if it has a valid size or a direct price
    const isValidProduct = hasValidSize || (typeof product.price === 'number' && product.price > 0);
    
    // Enhanced featured product detection for the featured bridge
    // Check all possible property variations to ensure consistency
    const isProductFeatured = Boolean(
      product.isFeatured || 
      product.featured ||
      (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
      (typeof product._id !== 'undefined' && (Boolean(product.featured) || Boolean(product.isFeatured)))
    );
    
    // Only include products that have sales data or are properly configured
    if (totalSoldCount > 0 && isValidProduct) {
      return {
        ...product,
        // Featured takes priority - if featured, show FEATURED badge instead of BESTSELLER
        isFeatured: isProductFeatured,
        featured: isProductFeatured,
        // Only show BESTSELLER badge if NOT featured
        isBestseller: !isProductFeatured, // Only show bestseller if not featured
        sold: totalSoldCount, // Ensure we're explicitly passing the sold count
        soldOut: product.stock !== undefined && product.stock <= 0,
        // Don't modify the product name anymore - let the display logic handle it
        name: product.name
      };
    }
    
    // If product doesn't have sales data, still preserve featured status
    return {
      ...product,
      isFeatured: isProductFeatured,
      featured: isProductFeatured,
      // No bestseller badge if no sales data
      isBestseller: false
    };
  });

  return (
    <div className="w-full mx-auto py-10 sm:py-12 relative px-4 sm:px-6 lg:px-8 max-w-[90%] from-amber-50 to-red-50 rounded-lg">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-black-900">
            BESTSELLERS
          </h2>
          <Flame className="h-6 w-6 text-red-500" />
          <p className="text-sm text-black-700 mt-1 ml-2">
            Our most popular products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={viewAllLink}>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-600 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              View All
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-white hover:bg-amber-100 text-amber-700"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-white hover:bg-amber-100 text-amber-700"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>
      <div className="embla overflow-hidden -mx-2 sm:-mx-3" ref={emblaRef}>
        <div className="embla__container flex -ml-2 sm:-ml-3">
          {enhancedProducts.map((product) => (
            <div
              key={product.id}
              // Updated: 2 cards on mobile, 4 cards on desktop
              className="embla__slide flex-[0_0_50%] md:flex-[0_0_calc(100%/4)] lg:flex-[0_0_calc(100%/4)] xl:flex-[0_0_calc(100%/4)] px-2 sm:px-3 relative"
            >
              <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
                <ProductCardSmall product={product} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <div className="bg-gray-100 rounded-lg p-2 inline-flex items-center">
          <span className="text-xs text-gray-600">Products ranked by sales</span>
        </div>
      </div>
    </div>
  );
};

export default BestsellingSection;
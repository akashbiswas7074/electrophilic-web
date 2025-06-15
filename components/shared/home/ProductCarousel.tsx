"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  featured?: boolean; // Support both property names
  createdAt?: string | Date;
  orderCount?: number; // Add order count for bestsellers
  sold?: number; // Add sold count for direct use
  stock?: number; // Add stock to determine if sold out
  // Add missing properties that might come from MongoDB
  _id?: string;
  _doc?: any;
  subProducts?: any[]; // Add subProducts property to fix TypeScript error
}

interface ProductCarouselProps {
  heading: string;
  products?: Product[];
  viewAllLink?: string; // Allow customizing the "View All" link
  autoplay?: boolean; // Allow disabling autoplay
  showDiscount?: boolean; // Control display of discount badges
  showNew?: boolean; // Control display of new badges
  showBestseller?: boolean; // Control display of bestseller badges
  showFeatured?: boolean;
  isBestseller?: boolean; // Made optional to match ProductCard props
  isNew?: boolean; // Added optional isNew based on ProductCard props
  orderCount?: number; // Add order count for bestsellers
  sold?: number; // Control display of featured badges
}

const ProductCarousel = ({ 
  heading, 
  products = [], 
  viewAllLink = "/shop",
  autoplay = true,
  showDiscount = true,
  showNew = true,
  showBestseller = true,
  showFeatured = true
}: ProductCarouselProps) => {
  // Create plugins array with conditional autoplay
  const plugins = autoplay ? [Autoplay({ delay: 5000, stopOnInteraction: true })] : [];
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start", 
      slidesToScroll: 1, // Scroll one slide at a time
    },
    plugins
  );

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Safety check for products
  if (!Array.isArray(products) || products.length === 0) {
    return null; // Don't render anything if no products
  }

  // Enhance product objects with display flags based on props
  const enhancedProducts = products.map(product => {
    // Calculate accurate total sold count from all sources
    const mainProductSold = typeof product.sold === 'number' ? product.sold : 0;
    const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 0;
    
    // If product has subProducts with sizes, calculate total from there
    let subProductsSold = 0;
    if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      subProductsSold = product.subProducts.reduce((total, subProduct) => {
        // Get sold count from subproduct
        const subProductSoldCount = typeof subProduct.sold === 'number' ? subProduct.sold : 0;
        
        // Get sold count from sizes
        let sizesSold = 0;
        if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
          sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
            return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
          }, 0);
        }
        
        return total + subProductSoldCount + sizesSold;
      }, 0);
    }
    
    // Combine all sources of sold counts
    const combinedSoldCount = mainProductSold + subProductsSold;
    
    // Use combined count if available, otherwise fall back to orderCount
    const totalSoldCount = combinedSoldCount > 0 ? combinedSoldCount : orderCount;
    
    // Check if product is featured - enhanced to detect all possible variations
    const isProductFeatured = Boolean(
      product.isFeatured || 
      product.featured ||
      (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
      (typeof product._id !== 'undefined' && (Boolean(product.featured) || Boolean(product.isFeatured)))
    );
    
    return {
      ...product,
      discount: showDiscount ? product.discount : undefined,
      isNew: showNew ? product.isNew : undefined,
      // Preserve featured status when showFeatured is true - add both properties for compatibility
      isFeatured: showFeatured ? isProductFeatured : undefined,
      featured: showFeatured ? isProductFeatured : undefined,
      // Show bestseller badge if showBestseller is true (regardless of featured status)
      isBestseller: showBestseller ? (product.isBestseller || totalSoldCount > 5) : undefined,
      // Ensure we're explicitly passing the sold count
      sold: totalSoldCount,
      // Determine if product is sold out based on stock information
      soldOut: product.stock !== undefined && product.stock <= 0
    };
  });

  return (
    <div className="w-full mx-auto py-8 sm:py-10 relative px-4 sm:px-6 lg:px-8 max-w-[90%]"> {/* Added max-w-7xl and responsive padding */}
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{heading}</h2> {/* Adjusted heading style */}
        <div className="flex items-center gap-2">
           <Link href={viewAllLink}>
             {/* Adjusted Shop All button style */}
             <Button variant="link" size="sm" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline">
                Shop All
             </Button>
           </Link>
           {/* Navigation Buttons - styled to match image */}
           <Button
             variant="ghost"
             size="icon"
             className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
             onClick={scrollPrev}
           >
             <ChevronLeft className="h-5 w-5" />
             <span className="sr-only">Previous</span>
           </Button>
           <Button
             variant="ghost"
             size="icon"
             className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
             onClick={scrollNext}
           >
             <ChevronRight className="h-5 w-5" />
             <span className="sr-only">Next</span>
           </Button>
        </div>
      </div>
      <div className="embla overflow-hidden -mx-2 sm:-mx-3" ref={emblaRef}> {/* Adjusted negative margins */}
        <div className="embla__container flex -ml-2 sm:-ml-3"> {/* Adjusted negative margins */}
          {enhancedProducts.map((product) => (
            <div
              key={product.id}
              // Adjusted slide width for better responsiveness and spacing
              // 1 card on xs and sm, 4 cards on md+
              className="embla__slide flex-[0_0_100%] md:flex-[0_0_calc(100%/4)] lg:flex-[0_0_calc(100%/4)] xl:flex-[0_0_calc(100%/4)] px-2 sm:px-3"
            >
              <ProductCardSmall product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;

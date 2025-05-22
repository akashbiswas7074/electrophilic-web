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
}

interface ProductCarouselProps {
  heading: string;
  products?: Product[];
}

const ProductCarousel = ({ heading, products = [] }: ProductCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start", 
      slidesToScroll: 1, // Scroll one slide at a time
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
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

  return (
    <div className="w-full mx-auto py-8 sm:py-10 relative px-4 sm:px-6 lg:px-8 max-w-[90%]"> {/* Added max-w-7xl and responsive padding */}
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{heading}</h2> {/* Adjusted heading style */}
        <div className="flex items-center gap-2">
           <Link href="/shop">
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
          {products.map((product) => (
            <div
              key={product.id}
              // Adjusted slide width for better responsiveness and spacing
              // 1 card on xs and sm, 3 cards on md+
              className="embla__slide flex-[0_0_100%] md:flex-[0_0_calc(100%/3)] lg:flex-[0_0_calc(100%/3)] xl:flex-[0_0_calc(100%/3)] px-2 sm:px-3"
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

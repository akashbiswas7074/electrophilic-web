'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCardSmall } from '@/components/shared/product/ProductCardSmall';
import { Button } from '@/components/ui/button';

interface AllProductsSectionProps {
  products: any[];
}

const AllProductsSection = ({ products }: AllProductsSectionProps) => {
  // Filter out best selling products
  const filteredProducts = products.filter(product => !product.isBestSelling);

  const processedProducts = filteredProducts.map(product => {
    // CRITICAL FIX: Force the featured property to be a proper boolean
    const isProductFeatured = Boolean(product.featured) || Boolean(product.isFeatured);
    
    return {
      ...product,
      // Force featured status as boolean and ensure it's preserved
      featured: isProductFeatured,
      isFeatured: isProductFeatured,
    };
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start",
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  );

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!Array.isArray(processedProducts) || processedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto py-8 sm:py-10 relative px-4 sm:px-6 lg:px-8 w-[90%]">
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">All Products</h2>
        <div className="flex items-center gap-2">
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
      <div className="embla overflow-hidden -mx-2 sm:-mx-3" ref={emblaRef}>
        <div className="embla__container flex -ml-2 sm:-ml-3">
          {processedProducts.map((product) => (
            <div
              key={product.id}
              // Updated: 2 cards on mobile, 4 cards on desktop
              className="embla__slide flex-[0_0_50%] md:flex-[0_0_calc(100%/4)] lg:flex-[0_0_calc(100%/4)] xl:flex-[0_0_calc(100%/4)] px-2 sm:px-3"
            >
              <ProductCardSmall 
                product={product}  // Don't modify the product here
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AllProductsSection;
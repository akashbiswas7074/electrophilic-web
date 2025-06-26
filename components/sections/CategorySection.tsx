'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCardSmall } from '@/components/shared/product/ProductCardSmall';
import { Button } from '@/components/ui/button';

interface CategorySectionProps {
  products: any[];
  category: string;
}

const CategorySection = ({ products, category }: CategorySectionProps) => {
  // Process products to properly handle featured and sold properties
  const processedProducts = products.map(product => {
    // Enhanced featured product detection for the featured bridge
    const isProductFeatured = Boolean(
      product.isFeatured || 
      product.featured ||
      (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
      (typeof product._id !== 'undefined' && (product.featured === true || product.isFeatured === true))
    );
    
    // Calculate accurate total sold count from all sources
    const mainProductSold = typeof product.sold === 'number' ? product.sold : 
                           (typeof product.sold === 'string' ? parseInt(product.sold, 10) : 0);
    const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 0;
    const totalSoldCount = Math.max(mainProductSold, orderCount, 0); // Use highest value
    
    // Debug logging for troubleshooting
    console.log(`CategorySection - Product ${product.name}: Raw sold=${product.sold}, Processed sold=${totalSoldCount}`);
    
    return {
      ...product,
      // Ensure sold property is always present and is a number
      sold: totalSoldCount,
      // Set featured flags
      isFeatured: isProductFeatured,
      featured: isProductFeatured,
      // Only show bestseller badge if not featured and has sales
      isBestseller: !isProductFeatured && totalSoldCount > 5,
    };
  });

  // Filter out best selling products if needed
  const filteredProducts = processedProducts.filter(product => !product.isBestSelling);

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

  if (!Array.isArray(filteredProducts) || filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto py-8 sm:py-10 relative px-4 sm:px-6 lg:px-8 w-[90%]">
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{category}</h2>
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
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              // Updated: 2 cards on mobile, 4 cards on desktop
              className="embla__slide flex-[0_0_50%] md:flex-[0_0_calc(100%/4)] lg:flex-[0_0_calc(100%/4)] xl:flex-[0_0_calc(100%/4)] px-2 sm:px-3"
            >
              <ProductCardSmall 
                product={product}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
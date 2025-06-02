'use client';

import React, { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductCardSmall } from '@/components/shared/product/ProductCardSmall';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  category?: string;
  image?: string;
  rating?: number;
  slug: string;
  reviews?: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  isBestSelling?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  featured?: boolean;
  createdAt?: string | Date;
  orderCount?: number;
  sold?: number;
  stock?: number;
}

interface NewArrivalsSectionProps {
  products: Product[];
  viewAllLink?: string;
}

const NewArrivalsSection = ({ 
  products, 
  viewAllLink = "/shop?sort=newest" 
}: NewArrivalsSectionProps) => {
  // Add debug logging to check incoming products
  useEffect(() => {
    // Check if any products have featured: true
    const featuredProducts = products.filter(p => p.featured === true);
    console.log("Featured products in NewArrivalsSection:", featuredProducts);
  }, [products]);

  // Filter out best selling products and enhance with new arrival properties
  const sortedNewArrivals = products
    .filter(product => !product.isBestSelling)
    .sort((a, b) => {
      // Sort by creation date (newest first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    })
    .slice(0, 8) // Limit to 8 newest products
    .map(product => {
      // CRITICAL FIX: Force the featured property to be a proper boolean
      const isProductFeatured = Boolean(product.featured) || Boolean(product.isFeatured);
      
      return {
        ...product,
        isNew: true, // Mark as new arrival
        // Force featured status as boolean and ensure it's preserved
        featured: isProductFeatured,
        isFeatured: isProductFeatured,
        // Ensure image is always defined with a default value
        image: product.image || '/images/broken-link.png'
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

  if (!Array.isArray(sortedNewArrivals) || sortedNewArrivals.length === 0) {
    return null;
  }

  return (
    <section className="w-full mx-auto py-10 sm:py-12 relative px-4 sm:px-6 lg:px-8 max-w-[90%]">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-indigo-900">NEW ARRIVALS</h2>
              <p className="text-sm text-indigo-700 mt-1">Check out our latest additions</p>
            </div>
            <Sparkles className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <Link href={viewAllLink}>
              <Button variant="outline" size="sm" className="border-indigo-600 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                View All
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white hover:bg-indigo-100 text-indigo-700"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-full bg-white hover:bg-indigo-100 text-indigo-700"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
        
        <div className="embla overflow-hidden -mx-2 sm:-mx-3" ref={emblaRef}>
          <div className="embla__container flex -ml-2 sm:-ml-3">
            {sortedNewArrivals.map((product) => {
              // Debug info for each product being rendered
              console.log(`Rendering product in carousel:`, {
                name: product.name,
                featured: product.featured,
                isFeatured: product.isFeatured
              });
              
              return (
                <div
                  key={product.id}
                  className="embla__slide flex-[0_0_100%] md:flex-[0_0_calc(100%/3)] lg:flex-[0_0_calc(100%/4)] xl:flex-[0_0_calc(100%/4)] px-2 sm:px-3"
                >
                  <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
                    {/* Pass explicit featured props to ensure it's recognized */}
                    <ProductCardSmall 
                      product={product}  // Don't modify the product here, let ProductCardSmall handle it
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <div className="bg-gray-100 rounded-lg p-2 inline-flex items-center">
            <span className="text-xs text-gray-600">Newest products first • {sortedNewArrivals.length} items</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
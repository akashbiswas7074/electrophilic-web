'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { transformProductSafely } from '@/lib/utils';
import { ProductCardSmall } from '@/components/shared/product/ProductCardSmall';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface CategoryProductSectionProps {
  title: string;
  categoryName: string;
  categorySlug: string;
  categoryImage?: string;
  products: any[];
}

const CategoryProductSection = ({
  title,
  categoryName,
  categorySlug,
  categoryImage,
  products
}: CategoryProductSectionProps) => {
  // Transform products for consistent rendering
  const transformedProducts = products
    .map(product => {
      // Calculate accurate total sold count from all sources
      const mainProductSold = typeof product.sold === 'number' ? product.sold : 
                            (typeof product.sold === 'string' ? parseInt(product.sold, 10) : 0);
      const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 0;
      const totalSoldCount = Math.max(mainProductSold, orderCount, 0); // Use highest value
      
      // Debug logging for troubleshooting
      console.log(`CategoryProductSection - Product ${product.name}: Raw sold=${product.sold}, Processed sold=${totalSoldCount}`);
      
      // Check if the product has subProducts with sold counts
      let subProductsSold = 0;
      if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
        subProductsSold = product.subProducts.reduce((total: number, subProduct: any) => {
          if (!subProduct) return total;
          
          // Get sold count from subproduct
          const subProductSoldCount = typeof subProduct.sold === 'number' ? subProduct.sold : 0;
          
          // Get sold count from sizes
          let sizesSold = 0;
          if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
            sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
              if (!size) return sizesTotal;
              return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
            }, 0);
          }
          
          return total + subProductSoldCount + sizesSold;
        }, 0);
      }
      
      // Use highest available sold count
      const finalSoldCount = Math.max(mainProductSold, orderCount, subProductsSold, 0);
      
      // Transform the product using the utility function
      let transformed = transformProductSafely(product);
      
      // If transformation succeeded, explicitly set critical properties
      if (transformed) {
        // Create a new object with forced properties to ensure they're correctly set
        transformed = {
          ...transformed,
          sold: finalSoldCount, // Use the calculated final sold count
          // Ensure featured status is correctly set
          featured: Boolean(product.featured || product.isFeatured),
          isFeatured: Boolean(product.featured || product.isFeatured),
          // Set bestseller flag based on sold count
          isBestseller: product.isBestseller || finalSoldCount > 5
        };
      }
      
      return transformed;
    })
    .filter(Boolean);
    
  // Initialize the carousel
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

  // Optimize mobile view detection with a single resize handler using throttling
  const [isMobileView, setIsMobileView] = React.useState(false);
  
  React.useEffect(() => {
    // Function to check if mobile view should be used based on window width
    const checkMobileView = () => {
      if (typeof window !== 'undefined') {
        return window.innerWidth < 1024;
      }
      return false;
    };

    // Throttle function to limit resize handler execution
    const throttle = (func: Function, limit: number) => {
      let inThrottle: boolean;
      return function() {
        if (!inThrottle) {
          func();
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };
    
    // Throttled resize handler
    const handleResize = throttle(() => {
      setIsMobileView(checkMobileView());
    }, 200);
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Memoized image fallback handler
  const handleImageError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = "/images/broken-link.png";
  }, []);

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-[90%]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Shop {categoryName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/shop/category/${categorySlug}`} passHref>
              <Button variant="link" size="sm" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline">
                View All
              </Button>
            </Link>
            {/* Only show navigation buttons on non-mobile view */}
            {!isMobileView && (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Category Image Card (on larger screens) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="relative h-full min-h-[400px] rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
              {categoryImage && categoryImage !== "/placeholder.jpg" ? (
                <Image 
                  src={categoryImage}
                  alt={categoryName}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  onError={handleImageError}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">{categoryName}</span>
                </div>
              )}
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-white text-2xl font-bold">{categoryName}</h3>
                <Link href={`/shop/category/${categorySlug}`} passHref>
                  <button className="mt-4 bg-white text-black px-6 py-2 rounded-full hover:bg-gray-100 transition-colors">
                    Shop Now
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Products Display: Carousel for all views */}
          <div className="lg:col-span-5">
            <div className="embla overflow-hidden" ref={emblaRef}>
              <div className="embla__container flex">
                {transformedProducts.slice(0, 10).map((product) => product && (
                  <div
                    key={product.id}
                    // Updated: 2 cards on mobile, 4 cards on desktop
                    className="embla__slide flex-[0_0_50%] md:flex-[0_0_calc(100%/4)] px-2 sm:px-3"
                  >
                    <ProductCardSmall product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile Category Banner - remains unchanged */}
          <div className="block lg:hidden col-span-full mt-6">
            <Link href={`/shop/category/${categorySlug}`} passHref>
              <div className="relative h-[120px] rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
                {categoryImage && categoryImage !== "/placeholder.jpg" ? (
                  <Image 
                    src={categoryImage} 
                    alt={categoryName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 100vw"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">{categoryName}</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-between z-20 p-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">{categoryName}</h3>
                    <p className="text-white/80 text-sm">View All Products</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryProductSection;
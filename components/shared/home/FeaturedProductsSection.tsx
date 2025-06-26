"use client";

import React, { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Sparkles } from "lucide-react";

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
  isFeatured: boolean;
  featured: boolean;
  stock?: number;
}

interface FeaturedProductsSectionProps {
  products?: Product[];
  viewAllLink?: string;
  showBadge?: boolean;
}

const FeaturedProductsSection = ({ 
  products: propProducts = [], 
  viewAllLink = "/shop?featured=true",
  showBadge = true
}: FeaturedProductsSectionProps) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(propProducts);
  const [loading, setLoading] = useState(!propProducts.length);

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

  // Fetch featured products if not provided via props
  useEffect(() => {
    if (!propProducts.length) {
      fetchFeaturedProducts();
    }
  }, [propProducts.length]);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/featured?limit=12');
      const data = await response.json();
      
      if (data.success) {
        setFeaturedProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full mx-auto py-10 sm:py-12 relative px-4 sm:px-6 lg:px-8 max-w-[90%]">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!featuredProducts.length) {
    return null;
  }

  // Enhanced products with featured-specific properties
  const enhancedProducts = featuredProducts.map(product => ({
    ...product,
    isFeatured: true,
    featured: true,
    // Add badge priority for featured products
    badgePriority: 'featured'
  }));

  return (
    <section className="w-full mx-auto py-10 sm:py-12 relative px-4 sm:px-6 lg:px-8 max-w-[90%]">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-purple-600 fill-purple-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                FEATURED PRODUCTS
              </h2>
            </div>
            {showBadge && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Handpicked for You
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={viewAllLink}>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-purple-600 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
              >
                View All Featured
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white hover:bg-purple-100 text-purple-700"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white hover:bg-purple-100 text-purple-700"
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
                className="embla__slide flex-[0_0_50%] md:flex-[0_0_calc(100%/4)] lg:flex-[0_0_calc(100%/4)] xl:flex-[0_0_calc(100%/4)] px-2 sm:px-3"
              >
                <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden border border-purple-100">
                  <ProductCardSmall 
                    product={product}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 inline-flex items-center border border-purple-100">
            <Sparkles className="h-4 w-4 text-purple-600 mr-2" />
            <span className="text-xs text-purple-700 font-medium">
              Curated collection • {enhancedProducts.length} featured items
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
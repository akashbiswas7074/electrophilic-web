"use client";

import React, { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface Product {
  id: string;
  _id?: string;
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
}

interface YouMightAlsoLikeProps {
  productId: string;
  recommendationType?: "category" | "brand" | "similar" | "trending" | "hybrid";
  limit?: number;
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  autoplay?: boolean;
  className?: string;
}

const YouMightAlsoLike: React.FC<YouMightAlsoLikeProps> = ({
  productId,
  recommendationType = "hybrid",
  limit = 8,
  title = "You Might Also Like",
  subtitle = "Based on your selection",
  showViewAll = true,
  viewAllLink = "/shop",
  autoplay = true,
  className = "",
}) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: false,
      align: "start",
      slidesToScroll: 1,
      breakpoints: {
        "(min-width: 640px)": { slidesToScroll: 2 },
        "(min-width: 1024px)": { slidesToScroll: 2 },
      },
    },
    autoplay ? [Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })] : []
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!productId) return;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from recommendations API first
        let response = await fetch(
          `/api/products/recommendations?productId=${productId}&type=${recommendationType}&limit=${limit}`
        );

        if (!response.ok) {
          // Fallback to general products API
          response = await fetch(`/api/products?limit=${limit}&exclude=${productId}`);
        }

        const data = await response.json();

        if (data.success) {
          const products = data.recommendations || data.products || [];
          
          // Transform products to match our interface with proper sold count calculation
          const transformedProducts = products.map((product: any) => {
            // Calculate proper price
            const basePrice = product.subProducts?.[0]?.sizes?.[0]?.price || 
                             product.subProducts?.[0]?.price || 
                             product.price || 0;
            
            // Calculate proper sold count from multiple sources
            const mainProductSold = typeof product.sold === 'number' ? product.sold : 
                                   (typeof product.sold === 'string' ? parseInt(product.sold, 10) : 0);
            const orderCount = typeof product.orderCount === 'number' ? product.orderCount : 0;
            const subProductSold = product.subProducts?.reduce((total: number, sub: any) => {
              const subSold = typeof sub.sold === 'number' ? sub.sold : 0;
              return total + subSold;
            }, 0) || 0;
            
            const totalSoldCount = Math.max(mainProductSold, orderCount, subProductSold, 0);
            
            // Get proper image
            const imageUrl = product.subProducts?.[0]?.images?.[0]?.url || 
                           product.images?.[0]?.url ||
                           product.image || 
                           "/placeholder.png";

            return {
              id: product._id || product.id,
              _id: product._id || product.id,
              name: product.name,
              category: product.category?.name || product.category || "Unknown",
              image: imageUrl,
              // Only set rating if the product has reviews
              rating: (product.numReviews || product.reviews) ? product.rating : 0,
              slug: product.slug,
              reviews: product.numReviews || product.reviews || 0,
              price: basePrice,
              originalPrice: product.subProducts?.[0]?.sizes?.[0]?.originalPrice || 
                            product.originalPrice,
              discount: product.subProducts?.[0]?.discount || product.discount || 0,
              isBestseller: totalSoldCount > 10,
              isNew: product.isNew || false,
              isFeatured: product.isFeatured || product.featured || false,
              featured: product.featured || product.isFeatured || false,
              sold: totalSoldCount,
              stock: product.stock || product.subProducts?.[0]?.sizes?.[0]?.qty || 0,
              orderCount: totalSoldCount,
            };
          }).filter((product: Product) => product.price > 0); // Filter out products without valid prices

          setRecommendations(transformedProducts);
        } else {
          setError(data.message || "Failed to load recommendations");
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId, recommendationType, limit]);

  if (loading) {
    return (
      <section className={`py-12 bg-gray-50 ${className}`}>
        <div className="w-[90%] mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !recommendations.length) {
    return null;
  }

  return (
    <section className={`py-12 bg-gray-50 ${className}`}>
      <div className="w-[90%] mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {showViewAll && (
              <Link href={viewAllLink}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-blue-600 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  View All
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white hover:bg-blue-100 text-blue-700"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white hover:bg-blue-100 text-blue-700"
              onClick={scrollNext}
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>

        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {recommendations.map((product) => (
              <div
                key={product.id}
                className="embla__slide flex-[0_0_50%] sm:flex-[0_0_50%] md:flex-[0_0_25%] lg:flex-[0_0_25%] xl:flex-[0_0_25%] pl-4"
              >
                <ProductCardSmall product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default YouMightAlsoLike;
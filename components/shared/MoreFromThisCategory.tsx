"use client";

import React, { useEffect, useState } from "react";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

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
  _id?: string;
  _doc?: any;
  subProducts?: any[];
}

interface MoreFromThisCategoryProps {
  categoryId: string;
  limit?: number;
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  autoplay?: boolean;
  className?: string;
}

const MoreFromThisCategory: React.FC<MoreFromThisCategoryProps> = ({
  categoryId,
  limit = 8,
  title = "More from This Category",
  subtitle = "Explore similar products",
  showViewAll = true,
  viewAllLink = "/shop",
  autoplay = true,
  className = "",
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const plugins = autoplay ? [Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })] : [];
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: false, 
      align: "start",
      slidesToScroll: 1,
      breakpoints: {
        '(min-width: 640px)': { slidesToScroll: 2 },
        '(min-width: 1024px)': { slidesToScroll: 2 },
      }
    },
    plugins
  );

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
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!categoryId) return;

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to fetch products using the category actions API
        let response = await fetch(`/api/products/category/${categoryId}?limit=${limit + 5}`);
        
        if (!response.ok) {
          // Fallback to general products API with category filter
          response = await fetch(`/api/products?category=${categoryId}&limit=${limit + 5}`);
        }

        const data = await response.json();

        if (data.success && data.products && data.products.length > 0) {
          const categoryProducts = data.products;
          
          // Get category name from first product or API response
          if (categoryProducts.length > 0) {
            setCategoryName(
              categoryProducts[0].category?.name || 
              categoryProducts[0].category || 
              data.categoryName ||
              "this category"
            );
          }
          
          // Transform products with proper sold count and pricing
          const transformedProducts = categoryProducts.map((product: any) => {
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

          setProducts(transformedProducts.slice(0, limit));
        } else {
          // If no products found, try a broader search
          console.log("No products found for category, trying fallback...");
          
          const fallbackResponse = await fetch(`/api/products?limit=${limit * 2}`);
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.products) {
            // Filter products that might be related
            const relatedProducts = fallbackData.products
              .filter((p: any) => p.category?._id === categoryId || p.category === categoryId)
              .slice(0, limit);
              
            if (relatedProducts.length > 0) {
              setProducts(relatedProducts.map((product: any) => ({
                id: product._id || product.id,
                _id: product._id || product.id,
                name: product.name,
                category: product.category?.name || product.category || "Unknown",
                image: product.subProducts?.[0]?.images?.[0]?.url || 
                       product.images?.[0]?.url ||
                       product.image || 
                       "/placeholder.png",
                rating: product.rating || 4.5,
                slug: product.slug,
                reviews: product.numReviews || product.reviews || 0,
                price: product.subProducts?.[0]?.sizes?.[0]?.price || 
                       product.subProducts?.[0]?.price || 
                       product.price || 0,
                originalPrice: product.originalPrice,
                discount: product.discount || 0,
                sold: product.sold || product.orderCount || 0,
                stock: product.stock || 0,
                isBestseller: (product.sold || 0) > 10,
                isFeatured: product.isFeatured || product.featured || false,
              })));
            } else {
              setError("No related products found");
            }
          } else {
            setError("Failed to load category products");
          }
        }
      } catch (err) {
        console.error("Error fetching category products:", err);
        setError("Failed to load category products");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryId, limit]);

  if (loading) {
    return (
      <section className={`py-8 sm:py-12 bg-gray-50 ${className}`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-300 rounded w-48 sm:w-64 mb-4 sm:mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 sm:h-72 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !products.length) {
    return null;
  }

  return (
    <section className={`py-8 sm:py-12 bg-gray-50 ${className}`}>
      <div className="w-full max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile-optimized header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {/* <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" /> */}
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                {title}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {subtitle.includes('category') ? subtitle : `Explore more products in ${categoryName}`}
            </p>
          </div>
          
          {/* Mobile-optimized controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {showViewAll && (
              <Link href={`${viewAllLink}?category=${categoryId}`} className="flex-1 sm:flex-none">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 
                           text-xs sm:text-sm px-3 py-2 font-medium transition-all duration-200"
                >
                  <span className="hidden sm:inline">View All in Category</span>
                  <span className="sm:hidden">View All</span>
                </Button>
              </Link>
            )}
            
            {/* Navigation buttons - hidden on mobile, visible on tablet+ */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm transition-all duration-200",
                  canScrollPrev ? "hover:border-gray-300" : "opacity-50 cursor-not-allowed"
                )}
                onClick={scrollPrev}
                disabled={!canScrollPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm transition-all duration-200",
                  canScrollNext ? "hover:border-gray-300" : "opacity-50 cursor-not-allowed"
                )}
                onClick={scrollNext}
                disabled={!canScrollNext}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile-optimized carousel */}
        <div className="relative">
          <div className="embla overflow-hidden -mx-2 sm:-mx-3" ref={emblaRef}>
            <div className="embla__container flex">
              {products.map((product) => (
                <div
                  key={product.id}
                  // Mobile: 1 card, Small: 1 card, Medium+: 4 cards with proper spacing
                  className="embla__slide flex-[0_0_calc(100%-16px)] 
                           sm:flex-[0_0_calc(100%-24px)] 
                           md:flex-[0_0_calc(50%-24px)] 
                           lg:flex-[0_0_calc(25%-24px)] 
                           px-2 sm:px-3"
                >
                  <div className="h-full">
                    <ProductCardSmall product={product} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobile-friendly navigation dots */}
          {products.length > 1 && (
            <div className="flex justify-center mt-6 gap-2 sm:hidden">
              {Array.from({ 
                length: Math.ceil(products.length / 1) // Show all dots on mobile since it's 1 card per view
              }).map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200 touch-manipulation",
                    index === 0 ? "bg-gray-600 w-4" : "bg-gray-300 hover:bg-gray-400"
                  )}
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Desktop navigation dots */}
          {products.length > 4 && (
            <div className="hidden sm:flex justify-center mt-6 gap-2">
              {Array.from({ 
                length: Math.ceil(products.length / 4) // Desktop shows 4 cards per view
              }).map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index === 0 ? "bg-gray-600 w-4" : "bg-gray-300 hover:bg-gray-400"
                  )}
                  onClick={() => emblaApi?.scrollTo(index * 4)}
                  aria-label={`Go to slide group ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Mobile swipe indicator */}
          <div className="sm:hidden flex justify-center mt-4">
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              <span>Swipe to see more</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MoreFromThisCategory;
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
      <section className={`py-12 bg-white ${className}`}>
        <div className="w-[90%] mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
    <section className={`py-12 bg-white ${className}`}>
      <div className="w-[90%] mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Grid3X3 className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-gray-600">
              {subtitle.includes('category') ? subtitle : `Explore more products in ${categoryName}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showViewAll && (
              <Link href={`${viewAllLink}?category=${categoryId}`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-600 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                >
                  View All in Category
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full border-2 border-purple-200 bg-white hover:bg-purple-100 text-purple-700 shadow-sm transition-all",
                canScrollPrev ? "hover:border-purple-400" : "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
              )}
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full border-2 border-purple-200 bg-white hover:bg-purple-100 text-purple-700 shadow-sm transition-all",
                canScrollNext ? "hover:border-purple-400" : "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
              )}
              onClick={scrollNext}
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="embla__slide flex-[0_0_50%] sm:flex-[0_0_50%] md:flex-[0_0_25%] lg:flex-[0_0_25%] xl:flex-[0_0_25%] pl-4"
                >
                  <ProductCardSmall product={product} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Carousel Navigation Indicators */}
          {products.length > 4 && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === 0 ? "bg-purple-600" : "bg-gray-300 hover:bg-purple-400"
                  )}
                  onClick={() => emblaApi?.scrollTo(index * 4)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MoreFromThisCategory;
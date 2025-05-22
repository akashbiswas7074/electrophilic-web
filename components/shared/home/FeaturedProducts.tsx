"use client";

import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Minus, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ProductCarousel = ({ products }: { products: any[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update selected index when the slide changes
  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      };

      // Listen to slide selection events
      emblaApi.on("select", onSelect);

      // Set the initial index
      onSelect();

      return () => {
        emblaApi.off("select", onSelect);
      };
    }
  }, [emblaApi]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ">
      <div className="heading mb-[10px] ownContainer text-center uppercase sm:mb-[40px]">
        FEATURED PRODUCTS
      </div>
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {products.map((product, index) => {
            const subProduct = product.subProducts?.[0]; // Assuming you're displaying the first sub-product
            const productImage =
              subProduct?.images?.[0]?.url || "https://placehold.co/600x600";
            const productPrice = subProduct?.sizes?.[0]?.price || "N/A";
            const originalPrice =
              productPrice + (productPrice * subProduct.discount) / 100;
            const discountPercent = subProduct.discount || 0;

            return (
              <div
                key={index}
                className="embla__slide flex-[0_0_100%] min-w-0 flex flex-col lg:flex-row gap-4 sm:gap-8"
              >
                <div className="lg:w-1/2 flex justify-center items-center">
                  <img
                    src={productImage}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full max-w-md h-auto object-cover rounded-lg shadow-md"
                  />
                </div>
                <div className="lg:w-1/2 space-y-3 sm:space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {product.name}
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500">
                    {product.category.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < product.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {product.rating}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({product.numReviews} Reviews)
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-gray-600">
                    {product.description.slice(0, 200)}...
                    <span className="text-blue-500 cursor-pointer ml-1 hover:underline">
                      Read More
                    </span>
                  </p>

                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-4">
                    <div className="mb-4 lg:mb-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl lg:text-3xl font-bold">
                          ₹{productPrice}
                        </span>
                        {discountPercent > 0 && (
                          <>
                            <span className="text-lg text-gray-500 line-through">
                              ₹{originalPrice.toFixed(2)}
                            </span>
                            <span className="text-red-500 font-semibold">
                              -{discountPercent}%
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Inclusive of all taxes
                      </p>
                    </div>

                    <div className="flex items-center gap-0">
                      <Button
                        variant="outline"
                        className="bg-[#F2F2F2]"
                        size="icon"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center border-y-2 py-[6px]">
                        1
                      </span>
                      <Button
                        variant="outline"
                        className="bg-[#F2F2F2]"
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Link href={`/product/${product.slug}?style=0`}>
                    <Button className="w-full sm:w-auto px-8">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add navigation dots */}
      <div className="flex justify-center space-x-2 pt-6">
        {products.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${
              selectedIndex === index ? "bg-gray-800" : "bg-gray-400"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default function FeaturedProducts({ products }: { products: any[] }) {
  return (
    <div className="space-y-12">
      <ProductCarousel products={products} />
    </div>
  );
}

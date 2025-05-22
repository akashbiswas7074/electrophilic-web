'use client'; // Add this directive
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import useEmblaCarousel from 'embla-carousel-react'; // Import Embla Carousel hook
import { Button } from "@/components/ui/button"; // Import Button for navigation
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import icons for navigation

interface Category {
  _id: string;
  name: string;
  slug: string;
  images?: { url: string }[];
  // Add a specific field for the sport image if different from general category images
  sportImageUrl?: string; 
}

interface CategoryShowcaseProps {
  categories: Category[];
  title?: string; // Optional title
}

const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({ categories = [], title = "Shop By Sport" }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start", 
      slidesToScroll: 1,
    }
  );

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className=" mx-auto py-8 sm:py-10 relative px-4 sm:px-6 lg:px-8 w-[90%]">
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
           {/* Navigation Buttons - styled like ProductCarousel */}
           <Button
             variant="ghost"
             size="icon"
             className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
             onClick={scrollPrev}
             disabled={!emblaApi?.canScrollPrev()} // Disable if cannot scroll
           >
             <ChevronLeft className="h-5 w-5" />
             <span className="sr-only">Previous</span>
           </Button>
           <Button
             variant="ghost"
             size="icon"
             className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
             onClick={scrollNext}
             disabled={!emblaApi?.canScrollNext()} // Disable if cannot scroll
           >
             <ChevronRight className="h-5 w-5" />
             <span className="sr-only">Next</span>
           </Button>
        </div>
      </div>

      <div className="embla overflow-hidden -mx-2 sm:-mx-3" ref={emblaRef}>
        <div className="embla__container flex -ml-2 sm:-ml-3">
          {categories.map((category) => {
            const imageUrl = category.sportImageUrl || category.images?.[0]?.url || '/placeholder-image.png';

            return (
              <div
                key={category._id}
                // Adjust slide width: 1 on xs, 2 on sm, 3 on md+
                className="embla__slide flex-[0_0_90%] sm:flex-[0_0_calc(100%/2.1)] md:flex-[0_0_calc(100%/3.1)] lg:flex-[0_0_calc(100%/3.1)] xl:flex-[0_0_calc(100%/3.1)] px-2 sm:px-3"
              >
                <Link href={`/shop?category=${category.slug}`} className="group block relative aspect-[4/3] w-full overflow-hidden bg-gray-200">
                  <Image
                    src={imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, 30vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 filter grayscale hover:grayscale-0"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white text-black text-sm font-medium py-2 px-4 rounded-full">
                      {category.name}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;

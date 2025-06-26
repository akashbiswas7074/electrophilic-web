'use client'; // Add this directive
import React from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react'; // Import Embla Carousel hook
import { Button } from "@/components/ui/button"; // Import Button for navigation
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import icons for navigation

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  images?: { url: string }[];
  parent?: string;
}

interface SubCategoryShowcaseProps {
  subCategories: SubCategory[];
  title?: string; // Optional title
  onSubcategoryClick?: (subcategoryName: string) => void; // Callback for subcategory click
}

const SubCategoryShowcase: React.FC<SubCategoryShowcaseProps> = ({ subCategories = [], title = "Shop By SubCategories", onSubcategoryClick }) => {
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

  if (!subCategories || subCategories.length === 0) {
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
          {subCategories.map((subCategory) => {
            const imageUrl = subCategory.images?.[0]?.url || '/placeholder-image.png';

            return (
              <div
                key={subCategory._id}
                // 1 card on mobile, 2 cards on sm, 4 cards on desktop
                className="embla__slide flex-[0_0_calc(100%-16px)] sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(25%-18px)] px-2 sm:px-3"
              >
                <div 
                  className="group block relative aspect-[4/3] w-full overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => {
                    // Instead of navigating, trigger a filter action to show subcategory products
                    if (onSubcategoryClick) {
                      onSubcategoryClick(subCategory.name);
                    }
                  }}
                >
                  <Image
                    src={imageUrl}
                    alt={subCategory.name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, (max-width: 1280px) 23vw, 15vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 filter grayscale hover:grayscale-0"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white text-black text-sm font-medium py-2 px-4 rounded-full">
                      {subCategory.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SubCategoryShowcase;
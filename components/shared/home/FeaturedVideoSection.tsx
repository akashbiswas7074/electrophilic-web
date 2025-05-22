'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { IFeaturedVideo } from '@/lib/database/models/featured.video.model';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel'; // Added EmblaCarouselType
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface FeaturedVideoSectionProps {
  videos: IFeaturedVideo[];
}

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const FeaturedVideoSection: React.FC<FeaturedVideoSectionProps> = ({ videos }) => {
  const OPTIONS: EmblaOptionsType = { 
    loop: true, 
    align: 'start', 
    slidesToScroll: 1,
  };
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => { // Changed parameter type to EmblaCarouselType
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  if (!videos || videos.length === 0) {
    return null;
  }

  const activeVideos = videos.filter(video => video.isActive && getYouTubeVideoId(video.youtubeLink));

  if (activeVideos.length === 0) {
    return null;
  }

  return (
    <div className="w-full mx-auto py-8 sm:py-10 relative px-4 sm:px-6 lg:px-8 max-w-7xl bg-gray-50">
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Featured Videos</h2>
        <div className="flex items-center gap-2">
          {/* View All link styled similarly to Shop All in ProductCarousel */}
          <Button variant="link" size="sm" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline">
            View All
          </Button>
          {/* Navigation Buttons styled to match ProductCarousel */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
            onClick={scrollNext}
            disabled={nextBtnDisabled}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>

      <div className="embla overflow-hidden -mx-2 sm:-mx-3" ref={emblaRef}>
        <div className="embla__container flex -ml-2 sm:-ml-3">
          {activeVideos.map((video) => {
            const videoId = getYouTubeVideoId(video.youtubeLink);
            if (!videoId) return null;
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;

            return (
              <div 
                key={String(video._id)} 
                className="embla__slide flex-[0_0_90%] sm:flex-[0_0_calc(100%/2)] md:flex-[0_0_calc(100%/3)] lg:flex-[0_0_calc(100%/3)] xl:flex-[0_0_calc(100%/3)] px-2 sm:px-3"
              >
                <Card className="overflow-hidden h-full flex flex-col shadow hover:shadow-lg transition-all duration-300">
                  <AspectRatio ratio={16 / 9} className="bg-black">
                    <iframe
                      src={embedUrl}
                      title={video.description}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </AspectRatio>
                  <CardContent className="p-4 flex-grow">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2 para">
                      {video.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturedVideoSection;

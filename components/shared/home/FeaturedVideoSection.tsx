'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IFeaturedVideo } from '@/lib/database/models/featured.video.model';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Play, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FeaturedVideoSectionProps {
  videos: IFeaturedVideo[];
}

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Video Popup Modal Component
const VideoPopup = ({ 
  video, 
  isOpen, 
  onClose 
}: { 
  video: IFeaturedVideo | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  if (!isOpen || !video) return null;

  const videoId = getYouTubeVideoId(video.youtubeLink);
  if (!videoId) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-2xl">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Video Container */}
        <div className="relative">
          <AspectRatio ratio={16 / 9} className="bg-black">
            <iframe
              src={embedUrl}
              title={video.description}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </AspectRatio>
        </div>
        
        {/* Video Description */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">DIY Product Video</h3>
          <p className="text-gray-700 leading-relaxed">{video.description}</p>
        </div>
      </div>
    </div>
  );
};

const FeaturedVideoSection: React.FC<FeaturedVideoSectionProps> = ({ videos }) => {
  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  
  const OPTIONS: EmblaOptionsType = { 
    loop: true, 
    align: 'start', 
    slidesToScroll: 1,
  };
  
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS, [autoplayPlugin.current]);
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<IFeaturedVideo | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  // Handle autoplay control
  useEffect(() => {
    if (!autoplayPlugin.current) return;
    
    if (isHovered || isPopupOpen) {
      autoplayPlugin.current.stop();
    } else {
      autoplayPlugin.current.reset();
    }
  }, [isHovered, isPopupOpen]);

  // Handle video popup
  const handleVideoClick = (video: IFeaturedVideo) => {
    setSelectedVideo(video);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedVideo(null);
  };

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClosePopup();
      }
    };

    if (isPopupOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isPopupOpen]);

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
    <>
      <div 
        className="w-full mx-auto py-8 sm:py-10 relative px-4 sm:px-6 lg:px-8 max-w-[90%]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">DIY Products Videos</h2>
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
              const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

              return (
                <div 
                  key={String(video._id)} 
                  className="embla__slide flex-[0_0_90%] sm:flex-[0_0_calc(100%/2)] md:flex-[0_0_calc(100%/3)] lg:flex-[0_0_calc(100%/3)] xl:flex-[0_0_calc(100%/3)] px-2 sm:px-3"
                >
                  <Card 
                    className="overflow-hidden h-full flex flex-col shadow hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => handleVideoClick(video)}
                  >
                    <div className="relative">
                      <AspectRatio ratio={16 / 9} className="bg-black">
                        {/* Video Thumbnail */}
                        <img
                          src={thumbnailUrl}
                          alt={video.description}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors duration-300">
                          <div className="relative">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300 shadow-lg">
                              <Play className="h-6 w-6 text-gray-800 ml-1" />
                            </div>
                            
                            {/* Expand icon */}
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Maximize2 className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover hint */}
                        <div className="absolute bottom-2 left-2 right-2 text-center">
                          <p className="text-white text-xs bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Click to watch
                          </p>
                        </div>
                      </AspectRatio>
                    </div>
                    
                    <CardContent className="p-4 flex-grow">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 para group-hover:text-gray-900 transition-colors duration-300">
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

      {/* Video Popup Modal */}
      <VideoPopup 
        video={selectedVideo}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />
    </>
  );
};

export default FeaturedVideoSection;

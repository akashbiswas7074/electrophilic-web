"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { fetchAllWebsiteBanners } from "@/lib/database/actions/banners.actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BannerImage {
  url: string;
  public_id: string;
  platform: "desktop" | "mobile";
  linkUrl?: string;
  altText?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  priority?: number;
  impressions?: number;
  clicks?: number;
}

interface BannerCarouselProps {
  priority?: boolean; // Whether this banner should load with high priority
  skipLazyLoad?: boolean; // Skip lazy loading entirely (load immediately)
  className?: string;
  onBannerLoad?: () => void; // Callback when banners are loaded
}

// Enhanced skeleton loader for banner
const BannerSkeleton = ({ isMobile }: { isMobile: boolean }) => (
  <div className={`relative w-full ${isMobile ? "h-[250px]" : "h-[500px]"} overflow-hidden mb-[20px]`}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer">
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
    
    {/* Skeleton navigation dots */}
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-3 h-3 rounded-full bg-white/30 animate-pulse" />
      ))}
    </div>
    
    {/* Skeleton arrows */}
    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 animate-pulse" />
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 animate-pulse" />
  </div>
);

const BannerCarousel: React.FC<BannerCarouselProps> = ({ 
  priority = true, 
  skipLazyLoad = false,
  className = "",
  onBannerLoad
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [desktopBanners, setDesktopBanners] = useState<BannerImage[]>([]);
  const [mobileBanners, setMobileBanners] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isVisible, setIsVisible] = useState(skipLazyLoad);
  const [hasStartedLoading, setHasStartedLoading] = useState(skipLazyLoad);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const impressionsTracked = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayDuration = 5000; // 5 seconds

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (skipLazyLoad || hasStartedLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          setHasStartedLoading(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: priority ? '200px' : '50px', // Load earlier if priority
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [skipLazyLoad, hasStartedLoading, priority]);

  // Track banner impression once per session
  const trackImpression = useCallback(async (bannerId: string) => {
    // Only track if not already tracked
    if (!impressionsTracked.current.has(bannerId)) {
      try {
        const response = await fetch('/api/banners/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bannerId, type: 'impression' }),
        });
        
        if (!response.ok) {
          console.warn('Failed to track banner impression - server returned:', response.status);
        }
        
        // Mark this banner as impressed regardless of server response
        // to avoid repeated failed requests
        impressionsTracked.current.add(bannerId);
      } catch (error) {
        console.error('Failed to track banner impression:', error);
      }
    }
  }, []);

  // Track banner click
  const trackClick = useCallback(async (bannerId: string) => {
    try {
      await fetch('/api/banners/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId, type: 'click' }),
      });
    } catch (error) {
      console.error('Failed to banner click:', error);
    }
  }, []);

  // Load banners data
  useEffect(() => {
    if (!isVisible && !skipLazyLoad) return;

    const loadBanners = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch desktop banners - these are already filtered and sorted by the backend
        const desktopResult = await fetchAllWebsiteBanners("desktop");
        setDesktopBanners(Array.isArray(desktopResult) ? desktopResult : []);

        // Fetch mobile banners - these are already filtered and sorted by the backend
        const mobileResult = await fetchAllWebsiteBanners("mobile");
        setMobileBanners(Array.isArray(mobileResult) ? mobileResult : []);
        
        // Call onBannerLoad callback if provided
        if (onBannerLoad) {
          onBannerLoad();
        }
      } catch (error) {
        console.error("Failed to load banners:", error);
        setError("Failed to load banner images. Please try again later.");
        setDesktopBanners([]);
        setMobileBanners([]);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, [isVisible, skipLazyLoad, onBannerLoad]);

  // Check mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Initial check
    checkMobileView();

    // Add resize event listener
    window.addEventListener("resize", checkMobileView);
    return () => {
      window.removeEventListener("resize", checkMobileView);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  // Select the appropriate banners based on the current view
  const currentBanners = useCallback(() => {
    if (isMobileView) {
      return mobileBanners.length > 0 ? mobileBanners : desktopBanners;
    } else {
      return desktopBanners.length > 0 ? desktopBanners : mobileBanners;
    }
  }, [isMobileView, desktopBanners, mobileBanners]);

  // Track impression for the current banner
  useEffect(() => {
    const banners = currentBanners();
    if (banners.length > 0 && currentIndex < banners.length) {
      const currentBanner = banners[currentIndex];
      if (currentBanner && currentBanner.public_id) {
        trackImpression(currentBanner.public_id);
      }
    }
  }, [currentIndex, trackImpression, currentBanners]);

  const nextSlide = useCallback(() => {
    const banners = currentBanners();
    if (banners.length > 0) {
      setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }
  }, [currentBanners]);

  const prevSlide = useCallback(() => {
    const banners = currentBanners();
    if (banners.length > 0) {
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }
  }, [currentBanners]);

  // Set up autoplay
  useEffect(() => {
    if (!autoPlay || loading) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      return;
    }

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, autoplayDuration);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, nextSlide, loading]);

  // Reset current index when mobile/desktop state or banner lists change
  useEffect(() => {
    setCurrentIndex(0);
  }, [isMobileView, desktopBanners, mobileBanners]);

  // Handle errors with toast notification
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handle image load tracking
  const handleImageLoad = useCallback((bannerId: string) => {
    setImagesLoaded(prev => new Set(prev).add(bannerId));
  }, []);

  // Show skeleton while not visible or loading
  if (!isVisible || loading) {
    return (
      <div ref={containerRef} className={cn("lazy-loading-container", className)}>
        <BannerSkeleton isMobile={isMobileView} />
      </div>
    );
  }

  const banners = currentBanners();
  if (banners.length === 0) {
    if (error) {
      return (
        <div className={cn(`relative w-full ${isMobileView ? "h-[250px]" : "h-[500px]"} flex items-center justify-center bg-gray-100`, className)}>
          <div className="text-red-500">Error loading banners. Please try again later.</div>
        </div>
      );
    }
    return (
      <div className={cn(`relative w-full ${isMobileView ? "h-[250px]" : "h-[500px]"} flex items-center justify-center bg-gray-100`, className)}>
        <div className="text-gray-500">No banners available.</div>
      </div>
    ); 
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        `relative w-full ${
          isMobileView ? "h-[250px]" : "h-[500px]"
        } overflow-hidden mb-[20px] group animate-fade-in`,
        className
      )}
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
    >
      {banners.map((banner, index) => {
        const BannerWrapper = banner.linkUrl ? 
          ({ children }: { children: React.ReactNode }) => (
            <Link 
              href={banner.linkUrl || '#'} 
              className="block w-full h-full"
              onClick={() => banner.public_id && trackClick(banner.public_id)}
            >
              {children}
            </Link>
          ) : 
          ({ children }: { children: React.ReactNode }) => (
            <div className="w-full h-full">{children}</div>
          );

        const isImageLoaded = imagesLoaded.has(banner.public_id);

        return (
          <div
            key={banner.public_id || index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              currentIndex === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <BannerWrapper>
              {/* Show skeleton until image loads */}
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
              )}
              
              <Image
                src={banner.url}
                alt={banner.altText || `Banner ${index + 1}`}
                fill
                priority={priority && index === 0} // First image gets priority loading
                sizes="(max-width: 768px) 100vw, 1200px"
                className={cn(
                  "object-cover transition-opacity duration-300",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => handleImageLoad(banner.public_id)}
                onError={() => {
                  setError(`Failed to load banner image: ${banner.url}`);
                  handleImageLoad(banner.public_id); // Mark as "loaded" to hide skeleton
                }}
              />
            </BannerWrapper>
          </div>
        );
      })}

      {/* Navigation Controls */}
      <div className={cn(
        "absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2",
        autoPlay ? "mb-4" : ""  // Add margin if progress bar is shown
      )}>
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentIndex === index
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Arrow Navigation - Only visible on hover or on focus for accessibility */}
      <Button 
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        onClick={prevSlide}
        aria-label="Previous banner"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        onClick={nextSlide}
        aria-label="Next banner"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default BannerCarousel;

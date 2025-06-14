"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface DynamicHeroSectionProps {
  data: {
    _id: string;
    title: string;
    subtitle: string;
    longDescription?: string;
    isActive: boolean;
    order: number;
    pattern: string;
    contentAlignment?: string;
    backgroundImage?: string;
    mediaUrl?: string;
    mediaType?: string;
    entryAnimation?: string; // Add entryAnimation to interface
    buttons: Array<{
      _id: string;
      label: string;
      link: string;
      variant: "primary" | "secondary" | "outline" | "ghost";
    }>;
  };
}

// Add new loading and performance hooks
const useIntersectionObserver = (options = {}) => {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px', ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
};

const useImagePreloader = (src: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new window.Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsError(true);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, isError };
};

// Enhanced loading skeleton component
const HeroSkeleton = () => (
  <section className="py-16 md:py-32 min-h-[70vh] animate-pulse">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg animate-shimmer"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-12 w-32 bg-gray-200 rounded animate-shimmer"></div>
            <div className="h-12 w-32 bg-gray-200 rounded animate-shimmer"></div>
          </div>
        </div>
        <div className="aspect-video bg-gray-200 rounded-xl animate-shimmer"></div>
      </div>
    </div>
  </section>
);

// Add missing utility functions
const getButtonVariant = (variant: string) => {
  switch (variant) {
    case 'primary': return 'default';
    case 'secondary': return 'secondary';
    case 'outline': return 'outline';
    case 'ghost': return 'ghost';
    default: return 'default';
  }
};

// Add RichDescription component
const RichDescription = ({ className, content }: { className?: string; content?: string }) => {
  if (!content) return null;
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

// Add analytics tracking
const trackHeroInteraction = (action: string, heroId: string, buttonLabel?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: 'Hero Section',
      event_label: heroId,
      value: buttonLabel || '',
    });
  }
};

// Add performance monitoring hook using browser's performance API
const usePerformanceMonitoring = () => {
  const [loadTime, setLoadTime] = useState<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      startTime.current = performance.now();
      return () => {
        const endTime = performance.now();
        setLoadTime(endTime - startTime.current);
        
        // Track performance metrics
        if ((window as any).gtag) {
          (window as any).gtag('event', 'hero_load_time', {
            event_category: 'Performance',
            value: Math.round(endTime - startTime.current),
          });
        }
      };
    }
  }, []);

  return loadTime;
};

export default function DynamicHeroSection({ data }: DynamicHeroSectionProps) {
  const { 
    title, 
    subtitle, 
    longDescription,
    buttons = [],
    pattern = "standard",
    contentAlignment = "center",
    backgroundImage,
    mediaUrl,
    mediaType = "image",
    entryAnimation = "fadeIn"
  } = data;
  
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO CONDITIONAL HOOKS
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [isVideoLoaded, setVideoLoaded] = useState(false);
  const [videoIsMuted, setVideoIsMuted] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isContentReady, setIsContentReady] = useState(false);
  
  const { ref: heroRef, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });
  const { isLoaded: imageIsLoaded } = useImagePreloader(mediaUrl || '');
  const loadTime = usePerformanceMonitoring();

  // Enhanced button click tracking - MOVED TO TOP LEVEL
  const handleButtonClick = useCallback((button: any) => {
    trackHeroInteraction('button_click', data._id, button.label);
  }, [data._id]);

  // Video controls - MOVED TO TOP LEVEL
  const handleVideoTogglePlay = useCallback(() => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      if (videoIsPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setVideoIsPlaying(!videoIsPlaying);
    }
  }, [videoIsPlaying]);

  const handleVideoToggleMute = useCallback(() => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      video.muted = !videoIsMuted;
      setVideoIsMuted(!videoIsMuted);
    }
  }, [videoIsMuted]);

  const handleVideoPlay = useCallback(() => {
    setVideoIsPlaying(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setVideoIsPlaying(false);
  }, []);

  const handleVideoLoaded = useCallback(() => {
    setVideoLoaded(true);
  }, []);

  // Performance-optimized memoized values
  const memoizedBackgroundStyle = useMemo(() => ({
    backgroundImage: backgroundImage ? 
      `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgroundImage})` : 
      undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: typeof window !== 'undefined' && window.innerWidth > 768 ? 'fixed' : 'scroll',
  }), [backgroundImage]);

  const animationClasses = useMemo(() => {
    if (!hasIntersected) return 'opacity-0 translate-y-8';
    
    const baseClasses = 'opacity-100 translate-y-0 transition-all duration-1000 ease-out';
    
    switch (entryAnimation) {
      case 'slideInLeft': return `${baseClasses} animate-slide-in-left`;
      case 'slideInRight': return `${baseClasses} animate-slide-in-right`;
      case 'slideInUp': return `${baseClasses} animate-slide-in-up`;
      case 'zoomIn': return `${baseClasses} animate-zoom-in`;
      case 'bounceIn': return `${baseClasses} animate-bounce-in`;
      default: return `${baseClasses} animate-fade-in`;
    }
  }, [hasIntersected, entryAnimation]);

  // Content readiness check
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Progressive loading simulation
  useEffect(() => {
    if (hasIntersected) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [hasIntersected]);

  // Early return after all hooks are declared
  if (!isContentReady) {
    return <HeroSkeleton />;
  }

  // Enhanced video component with controls
  const VideoComponent = ({ src, title }: { src: string; title: string }) => (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl group">
      <video
        src={src}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onLoadedData={handleVideoLoaded}
        muted={videoIsMuted}
        loop
        playsInline
        preload="metadata"
      />
      
      {/* Enhanced video controls overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleVideoTogglePlay}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-0"
            >
              {videoIsPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleVideoToggleMute}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-0"
            >
              {videoIsMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
          </div>
          
          {/* Video progress indicator */}
          <div className="text-white text-sm bg-black/30 px-2 py-1 rounded">
            HD
          </div>
        </div>
      </div>

      {/* Loading overlay for video */}
      {!isVideoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-white">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Loading video...</span>
          </div>
        </div>
      )}
    </div>
  );

  // Enhanced image component with progressive loading
  const ImageComponent = ({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) => (
    <div className="relative aspect-video md:aspect-auto md:h-[400px] w-full overflow-hidden rounded-2xl shadow-xl group">
      <div className={cn(
        "relative w-full h-full transition-all duration-500",
        imageIsLoaded ? "opacity-100" : "opacity-0"
      )}>
        <Image 
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          quality={90}
          onLoad={() => setLoadingProgress(100)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
      </div>
      
      {/* Progressive loading overlay */}
      {!imageIsLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-shimmer flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading image...</div>
        </div>
      )}
    </div>
  );

  // Render based on pattern type
  switch (pattern) {
    case 'dont-miss': 
      return (
        <section className="bg-black text-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                  {title}
                </h2>
                <p className="text-lg md:text-xl mb-8 text-gray-300">
                  {subtitle}
                </p>

                {buttons && buttons.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {buttons.map((button) => (
                      <Link href={button.link} key={button._id}>
                        <Button
                          variant={getButtonVariant(button.variant) as any}
                          size="lg"
                          onClick={() => handleButtonClick(button)}
                          className={cn(
                            "min-w-[160px] font-medium text-base",
                            button.variant === "primary" &&
                              "bg-white text-black hover:bg-gray-200",
                            button.variant === "secondary" &&
                              "bg-gray-800 text-white border border-white hover:bg-gray-700"
                          )}
                        >
                          {button.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {mediaUrl && (
                <div className="md:w-1/2">
                  {mediaType === 'video' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                        onPlay={handleVideoPlay}
                        onLoadedData={() => setVideoLoaded(true)}
                      />
                      {!videoIsPlaying && isVideoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transform hover:scale-105 transition-all duration-300 shadow-lg">
                            <div className="ml-2 w-0 h-0 border-t-10 border-t-transparent border-l-16 border-l-black border-b-10 border-b-transparent"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video md:aspect-auto md:h-[400px] w-full overflow-hidden rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                      <Image 
                        src={mediaUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      );
      
    case 'brand-control':
      return (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {mediaUrl && (
                <div className="md:w-1/2 order-2 md:order-1">
                  {mediaType === 'video' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                        onPlay={handleVideoPlay}
                        onLoadedData={() => setVideoLoaded(true)}
                      />
                      {!videoIsPlaying && isVideoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transform hover:scale-105 transition-all duration-300 shadow-lg">
                            <div className="ml-2 w-0 h-0 border-t-10 border-t-transparent border-l-16 border-l-black border-b-10 border-b-transparent"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video md:aspect-auto md:h-[400px] w-full overflow-hidden rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                      <Image 
                        src={mediaUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60"></div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="md:w-1/2 order-1 md:order-2">
                <div className="max-w-xl">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 relative">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">{title}</span>
                    <div className="absolute -bottom-2 left-0 w-24 h-1 bg-primary rounded-full"></div>
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    {subtitle}
                  </p>

                  <RichDescription className="text-gray-700 mb-8" content={longDescription} />

                  {buttons && buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {buttons.map((button) => (
                        <Link href={button.link} key={button._id}>
                          <Button
                            variant={getButtonVariant(button.variant) as any}
                            size="lg"
                            onClick={() => handleButtonClick(button)}
                            className={cn(
                              "min-w-[160px] font-medium text-base shadow-md hover:shadow-lg transition-all duration-300",
                              button.variant === "primary" &&
                                "bg-black hover:bg-gray-800",
                              button.variant === "secondary" &&
                                "bg-white text-black border border-black hover:bg-gray-100"
                            )}
                          >
                            {button.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
      
    case 'partner':
      return (
        <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <div className="max-w-xl">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 relative">
                    <span>{title}</span>
                    <div className="absolute -bottom-2 left-0 w-24 h-1 bg-primary rounded-full"></div>
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    {subtitle}
                  </p>

                  <RichDescription className="text-gray-700 mb-8" content={longDescription} />

                  {buttons && buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {buttons.map((button) => (
                        <Link href={button.link} key={button._id}>
                          <Button
                            variant={getButtonVariant(button.variant) as any}
                            size="lg"
                            onClick={() => handleButtonClick(button)}
                            className={cn(
                              "min-w-[160px] font-medium text-base shadow-md hover:shadow-lg transition-all duration-300",
                              button.variant === "primary" &&
                                "bg-primary hover:bg-primary/90",
                              button.variant === "secondary" &&
                                "bg-white text-black border border-primary hover:bg-gray-50"
                            )}
                          >
                            {button.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {mediaUrl && (
                <div className="md:w-1/2">
                  {mediaType === 'video' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                        onPlay={handleVideoPlay}
                        onLoadedData={() => setVideoLoaded(true)}
                      />
                      {!videoIsPlaying && isVideoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transform hover:scale-105 transition-all duration-300 shadow-lg">
                            <div className="ml-2 w-0 h-0 border-t-10 border-t-transparent border-l-16 border-l-black border-b-10 border-b-transparent"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video md:aspect-square w-full overflow-hidden rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                      <Image 
                        src={mediaUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      );
      
    default: // standard pattern
      return (
        <section 
          ref={heroRef}
          className={cn(
            "py-16 md:py-32 flex items-center justify-center relative overflow-hidden min-h-[70vh] will-change-transform",
            backgroundImage ? "text-white" : "bg-gradient-to-br from-gray-50 to-white",
            animationClasses
          )}
          style={memoizedBackgroundStyle}
        >
          {backgroundImage && (
            <div className="absolute inset-0 bg-black/30"></div>
          )}
          
          <div className="container mx-auto px-4 relative z-10 staggered-load">
            <div className={cn(
              "text-center max-w-4xl mx-auto space-y-8",
              contentAlignment === 'left' && "text-left ml-0",
              contentAlignment === 'right' && "text-right mr-0"
            )}>
              {subtitle && (
                <p className="text-xl md:text-2xl opacity-90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  {subtitle}
                </p>
              )}
              <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {title}
              </h1>
              {longDescription && (
                <div className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <RichDescription content={longDescription} />
                </div>
              )}
              
              {buttons && buttons.length > 0 && (
                <div className="flex flex-wrap gap-6 justify-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
                  {buttons.map((button, index) => (
                    <Link key={index} href={button.link}>
                      <Button
                        size="lg"
                        onClick={() => handleButtonClick(button)}
                        className={cn(
                          "transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-3",
                          button.variant === "primary" &&
                            "bg-primary hover:bg-primary/90",
                          button.variant === "secondary" &&
                            "bg-white text-black border border-primary hover:bg-gray-50"
                        )}
                      >
                        {button.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
              
              {mediaUrl && (
                <div className="mt-12 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '1s' }}>
                  {mediaType === 'video' ? (
                    <VideoComponent src={mediaUrl} title={title} />
                  ) : (
                    <ImageComponent src={mediaUrl} alt={title} />
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      );
  }
}
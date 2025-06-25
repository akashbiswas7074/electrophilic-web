"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    titleColor?: string;
    descriptionColor?: string;
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    entryAnimation?: string;
    layoutId?: string; // Add layoutId for section navigation
    buttons: Array<{
      _id?: string;
      label: string;
      link: string;
      variant: "primary" | "secondary" | "outline" | "ghost";
    }>;
  };
}

// Fixed intersection observer hook with proper typing
const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
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
  }, [hasIntersected, options]);

  return { ref, isIntersecting, hasIntersected };
};

// Enhanced loading skeleton component
const HeroSkeleton = () => (
  <section className="py-16 md:py-32 min-h-[80vh] animate-pulse">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-5xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="h-16 md:h-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl mx-auto max-w-4xl"></div>
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mx-auto max-w-2xl"></div>
        </div>
        <div className="flex justify-center gap-4">
          <div className="h-14 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"></div>
          <div className="h-14 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"></div>
        </div>
        <div className="aspect-video max-w-4xl mx-auto bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl"></div>
      </div>
    </div>
  </section>
);

// Utility function to map button variants
const getButtonVariant = (variant: string): "default" | "secondary" | "outline" | "ghost" => {
  switch (variant) {
    case 'primary': return 'default';
    case 'secondary': return 'secondary';
    case 'outline': return 'outline';
    case 'ghost': return 'ghost';
    default: return 'default';
  }
};

// Analytics tracking function
const trackHeroInteraction = (action: string, heroId: string, buttonLabel?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: 'Hero Section',
      event_label: heroId,
      value: buttonLabel || '',
    });
  }
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
    titleColor,
    descriptionColor,
    buttonTextColor,
    buttonBackgroundColor,
    entryAnimation = "fadeIn",
    layoutId // Extract layoutId for section navigation
  } = data;
  
  // Generate a fallback section ID based on title or pattern if layoutId is not provided
  const generateSectionId = useCallback(() => {
    if (layoutId) return layoutId;
    
    // Create a slug from title or use pattern as fallback
    const baseText = title || pattern || 'hero-section';
    return baseText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .slice(0, 50); // Limit length
  }, [layoutId, title, pattern]);

  const sectionId = generateSectionId();

  // State management
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [isVideoLoaded, setVideoLoaded] = useState(false);
  const [videoIsMuted, setVideoIsMuted] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [backgroundImageError, setBackgroundImageError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: heroRef, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

  // Error handlers
  const handleImageError = useCallback(() => {
    console.warn('Hero section image failed to load:', mediaUrl);
    setImageError(true);
    setIsImageLoaded(true);
  }, [mediaUrl]);

  const handleBackgroundImageError = useCallback(() => {
    console.warn('Hero section background image failed to load:', backgroundImage);
    setBackgroundImageError(true);
  }, [backgroundImage]);

  // Button click tracking
  const handleButtonClick = useCallback((button: any) => {
    trackHeroInteraction('button_click', data._id, button.label);
  }, [data._id]);

  // Video controls
  const handleVideoToggle = useCallback(() => {
    if (videoRef.current) {
      if (videoIsPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setVideoIsPlaying(!videoIsPlaying);
    }
  }, [videoIsPlaying]);

  const handleVideoMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoIsMuted;
      setVideoIsMuted(!videoIsMuted);
    }
  }, [videoIsMuted]);

  // Animation system
  const getAnimationClass = useCallback(() => {
    const baseClass = 'transition-all duration-700 ease-out';
    if (!hasIntersected) return `${baseClass} opacity-0 translate-y-8`;
    
    switch (entryAnimation) {
      case 'slideInLeft': return `${baseClass} opacity-100 transform translate-x-0`;
      case 'slideInRight': return `${baseClass} opacity-100 transform translate-x-0`;
      case 'slideInUp': return `${baseClass} opacity-100 transform translate-y-0`;
      case 'zoomIn': return `${baseClass} opacity-100 transform scale-100`;
      case 'bounceIn': return `${baseClass} opacity-100 transform scale-100`;
      default: return `${baseClass} opacity-100 transform translate-y-0`;
    }
  }, [hasIntersected, entryAnimation]);

  // Media component
  const MediaComponent = useCallback(({ className = "" }: { className?: string }) => {
    if (!mediaUrl) return null;

    return (
      <div className={cn("relative overflow-hidden rounded-2xl shadow-2xl group", className)}>
        {mediaType === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              muted={videoIsMuted}
              loop
              playsInline
              onPlay={() => setVideoIsPlaying(true)}
              onPause={() => setVideoIsPlaying(false)}
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => console.error('Video failed to load')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleVideoToggle}
                    className="h-10 w-10 p-0 bg-white/20 backdrop-blur-md hover:bg-white/30 border-0 rounded-full"
                  >
                    {videoIsPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleVideoMute}
                    className="h-10 w-10 p-0 bg-white/20 backdrop-blur-md hover:bg-white/30 border-0 rounded-full"
                  >
                    {videoIsMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </Button>
                </div>
                <div className="bg-black/30 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  HD
                </div>
              </div>
            </div>
            {!isVideoLoaded && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <div className="text-gray-500 text-lg">Loading video...</div>
              </div>
            )}
          </>
        ) : (
          <div className="relative">
            {imageError ? (
              <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl">
                <div className="text-center space-y-4 p-8">
                  <div className="w-16 h-16 mx-auto bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-gray-600">
                    <p className="font-medium">Image Preview</p>
                    <p className="text-sm text-gray-500">Content showcase</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Image 
                  src={mediaUrl} 
                  alt={title || 'Hero image'} 
                  width={800} 
                  height={600}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={handleImageError}
                  priority
                />
                {!isImageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="text-gray-500 text-lg">Loading image...</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5"></div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }, [mediaUrl, mediaType, title, imageError, isImageLoaded, handleImageError, videoIsMuted, videoIsPlaying, isVideoLoaded, handleVideoToggle, handleVideoMute]);

  // Enhanced button component with comprehensive color support
  const EnhancedButton = useCallback(({ button, index }: { button: any; index: number }) => {
    // Calculate dynamic styles based on custom colors and context
    const getButtonStyles = () => {
      const baseStyles: React.CSSProperties = {
        animationDelay: `${index * 100}ms`,
        transition: 'all 0.3s ease'
      };

      // Apply custom colors if provided
      if (buttonBackgroundColor || buttonTextColor) {
        return {
          ...baseStyles,
          backgroundColor: buttonBackgroundColor || undefined,
          color: buttonTextColor || undefined,
          borderColor: buttonBackgroundColor || undefined,
          // Ensure hover states work with custom colors
          '--tw-bg-opacity': '1',
          '--custom-bg-color': buttonBackgroundColor || 'transparent',
          '--custom-text-color': buttonTextColor || 'inherit'
        };
      }

      // Default styles based on variant and context
      switch (button.variant) {
        case 'primary':
          if (backgroundImage && !backgroundImageError) {
            return {
              ...baseStyles,
              backgroundColor: 'white',
              color: 'black',
              borderColor: 'white'
            };
          }
          return {
            ...baseStyles,
            backgroundColor: '#000000',
            color: 'white',
            borderColor: '#000000'
          };

        case 'secondary':
          if (backgroundImage && !backgroundImageError) {
            return {
              ...baseStyles,
              backgroundColor: 'transparent',
              color: 'white',
              borderColor: 'white'
            };
          }
          return baseStyles; // Use default shadcn styling

        case 'outline':
          if (backgroundImage && !backgroundImageError) {
            return {
              ...baseStyles,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.5)'
            };
          }
          return baseStyles; // Use default shadcn styling

        case 'ghost':
          if (backgroundImage && !backgroundImageError) {
            return {
              ...baseStyles,
              backgroundColor: 'transparent',
              color: 'white'
            };
          }
          return baseStyles; // Use default shadcn styling

        default:
          return baseStyles;
      }
    };

    // Calculate CSS classes for proper styling
    const getButtonClasses = () => {
      let classes = "transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-4 text-base font-semibold rounded-lg min-w-[160px]";
      
      // Add custom hover effects based on colors
      if (buttonBackgroundColor || buttonTextColor) {
        classes += " hover:opacity-90";
      } else {
        // Context-specific styling when no custom colors
        if (backgroundImage && !backgroundImageError) {
          switch (button.variant) {
            case 'primary':
              classes += " hover:bg-gray-100 border-2 border-white";
              break;
            case 'secondary':
              classes += " hover:bg-white hover:text-black backdrop-blur-sm border-2 border-white";
              break;
            case 'outline':
              classes += " hover:bg-white/20 backdrop-blur-sm border-2 border-white/50";
              break;
            case 'ghost':
              classes += " hover:bg-white/20 backdrop-blur-sm";
              break;
          }
        } else {
          // Non-background image styling
          switch (button.variant) {
            case 'primary':
              classes += " hover:bg-gray-800 border-2 border-black";
              break;
            case 'secondary':
              classes += " hover:bg-gray-100 border-2 border-gray-300";
              break;
            case 'outline':
              classes += " hover:bg-gray-50 hover:border-gray-400 border-2 border-gray-300";
              break;
            case 'ghost':
              classes += " hover:bg-gray-100";
              break;
          }
        }
      }

      return classes;
    };

    return (
      <Link key={button._id || index} href={button.link || '#'}>
        <Button
          size="lg"
          variant={getButtonVariant(button.variant)}
          onClick={() => handleButtonClick(button)}
          className={cn(getButtonClasses())}
          style={getButtonStyles()}
          onMouseEnter={(e) => {
            // Enhanced hover effects for custom colors
            if (buttonBackgroundColor && buttonTextColor) {
              const target = e.target as HTMLElement;
              target.style.filter = 'brightness(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            // Reset hover effects
            if (buttonBackgroundColor && buttonTextColor) {
              const target = e.target as HTMLElement;
              target.style.filter = 'brightness(1)';
            }
          }}
        >
          {button.label}
        </Button>
      </Link>
    );
  }, [backgroundImage, backgroundImageError, buttonBackgroundColor, buttonTextColor, handleButtonClick]);

  // Content readiness effect
  useEffect(() => {
    const timer = setTimeout(() => setIsContentReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isContentReady) {
    return <HeroSkeleton />;
  }

  // Pattern-specific rendering
  const renderPatternContent = () => {
    const commonProps = {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false)
    };

    switch (pattern?.toLowerCase()?.trim()) {
      case 'dont-miss':
        return (
          <section 
            id={sectionId}
            ref={heroRef}
            {...commonProps}
            className={cn("bg-gray-900 text-white py-16 md:py-20 relative overflow-hidden", getAnimationClass())}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-white to-transparent rounded-full -translate-x-48 -translate-y-48"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-white to-transparent rounded-full translate-x-48 translate-y-48"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2 space-y-8">
                  {title && (
                    <h2 
                      className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-wider leading-tight"
                      style={{ color: titleColor || 'white' }}
                    >
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p 
                      className="text-lg md:text-xl leading-relaxed opacity-90"
                      style={{ color: descriptionColor || 'rgba(255,255,255,0.9)' }}
                    >
                      {subtitle}
                    </p>
                  )}
                  {longDescription && (
                    <p className="text-base opacity-75 max-w-md leading-relaxed">
                      {longDescription}
                    </p>
                  )}
                  {buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {buttons.map((button, index) => (
                        <EnhancedButton key={index} button={button} index={index} />
                      ))}
                    </div>
                  )}
                </div>
                {mediaUrl && (
                  <div className="md:w-1/2">
                    <MediaComponent className="aspect-video md:aspect-square" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'brand-control':
        return (
          <section 
            id={sectionId}
            ref={heroRef}
            {...commonProps}
            className={cn("py-16 md:py-24 bg-white relative overflow-hidden", getAnimationClass())}
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-50 to-transparent rounded-full translate-x-36 -translate-y-36"></div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-12">
                {mediaUrl && (
                  <div className="md:w-1/2 order-2 md:order-1">
                    <MediaComponent className="aspect-video" />
                  </div>
                )}
                <div className="md:w-1/2 order-1 md:order-2 space-y-8">
                  {title && (
                    <h2 
                      className="text-3xl md:text-5xl font-bold leading-tight relative"
                      style={{ color: titleColor || '#1f2937' }}
                    >
                      {title}
                      <div className="absolute -bottom-2 left-0 w-24 h-1 bg-blue-500 rounded-full"></div>
                    </h2>
                  )}
                  {subtitle && (
                    <p 
                      className="text-lg md:text-xl leading-relaxed"
                      style={{ color: descriptionColor || '#6b7280' }}
                    >
                      {subtitle}
                    </p>
                  )}
                  {longDescription && (
                    <p className="text-base text-gray-600 leading-relaxed max-w-md">
                      {longDescription}
                    </p>
                  )}
                  {buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {buttons.map((button, index) => (
                        <EnhancedButton key={index} button={button} index={index} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );

      case 'partner':
        return (
          <section 
            id={sectionId}
            ref={heroRef}
            {...commonProps}
            className={cn("py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden", getAnimationClass())}
          >
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-100 to-transparent rounded-full -translate-x-48 -translate-y-48"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-100 to-transparent rounded-full translate-x-48 translate-y-48"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2 space-y-8">
                  {title && (
                    <h2 
                      className="text-3xl md:text-5xl font-bold leading-tight relative"
                      style={{ color: titleColor || '#1f2937' }}
                    >
                      {title}
                      <div className="absolute -bottom-2 left-0 w-24 h-1 bg-purple-500 rounded-full"></div>
                    </h2>
                  )}
                  {subtitle && (
                    <p 
                      className="text-lg md:text-xl leading-relaxed"
                      style={{ color: descriptionColor || '#6b7280' }}
                    >
                      {subtitle}
                    </p>
                  )}
                  {longDescription && (
                    <p className="text-base text-gray-600 leading-relaxed max-w-md">
                      {longDescription}
                    </p>
                  )}
                  {buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {buttons.map((button, index) => (
                        <EnhancedButton key={index} button={button} index={index} />
                      ))}
                    </div>
                  )}
                </div>
                {mediaUrl && (
                  <div className="md:w-1/2">
                    <MediaComponent className="aspect-video" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      default: // Standard pattern
        return (
          <section 
            id={sectionId}
            ref={heroRef}
            {...commonProps}
            className={cn(
              "py-16 md:py-32 flex items-center justify-center relative overflow-hidden min-h-[80vh]",
              (backgroundImage && !backgroundImageError) ? "text-white" : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
              getAnimationClass()
            )}
            style={{
              backgroundImage: (backgroundImage && !backgroundImageError) ? 
                `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgroundImage})` : 
                undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {backgroundImage && (
              <img
                src={backgroundImage}
                alt=""
                className="hidden"
                onError={handleBackgroundImageError}
              />
            )}
            
            {(backgroundImage && !backgroundImageError) && (
              <div className="absolute inset-0 bg-black/40"></div>
            )}
            
            {(!backgroundImage || backgroundImageError) && (
              <>
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-x-48 -translate-y-48"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50 translate-x-48 translate-y-48"></div>
              </>
            )}
            
            <div className="container mx-auto px-4 relative z-10">
              <div className={cn(
                "text-center max-w-5xl mx-auto space-y-10",
                contentAlignment === 'left' && "text-left ml-0 max-w-4xl",
                contentAlignment === 'right' && "text-right mr-0 max-w-4xl"
              )}>
                
                <div className="space-y-6">
                  {title && (
                    <h1 
                      className={cn(
                        "text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight",
                        backgroundImage ? "text-white drop-shadow-2xl" : "text-gray-900"
                      )}
                      style={{ 
                        color: titleColor || undefined,
                        textShadow: backgroundImage ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                      }}
                    >
                      {title}
                    </h1>
                  )}
                  
                  {subtitle && (
                    <p 
                      className={cn(
                        "text-lg md:text-xl lg:text-2xl font-medium leading-relaxed max-w-3xl mx-auto",
                        backgroundImage ? "text-white/90 drop-shadow-lg" : "text-gray-600",
                        contentAlignment === 'left' && "mx-0",
                        contentAlignment === 'right' && "mx-0"
                      )}
                      style={{ 
                        color: descriptionColor || undefined
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>

                {longDescription && (
                  <div 
                    className={cn(
                      "text-base md:text-lg leading-relaxed max-w-2xl mx-auto",
                      backgroundImage ? "text-white/80" : "text-gray-700",
                      contentAlignment === 'left' && "mx-0",
                      contentAlignment === 'right' && "mx-0"
                    )}
                    style={{ 
                      color: descriptionColor || undefined
                    }}
                  >
                    {longDescription}
                  </div>
                )}
                
                {buttons && buttons.length > 0 && (
                  <div 
                    className={cn(
                      "flex flex-wrap gap-4 md:gap-6",
                      contentAlignment === 'center' && "justify-center",
                      contentAlignment === 'left' && "justify-start",
                      contentAlignment === 'right' && "justify-end"
                    )}
                  >
                    {buttons.map((button, index) => (
                      <EnhancedButton key={index} button={button} index={index} />
                    ))}
                  </div>
                )}
                
                {mediaUrl && (
                  <div className="mt-16 max-w-4xl mx-auto">
                    <MediaComponent className="aspect-video" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
    }
  };
  
  return renderPatternContent();
}
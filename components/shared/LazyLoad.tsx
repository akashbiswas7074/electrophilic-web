"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyLoadProps {
  children: React.ReactNode;
  height: string | number;
  className?: string;
  loadingClassName?: string;
  loadingAnimation?: 'spinner' | 'pulse' | 'skeleton' | 'fade';
  skipLazyLoad?: boolean; // Skip lazy loading for priority content
  threshold?: number; // Intersection observer threshold (0-1)
}

const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  height,
  className = '',
  loadingClassName = '',
  loadingAnimation = 'spinner',
  skipLazyLoad = false,
  threshold = 0.1
}) => {
  const [isVisible, setIsVisible] = useState(skipLazyLoad);
  const [isLoaded, setIsLoaded] = useState(skipLazyLoad);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipLazyLoad) {
      setIsVisible(true);
      setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // When the element becomes visible
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Load slightly before element is in view
        threshold: threshold,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [skipLazyLoad, threshold]);

  // Simulate loading delay for smoother transitions
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isVisible && !isLoaded) {
      timeout = setTimeout(() => {
        setIsLoaded(true);
      }, 500); // Small delay for smoother loading animation
    }
    
    return () => clearTimeout(timeout);
  }, [isVisible, isLoaded]);

  // Render different loading states based on the animation type
  const renderLoading = () => {
    switch (loadingAnimation) {
      case 'spinner':
        return (
          <div className={cn("flex items-center justify-center w-full h-full", loadingClassName)}>
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        );
      case 'pulse':
        return (
          <div className={cn("w-full h-full animate-pulse bg-gray-200 rounded-md", loadingClassName)} />
        );
      case 'skeleton':
        return (
          <div className={cn("w-full h-full", loadingClassName)}>
            <div className="w-full h-full animate-pulse bg-gray-200 rounded-md overflow-hidden">
              <div className="shimmer-effect" />
            </div>
          </div>
        );
      case 'fade':
        return (
          <div className={cn("w-full h-full bg-gray-100", loadingClassName)} />
        );
      default:
        return (
          <div className={cn("flex items-center justify-center w-full h-full", loadingClassName)}>
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={cn("relative transition-all duration-500", className)}
      style={{ minHeight: isLoaded ? 'auto' : height }}
    >
      {isLoaded ? (
        <div className="animate-fade-in">
          {children}
        </div>
      ) : isVisible ? (
        renderLoading()
      ) : (
        renderLoading()
      )}
    </div>
  );
};

export default LazyLoad;
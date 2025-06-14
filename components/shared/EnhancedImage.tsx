"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface EnhancedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  showLoadingSpinner?: boolean;
  placeholderType?: 'product' | 'banner' | 'avatar' | 'logo' | 'general';
}

// High-quality placeholder images from reliable sources
const PLACEHOLDER_URLS = {
  product: 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=Product+Image',
  banner: 'https://via.placeholder.com/1200x400/f3f4f6/9ca3af?text=Banner+Image',
  avatar: 'https://via.placeholder.com/150x150/f3f4f6/9ca3af?text=User+Avatar',
  logo: 'https://via.placeholder.com/200x100/f3f4f6/9ca3af?text=Logo',
  general: 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=Image+Not+Available'
};

// Alternative placeholder service in case primary fails
const FALLBACK_PLACEHOLDER_URLS = {
  product: 'https://picsum.photos/400/400?grayscale&blur=1',
  banner: 'https://picsum.photos/1200/400?grayscale&blur=1',
  avatar: 'https://picsum.photos/150/150?grayscale&blur=1',
  logo: 'https://picsum.photos/200/100?grayscale&blur=1',
  general: 'https://picsum.photos/300/300?grayscale&blur=1'
};

export default function EnhancedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes,
  priority = false,
  loading = 'lazy',
  objectFit = 'cover',
  onLoad,
  onError,
  showLoadingSpinner = true,
  placeholderType = 'general'
}: EnhancedImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setImageState('loading');
    setRetryCount(0);
  }, [src]);

  const handleLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleError = () => {
    if (retryCount < maxRetries) {
      // Try fallback placeholder on first retry
      if (retryCount === 0) {
        setCurrentSrc(FALLBACK_PLACEHOLDER_URLS[placeholderType]);
        setRetryCount(1);
        return;
      }
      // Try primary placeholder on second retry
      if (retryCount === 1) {
        setCurrentSrc(PLACEHOLDER_URLS[placeholderType]);
        setRetryCount(2);
        return;
      }
    }
    
    setImageState('error');
    onError?.();
  };

  const containerClassName = cn(
    'relative overflow-hidden',
    imageState === 'loading' && showLoadingSpinner && 'bg-gray-100',
    className
  );

  const imageClassName = cn(
    'transition-all duration-300 ease-in-out',
    imageState === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
    objectFit === 'contain' && 'object-contain',
    objectFit === 'cover' && 'object-cover',
    objectFit === 'fill' && 'object-fill',
    objectFit === 'none' && 'object-none',
    objectFit === 'scale-down' && 'object-scale-down'
  );

  return (
    <div className={containerClassName}>
      {/* Loading Spinner */}
      {imageState === 'loading' && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="relative">
            {/* Main spinner */}
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            {/* Pulsing ring */}
            <div className="absolute -inset-2 border-2 border-gray-200 rounded-full animate-pulse opacity-50"></div>
          </div>
        </div>
      )}

      {/* Shimmer effect during loading */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
      )}

      {/* Main Image */}
      <Image
        ref={imageRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        loading={loading}
        className={imageClassName}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Error State */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
          <div className="w-12 h-12 mb-2 opacity-50">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xs text-center px-2">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
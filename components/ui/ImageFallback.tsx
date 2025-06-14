'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface ImageFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  fallbackSrc?: string;
  alt: string;
  fallbackClassName?: string;
}

export const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  className,
  fallbackClassName,
  ...props
}) => {
  const [error, setError] = React.useState(false);

  // For logo.png or error.png, generate a text-based fallback
  const generateTextFallback = () => {
    if (src.includes('logo.png')) {
      return 'Electrophilic';
    } else if (src.includes('error.png')) {
      return 'Error';
    }
    return alt;
  };

  if (error) {
    if (fallbackSrc) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt}
          className={cn(className, fallbackClassName)}
          {...props}
        />
      );
    }
    
    // Text fallback for specific images
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground font-semibold",
          className, 
          fallbackClassName
        )}
        style={{ width: props.width, height: props.height }}
      >
        {generateTextFallback()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
};

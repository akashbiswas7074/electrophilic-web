"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BannerProps {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  altText: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
  position?: 'top' | 'middle' | 'bottom' | 'featured';
  priority?: boolean;
  className?: string;
  trackImpression?: boolean;
  trackClicks?: boolean;
}

/**
 * Responsive banner component with tracking capabilities
 */
const Banner = ({
  id,
  imageUrl,
  mobileImageUrl,
  altText,
  linkUrl,
  title,
  subtitle,
  position = 'middle',
  priority = false,
  className,
  trackImpression = true,
  trackClicks = true
}: BannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // Track when banner becomes visible
  useEffect(() => {
    if (!trackImpression || hasTrackedImpression) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          
          // Track impression
          fetch('/api/banners/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              bannerId: id,
              type: 'impression'
            }),
          }).catch(err => console.error('Failed to track banner impression:', err));
          
          setHasTrackedImpression(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // Banner is considered viewed when 50% visible
    );
    
    const timer = setTimeout(() => {
      const element = document.getElementById(`banner-${id}`);
      if (element) observer.observe(element);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [id, trackImpression, hasTrackedImpression]);

  const handleClick = () => {
    if (!trackClicks) return;
    
    // Track click
    fetch('/api/banners/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        bannerId: id,
        type: 'click'
      }),
    }).catch(err => console.error('Failed to track banner click:', err));
  };

  const imageComponent = (
    <div className="relative w-full h-full">
      <Image
        src={mobileImageUrl || imageUrl}
        alt={altText}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        priority={priority}
        className={cn(
          "object-cover rounded-lg transition-opacity duration-500",
          isVisible ? "opacity-100" : "opacity-0",
        )}
      />
      
      {(title || subtitle) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/30 text-white rounded-lg">
          {title && <h3 className="text-2xl md:text-3xl font-bold mb-2 text-center">{title}</h3>}
          {subtitle && <p className="text-sm md:text-base text-center max-w-md">{subtitle}</p>}
        </div>
      )}
    </div>
  );

  return (
    <div 
      id={`banner-${id}`}
      className={cn(
        "w-full overflow-hidden rounded-lg shadow-md animate-fadeIn",
        position === 'featured' ? 'aspect-[21/9] md:aspect-[21/9]' : 'aspect-[5/2] md:aspect-[5/1]',
        className
      )}
    >
      {linkUrl ? (
        <Link href={linkUrl} onClick={handleClick} className="block w-full h-full">
          {imageComponent}
        </Link>
      ) : (
        imageComponent
      )}
    </div>
  );
};

export default Banner;
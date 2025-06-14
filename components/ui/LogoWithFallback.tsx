'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LogoWithFallbackProps {
  src: string;
  fallbackText?: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

const LogoWithFallback: React.FC<LogoWithFallbackProps> = ({
  src,
  fallbackText = 'Electrophilic',
  width = 120,
  height = 40,
  alt = 'Logo',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [logoUrl, setLogoUrl] = useState(src);

  useEffect(() => {
    // Try to fetch the logo from API as a backup
    const fetchLogoFromApi = async () => {
      try {
        const response = await fetch('/api/website/logo');
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
            setImgError(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch logo from API:', error);
      }
    };

    // If the default logo fails, try to get it from API
    if (imgError && src === '/images/logo.png') {
      fetchLogoFromApi();
    }
  }, [imgError, src]);

  if (imgError) {
    return (
      <div 
        className={`flex items-center justify-center text-primary font-bold text-lg ${className}`}
        style={{ width, height }}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <Image
      src={logoUrl}
      width={width}
      height={height}
      alt={alt}
      className={className}
      onError={() => setImgError(true)}
    />
  );
};

export default LogoWithFallback;

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSiteConfig } from '@/hooks/use-site-config';

const Logo: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const siteConfig = useSiteConfig();

  useEffect(() => {
    // Delay the text display to implement lazy loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Link href="/" className="flex items-center space-x-2">
      {siteConfig.logo.useImage && (
        <Image
          src={siteConfig.logo.imagePath}
          alt={siteConfig.name}
          width={32}
          height={32}
          className="h-8 w-8"
        />
      )}
      {siteConfig.logo.showText && (
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {isLoaded ? siteConfig.logo.text : (
            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
          )}
        </span>
      )}
    </Link>
  );
};

export default Logo;
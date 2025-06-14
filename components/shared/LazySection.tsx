"use client";

import React from 'react';
import LazyLoad from './LazyLoad';

interface LazySectionProps {
  children: React.ReactNode;
  minHeight?: number | string;
  className?: string;
  loadingClassName?: string;
  loadingAnimation?: 'spinner' | 'pulse' | 'skeleton' | 'fade';
  priority?: boolean; // Set true for above-the-fold content that should load immediately
  threshold?: number; // Intersection observer threshold (0-1)
}

const LazySection: React.FC<LazySectionProps> = ({
  children,
  minHeight = 400,
  className = '',
  loadingClassName = '',
  loadingAnimation = 'spinner',
  priority = false,
  threshold = 0.1
}) => {
  return (
    <LazyLoad
      height={minHeight}
      className={className}
      loadingClassName={loadingClassName}
      loadingAnimation={loadingAnimation}
      skipLazyLoad={priority}
      threshold={threshold}
    >
      {children}
    </LazyLoad>
  );
};

export default LazySection;
"use client";

import React, { useState, useCallback } from 'react';
import LazySection from '@/components/shared/LazySection';
import LazyProductGrid from '@/components/shared/LazyProductGrid';
import LazyLoad from '@/components/shared/LazyLoad';
import BestSellingProducts from "@/components/sections/BestSellingProducts";
import BannerCarousel from "@/components/shared/home/BannerCarousel";
import StrengthTakesSweat from "@/components/shared/home/StrengthTakesSweat"; 
import FeaturedProducts from "@/components/shared/home/FeaturedProducts";
import SpecialCombos from "@/components/shared/home/SpecialCombos";
import DynamicHeroSection from "@/components/shared/home/DynamicHeroSection";
import FeaturedShowcase from "@/components/sections/FeaturedShowcase";
import CategoryShowcase from "@/components/sections/CategoryShowcase";
import SubCategoryShowcase from "@/components/sections/SubCategoryShowcase";
import ToughShoeHero from "@/components/shared/home/ToughShoeHero";
import FeaturedVideoSection from "@/components/shared/home/FeaturedVideoSection";
import AllProductsSection from "@/components/shared/home/AllProductsSection";
import CategoryProductSection from "@/components/sections/CategoryProductSection";
import BestsellingSection from "@/components/shared/home/BestsellingSection";
import NewArrivalsSection from "@/components/shared/home/NewArrivalsSection";
import FeaturedProductsSection from "@/components/shared/home/FeaturedProductsSection";
import CrazyDeals from "@/components/shared/home/CrazyDeals";

// Global state to track if banner has loaded
let bannerHasLoaded = false;
const bannerLoadCallbacks: (() => void)[] = [];

// Utility function to manage banner load state
const onBannerLoad = () => {
  bannerHasLoaded = true;
  bannerLoadCallbacks.forEach(callback => callback());
  bannerLoadCallbacks.length = 0; // Clear callbacks
};

const waitForBanner = (callback: () => void) => {
  if (bannerHasLoaded) {
    callback();
  } else {
    bannerLoadCallbacks.push(callback);
  }
};

// Enhanced Banner Carousel with immediate loading
const LazyBannerCarousel = (props: any) => (
  <BannerCarousel 
    {...props}
    skipLazyLoad={true} // Load immediately, no lazy loading
    priority={true}
    onBannerLoad={onBannerLoad}
    className="banner-priority-load"
  />
);

// Enhanced Lazy Section that waits for banner to load first
const DelayedLazySection = ({ 
  children, 
  minHeight, 
  loadingAnimation, 
  className, 
  priority = false,
  delayAfterBanner = true
}: {
  children: React.ReactNode;
  minHeight: number;
  loadingAnimation: "spinner" | "pulse" | "skeleton" | "fade"; // Fix the type
  className: string;
  priority?: boolean;
  delayAfterBanner?: boolean;
}) => {
  const [shouldLoad, setShouldLoad] = useState(!delayAfterBanner || priority || bannerHasLoaded);

  React.useEffect(() => {
    if (delayAfterBanner && !priority && !shouldLoad) {
      waitForBanner(() => {
        // Add a small delay after banner loads for smooth UX
        setTimeout(() => {
          setShouldLoad(true);
        }, 100);
      });
    }
  }, [delayAfterBanner, priority, shouldLoad]);

  if (!shouldLoad) {
    // Show enhanced skeleton while waiting
    return (
      <div className={className} style={{ minHeight }}>
        <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer">
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-6">
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LazySection 
      minHeight={minHeight}
      loadingAnimation={loadingAnimation}
      className={className}
      priority={priority}
    >
      {children}
    </LazySection>
  );
};

// Lazy load these components with banner dependency
const LazyBestSellingProducts = (props: any) => (
  <DelayedLazySection 
    minHeight={400}
    loadingAnimation="pulse"
    className="w-full py-12"
  >
    <BestSellingProducts {...props} />
  </DelayedLazySection>
);

const LazyFeaturedProducts = (props: any) => (
  <DelayedLazySection 
    minHeight={400}
    loadingAnimation="skeleton"
    className="w-full py-12"
  >
    <FeaturedProductsSection {...props} />
  </DelayedLazySection>
);

const LazyNewArrivals = (props: any) => (
  <DelayedLazySection 
    minHeight={400}
    loadingAnimation="skeleton"
    className="w-full py-12"
  >
    <NewArrivalsSection {...props} />
  </DelayedLazySection>
);

const LazyCategoryShowcase = (props: any) => (
  <DelayedLazySection 
    minHeight={300}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <CategoryShowcase {...props} />
  </DelayedLazySection>
);

const LazySpecialCombos = (props: any) => (
  <DelayedLazySection 
    minHeight={300}
    loadingAnimation="skeleton"
    className="w-full py-8"
  >
    <SpecialCombos {...props} />
  </DelayedLazySection>
);

const LazyCrazyDeals = (props: any) => (
  <DelayedLazySection 
    minHeight={300}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <CrazyDeals {...props} />
  </DelayedLazySection>
);

const LazyFeaturedShowcase = (props: any) => (
  <DelayedLazySection 
    minHeight={500}
    loadingAnimation="skeleton"
    className="w-full"
  >
    <FeaturedShowcase {...props} />
  </DelayedLazySection>
);

const LazyFeaturedVideoSection = (props: any) => (
  <DelayedLazySection 
    minHeight={400}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <FeaturedVideoSection {...props} />
  </DelayedLazySection>
);

const LazySubCategoryShowcase = (props: any) => (
  <DelayedLazySection 
    minHeight={300}
    loadingAnimation="skeleton"
    className="w-full py-8"
  >
    <SubCategoryShowcase {...props} />
  </DelayedLazySection>
);

const LazyCategoryProductSection = (props: any) => (
  <DelayedLazySection 
    minHeight={400}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <CategoryProductSection {...props} />
  </DelayedLazySection>
);

const LazyAllProductsSection = (props: any) => (
  <DelayedLazySection 
    minHeight={400}
    loadingAnimation="skeleton"
    className="w-full py-8"
  >
    <AllProductsSection {...props} />
  </DelayedLazySection>
);

const LazyToughShoeHero = (props: any) => (
  <DelayedLazySection 
    minHeight={300}
    loadingAnimation="fade"
    className="w-full"
  >
    <ToughShoeHero {...props} />
  </DelayedLazySection>
);

export {
  LazyBestSellingProducts,
  LazyFeaturedProducts,
  LazyNewArrivals,
  LazyBannerCarousel,
  LazyCategoryShowcase,
  LazySpecialCombos,
  LazyCrazyDeals,
  LazyFeaturedShowcase,
  LazyFeaturedVideoSection,
  LazySubCategoryShowcase,
  LazyCategoryProductSection,
  LazyAllProductsSection,
  LazyToughShoeHero
};
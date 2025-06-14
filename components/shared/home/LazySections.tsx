"use client";

import React from 'react';
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

// Lazy load these components
const LazyBestSellingProducts = (props: any) => (
  <LazySection 
    minHeight={400}
    loadingAnimation="pulse"
    className="w-full py-12"
  >
    <BestSellingProducts {...props} />
  </LazySection>
);

const LazyFeaturedProducts = (props: any) => (
  <LazySection 
    minHeight={400}
    loadingAnimation="skeleton"
    className="w-full py-12"
  >
    <FeaturedProductsSection {...props} />
  </LazySection>
);

const LazyNewArrivals = (props: any) => (
  <LazySection 
    minHeight={400}
    loadingAnimation="skeleton"
    className="w-full py-12"
  >
    <NewArrivalsSection {...props} />
  </LazySection>
);

const LazyBannerCarousel = (props: any) => (
  <LazySection 
    minHeight={400}
    loadingAnimation="fade"
    className="w-full"
    priority={true} // Load immediately as it's above the fold
  >
    <BannerCarousel {...props} />
  </LazySection>
);

const LazyCategoryShowcase = (props: any) => (
  <LazySection 
    minHeight={300}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <CategoryShowcase {...props} />
  </LazySection>
);

const LazySpecialCombos = (props: any) => (
  <LazySection 
    minHeight={300}
    loadingAnimation="skeleton"
    className="w-full py-8"
  >
    <SpecialCombos {...props} />
  </LazySection>
);

const LazyCrazyDeals = (props: any) => (
  <LazySection 
    minHeight={300}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <CrazyDeals {...props} />
  </LazySection>
);

const LazyFeaturedShowcase = (props: any) => (
  <LazySection 
    minHeight={500}
    loadingAnimation="skeleton"
    className="w-full"
  >
    <FeaturedShowcase {...props} />
  </LazySection>
);

const LazyFeaturedVideoSection = (props: any) => (
  <LazySection 
    minHeight={400}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <FeaturedVideoSection {...props} />
  </LazySection>
);

const LazySubCategoryShowcase = (props: any) => (
  <LazySection 
    minHeight={300}
    loadingAnimation="skeleton"
    className="w-full py-8"
  >
    <SubCategoryShowcase {...props} />
  </LazySection>
);

const LazyCategoryProductSection = (props: any) => (
  <LazySection 
    minHeight={400}
    loadingAnimation="pulse"
    className="w-full py-8"
  >
    <CategoryProductSection {...props} />
  </LazySection>
);

const LazyAllProductsSection = (props: any) => (
  <LazySection 
    minHeight={400}
    loadingAnimation="skeleton"
    className="w-full py-8"
  >
    <AllProductsSection {...props} />
  </LazySection>
);

const LazyToughShoeHero = (props: any) => (
  <LazySection 
    minHeight={300}
    loadingAnimation="fade"
    className="w-full"
  >
    <ToughShoeHero {...props} />
  </LazySection>
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
"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SpecialComboDataType = {
  offers: any[];
  message: string;
  success: boolean;
} | null;

const SpecialCombos = ({ comboData }: { comboData: SpecialComboDataType }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [fade, setFade] = useState(true);

  // Only show navigation controls when there's more than one item
  const showNavigation = comboData && comboData.offers.length > 1;

  // Auto-play logic
  useEffect(() => {
    if (!comboData || comboData.offers.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % comboData.offers.length);
        setFade(true);
      }, 200);
    }, 3500); // 3.5 seconds per slide
    return () => clearInterval(interval);
  }, [comboData]);

  // Manual navigation with fade
  const goToSlide = (index: number) => {
    setFade(false);
    setTimeout(() => {
      setActiveSlide(index);
      setFade(true);
    }, 200);
  };

  const scrollToNext = () => {
    if (comboData && activeSlide < comboData.offers.length - 1) {
      goToSlide(activeSlide + 1);
    }
  };

  const scrollToPrev = () => {
    if (activeSlide > 0) {
      goToSlide(activeSlide - 1);
    }
  };

  if (!comboData || !Array.isArray(comboData.offers) || comboData.offers.length === 0) {
    return null;
  }

  const combo = comboData.offers[activeSlide];

  return (
    <div className="w-full mb-8">
      {/* Heading with navigation arrows only when needed */}
      <div className="mb-3 px-2 sm:px-4 md:px-6 mx-auto flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-center mt-6 sm:mt-8 mb-2 sm:mb-4 uppercase px-2 sm:px-4">Special Combos</h2>
        {/* {showNavigation && (
          <div className="flex items-center gap-2 mt-2">
            <button 
              onClick={scrollToPrev}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={activeSlide === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={scrollToNext}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={activeSlide === comboData.offers.length - 1}
              aria-label="Next slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )} */}
      </div>
      <div className="relative flex flex-col items-center justify-center w-full">
        <Link 
          href={combo?.link || "/shop"} 
          className={`block w-full max-w-[98%] sm:max-w-[90%] mx-auto transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="relative w-full rounded-lg overflow-hidden bg-white">
            <div className="w-full aspect-[4/3] sm:aspect-[16/7] flex items-center justify-center bg-gray-100">
              {combo?.images?.[0]?.url ? (
                <img
                  src={combo.images[0].url}
                  alt={combo?.title || 'Combo offer'}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            <div className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">{combo?.title || "Combo Name"}</h3>
              {combo?.description && (
                <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2">{combo.description}</p>
              )}
              {combo?.price && (
                <div className="text-primary font-bold text-lg sm:text-xl">₹{combo.price}</div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SpecialCombos;

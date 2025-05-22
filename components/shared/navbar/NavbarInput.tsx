"use client";
import React, { useState, useEffect } from "react";
import SearchModal from "./SearchModal";
import { Search, X } from "lucide-react";

// Add openSearchModal as an optional prop
const NavbarInput = ({ responsive, openSearchModal = false }: { 
  responsive: boolean;
  openSearchModal?: boolean;
}) => {
  const [open, setOpen] = useState<boolean>(openSearchModal);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  
  // Effect to handle openSearchModal prop changes
  useEffect(() => {
    if (openSearchModal) {
      setOpen(true);
    }
  }, [openSearchModal]);

  useEffect(() => {
    // Only apply fixed positioning for desktop view (non-responsive mode)
    if (!responsive) {
      const handleScroll = () => {
        // After scrolling 200px, make the search bar fixed
        const shouldBeFixed = window.scrollY > 200;
        setIsFixed(shouldBeFixed);
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [responsive]);
  
  // For responsive mobile design
  if (responsive) {
    return (
      <div className="w-full">
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-black transition-colors duration-200"
            size={18}
          />
          <input
            type="search"
            placeholder="Search products..."
            className="pl-10 pr-12 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => setOpen(true)}
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center justify-center text-[10px] font-sans font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            <span className="mr-0.5">⌘</span>K
          </kbd>
        </div>
        {open && <SearchModal setOpen={setOpen} />}
      </div>
    );
  }
  
  // For desktop design with fixed positioning option
  return (
    <>
      {/* Regular search input in navbar */}
      <div className={`hidden lg:block w-full max-w-md transition-all duration-300 ${isFixed ? 'opacity-0' : 'opacity-100'}`}>
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors duration-200"
            size={18}
          />
          <input
            type="search"
            placeholder="Search for products, brands and more"
            onClick={() => setOpen(true)}
            className="pl-10 pr-12 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center justify-center text-[10px] font-sans font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            <span className="mr-0.5">⌘</span>K
          </kbd>
        </div>
      </div>
      
      {/* Fixed search bar that appears when scrolling */}
      {isFixed && (
        <div 
          className="hidden lg:flex fixed top-4 left-1/2 transform -translate-x-1/2 z-[150] w-full max-w-xl transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-4"
        >
          <div className="w-full relative group shadow-lg rounded-full">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 z-10"
              size={20}
            />
            <input
              type="search"
              placeholder="Search for products, brands and more"
              onClick={() => setOpen(true)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-transparent text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              readOnly
            />
            <kbd className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-xs font-sans font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              <span className="mr-0.5">⌘</span>K
            </kbd>
          </div>
        </div>
      )}
      
      {open && <SearchModal setOpen={setOpen} />}
    </>
  );
};

export default NavbarInput;

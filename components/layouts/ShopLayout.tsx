'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarFilters, { type SelectedFiltersState } from "@/components/shared/shop/SidebarFilters";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { getAllBrands } from "@/lib/database/actions/brands.actions";
import { getUniqueSubCategoryNames } from "@/lib/database/actions/subCategory.actions";
import { handleError } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Category {
  _id: string;
  name: string;
  slug: string; // Add slug property to match SidebarFilters expectations
}

interface Brand {
  _id: string;
  name: string;
}

interface ShopLayoutProps {
  children: ReactNode;
  selectedFilters: SelectedFiltersState;
  priceRange: number[];
  onApplyFilters: (filters: SelectedFiltersState, range: number[]) => void;
  onClearFilters: () => void;
}

const ShopLayout = ({ 
  children, 
  selectedFilters, 
  priceRange, 
  onApplyFilters, 
  onClearFilters 
}: ShopLayoutProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch filter categories data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required data in parallel
        const [categoriesResponse, subcategoriesResult, brandsResponse] = await Promise.all([
          getAllCategories(),
          getUniqueSubCategoryNames(),
          getAllBrands()
        ]);
        
        // Process categories
        if (categoriesResponse?.categories && Array.isArray(categoriesResponse.categories)) {
          setCategories(categoriesResponse.categories);
        } else if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse);
        } else {
          console.error("[ShopLayout] Failed to process categories", categoriesResponse);
          setCategories([]);
        }
        
        // Process subcategories
        setSubcategories(subcategoriesResult || []);
        
        // Process brands
        if (brandsResponse?.brands && Array.isArray(brandsResponse.brands)) {
          setBrands(brandsResponse.brands);
        } else if (Array.isArray(brandsResponse)) {
          setBrands(brandsResponse);
        } else {
          console.error("[ShopLayout] Failed to process brands", brandsResponse);
          setBrands([]);
        }
      } catch (error) {
        console.error("[ShopLayout] Error fetching filter data:", error);
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilterData();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar filters - hidden on mobile */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <SidebarFilters
          categories={categories}
          subCategoryNames={subcategories}
          brands={brands}
          onApplyFilters={onApplyFilters}
          onClearFilters={onClearFilters}
          initialFilters={selectedFilters}
          initialPriceRange={priceRange}
          className="sticky top-24" // Keep filter sidebar sticky while scrolling
          isLoading={loading}
        />
      </div>
      
      {/* Mobile filter button and overlay */}
      <div className="lg:hidden mb-4">
        <Button 
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2"
          variant="outline"
        >
          <Filter size={16} />
          Filters
        </Button>
        
        {/* Mobile filter overlay */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              
              {/* Sidebar */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 h-full w-80 max-w-full bg-white z-50 p-4 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileFilterOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                
                <SidebarFilters
                  categories={categories}
                  subCategoryNames={subcategories}
                  brands={brands}
                  onApplyFilters={(filters, range) => {
                    onApplyFilters(filters, range);
                    setIsMobileFilterOpen(false);
                  }}
                  onClearFilters={onClearFilters}
                  initialFilters={selectedFilters}
                  initialPriceRange={priceRange}
                  isLoading={loading}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Main content area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default ShopLayout;

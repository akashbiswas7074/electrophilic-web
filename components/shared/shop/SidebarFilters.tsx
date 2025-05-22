'use client';

import { useState, useEffect, useRef } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SelectedFiltersState } from './FilterButton';
import { ChevronUp, ChevronDown } from "lucide-react";

// Define Category and Brand types
interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

// Define props for sidebar filters
interface SidebarFiltersProps {
  categories: Category[];
  subCategoryNames: string[];
  brands: Brand[];
  onApplyFilters: (filters: SelectedFiltersState, priceRange: number[]) => void;
  onClearFilters: () => void;
  initialFilters?: Partial<SelectedFiltersState>;
  initialPriceRange?: number[];
  className?: string;
}

// Default initial filters
const defaultInitialFilters: SelectedFiltersState = {
  category: [],
  subcategory: [],
  sale: [],
  brand: [],
  bestSelling: [],
};

const SidebarFilters = ({
  categories,
  subCategoryNames,
  brands,
  onApplyFilters,
  onClearFilters,
  initialFilters = {},
  initialPriceRange = [0, 20000],
  className = '',
}: SidebarFiltersProps) => {
  // Ensure categories, subCategoryNames, and brands are arrays
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeSubCategoryNames = Array.isArray(subCategoryNames) ? subCategoryNames : [];
  const safeBrands = Array.isArray(brands) ? brands : [];
  
  const [priceRange, setPriceRange] = useState<number[]>(initialPriceRange);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFiltersState>({
    ...defaultInitialFilters,
    ...initialFilters,
  });
  
  // Define a type for the keys of openSections
  type SectionName = keyof typeof openSections;

  // State for section toggles - set all to true by default for desktop view
  const [openSections, setOpenSections] = useState({
    category: true,
    subcategory: true,
    price: true,
    deals: true,
    brand: true
  });
  
  // Add debounce timeout for price changes
  const [priceChangeTimeout, setPriceChangeTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleCheckboxChange = (
    filterType: keyof SelectedFiltersState,
    value: string,
    checked: boolean
  ) => {
    setSelectedFilters(prev => {
      const currentValues = prev[filterType];
      const safeCurrentValues = Array.isArray(currentValues) ? currentValues : [];

      if (checked) {
        if (!safeCurrentValues.includes(value)) {
          return { 
            ...prev, 
            [filterType]: [...safeCurrentValues, value] 
          };
        }
        return prev;
      } else {
        return { 
          ...prev, 
          [filterType]: safeCurrentValues.filter((v: string) => v !== value) 
        };
      }
    });
  };

  // Specific handler for "All" options
  const handleSelectAll = (filterType: keyof SelectedFiltersState) => {
    const newFilters = { 
      ...selectedFilters,
      [filterType]: [] 
    };
    setSelectedFilters(newFilters);
    // onApplyFilters call removed - will be handled by useEffect
  };

  // Modified handlePriceChange to avoid calling onApplyFilters directly
  const handlePriceChange = (newPriceRange: number[]) => {
    // Clear any existing timeout
    if (priceChangeTimeout) {
      clearTimeout(priceChangeTimeout);
    }
    
    setPriceRange(newPriceRange);
    
    // No need to call onApplyFilters here, the useEffect will handle it
  };

  const resetPrice = () => {
    const resetPriceRange = [0, 20000];
    setPriceRange(resetPriceRange);
    // onApplyFilters call removed - will be handled by useEffect
  };

  const clearFilters = () => {
    const resetFilters = {...defaultInitialFilters};
    setSelectedFilters(resetFilters);
    setPriceRange([0, 20000]);
    onClearFilters();
  };

  // Toggle section visibility
  const toggleSection = (section: SectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Sync with parent component
  useEffect(() => {
    const syncedFilters: SelectedFiltersState = {
      ...defaultInitialFilters,
      ...initialFilters,
    };
    // This needs to be carefully handled to prevent loops
    // Only update if the filters actually changed
    const currentKeys = Object.keys(selectedFilters) as (keyof SelectedFiltersState)[];
    let needsUpdate = false;
    
    for (const key of currentKeys) {
      const current = selectedFilters[key];
      const incoming = initialFilters[key] || [];
      
      if (current.length !== incoming.length || 
          !current.every(item => incoming.includes(item))) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      setSelectedFilters(syncedFilters);
    }
  }, [initialFilters]);

  // Improved synchronization with parent component's initialPriceRange
  const initialPriceRangeRef = useRef(initialPriceRange);
  useEffect(() => {
    // Only update if price range significantly changed and isn't due to local slider interaction
    const hasSignificantChange = 
      Math.abs(priceRange[0] - initialPriceRange[0]) > 1 || 
      Math.abs(priceRange[1] - initialPriceRange[1]) > 1;
    
    const isDifferentFromLastInitial = 
      initialPriceRangeRef.current[0] !== initialPriceRange[0] || 
      initialPriceRangeRef.current[1] !== initialPriceRange[1];
    
    if (isDifferentFromLastInitial && hasSignificantChange) {
      setPriceRange(initialPriceRange);
      initialPriceRangeRef.current = initialPriceRange;
    }
  }, [initialPriceRange]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (priceChangeTimeout) {
        clearTimeout(priceChangeTimeout);
      }
    };
  }, [priceChangeTimeout]);

  const saleOptions = [
    { id: "sale", name: "On Sale" },
  ];
  const bestSellingOptions = [
    { id: "bestseller", name: "Best Selling" },
  ];

  // Instead of calling onApplyFilters directly during render, use useEffect
  // to handle the side effect after rendering
  const didMount = useRef(false);

  useEffect(() => {
    // Only call onApplyFilters when dependencies change AND not on initial mount
    if (didMount.current) {
      onApplyFilters(selectedFilters, priceRange);
    } else {
      didMount.current = true;
    }
  }, [selectedFilters, priceRange, onApplyFilters]);

  // Add a dedicated "Apply" button to SidebarFilters
  const handleApplyClick = () => {
    onApplyFilters(selectedFilters, priceRange);
  };

  const handleCategoryChange = (catId: string, checked: boolean) => {
    const newFilters = {...selectedFilters};
    if (checked) {
      newFilters.category.push(catId);
    } else {
      newFilters.category = newFilters.category.filter(id => id !== catId);
    }
    setSelectedFilters(newFilters);
    // Remove the onApplyFilters call from here
  };

  return (
    <div className={`${className} pr-4`}>
      <div className="mb-5 pb-4 border-b">
        <h2 className="text-lg font-bold">Filters</h2>
      </div>
      
      {/* Category Section */}
      <div className="border-b pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-3" 
          onClick={() => toggleSection('category')}
        >
          <h3 className="text-base font-medium">Category</h3>
          {openSections.category ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {openSections.category && (
          <div className="space-y-2 ml-1 max-h-44 overflow-y-auto scrollbar-thin">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sidebar-cat-all"
                checked={selectedFilters.category.length === 0}
                onCheckedChange={() => handleSelectAll('category')}
              />
              <Label 
                htmlFor="sidebar-cat-all" 
                className="text-sm leading-none cursor-pointer"
              >
                All Categories
              </Label>
            </div>
            
            {safeCategories.map((cat) => (
              <div key={cat._id} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-cat-${cat._id}`}
                  checked={selectedFilters.category.includes(cat._id)}
                  onCheckedChange={(checked) => handleCategoryChange(cat._id, !!checked)}
                />
                <Label 
                  htmlFor={`sidebar-cat-${cat._id}`} 
                  className="text-sm leading-none cursor-pointer"
                >
                  {cat.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Subcategory Section */}
      <div className="border-b py-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-3" 
          onClick={() => toggleSection('subcategory')}
        >
          <h3 className="text-base font-medium">Subcategory</h3>
          {openSections.subcategory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {openSections.subcategory && (
          <div className="space-y-2 ml-1 max-h-44 overflow-y-auto scrollbar-thin">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sidebar-subcat-all"
                checked={selectedFilters.subcategory.length === 0}
                onCheckedChange={() => handleSelectAll('subcategory')}
              />
              <Label 
                htmlFor="sidebar-subcat-all" 
                className="text-sm leading-none cursor-pointer"
              >
                All Subcategories
              </Label>
            </div>
            
            {safeSubCategoryNames.map((name) => (
              <div key={name} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-subcat-${name}`}
                  checked={selectedFilters.subcategory.includes(name)}
                  onCheckedChange={(checked) => handleCheckboxChange('subcategory', name, !!checked)}
                />
                <Label 
                  htmlFor={`sidebar-subcat-${name}`} 
                  className="text-sm leading-none cursor-pointer"
                >
                  {name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Price Section */}
      <div className="border-b py-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => toggleSection('price')}
        >
          <h3 className="text-base font-medium">Shop By Price</h3>
          {openSections.price ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {openSections.price && (
          <div className="px-1">
            <Slider
              value={priceRange}
              max={20000}
              step={500}
              minStepsBetweenThumbs={1}
              onValueChange={handlePriceChange}
              className="my-4"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
              <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-2 text-center">
              <button
                onClick={resetPrice}
                className="text-sm text-gray-600 hover:text-black"
              >
                Reset to All Prices
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Deals & Features Section */}
      <div className="border-b py-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => toggleSection('deals')}
        >
          <h3 className="text-base font-medium">Deals & Features</h3>
          {openSections.deals ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {openSections.deals && (
          <div className="space-y-2 ml-1">
            {saleOptions.map((sale) => (
              <div key={sale.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-sale-${sale.id}`}
                  checked={selectedFilters.sale.includes(sale.id)}
                  onCheckedChange={(checked) => handleCheckboxChange('sale', sale.id, !!checked)}
                />
                <Label 
                  htmlFor={`sidebar-sale-${sale.id}`} 
                  className="text-sm leading-none cursor-pointer"
                >
                  {sale.name}
                </Label>
              </div>
            ))}
            {bestSellingOptions.map((bs) => (
              <div key={bs.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-bs-${bs.id}`}
                  checked={selectedFilters.bestSelling.includes(bs.id)}
                  onCheckedChange={(checked) => handleCheckboxChange('bestSelling', bs.id, !!checked)}
                />
                <Label 
                  htmlFor={`sidebar-bs-${bs.id}`} 
                  className="text-sm leading-none cursor-pointer"
                >
                  {bs.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Brand Section */}
      <div className="py-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => toggleSection('brand')}
        >
          <h3 className="text-base font-medium">Brand</h3>
          {openSections.brand ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {openSections.brand && (
          <div className="space-y-2 ml-1 max-h-44 overflow-y-auto scrollbar-thin">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sidebar-brand-all"
                checked={selectedFilters.brand.length === 0}
                onCheckedChange={() => handleSelectAll('brand')}
              />
              <Label 
                htmlFor="sidebar-brand-all" 
                className="text-sm leading-none cursor-pointer"
              >
                All Brands
              </Label>
            </div>
            
            {safeBrands.map((brand) => (
              <div key={brand._id} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-brand-${brand._id}`}
                  checked={selectedFilters.brand.includes(brand._id)}
                  onCheckedChange={(checked) => handleCheckboxChange('brand', brand._id, !!checked)}
                />
                <Label 
                  htmlFor={`sidebar-brand-${brand._id}`} 
                  className="text-sm leading-none cursor-pointer"
                >
                  {brand.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Apply and Clear buttons */}
      <div className="mt-6 pt-2 border-t">
        <Button
          variant="default"
          className="w-full mb-2 bg-black text-white hover:bg-gray-800"
          onClick={handleApplyClick}
        >
          Apply Filters
        </Button>
        <button
          onClick={clearFilters}
          className="w-full text-center text-sm text-gray-600 hover:text-black"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default SidebarFilters;
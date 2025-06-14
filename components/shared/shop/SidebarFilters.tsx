'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CheckedState } from "@radix-ui/react-checkbox";

// Define interface for filter categories
interface Category {
  _id: string;
  name: string;
  slug?: string; // Make slug optional to match shopPage.tsx
}

interface Brand {
  _id: string;
  name: string;
}

export interface SelectedFiltersState {
  category: string[];
  subcategory: string[];
  brand: string[];
  price: [number, number]; // [min, max]
  sale: string[];
  bestSelling: string[];
  isNew: string[];
  isFeatured: string[];
  inStock: string[];
  rating: string[]; // Added rating filter
  color: string[]; // Add color property
  size: string[]; // Add size property
}

interface SidebarFiltersProps {
  categories: Category[];
  subCategoryNames: string[];
  brands: Brand[];
  onApplyFilters: (filters: SelectedFiltersState, priceRange: number[]) => void;
  onClearFilters: () => void;
  initialFilters?: SelectedFiltersState;
  initialPriceRange?: number[];
  className?: string;
  disabledCategories?: string[];
  disabledSubcategories?: string[];
  subCategoryDetails?: { 
    _id: string; 
    name: string; 
    parent?: string | { _id: string };
    category?: string | { _id: string };
    categoryId?: string;
    parentCategory?: string | { _id: string };
  }[];
  isLoading?: boolean;
  hasProductsWithRatings?: boolean; // New prop to check if any products have ratings
}

const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  categories,
  subCategoryNames,
  brands,
  onApplyFilters,
  onClearFilters,
  initialFilters,
  initialPriceRange = [0, 20000],
  className = '',
  disabledCategories = [],
  disabledSubcategories = [],
  subCategoryDetails = [],
  isLoading = false,
  hasProductsWithRatings = false, // New prop to check if any products have ratings
}) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Use refs to track if we've initialized state to prevent infinite loops
  const hasInitialized = useRef(false);
  const filtersApplied = useRef(false);
  const lastInitialFilters = useRef(initialFilters);
  const lastInitialPriceRange = useRef(initialPriceRange);
  
  // Default filters constant
  const defaultFilters = useMemo(() => ({
    category: [] as string[],
    subcategory: [] as string[],
    sale: [] as string[],
    brand: [] as string[],
    bestSelling: [] as string[],
    isNew: [] as string[],
    isFeatured: [] as string[],
    inStock: [] as string[],
    rating: [] as string[],
    price: [0, 20000] as [number, number],
    color: [] as string[], // Initialize color filter
    size: [] as string[] // Initialize size filter
  }), []);
  
  // Filter state - initialize directly without dependency on props
  const [selectedFilters, setSelectedFilters] = useState<SelectedFiltersState>(() => {
    return initialFilters || defaultFilters;
  });
  
  // Price range state - initialize with the initial price range or default
  const [priceRange, setPriceRange] = useState<number[]>(() => {
    return initialPriceRange;
  });
  
  // New state to track pending filter changes
  const [pendingFilterChange, setPendingFilterChange] = useState<{
    filters: SelectedFiltersState | null,
    range: number[] | null
  }>({
    filters: null,
    range: null
  });

  // Accordion states
  const [expandedSections, setExpandedSections] = useState<{
    brands: boolean;
    categories: boolean;
    subcategories: boolean;
  }>({
    brands: true,
    categories: true,
    subcategories: true
  });
  
  // State for lazy-loaded items
  const [visibleBrands, setVisibleBrands] = useState<Brand[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Category[]>([]);
  const [visibleSubcategories, setVisibleSubcategories] = useState<string[]>([]);
  
  // State to track subcategories for selected categories
  const [relevantSubcategories, setRelevantSubcategories] = useState<string[]>([]);
  
  // Default number of items to show initially
  const initialVisibleItems = 5;
  
  // Debounced price range for better performance
  const debouncedPriceRange = useDebounce(priceRange, 500);
  
  // Deep comparison function
  const deepEqual = (obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  };
  
  // Only update state when props actually change (not on every render)
  useEffect(() => {
    // Check if initialFilters has actually changed
    if (initialFilters && !deepEqual(initialFilters, lastInitialFilters.current)) {
      setSelectedFilters(initialFilters);
      lastInitialFilters.current = initialFilters;
    }
    
    // Check if initialPriceRange has actually changed
    if (initialPriceRange && !deepEqual(initialPriceRange, lastInitialPriceRange.current)) {
      setPriceRange(initialPriceRange);
      lastInitialPriceRange.current = initialPriceRange;
    }
    
    hasInitialized.current = true;
  }, [initialFilters, initialPriceRange]);
  
  // Filter subcategories based on selected categories
  useEffect(() => {
    if (selectedFilters.category.length > 0 && subCategoryDetails.length > 0) {
      // Only get subcategories for the selected category
      const selectedCategoryId = selectedFilters.category[0]; // Get the first selected category
      
      // Get all subcategories for the selected category with enhanced matching
      const subcategoriesForSelectedCategory = subCategoryDetails
        .filter(sub => {
          // Skip null/undefined subcategories
          if (!sub) return false;
          
          // Extract subcategory parent ID with flexible property access
          let parentId = null;
          
          // Check all possible parent reference formats
          if (sub.parent) {
            parentId = typeof sub.parent === 'string' ? sub.parent : 
                      (sub.parent._id ? sub.parent._id : null);
          } else if (sub.categoryId) {
            parentId = sub.categoryId;
          } else if (sub.parentCategory) {
            parentId = typeof sub.parentCategory === 'string' ? sub.parentCategory : 
                      (sub.parentCategory._id ? sub.parentCategory._id : null);
          } else if (sub.category) {
            parentId = typeof sub.category === 'string' ? sub.category : 
                      (sub.category._id ? sub.category._id : null);
          }
          
          // Compare with selected category ID
          return parentId === selectedCategoryId;
        })
        .map(sub => sub.name);
      
      // Set the relevant subcategories
      setRelevantSubcategories(subcategoriesForSelectedCategory);
      
      // Only show the first few subcategories initially
      setVisibleSubcategories(subcategoriesForSelectedCategory.slice(0, initialVisibleItems));
    } else {
      setRelevantSubcategories([]);
      setVisibleSubcategories([]);
    }
  }, [selectedFilters.category, subCategoryDetails, initialVisibleItems]);
  
  // Initialize visible items when data changes
  useEffect(() => {
    if (brands?.length > 0) {
      setVisibleBrands(brands.slice(0, initialVisibleItems));
    }
    
    if (categories?.length > 0) {
      setVisibleCategories(categories.slice(0, initialVisibleItems));
    }
  }, [brands, categories]);
  
  // FIXED: Consolidated useEffect for handling price range changes
  // This single effect handles both the debounced price range and selectedFilters
  useEffect(() => {
    // Only proceed if component has finished initializing
    if (!hasInitialized.current) return;
    
    // Skip if we're already in the process of applying filters to prevent duplicate calls
    if (filtersApplied.current) return;
    
    // Set a flag to prevent multiple simultaneous updates
    filtersApplied.current = true;
    
    // Make sure debouncedPriceRange is defined and has at least 2 elements before accessing
    if (!debouncedPriceRange || debouncedPriceRange.length < 2) {
      filtersApplied.current = false;
      return;
    }
    
    // Update the price in selectedFilters to match the debounced price range
    const updatedFilters = {
      ...selectedFilters,
      price: [debouncedPriceRange[0], debouncedPriceRange[1]] as [number, number]
    };
    
    // Check if price has actually changed to avoid unnecessary updates
    // Ensure both price arrays exist before comparing
    const priceChanged = 
      selectedFilters.price && 
      updatedFilters.price && 
      (updatedFilters.price[0] !== selectedFilters.price[0] || 
       updatedFilters.price[1] !== selectedFilters.price[1]);
    
    if (priceChanged) {
      // Update the selected filters state
      setSelectedFilters(updatedFilters);
      
      // Apply the filters with the updated price range
      // Use a slight delay to batch potential multiple updates
      const timeoutId = setTimeout(() => {
        onApplyFilters(updatedFilters, debouncedPriceRange);
        console.log('Price range updated:', debouncedPriceRange);
      }, 50);
      
      // Clean up timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
    
    // Reset the flag after a short delay
    const resetTimeout = setTimeout(() => {
      filtersApplied.current = false;
    }, 150);
    
    return () => clearTimeout(resetTimeout);
  }, [debouncedPriceRange, selectedFilters, onApplyFilters]);

  // Effect to apply pending filter changes outside of render
  useEffect(() => {
    if (pendingFilterChange.filters && pendingFilterChange.range) {
      onApplyFilters(pendingFilterChange.filters, pendingFilterChange.range);
      // Reset pending changes after applying
      setPendingFilterChange({
        filters: null,
        range: null
      });
    }
  }, [pendingFilterChange, onApplyFilters]);

  // Toggle filter selection or navigate to category/subcategory page
  const toggleFilter = (type: keyof SelectedFiltersState, value: string, event?: React.MouseEvent | React.ChangeEvent) => {
    // Prevent event propagation if event is provided
    if (event) {
      event.stopPropagation();
    }

    // Skip if this category/subcategory is disabled (i.e., it's the current page)
    if (type === 'category' && disabledCategories?.includes(value)) return;
    if (type === 'subcategory' && disabledSubcategories?.includes(value)) return;

    // For category selection, we'll update our state but prevent automatic navigation
    if (type === 'category') {
      const category = categories?.find(c => c._id === value);
      if (category) {
        // Update local state first
        const newFilters = {
          ...selectedFilters,
          category: [value],
          // Clear subcategory selection when changing category
          subcategory: []
        };
        
        setSelectedFilters(newFilters);
        
        // Queue the filter application instead of calling directly
        setPendingFilterChange({
          filters: newFilters,
          range: priceRange
        });
        
        return;
      }
    }
    
    if (type === 'subcategory') {
      // Update selected filters with the subcategory
      const filterArray = Array.isArray(selectedFilters.subcategory) ? selectedFilters.subcategory : [];
      const isSelected = filterArray.includes(value);
      
      const newFilters = {
        ...selectedFilters,
        subcategory: isSelected
          ? filterArray.filter(v => v !== value) // Remove if already selected
          : [...filterArray, value] // Add if not selected
      };
      
      setSelectedFilters(newFilters);
      
      // Queue the filter application instead of calling directly
      setPendingFilterChange({
          filters: newFilters,
          range: priceRange
      });
      
      return;
    }
    
    // For other filter types (brand, rating, etc.)
    // Properly type check for arrays to avoid 'never' type issues
    if (type === 'price') {
      return; // Price is handled separately with the slider
    }
    
    // For array-based filters - ensure we're working with arrays
    const filterArray = Array.isArray(selectedFilters[type]) ? (selectedFilters[type] as string[]) : [];
    const isSelected = filterArray.includes(value);
    
    const newFilters = {
      ...selectedFilters,
      [type]: isSelected
        ? filterArray.filter(v => v !== value)
        : [...filterArray, value]
    };
    
    setSelectedFilters(newFilters);
    
    // Queue the filter application instead of calling directly
    setPendingFilterChange({
      filters: newFilters,
      range: priceRange
    });
  };
  
  // Load more items for lazy loading
  const loadMoreItems = (type: 'brands' | 'categories' | 'subcategories') => {
    switch (type) {
      case 'brands':
        setVisibleBrands(brands.slice(0, visibleBrands.length + 5));
        break;
      case 'categories':
        setVisibleCategories(categories.slice(0, visibleCategories.length + 5));
        break;
      case 'subcategories':
        setVisibleSubcategories(relevantSubcategories.slice(0, visibleSubcategories.length + 5));
        break;
    }
  };
  
  // Handle applying filters - now a controlled action
  const handleApplyFilters = useCallback(() => {
    // Queue the filter application instead of calling onApplyFilters directly
    setPendingFilterChange({
      filters: selectedFilters,
      range: priceRange
    });
  }, [selectedFilters, priceRange]);
  
  // Handle clearing filters
  const handleClearFilters = () => {
    // Keep the disabled filters (current page)
    const categoryFilters = disabledCategories.length > 0 ? disabledCategories : [];
    const subcategoryFilters = disabledSubcategories.length > 0 ? disabledSubcategories : [];
    
    const resetFilters = {
      category: categoryFilters,
      subcategory: subcategoryFilters,
      sale: [],
      brand: [],
      bestSelling: [],
      isNew: [],
      isFeatured: [],
      inStock: [],
      rating: [], // Don't forget to reset rating filter
      price: [0, 20000] as [number, number], // Don't forget to reset price
      color: [], // Reset color filter
      size: [] // Reset size filter
    };
    
    setSelectedFilters(resetFilters);
    setPriceRange([0, 20000]);
    onClearFilters();
  };
  
  // Check if the selected categories have any subcategories
  const hasSubcategories = useMemo(() => {
    // Only show subcategories section if:
    // 1. There are relevant subcategories for the selected category
    // 2. A category is actually selected (if no category is selected, don't show subcategories)
    return relevantSubcategories.length > 0 && selectedFilters.category.length > 0;
  }, [relevantSubcategories, selectedFilters.category]);
  
  // Get category name by ID for better display in filters
  const getCategoryNameById = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : "Category";
  }, [categories]);
  
  // Get subcategory name from ID if needed
  const getSubcategoryNameById = useCallback((subcategoryId: string) => {
    const subcategory = subCategoryDetails.find(sub => sub._id === subcategoryId);
    return subcategory ? subcategory.name : subcategoryId;
  }, [subCategoryDetails]);
  
  // Update getDisplayName function to properly resolve category and subcategory names
  const getDisplayName = useCallback((type: keyof SelectedFiltersState, id: string) => {
    switch (type) {
      case 'category':
        return getCategoryNameById(id);
      case 'subcategory':
        return getSubcategoryNameById(id);
      case 'brand':
        const brand = brands.find(b => b._id === id);
        return brand ? brand.name : id;
      default:
        return id;
    }
  }, [getCategoryNameById, getSubcategoryNameById, brands]);
  
  // Map selected filters to their display names for UI
  const getSelectedFiltersDisplayNames = useCallback(() => {
    const displayNames: Record<keyof SelectedFiltersState, any> = {
      category: [],
      subcategory: [],
      sale: [],
      brand: [],
      bestSelling: [], 
      isNew: [],
      isFeatured: [],
      inStock: [],
      rating: [],
      price: [0, 0] as [number, number],
      color: [],
      size: []
    };
    
    Object.entries(selectedFilters).forEach(([key, values]) => {
      const filterType = key as keyof SelectedFiltersState;
      if (filterType === 'price' && Array.isArray(values)) {
        displayNames[filterType] = values as [number, number];
      } else if (Array.isArray(values)) {
        displayNames[filterType] = values.map((id: string) => getDisplayName(filterType, id));
      }
    });
    
    return displayNames;
  }, [selectedFilters, getDisplayName]);
  
  // Get display names for currently selected filters
  const selectedFiltersDisplayNames = useMemo(() => {
    return getSelectedFiltersDisplayNames();
  }, [getSelectedFiltersDisplayNames]);
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div>
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Price Range</h4>
              
              {/* Modern Slider Component */}
              <div className="mb-4">
                <Slider
                  defaultValue={priceRange}
                  min={0}
                  max={50000}
                  step={100}
                  value={priceRange}
                  onValueChange={(value) => {
                    setPriceRange(value);
                  }}
                  onValueCommit={(value) => {
                    // Only apply when user finishes dragging
                    setPendingFilterChange({
                      filters: {
                        ...selectedFilters,
                        price: [value[0], value[1]] as [number, number]
                      },
                      range: value
                    });
                  }}
                  className="my-6"
                />
              </div>
              
              {/* Price Input Fields with Modern Styling */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minPrice" className="text-xs text-gray-500">Min Price</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      id="minPrice"
                      type="number"
                      min={0}
                      max={priceRange[1]}
                      value={priceRange[0]}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        if (newValue >= 0 && newValue <= priceRange[1]) {
                          setPriceRange([newValue, priceRange[1]]);
                        }
                      }}
                      onBlur={() => {
                        setPendingFilterChange({
                          filters: {
                            ...selectedFilters,
                            price: [priceRange[0], priceRange[1]] as [number, number]
                          },
                          range: priceRange
                        });
                      }}
                      className="w-full h-9 pl-6 pr-2 border border-gray-200 rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxPrice" className="text-xs text-gray-500">Max Price</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      id="maxPrice"
                      type="number"
                      min={priceRange[0]}
                      max={50000}
                      value={priceRange[1]}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        if (newValue >= priceRange[0] && newValue <= 50000) {
                          setPriceRange([priceRange[0], newValue]);
                        }
                      }}
                      onBlur={() => {
                        setPendingFilterChange({
                          filters: {
                            ...selectedFilters,
                            price: [priceRange[0], priceRange[1]] as [number, number]
                          },
                          range: priceRange
                        });
                      }}
                      className="w-full h-9 pl-6 pr-2 border border-gray-200 rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Price Range Display */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
                <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
              </div>
              
              {/* Apply Filter Button with Modern Styling */}
              <Button
                onClick={() => {
                  setPendingFilterChange({
                    filters: {
                      ...selectedFilters,
                      price: [priceRange[0], priceRange[1]] as [number, number]
                    },
                    range: priceRange
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-md py-2 text-sm font-medium"
              >
                Apply Price Filter
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            {/* Categories */}
            <Accordion type="single" collapsible defaultValue="categories" className="mb-4">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger className="py-2 px-0 hover:no-underline">
                  <h4 className="font-medium text-left">Categories</h4>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 py-2">
                    {/* All Products Option */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id="category-all-products"
                        checked={pathname === '/shop'}
                        onCheckedChange={(checked: CheckedState) => {
                          if (checked) {
                            const resetFilters = {
                              category: [],
                              subcategory: [],
                              sale: [],
                              brand: [],
                              bestSelling: [],
                              isNew: [],
                              isFeatured: [],
                              inStock: [],
                              rating: [], 
                              price: [0, 20000] as [number, number],
                              color: [],
                              size: []
                            };
                            setSelectedFilters(resetFilters);
                            setPriceRange([0, 20000]);
                            // Apply the cleared filters via pendingFilterChange
                            setPendingFilterChange({
                              filters: resetFilters,
                              range: [0, 20000]
                            });
                            router.push('/shop');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label 
                        htmlFor="category-all-products"
                        className="cursor-pointer text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        All Products
                      </Label>
                    </div>
                    
                    {visibleCategories.map((category) => (
                      <div key={category._id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category._id}`} 
                          checked={Boolean(selectedFilters.category.includes(category._id) || (pathname && pathname.includes(`/shop/category/${category.slug}`)))}
                          onCheckedChange={(checked: CheckedState) => {
                            if (checked) {
                              toggleFilter('category', category._id);
                            } else {
                              // Handle unchecking - only if it's not a disabled category
                              if (!disabledCategories.includes(category._id)) {
                                toggleFilter('category', category._id);
                              }
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={disabledCategories.includes(category._id)}
                          className={disabledCategories.includes(category._id) ? 'opacity-50' : ''}
                        />
                        <Label 
                          htmlFor={`category-${category._id}`}
                          className={`cursor-pointer text-sm ${disabledCategories.includes(category._id) ? 'opacity-50' : ''}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))}
                    
                    {/* Lazy loading for categories */}
                    {visibleCategories.length < categories.length && (
                      <button 
                        onClick={() => loadMoreItems('categories')}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                      >
                        Show more 
                        <ChevronDown size={14} />
                      </button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Separator className="my-4" />
            
            {/* Subcategories - Only show if there are subcategories for the selected categories */}
            {hasSubcategories && (
              <>
                <Accordion type="single" collapsible defaultValue="subcategories" className="mb-4">
                  <AccordionItem value="subcategories" className="border-none">
                    <AccordionTrigger className="py-2 px-0 hover:no-underline">
                      <h4 className="font-medium text-left">Subcategories</h4>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 py-2">
                        {visibleSubcategories.map((subcategory) => (
                          <div key={subcategory} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`subcategory-${subcategory}`} 
                              checked={Boolean(selectedFilters.subcategory.includes(subcategory) || 
                                (pathname && pathname.includes('/shop/category/') && pathname.includes(subcategory.toLowerCase().replace(/\s+/g, '-'))))}
                              onCheckedChange={(checked: CheckedState) => {
                                if (checked) {
                                  toggleFilter('subcategory', subcategory);
                                } else if (checked === false) {
                                  if (!disabledSubcategories.includes(subcategory)) {
                                    toggleFilter('subcategory', subcategory);
                                  }
                                }
                              }}
                              disabled={disabledSubcategories.includes(subcategory)}
                              onClick={(e) => e.stopPropagation()}
                              className={disabledSubcategories.includes(subcategory) ? 'opacity-50' : ''}
                            />
                            <Label 
                              htmlFor={`subcategory-${subcategory}`}
                              className={`cursor-pointer text-sm ${disabledSubcategories.includes(subcategory) ? 'opacity-50' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {subcategory}
                            </Label>
                          </div>
                        ))}
                        
                        {/* Lazy loading for subcategories */}
                        {visibleSubcategories.length < relevantSubcategories.length && (
                          <button 
                            onClick={() => loadMoreItems('subcategories')}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                          >
                            Show more 
                            <ChevronDown size={14} />
                          </button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <Separator className="my-4" />
              </>
            )}
            
            {/* Brands */}
            <Accordion type="single" collapsible defaultValue="brands" className="mb-4">
              <AccordionItem value="brands" className="border-none">
                <AccordionTrigger className="py-2 px-0 hover:no-underline">
                  <h4 className="font-medium text-left">Brands</h4>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 py-2">
                    {visibleBrands.map((brand) => (
                      <div key={brand._id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`brand-${brand._id}`} 
                          checked={selectedFilters.brand.includes(brand._id)}
                          onCheckedChange={(checked: CheckedState) => {
                            if (checked !== undefined) {
                              toggleFilter('brand', brand._id);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label 
                          htmlFor={`brand-${brand._id}`}
                          className="cursor-pointer text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {brand.name}
                        </Label>
                      </div>
                    ))}
                    
                    {/* Lazy loading for brands */}
                    {visibleBrands.length < brands.length && (
                      <button 
                        onClick={() => loadMoreItems('brands')}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                      >
                        Show more 
                        <ChevronDown size={14} />
                      </button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Separator className="my-4" />
            
            {/* Rating Filter - Only show if there are products with ratings */}
            {hasProductsWithRatings && (
              <>
                <div className="mb-4">
                  <h4 className="font-medium mb-3">Rating</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rating-5" 
                        checked={selectedFilters.rating.includes('5')}
                        onCheckedChange={(checked: CheckedState) => {
                          if (checked !== undefined) {
                            toggleFilter('rating', '5');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label 
                        htmlFor="rating-5"
                        className="cursor-pointer text-sm flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-1">5 stars</span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rating-4" 
                        checked={selectedFilters.rating.includes('4')}
                        onCheckedChange={(checked: CheckedState) => {
                          if (checked !== undefined) {
                            toggleFilter('rating', '4');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label 
                        htmlFor="rating-4"
                        className="cursor-pointer text-sm flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          {[...Array(4)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-1">4 stars</span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rating-3" 
                        checked={selectedFilters.rating.includes('3')}
                        onCheckedChange={(checked: CheckedState) => {
                          if (checked !== undefined) {
                            toggleFilter('rating', '3');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label 
                        htmlFor="rating-3"
                        className="cursor-pointer text-sm flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          {[...Array(3)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-1">3 stars</span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rating-2" 
                        checked={selectedFilters.rating.includes('2')}
                        onCheckedChange={(checked: CheckedState) => {
                          if (checked !== undefined) {
                            toggleFilter('rating', '2');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label 
                        htmlFor="rating-2"
                        className="cursor-pointer text-sm flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          {[...Array(2)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-1">2 stars</span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rating-1" 
                        checked={selectedFilters.rating.includes('1')}
                        onCheckedChange={(checked: CheckedState) => {
                          if (checked !== undefined) {
                            toggleFilter('rating', '1');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label 
                        htmlFor="rating-1"
                        className="cursor-pointer text-sm flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          {[...Array(1)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-1">1 star</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
              </>
            )}
            
            {/* Product Status & Features */}
            <div className="mb-4">
              <h4 className="font-medium mb-3">Product Status</h4>
              <div className="space-y-2">
                {/* Featured Products */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="featured" 
                    checked={selectedFilters.isFeatured.includes('featured')}
                    onCheckedChange={(checked: CheckedState) => {
                      if (checked !== undefined) {
                        toggleFilter('isFeatured', 'featured');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label 
                    htmlFor="featured"
                    className="cursor-pointer text-sm flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center">
                      <span>Featured Products</span>
                    </div>
                  </Label>
                </div>
                
                {/* Newly Arrived */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="new-arrival" 
                    checked={selectedFilters.isNew.includes('new')}
                    onCheckedChange={(checked: CheckedState) => {
                      if (checked !== undefined) {
                        toggleFilter('isNew', 'new');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label 
                    htmlFor="new-arrival"
                    className="cursor-pointer text-sm flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center">
                      <span>Newly Arrived</span>
                    </div>
                  </Label>
                </div>
                
                {/* On Sale */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="on-sale" 
                    checked={selectedFilters.sale.includes('sale')}
                    onCheckedChange={(checked: CheckedState) => {
                      if (checked !== undefined) {
                        toggleFilter('sale', 'sale');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label 
                    htmlFor="on-sale"
                    className="cursor-pointer text-sm flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center">
                      <span>On Sale</span>
                    </div>
                  </Label>
                </div>
                
                {/* Best Selling */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="best-selling" 
                    checked={selectedFilters.bestSelling.includes('bestSelling')}
                    onCheckedChange={(checked: CheckedState) => {
                      if (checked !== undefined) {
                        toggleFilter('bestSelling', 'bestSelling');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label 
                    htmlFor="best-selling"
                    className="cursor-pointer text-sm flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center">
                      <span>Best Selling</span>
                    </div>
                  </Label>
                </div>
                
                {/* In Stock */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="in-stock" 
                    checked={selectedFilters.inStock.includes('inStock')}
                    onCheckedChange={(checked: CheckedState) => {
                      if (checked !== undefined) {
                        toggleFilter('inStock', 'inStock');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label 
                    htmlFor="in-stock"
                    className="cursor-pointer text-sm flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center">
                      <span>In Stock</span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SidebarFilters;

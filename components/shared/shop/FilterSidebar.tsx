'use client';

import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface Category extends FilterOption {
  subcategories?: FilterOption[];
}

interface FilterSidebarProps {
  categories?: Category[];
  brands?: FilterOption[];
  priceRange?: {
    min: number;
    max: number;
  };
  isLoading?: boolean;
  disabledCategories?: string[];
  disabledSubcategories?: string[];
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories = [],
  brands = [],
  priceRange = { min: 0, max: 2000 },
  isLoading = false,
  disabledCategories = [],
  disabledSubcategories = [],
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize state from URL parameters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([priceRange.min, priceRange.max]);
  const [onSale, setOnSale] = useState(false);
  const [bestSelling, setBestSelling] = useState(false);
  
  // Lazy loading states
  const [visibleCategories, setVisibleCategories] = useState<Category[]>([]);
  const [visibleBrands, setVisibleBrands] = useState<FilterOption[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Number of items to show initially and when "Show more" is clicked
  const initialVisibleItems = 5;
  const showMoreIncrement = 5;
  
  // Debounced price to avoid too many URL updates
  const debouncedPrice = useDebounce(price, 500);

  // Initialize visible items on component mount
  useEffect(() => {
    setVisibleCategories(categories.slice(0, initialVisibleItems));
    setVisibleBrands(brands.slice(0, initialVisibleItems));
  }, [categories, brands]);

  // Initialize state from URL parameters on first load
  useEffect(() => {
    if (!searchParams) return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Set selected categories
    const categoryParam = params.get('categories');
    if (categoryParam) {
      setSelectedCategories(categoryParam.split(','));
    }
    
    // Set selected subcategories
    const subcategoryParam = params.get('subcategories');
    if (subcategoryParam) {
      setSelectedSubcategories(subcategoryParam.split(','));
    }
    
    // Set selected brands
    const brandParam = params.get('brands');
    if (brandParam) {
      setSelectedBrands(brandParam.split(','));
    }
    
    // Set price range
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    if (minPrice && maxPrice) {
      setPrice([parseInt(minPrice), parseInt(maxPrice)]);
    }
    
    // Set sale and best selling
    setOnSale(params.get('onSale') === 'true');
    setBestSelling(params.get('bestSelling') === 'true');
  }, [searchParams]);

  // Update URL when debounced price changes
  useEffect(() => {
    if (!searchParams) return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    params.set('minPrice', debouncedPrice[0].toString());
    params.set('maxPrice', debouncedPrice[1].toString());
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedPrice, router, pathname, searchParams]);

  // Update URL when filters change
  const updateURL = (newParams: Record<string, string | null>) => {
    if (!searchParams) return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    // Reset to page 1 when filters change
    params.set('page', '1');
    
    // Update the URL
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    // Skip if this category is disabled
    if (disabledCategories.includes(categoryId)) return;
    
    const newCategories = checked
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter(id => id !== categoryId);
    
    setSelectedCategories(newCategories);
    updateURL({
      categories: newCategories.length > 0 ? newCategories.join(',') : null
    });
    
    // Auto-expand subcategories when parent category is selected
    if (checked) {
      setExpandedCategories(prev => ({ ...prev, [categoryId]: true }));
    }
  };

  // Handle subcategory change
  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    // Skip if this subcategory is disabled
    if (disabledSubcategories.includes(subcategoryId)) return;
    
    const newSubcategories = checked
      ? [...selectedSubcategories, subcategoryId]
      : selectedSubcategories.filter(id => id !== subcategoryId);
    
    setSelectedSubcategories(newSubcategories);
    updateURL({
      subcategories: newSubcategories.length > 0 ? newSubcategories.join(',') : null
    });
  };

  // Handle brand change
  const handleBrandChange = (brandId: string, checked: boolean) => {
    const newBrands = checked
      ? [...selectedBrands, brandId]
      : selectedBrands.filter(id => id !== brandId);
    
    setSelectedBrands(newBrands);
    updateURL({
      brands: newBrands.length > 0 ? newBrands.join(',') : null
    });
  };

  // Handle price change
  const handlePriceChange = (newPrice: [number, number]) => {
    setPrice(newPrice);
  };

  // Handle sale and best selling toggles
  const handleOnSaleChange = (checked: boolean) => {
    setOnSale(checked);
    updateURL({ onSale: checked ? 'true' : null });
  };

  const handleBestSellingChange = (checked: boolean) => {
    setBestSelling(checked);
    updateURL({ bestSelling: checked ? 'true' : null });
  };

  // Load more items
  const loadMoreItems = (type: 'categories' | 'brands') => {
    if (type === 'categories') {
      setVisibleCategories(prev => 
        categories.slice(0, Math.min(prev.length + showMoreIncrement, categories.length))
      );
    } else if (type === 'brands') {
      setVisibleBrands(prev => 
        brands.slice(0, Math.min(prev.length + showMoreIncrement, brands.length))
      );
    }
  };

  // Toggle category expanded state to show/hide subcategories
  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Skeleton loaders for lazy loading
  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        <Skeleton className="h-8 w-4/5 mb-4" />
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="pl-4 space-y-1">
              {Array(3).fill(0).map((_, j) => (
                <Skeleton key={j} className="h-5 w-2/3" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        
        {/* Categories */}
        <Accordion type="multiple" defaultValue={['categories']} className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger className="text-base font-medium">Categories</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {visibleCategories.map((category) => (
                  <div key={category.id} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category.id}`} 
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => handleCategoryChange(category.id, checked === true)}
                        disabled={disabledCategories.includes(category.id)}
                        className={disabledCategories.includes(category.id) ? 'opacity-50' : ''}
                      />
                      <Label 
                        htmlFor={`category-${category.id}`} 
                        className={`cursor-pointer ${disabledCategories.includes(category.id) ? 'opacity-50' : ''}`}
                      >
                        {category.name} {category.count !== undefined && <span className="text-gray-500 text-sm">({category.count})</span>}
                      </Label>
                      
                      {/* Show toggle button if category has subcategories */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <button 
                          onClick={() => toggleCategoryExpanded(category.id)}
                          className="ml-auto text-gray-500 hover:text-gray-700"
                          aria-label={expandedCategories[category.id] ? "Collapse" : "Expand"}
                        >
                          <ChevronDown 
                            size={16} 
                            className={`transition-transform ${expandedCategories[category.id] ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                    
                    {/* Subcategories - show when category is selected or manually expanded */}
                    {category.subcategories && category.subcategories.length > 0 && 
                     (selectedCategories.includes(category.id) || expandedCategories[category.id]) && (
                      <div className="pl-6 space-y-1 mt-1">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`subcategory-${subcategory.id}`} 
                              checked={selectedSubcategories.includes(subcategory.id)}
                              onCheckedChange={(checked) => handleSubcategoryChange(subcategory.id, checked === true)}
                              disabled={disabledSubcategories.includes(subcategory.id)}
                              className={disabledSubcategories.includes(subcategory.id) ? 'opacity-50' : ''}
                            />
                            <Label 
                              htmlFor={`subcategory-${subcategory.id}`} 
                              className={`cursor-pointer text-sm ${disabledSubcategories.includes(subcategory.id) ? 'opacity-50' : ''}`}
                            >
                              {subcategory.name} {subcategory.count !== undefined && <span className="text-gray-500 text-xs">({subcategory.count})</span>}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Show more categories button */}
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
          
          {/* Brands */}
          <AccordionItem value="brands">
            <AccordionTrigger className="text-base font-medium">Brands</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {visibleBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`brand-${brand.id}`} 
                      checked={selectedBrands.includes(brand.id)}
                      onCheckedChange={(checked) => handleBrandChange(brand.id, checked === true)}
                    />
                    <Label htmlFor={`brand-${brand.id}`} className="cursor-pointer">
                      {brand.name} {brand.count !== undefined && <span className="text-gray-500 text-sm">({brand.count})</span>}
                    </Label>
                  </div>
                ))}
                
                {/* Show more brands button */}
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
          
          {/* Price Range */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-base font-medium">Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="px-2 pt-2 pb-4">
                <div className="mb-4">
                  <Slider
                    defaultValue={[priceRange.min, priceRange.max]}
                    value={price}
                    min={priceRange.min}
                    max={priceRange.max}
                    step={10}
                    onValueChange={(value) => handlePriceChange(value as [number, number])}
                  />
                </div>
                <div className="flex justify-between">
                  <span>${price[0]}</span>
                  <span>${price[1]}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Special Filters */}
          <AccordionItem value="special">
            <AccordionTrigger className="text-base font-medium">Special Offers</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="on-sale" 
                    checked={onSale}
                    onCheckedChange={(checked) => handleOnSaleChange(checked === true)}
                  />
                  <Label htmlFor="on-sale" className="cursor-pointer">On Sale</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="best-selling" 
                    checked={bestSelling}
                    onCheckedChange={(checked) => handleBestSellingChange(checked === true)}
                  />
                  <Label htmlFor="best-selling" className="cursor-pointer">Best Selling</Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default FilterSidebar;
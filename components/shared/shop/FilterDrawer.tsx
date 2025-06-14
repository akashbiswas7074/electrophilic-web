'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getAllCategories } from '@/lib/database/actions/categories.actions';
import { getAllBrands } from '@/lib/database/actions/brands.actions';
import { getUniqueSubCategoryNames } from '@/lib/database/actions/subCategory.actions';

// Product type (simplified version of what we need for filtering)
interface Product {
  id: string;
  categoryId: string;
  category?: string;
  subcategory: string;
  brandId: string;
  brandName: string;
  price: number;
  isOnSale: boolean;
  isBestseller?: boolean;
  stock: number;
}

// Filter state interface
interface FilterState {
  categories: string[];
  subcategories: string[];
  brands: string[];
  price: [number, number];
  sale: boolean;
  bestseller: boolean;
  inStock: boolean;
  sort: string;
  view: 'grid' | 'list';
  search: string;
  page: number;
}

interface FilterDrawerProps {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: any) => void;
  removeFilter: (key: keyof FilterState, value?: any) => void;
  clearAllFilters: () => void;
  products: Product[];
  expanded?: boolean;
  onClose?: () => void;
}

// Helper function to calculate price range from products
const calculatePriceRange = (products: Product[]): [number, number] => {
  if (!products.length) return [0, 50000];
  
  const prices = products.map(p => p.price);
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  
  return [min, max];
};

// Helper to get frequency of values in an array
const getFrequencyCounts = <T extends string | number>(arr: T[]): Record<string, number> => {
  return arr.reduce((acc, val) => {
    const key = String(val);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  filters,
  updateFilter,
  removeFilter,
  clearAllFilters,
  products,
  expanded = false,
  onClose
}) => {
  // Local state for filter UI
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>(filters.price);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate facets (counts for each filter value)
  const categoryFacets = getFrequencyCounts(products.map(p => p.categoryId));
  const brandFacets = getFrequencyCounts(products.map(p => p.brandId));
  const subcategoryFacets = getFrequencyCounts(products.filter(p => p.subcategory).map(p => p.subcategory));
  
  // Count products on sale, bestsellers, and in stock
  const saleCount = products.filter(p => p.isOnSale).length;
  const bestsellerCount = products.filter(p => p.isBestseller).length;
  const inStockCount = products.filter(p => p.stock > 0).length;
  
  // Product price range
  const [minPrice, maxPrice] = calculatePriceRange(products);
  
  // Fetch categories, brands, and subcategories on mount
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
          setCategories(categoriesResponse.categories.map(c => ({ id: c._id, name: c.name })));
        } else if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse.map(c => ({ id: c._id, name: c.name })));
        } else {
          console.error("[FilterDrawer] Failed to process categories", categoriesResponse);
          setCategories([]);
        }
        
        // Process subcategories
        setSubcategories(subcategoriesResult || []);
        
        // Process brands
        if (brandsResponse?.brands && Array.isArray(brandsResponse.brands)) {
          setBrands(brandsResponse.brands.map(b => ({ id: b._id, name: b.name })));
        } else if (Array.isArray(brandsResponse)) {
          setBrands(brandsResponse.map(b => ({ id: b._id, name: b.name })));
        } else {
          console.error("[FilterDrawer] Failed to process brands", brandsResponse);
          setBrands([]);
        }
      } catch (error) {
        console.error("[FilterDrawer] Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilterData();
  }, []);
  
  // Update price range slider when price filter changes
  useEffect(() => {
    setPriceRange(filters.price);
  }, [filters.price]);
  
  // Apply price filter
  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
  };
  
  const handlePriceChangeEnd = () => {
    updateFilter('price', priceRange);
  };
  
  // Filter categories, brands, and subcategories by search
  const filteredCategories = categories.filter(
    c => c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const filteredBrands = brands.filter(
    b => b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  
  const filteredSubcategories = subcategories.filter(
    s => s.toLowerCase().includes(subcategorySearch.toLowerCase())
  );
  
  // Content of the filter drawer
  const filterContent = (
    <div className="space-y-6">
      {/* Price Range Filter */}
      <div className="space-y-4">
        <h3 className="font-medium">Price Range</h3>
        <div className="space-y-6 px-1">
          <Slider
            defaultValue={[minPrice, maxPrice]}
            value={priceRange}
            min={minPrice}
            max={maxPrice}
            step={10}
            onValueChange={(value) => handlePriceChange(value as [number, number])}
            onValueCommit={() => handlePriceChangeEnd()}
            className="py-4"
          />
          <div className="flex items-center justify-between">
            <div className="border rounded-md p-2 w-full text-center text-sm">
              ₹{priceRange[0].toLocaleString('en-IN')}
            </div>
            <span className="mx-2 text-muted-foreground">to</span>
            <div className="border rounded-md p-2 w-full text-center text-sm">
              ₹{priceRange[1].toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Quick Filters */}
      <div className="space-y-4">
        <h3 className="font-medium">Quick Filters</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch 
                id="sale-filter" 
                checked={filters.sale}
                onCheckedChange={(checked) => updateFilter('sale', checked)}
              />
              <Label htmlFor="sale-filter">On Sale</Label>
            </div>
            <span className="text-xs text-muted-foreground">{saleCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch 
                id="bestseller-filter" 
                checked={filters.bestseller}
                onCheckedChange={(checked) => updateFilter('bestseller', checked)}
              />
              <Label htmlFor="bestseller-filter">Best Sellers</Label>
            </div>
            <span className="text-xs text-muted-foreground">{bestsellerCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch 
                id="instock-filter" 
                checked={filters.inStock}
                onCheckedChange={(checked) => updateFilter('inStock', checked)}
              />
              <Label htmlFor="instock-filter">In Stock</Label>
            </div>
            <span className="text-xs text-muted-foreground">{inStockCount}</span>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Categories Accordion */}
      <Accordion type="multiple" defaultValue={['categories']} className="w-full">
        <AccordionItem value="categories" className="border-none">
          <AccordionTrigger className="py-3 font-medium">
            Categories
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {loading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading categories...
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No categories found
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`category-${category.id}`}
                          checked={filters.categories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('categories', [...filters.categories, category.id]);
                            } else {
                              removeFilter('categories', category.id);
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`category-${category.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {categoryFacets[category.id] || 0}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Subcategories Accordion */}
        <AccordionItem value="subcategories" className="border-none">
          <AccordionTrigger className="py-3 font-medium">
            Subcategories
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search subcategories..."
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {loading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading subcategories...
                  </div>
                ) : filteredSubcategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No subcategories found
                  </div>
                ) : (
                  filteredSubcategories.map((subcategory) => (
                    <div key={subcategory} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`subcategory-${subcategory}`}
                          checked={filters.subcategories.includes(subcategory)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('subcategories', [...filters.subcategories, subcategory]);
                            } else {
                              removeFilter('subcategories', subcategory);
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`subcategory-${subcategory}`}
                          className="text-sm cursor-pointer"
                        >
                          {subcategory}
                        </Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {subcategoryFacets[subcategory] || 0}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Brands Accordion */}
        <AccordionItem value="brands" className="border-none">
          <AccordionTrigger className="py-3 font-medium">
            Brands
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {loading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading brands...
                  </div>
                ) : filteredBrands.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No brands found
                  </div>
                ) : (
                  filteredBrands.map((brand) => (
                    <div key={brand.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`brand-${brand.id}`}
                          checked={filters.brands.includes(brand.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('brands', [...filters.brands, brand.id]);
                            } else {
                              removeFilter('brands', brand.id);
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`brand-${brand.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {brand.name}
                        </Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {brandFacets[brand.id] || 0}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Separator />
      
      {/* Clear all filters button */}
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={clearAllFilters}
      >
        Clear All Filters
      </Button>
    </div>
  );
  
  // For desktop view (expanded)
  if (expanded) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        {filterContent}
      </div>
    );
  }
  
  // For mobile view (slide-in drawer)
  return (
    <Sheet open onOpenChange={() => onClose?.()}>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-white pb-4 z-10">
          <SheetTitle className="text-left">Filters</SheetTitle>
        </SheetHeader>
        
        {filterContent}
        
        <SheetFooter className="mt-6">
          <Button 
            className="w-full" 
            onClick={() => onClose?.()}
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
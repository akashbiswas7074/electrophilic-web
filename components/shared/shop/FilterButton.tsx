'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Filter } from 'lucide-react';

// Define and export a specific type for the filters state
export interface SelectedFiltersState {
  category: string[];
  subcategory: string[];
  sale: string[];
  brand: string[];
  bestSelling: string[];
  color: string[];
  size: string[];
  isNew: string[];
  isFeatured: string[];
  inStock: string[];
  price: [number, number];
  rating: string[];
}

// Define Category type
interface Category {
  _id: string;
  name: string;
}

// Update Brand type to use _id
interface Brand {
  _id: string;
  name: string;
}

// Define props for filter callbacks and fetched data
interface FilterButtonProps {
  categories: Category[];
  subCategoryNames: string[];
  brands: Brand[];
  onApplyFilters: (filters: SelectedFiltersState, priceRange: number[]) => void;
  onClearFilters: () => void;
  initialFilters?: Partial<SelectedFiltersState>;
  initialPriceRange?: number[];
}

// Default initial filters with the specific type
const defaultInitialFilters: SelectedFiltersState = {
  category: [],
  subcategory: [],
  sale: [],
  brand: [],
  bestSelling: [],
  color: [],
  size: [],
  isNew: [],
  isFeatured: [],
  inStock: [],
  price: [0, 20000],
  rating: [],
};

const FilterButton = ({
  categories = [],
  subCategoryNames = [],
  brands = [],
  onApplyFilters,
  onClearFilters,
  initialFilters = {},
  initialPriceRange = [0, 20000]
}: FilterButtonProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>(initialPriceRange);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFiltersState>({
    ...defaultInitialFilters,
    ...initialFilters,
  });

  const handleCheckboxChange = (
    filterType: Exclude<keyof SelectedFiltersState, 'price'>,
    value: string,
    checked: boolean
  ) => {
    setSelectedFilters(prev => {
      const currentValues = prev[filterType] as string[];
      
      if (checked) {
        if (!currentValues.includes(value)) {
          return { ...prev, [filterType]: [...currentValues, value] };
        }
        return prev;
      } else {
        return { ...prev, [filterType]: currentValues.filter((v: string) => v !== value) };
      }
    });
  };

  const applyFilters = () => {
    console.log("Applying Filters:", selectedFilters, priceRange);
    onApplyFilters(selectedFilters, priceRange);
    setIsSheetOpen(false);
  };

  const clearFilters = () => {
    setSelectedFilters(defaultInitialFilters);
    setPriceRange([0, 20000]);
    onClearFilters();
    console.log("Filters Cleared");
  };

  useEffect(() => {
    const syncedFilters: SelectedFiltersState = {
      ...defaultInitialFilters,
      category: initialFilters.category || [],
      subcategory: initialFilters.subcategory || [],
      sale: initialFilters.sale || [],
      brand: initialFilters.brand || [],
      bestSelling: initialFilters.bestSelling || [],
    };
    setSelectedFilters(syncedFilters);
  }, [initialFilters]);

  useEffect(() => {
    setPriceRange(initialPriceRange);
  }, [initialPriceRange]);

  const saleOptions = [
    { id: "sale", name: "On Sale" },
  ];
  const bestSellingOptions = [
    { id: "bestseller", name: "Best Selling" },
  ];

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[300px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-4 py-4">
          <Accordion type="multiple" defaultValue={['category', 'price', 'brand', 'sale']} className="w-full">
            <AccordionItem value="category">
              <AccordionTrigger>Category</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cat-all"
                      checked={selectedFilters.category.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            category: []
                          }));
                        }
                      }}
                    />
                    <Label htmlFor="cat-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      All Categories
                    </Label>
                  </div>
                  
                  {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat._id}`}
                        checked={selectedFilters.category.includes(cat._id)}
                        onCheckedChange={(checked) => handleCheckboxChange('category', cat._id, !!checked)}
                      />
                      <Label htmlFor={`cat-${cat._id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {cat.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="subcategory">
              <AccordionTrigger>Subcategory</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subcat-all"
                      checked={selectedFilters.subcategory.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            subcategory: []
                          }));
                        }
                      }}
                    />
                    <Label htmlFor="subcat-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      All Subcategories
                    </Label>
                  </div>
                  
                  {subCategoryNames.map((name) => (
                    <div key={name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subcat-${name}`}
                        checked={selectedFilters.subcategory.includes(name)}
                        onCheckedChange={(checked) => handleCheckboxChange('subcategory', name, !!checked)}
                      />
                      <Label htmlFor={`subcat-${name}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="price">
              <AccordionTrigger>Shop By Price</AccordionTrigger>
              <AccordionContent>
                <div className="px-1">
                  <Slider
                    value={priceRange}
                    max={20000}
                    step={500}
                    minStepsBetweenThumbs={1}
                    onValueChange={(value) => setPriceRange(value)}
                    className="my-4"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
                    <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPriceRange([0, 20000])}
                      className="text-xs"
                    >
                      Reset to All Prices
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sale">
              <AccordionTrigger>Deals & Features</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {saleOptions.map((sale) => (
                    <div key={sale.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sale-${sale.id}`}
                        checked={selectedFilters.sale.includes(sale.id)}
                        onCheckedChange={(checked) => handleCheckboxChange('sale', sale.id, !!checked)}
                      />
                      <Label htmlFor={`sale-${sale.id}`} className="text-sm font-medium leading-none">
                        {sale.name}
                      </Label>
                    </div>
                  ))}
                  {bestSellingOptions.map((bs) => (
                    <div key={bs.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bs-${bs.id}`}
                        checked={selectedFilters.bestSelling.includes(bs.id)}
                        onCheckedChange={(checked) => handleCheckboxChange('bestSelling', bs.id, !!checked)}
                      />
                      <Label htmlFor={`bs-${bs.id}`} className="text-sm font-medium leading-none">
                        {bs.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="brand">
              <AccordionTrigger>Brand</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="brand-all"
                      checked={selectedFilters.brand.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFilters(prev => ({
                            ...prev,
                            brand: []
                          }));
                        }
                      }}
                    />
                    <Label htmlFor="brand-all" className="text-sm font-medium leading-none">
                      All Brands
                    </Label>
                  </div>
                  
                  {brands.map((brand) => (
                    <div key={brand._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand._id}`}
                        checked={selectedFilters.brand.includes(brand._id)}
                        onCheckedChange={(checked) => handleCheckboxChange('brand', brand._id, !!checked)}
                      />
                      <Label htmlFor={`brand-${brand._id}`} className="text-sm font-medium leading-none">
                        {brand.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="mt-auto border-t pt-4">
          <Button variant="outline" onClick={clearFilters}>Clear All</Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterButton;

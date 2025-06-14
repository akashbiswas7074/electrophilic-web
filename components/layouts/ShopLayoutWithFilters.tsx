'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import SidebarFilters from '@/components/shared/shop/SidebarFilters';
import { Button } from '@/components/ui/button';
import { Filter, X, Search, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type SelectedFiltersState } from "@/components/shared/shop/SidebarFilters";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  parent?: string;
}

interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  category?: {
    _id: string;
    name: string;
  };
  brand?: {
    _id: string;
    name: string;
  };
  subcategory?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  stock?: number;
  image?: string;
  subProducts?: any[];
}

// Page type enum to identify which page is currently active
export enum ShopPageType {
  SHOP = 'shop',
  CATEGORY = 'category',
  SUBCATEGORY = 'subcategory'
}

// Shop Context for sharing filter state
interface ShopContextType {
  filteredProducts: Product[];
  loading: boolean;
  selectedFilters: SelectedFiltersState;
  priceRange: number[];
  searchQuery: string;
  totalProducts: number;
  setSearchQuery: (query: string) => void;
  setSelectedFilters: (filters: SelectedFiltersState) => void;
  setPriceRange: (range: number[]) => void;
  clearAllFilters: () => void;
  categories: Category[];
  subcategories: string[];
  brands: Brand[];
  allSubCategoryDetails: SubCategory[];
  pageType: ShopPageType;
  currentCategorySlug?: string;
  currentSubCategoryId?: string;
  currentSubCategoryName?: string;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within ShopLayoutWithFilters');
  }
  return context;
};

interface ShopLayoutWithFiltersProps {
  children: React.ReactNode;
  pageType: ShopPageType;
  categorySlug?: string;
  subCategoryId?: string;
  subCategoryName?: string;
}

export default function ShopLayoutWithFilters({
  children,
  pageType,
  categorySlug,
  subCategoryId,
  subCategoryName
}: ShopLayoutWithFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // UI States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  
  // Filter States
  const [selectedFilters, setSelectedFilters] = useState<SelectedFiltersState>({
    category: [],
    subcategory: [],
    sale: [],
    brand: [],
    bestSelling: [],
    isNew: [],
    isFeatured: [],
    inStock: [], // Add missing inStock property
    rating: [], // Add missing rating property
    price: [0, 20000] as [number, number], // Add missing price property
    color: [], // Add missing color property
    size: [], // Add missing size property
  });
  const [priceRange, setPriceRange] = useState<number[]>([0, 20000]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allSubCategoryDetails, setAllSubCategoryDetails] = useState<SubCategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Track disabled categories and subcategories based on current page
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [disabledSubcategories, setDisabledSubcategories] = useState<string[]>([]);

  // Initialize URL search params
  useEffect(() => {
    if (!searchParams) return;
    
    try {
      const category = searchParams.get('category') ?? '';
      const subcategory = searchParams.get('subcategory') ?? '';
      const brand = searchParams.get('brand') ?? '';
      const search = searchParams.get('search') ?? '';
      const minPrice = searchParams.get('minPrice') ?? '';
      const maxPrice = searchParams.get('maxPrice') ?? '';
      const sale = searchParams.get('sale') ?? '';
      const bestseller = searchParams.get('bestseller') ?? '';
      const featured = searchParams.get('featured') ?? '';
      const isNew = searchParams.get('new') ?? '';
      
      if (search) setSearchQuery(search);
      if (minPrice || maxPrice) {
        setPriceRange([
          minPrice ? Math.max(0, parseInt(minPrice)) : 0,
          maxPrice ? Math.min(20000, parseInt(maxPrice)) : 20000
        ]);
      }
      
      setSelectedFilters({
        category: category ? category.split(',').filter(Boolean) : [],
        subcategory: subcategory ? subcategory.split(',').filter(Boolean) : [],
        brand: brand ? brand.split(',').filter(Boolean) : [],
        sale: sale === 'true' ? ['sale'] : [],
        bestSelling: bestseller === 'true' ? ['bestseller'] : [],
        isNew: isNew === 'true' ? ['new'] : [],
        isFeatured: featured === 'true' ? ['featured'] : [],
        inStock: [], // Add missing inStock property
        rating: [], // Add missing rating property
        price: [
          minPrice ? Math.max(0, parseInt(minPrice)) : 0,
          maxPrice ? Math.min(20000, parseInt(maxPrice)) : 20000
        ] as [number, number], // Add missing price property with URL values
        color: [], // Add missing color property
        size: [], // Add missing size property
      });
    } catch (error) {
      console.error('Error parsing search params:', error);
    }
  }, [searchParams]);

  // Set up disabled categories/subcategories based on page type
  useEffect(() => {
    // Reset disabled items
    setDisabledCategories([]);
    setDisabledSubcategories([]);
    
    // If we're on a category page, find and disable that category
    if (pageType === ShopPageType.CATEGORY && categorySlug) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        setDisabledCategories([category._id]);
        
        // Update selected filters to include this category
        setSelectedFilters(prev => ({
          ...prev,
          category: [category._id]
        }));
      }
    }
    
    // If we're on a subcategory page, find and disable that subcategory
    if (pageType === ShopPageType.SUBCATEGORY && subCategoryName) {
      setDisabledSubcategories([subCategoryName]);
      
      // Update selected filters to include this subcategory
      setSelectedFilters(prev => ({
        ...prev,
        subcategory: [subCategoryName]
      }));
    }
  }, [pageType, categorySlug, subCategoryName, categories, subCategoryId]);

  // Fetch all data using API route
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/shop/products');
        const result = await response.json();
        
        if (result.success && result.data) {
          const { products, categories, brands, subcategories, allSubCategoryDetails } = result.data;
          
          // Transform products to ensure consistent interface
          const transformedProducts = (products || [])
            .map(transformProduct)
            .filter(Boolean) as Product[];
          
          setAllProducts(transformedProducts);
          setCategories(categories || []);
          setBrands(brands || []);
          setSubcategories(subcategories || []);
          setAllSubCategoryDetails(allSubCategoryDetails || []);
          
          console.log('Shop data loaded:', {
            products: transformedProducts.length,
            categories: (categories || []).length,
            brands: (brands || []).length,
            subcategories: (subcategories || []).length
          });
        } else {
          console.error('Failed to fetch shop data:', result.error);
          // Set empty arrays as fallback
          setAllProducts([]);
          setCategories([]);
          setBrands([]);
          setSubcategories([]);
          setAllSubCategoryDetails([]);
        }
        
      } catch (error) {
        console.error("Error fetching shop data:", error);
        // Set empty arrays as fallback
        setAllProducts([]);
        setCategories([]);
        setBrands([]);
        setSubcategories([]);
        setAllSubCategoryDetails([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Transform product data safely
  const transformProduct = (product: any): Product | null => {
    if (!product || typeof product !== 'object') return null;
    
    try {
      const subProducts = Array.isArray(product.subProducts) ? product.subProducts : [];
      const firstSubProduct = subProducts.length > 0 ? subProducts[0] : null;
      
      // Calculate stock safely
      let stock = 0;
      try {
        if (firstSubProduct?.sizes && Array.isArray(firstSubProduct.sizes)) {
          stock = firstSubProduct.sizes.reduce((total: number, size: any) => total + (size?.qty || 0), 0);
        } else if (firstSubProduct?.qty) {
          stock = firstSubProduct.qty;
        } else if (product.stock || product.qty) {
          stock = product.stock || product.qty;
        }
      } catch (e) {
        stock = 0;
      }
      
      // Get main product image safely
      let image = '';
      try {
        if (firstSubProduct?.images && firstSubProduct.images.length > 0) {
          image = firstSubProduct.images[0];
        } else if (product.images && product.images.length > 0) {
          image = product.images[0];
        }
      } catch (e) {
        image = '';
      }
      
      // Format subcategory name
      let subcategoryName = '';
      try {
        if (product.subcategory && typeof product.subcategory === 'object' && product.subcategory.name) {
          subcategoryName = product.subcategory.name;
        } else if (typeof product.subcategory === 'string') {
          subcategoryName = product.subcategory;
        }
      } catch (e) {
        subcategoryName = '';
      }
      
      return {
        _id: product._id || '',
        id: product.id || product._id || '',
        name: product.name || '',
        slug: product.slug || '',
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : Number(product.price) || 0,
        discount: product.discount ? Number(product.discount) : 0,
        category: product.category || null,
        brand: product.brand || null,
        subcategory: subcategoryName,
        isNew: !!product.isNew,
        isBestseller: !!product.isBestseller,
        isFeatured: !!product.isFeatured,
        isOnSale: !!product.isOnSale || !!product.discount,
        stock,
        image,
        subProducts: subProducts || [],
      };
    } catch (error) {
      console.error("Error transforming product:", error);
      return null;
    }
  };

  // Apply all filters to products
  useEffect(() => {
    let filtered = [...allProducts];
    
    // If we're on a category page, filter by the current category
    if (pageType === ShopPageType.CATEGORY && categorySlug) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        filtered = filtered.filter(product => 
          product.category && product.category._id === category._id
        );
      }
    }
    
    // If we're on a subcategory page, filter by the current subcategory
    if (pageType === ShopPageType.SUBCATEGORY && subCategoryName) {
      filtered = filtered.filter(product => 
        product.subcategory === subCategoryName
      );
    }
    
    // Apply other filters from selectedFilters state ONLY if not on category/subcategory pages
    // or if additional filters are selected
    
    // Filter by categories (not needed if we're on a category page)
    if (pageType !== ShopPageType.CATEGORY && selectedFilters.category.length > 0) {
      filtered = filtered.filter(product => 
        product.category && selectedFilters.category.includes(product.category._id)
      );
    }
    
    // Filter by subcategories (not needed if we're on a subcategory page)
    if (pageType !== ShopPageType.SUBCATEGORY && selectedFilters.subcategory.length > 0) {
      filtered = filtered.filter(product => 
        product.subcategory && selectedFilters.subcategory.includes(product.subcategory)
      );
    }
    
    // Filter by brands
    if (selectedFilters.brand.length > 0) {
      filtered = filtered.filter(product => 
        product.brand && selectedFilters.brand.includes(product.brand._id)
      );
    }
    
    // Filter by product status flags
    if (selectedFilters.sale.includes('sale')) {
      filtered = filtered.filter(product => product.isOnSale);
    }
    
    if (selectedFilters.bestSelling.includes('bestseller')) {
      filtered = filtered.filter(product => product.isBestseller);
    }
    
    if (selectedFilters.isNew.includes('new')) {
      filtered = filtered.filter(product => product.isNew);
    }
    
    if (selectedFilters.isFeatured.includes('featured')) {
      filtered = filtered.filter(product => product.isFeatured);
    }
    
    // Filter by price range
    filtered = filtered.filter(product => {
      const price = Number(product.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(query);
        const brandMatch = product.brand?.name.toLowerCase().includes(query);
        const categoryMatch = product.category?.name.toLowerCase().includes(query);
        const subcategoryMatch = product.subcategory?.toLowerCase().includes(query);
        
        return nameMatch || brandMatch || categoryMatch || subcategoryMatch;
      });
    }
    
    setFilteredProducts(filtered);
  }, [
    allProducts, 
    selectedFilters, 
    priceRange, 
    searchQuery,
    pageType,
    categorySlug,
    subCategoryName,
    categories
  ]);

  // Handle filter changes
  const handleFilterChange = (newFilters: SelectedFiltersState, newPriceRange: number[]) => {
    // Update URL parameters
    const params = new URLSearchParams();
    
    // Only add category param if we're not on a category page
    if (pageType !== ShopPageType.CATEGORY && newFilters.category.length > 0) {
      params.set('category', newFilters.category.join(','));
    }
    
    // Only add subcategory param if we're not on a subcategory page
    if (pageType !== ShopPageType.SUBCATEGORY && newFilters.subcategory.length > 0) {
      params.set('subcategory', newFilters.subcategory.join(','));
    }
    
    if (newFilters.brand.length > 0) {
      params.set('brand', newFilters.brand.join(','));
    }
    
    if (newFilters.sale.includes('sale')) {
      params.set('sale', 'true');
    }
    
    if (newFilters.bestSelling.includes('bestseller')) {
      params.set('bestseller', 'true');
    }
    
    if (newFilters.isNew.includes('new')) {
      params.set('new', 'true');
    }
    
    if (newFilters.isFeatured.includes('featured')) {
      params.set('featured', 'true');
    }
    
    if (newPriceRange[0] > 0) {
      params.set('minPrice', newPriceRange[0].toString());
    }
    
    if (newPriceRange[1] < 20000) {
      params.set('maxPrice', newPriceRange[1].toString());
    }
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    // Update the URL without full page reload
    const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl, { scroll: false });
    
    // Update state
    setSelectedFilters(newFilters);
    setPriceRange(newPriceRange);
  };

  // Handle clearing all filters
  const clearAllFilters = () => {
    // Keep category/subcategory selection if we're on a category/subcategory page
    let newFilters: SelectedFiltersState = {
      category: [],
      subcategory: [],
      sale: [],
      brand: [],
      bestSelling: [],
      isNew: [],
      isFeatured: [],
      inStock: [], // Add missing inStock property
      rating: [], // Add missing rating property
      price: [0, 20000] as [number, number], // Add missing price property
      color: [], // Add missing color property
      size: [], // Add missing size property
    };
    
    if (pageType === ShopPageType.CATEGORY) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        newFilters.category = [category._id];
      }
    }
    
    if (pageType === ShopPageType.SUBCATEGORY && subCategoryName) {
      newFilters.subcategory = [subCategoryName];
    }
    
    setSelectedFilters(newFilters);
    setPriceRange([0, 20000]);
    setSearchQuery('');
    
    // Update URL based on page type
    let newUrl = '';
    switch (pageType) {
      case ShopPageType.SHOP:
        newUrl = '/shop';
        break;
      case ShopPageType.CATEGORY:
        newUrl = `/shop/category/${categorySlug}`;
        break;
      case ShopPageType.SUBCATEGORY:
        newUrl = `/shop/subCategory/${subCategoryId}?name=${encodeURIComponent(subCategoryName || '')}`;
        break;
    }
    
    router.push(newUrl);
  };

  // Handle search query submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search query
    const params = new URLSearchParams(searchParams?.toString());
    
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    
    const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl, { scroll: false });
  };
  
  // Context value
  const contextValue: ShopContextType = {
    filteredProducts,
    loading,
    selectedFilters,
    priceRange,
    searchQuery,
    totalProducts: filteredProducts.length,
    setSearchQuery,
    setSelectedFilters,
    setPriceRange,
    clearAllFilters,
    categories,
    subcategories,
    brands,
    allSubCategoryDetails,
    pageType,
    currentCategorySlug: categorySlug,
    currentSubCategoryId: subCategoryId,
    currentSubCategoryName: subCategoryName
  };

  return (
    <ShopContext.Provider value={contextValue}>
      <div className="container mx-auto px-4 py-8">
        {/* Shop heading and filters row */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {pageType === ShopPageType.CATEGORY && categorySlug
                ? categories.find(c => c.slug === categorySlug)?.name || 'Category'
                : pageType === ShopPageType.SUBCATEGORY && subCategoryName
                  ? subCategoryName
                  : 'Shop All Products'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredProducts.length} products
            </p>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <form onSubmit={handleSearch} className="relative flex-grow">
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            </form>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden"
              aria-label="Filter"
            >
              <Filter size={18} />
            </Button>
          </div>
        </div>
        
        {/* Active filters */}
        {(selectedFilters.category.length > 0 || 
          selectedFilters.subcategory.length > 0 || 
          selectedFilters.brand.length > 0 || 
          selectedFilters.sale.length > 0 ||
          selectedFilters.bestSelling.length > 0 ||
          selectedFilters.isNew.length > 0 ||
          selectedFilters.isFeatured.length > 0 ||
          priceRange[0] > 0 ||
          priceRange[1] < 20000 ||
          searchQuery) && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium">Active Filters:</span>
              
              {/* Show active categories */}
              {pageType !== ShopPageType.CATEGORY && selectedFilters.category.map(catId => {
                const category = categories.find(c => c._id === catId);
                return category ? (
                  <Badge key={`cat-${catId}`} variant="outline" className="flex items-center gap-1">
                    {category.name}
                    <button 
                      onClick={() => {
                        setSelectedFilters(prev => ({
                          ...prev,
                          category: prev.category.filter(id => id !== catId)
                        }));
                      }}
                      aria-label={`Remove ${category.name} filter`}
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ) : null;
              })}
              
              {/* Show active subcategories */}
              {pageType !== ShopPageType.SUBCATEGORY && selectedFilters.subcategory.map(subcat => (
                <Badge key={`subcat-${subcat}`} variant="outline" className="flex items-center gap-1">
                  {subcat}
                  <button 
                    onClick={() => {
                      setSelectedFilters(prev => ({
                        ...prev,
                        subcategory: prev.subcategory.filter(sc => sc !== subcat)
                      }));
                    }}
                    aria-label={`Remove ${subcat} filter`}
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
              
              {/* Show active brands */}
              {selectedFilters.brand.map(brandId => {
                const brand = brands.find(b => b._id === brandId);
                return brand ? (
                  <Badge key={`brand-${brandId}`} variant="outline" className="flex items-center gap-1">
                    {brand.name}
                    <button 
                      onClick={() => {
                        setSelectedFilters(prev => ({
                          ...prev,
                          brand: prev.brand.filter(id => id !== brandId)
                        }));
                      }}
                      aria-label={`Remove ${brand.name} filter`}
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ) : null;
              })}
              
              {/* Show other active filters */}
              {selectedFilters.sale.includes('sale') && (
                <Badge variant="outline" className="flex items-center gap-1">
                  On Sale
                  <button 
                    onClick={() => {
                      setSelectedFilters(prev => ({
                        ...prev,
                        sale: []
                      }));
                    }}
                    aria-label="Remove on sale filter"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              
              {selectedFilters.bestSelling.includes('bestseller') && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Best Selling
                  <button 
                    onClick={() => {
                      setSelectedFilters(prev => ({
                        ...prev,
                        bestSelling: []
                      }));
                    }}
                    aria-label="Remove best selling filter"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              
              {selectedFilters.isNew.includes('new') && (
                <Badge variant="outline" className="flex items-center gap-1">
                  New Arrival
                  <button 
                    onClick={() => {
                      setSelectedFilters(prev => ({
                        ...prev,
                        isNew: []
                      }));
                    }}
                    aria-label="Remove new arrival filter"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              
              {selectedFilters.isFeatured.includes('featured') && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Featured
                  <button 
                    onClick={() => {
                      setSelectedFilters(prev => ({
                        ...prev,
                        isFeatured: []
                      }));
                    }}
                    aria-label="Remove featured filter"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              
              {/* Show price range filter */}
              {(priceRange[0] > 0 || priceRange[1] < 20000) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Price: ₹{priceRange[0]} - ₹{priceRange[1]}
                  <button 
                    onClick={() => {
                      setPriceRange([0, 20000]);
                    }}
                    aria-label="Remove price filter"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              
              {/* Show search query */}
              {searchQuery && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Search: {searchQuery}
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      const params = new URLSearchParams(searchParams?.toString());
                      params.delete('search');
                      const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
                      router.push(newUrl, { scroll: false });
                    }}
                    aria-label="Remove search query"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              
              {/* Clear all filters button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters} 
                className="text-sm"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden md:block md:col-span-3 lg:col-span-2">
            <SidebarFilters
              categories={categories}
              subCategoryNames={subcategories}
              brands={brands}
              onApplyFilters={handleFilterChange}
              onClearFilters={clearAllFilters}
              initialFilters={selectedFilters}
              initialPriceRange={priceRange}
              disabledCategories={disabledCategories}
              disabledSubcategories={disabledSubcategories}
              subCategoryDetails={allSubCategoryDetails}
              isLoading={loading}
              className="sticky top-24"
            />
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10">
            {children}
          </div>
        </div>
        
        {/* Mobile Filter Sidebar */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              
              {/* Sidebar */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 right-0 w-[85%] max-w-md bg-background z-50 p-6 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
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
                    handleFilterChange(filters, range);
                    setIsMobileFilterOpen(false);
                  }}
                  onClearFilters={() => {
                    clearAllFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  initialFilters={selectedFilters}
                  initialPriceRange={priceRange}
                  disabledCategories={disabledCategories}
                  disabledSubcategories={disabledSubcategories}
                  subCategoryDetails={allSubCategoryDetails}
                  isLoading={loading}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ShopContext.Provider>
  );
}
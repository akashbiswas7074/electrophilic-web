'use client';

import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
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
  slug: string; // Changed from string | ObjectId to string
  images?: { url: string }[];
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
  id?: string; // Add optional id property
  name: string;
  slug: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  category?: {
    _id: string;
    name: string;
    slug?: string; // Make slug optional
  } | string; // Allow category to be string or object (like brand)
  brand?: {
    _id: string;
    name: string;
  } | string; // Allow brand to be string or object
  subcategory?: string | { name: string }; // Allow subcategory to be string or object
  subCategories?: (string | { name: string })[]; // Add subCategories array with flexible types
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  stock?: number;
  image?: string;
  subProducts?: any[];
  rating?: number; // Add rating property
  numReviews?: number; // Add numReviews property
  bestsellerRank?: number; // Add bestsellerRank property
  orderCount?: number; // Add orderCount property
  sold?: number; // Add sold property
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
  removeFilter: (type: keyof SelectedFiltersState, value: string) => void;
  categories: Category[];
  subcategories: string[];
  brands: Brand[];
  allSubCategoryDetails: SubCategory[];
  pageType: ShopPageType;
  currentCategorySlug?: string;
  currentSubCategoryId?: string;
  currentSubCategoryName?: string;
  setDirectProducts?: (products: Product[]) => void;
  setPageType: (pageType: ShopPageType) => void;
  setCurrentSubCategoryName: (name: string) => void;
  setLoading: (loading: boolean) => void;
  setCurrentCategorySlug?: (slug: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within ShopLayout');
  }
  return context;
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // UI States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  
  // Debug effect to track state changes
  useEffect(() => {
    console.log('Mobile filter state updated:', isMobileFilterOpen);
  }, [isMobileFilterOpen]);
  
  // Toggle mobile filter drawer with useCallback
  const toggleMobileFilterDrawer = useCallback(() => {
    setIsMobileFilterOpen(prev => !prev);
  }, []);
  
  // Filter States
  const [selectedFilters, setSelectedFilters] = useState<SelectedFiltersState>({
    category: [],
    subcategory: [],
    sale: [],
    brand: [],
    bestSelling: [],
    isNew: [],
    isFeatured: [],
    inStock: [],
    rating: [],
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
  // Add state for direct products
  const [directProducts, setDirectProducts] = useState<Product[]>([]);

  // Determine page type based on URL path
  const [pageType, setPageType] = useState<ShopPageType>(ShopPageType.SHOP);
  const [currentCategorySlug, setCurrentCategorySlug] = useState<string | undefined>(undefined);
  const [currentSubCategoryId, setCurrentSubCategoryId] = useState<string | undefined>(undefined);
  const [currentSubCategoryName, setCurrentSubCategoryName] = useState<string | undefined>(undefined);
  
  // Detect current page type and slugs from URL
  useEffect(() => {
    if (!pathname) return;
    
    try {
      // Check if we're on a direct subcategory page (new route)
      const directSubcategoryMatch = pathname.match(/\/shop\/subcategory\/([^\/]+)$/);
      if (directSubcategoryMatch) {
        setPageType(ShopPageType.SUBCATEGORY);
        setCurrentCategorySlug(undefined);
        
        // Format subcategory slug to a proper name (replace hyphens with spaces and capitalize)
        const formattedSubName = directSubcategoryMatch[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        setCurrentSubCategoryName(formattedSubName);
        return;
      }
      
      // Check if we're on a category page
      const categoryMatch = pathname.match(/\/shop\/category\/([^\/]+)$/);
      if (categoryMatch) {
        setPageType(ShopPageType.CATEGORY);
        setCurrentCategorySlug(categoryMatch[1]);
        setCurrentSubCategoryName(undefined);
        return;
      }
      
      // Check if we're on a nested subcategory page
      const subcategoryMatch = pathname.match(/\/shop\/category\/([^\/]+)\/([^\/]+)$/);
      if (subcategoryMatch) {
        setPageType(ShopPageType.SUBCATEGORY);
        setCurrentCategorySlug(subcategoryMatch[1]);
        
        // Format subcategory slug to a proper name (replace hyphens with spaces and capitalize)
        const formattedSubName = subcategoryMatch[2]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        setCurrentSubCategoryName(formattedSubName);
        return;
      }
      
      // Default to shop page
      setPageType(ShopPageType.SHOP);
      setCurrentCategorySlug(undefined);
      setCurrentSubCategoryName(undefined);
    } catch (error) {
      console.error('Error determining page type:', error);
    }
  }, [pathname]);
  
  // Initialize URL search params - MODIFIED to handle path-based routing
  useEffect(() => {
    if (!searchParams) return;
    
    try {
      // For path-based navigation, we rely on the pathname effect above
      // This effect now only handles traditional filter params
      const brand = searchParams.get('brand') ?? '';
      const search = searchParams.get('search') ?? '';
      const minPrice = searchParams.get('minPrice') ?? '';
      const maxPrice = searchParams.get('maxPrice') ?? '';
      const sale = searchParams.get('sale') ?? '';
      const bestseller = searchParams.get('bestseller') ?? '';
      const featured = searchParams.get('featured') ?? '';
      const isNew = searchParams.get('new') ?? '';
      
      // Log the parameters to help with debugging
      console.log('URL Parameters:', { 
        brand, search, minPrice, maxPrice, sale, 
        bestseller, featured, isNew 
      });
      
      // Re-enable parsing for category and subcategory from query parameters
      const category = searchParams.get('category') ?? '';
      const subcategory = searchParams.get('subcategory') ?? '';
      
      // Set search query if present
      if (search) setSearchQuery(search);
      
      // Set price range if present
      if (minPrice || maxPrice) {
        setPriceRange([
          minPrice ? Math.max(0, parseInt(minPrice)) : 0,
          maxPrice ? Math.min(20000, parseInt(maxPrice)) : 20000
        ]);
      }
      
      // Set selected filters based on URL parameters
      // Category and subcategory filters now come from the pathname OR query parameters
      setSelectedFilters(prevFilters => ({
        ...prevFilters,
        category: category ? category.split(',').filter(Boolean) : prevFilters.category, // Keep existing if not in query
        subcategory: subcategory ? subcategory.split(',').filter(Boolean) : prevFilters.subcategory, // Keep existing if not in query
        brand: brand ? brand.split(',').filter(Boolean) : [],
        sale: sale === 'true' ? ['sale'] : [],
        bestSelling: bestseller === 'true' ? ['bestseller'] : [],
        isNew: isNew === 'true' ? ['new'] : [],
        isFeatured: featured === 'true' ? ['featured'] : [],
      }));
    } catch (error) {
      console.error('Error parsing search params:', error);
    }
  }, [searchParams]);

  // Update filter state based on path when path changes
  useEffect(() => {
    if (!pathname || !allSubCategoryDetails.length) return;
    
    try {
      // When on a subcategory page, update the filter state
      if (pageType === ShopPageType.SUBCATEGORY && currentSubCategoryName) {
        // Find the subcategory in our details list
        const subcategory = allSubCategoryDetails.find(sub => 
          sub.name.toLowerCase() === currentSubCategoryName?.toLowerCase()
        );
        
        if (subcategory) {
          setSelectedFilters(prev => ({
            ...prev,
            subcategory: [subcategory.name]
          }));
          
          // If this subcategory has a parent category, select that too
          if (subcategory.parent && typeof subcategory.parent === 'string') {
            setSelectedFilters(prev => ({
              ...prev,
              category: [subcategory.parent as string]
            }));
          }
        }
      } 
      // When on a category page, update filter state
      else if (pageType === ShopPageType.CATEGORY && currentCategorySlug) {
        // Find the category in our categories list
        const category = categories.find(cat => 
          cat.slug === currentCategorySlug
        );
        
        if (category) {
          setSelectedFilters(prev => ({
            ...prev,
            category: [category._id],
            subcategory: []
          }));
        }
      }
    } catch (error) {
      console.error('Error updating filters from path:', error);
    }
  }, [pathname, pageType, currentSubCategoryName, currentCategorySlug, allSubCategoryDetails, categories]);

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
      
      // Calculate prices safely
      let price = 0;
      let originalPrice = 0;
      try {
        if (firstSubProduct?.sizes && Array.isArray(firstSubProduct.sizes) && firstSubProduct.sizes.length > 0) {
          originalPrice = firstSubProduct.sizes[0]?.price || firstSubProduct.sizes[0]?.originalPrice || 0;
        } else if (firstSubProduct?.price) {
          originalPrice = firstSubProduct.price;
        } else if (product.price) {
          originalPrice = product.price;
        }
        
        const discount = firstSubProduct?.discount || product.discount || 0;
        if (discount > 0 && originalPrice > 0) {
          price = originalPrice - (originalPrice * discount / 100);
        } else {
          price = originalPrice;
        }
      } catch (e) {
        price = 0;
        originalPrice = 0;
      }
      
      // Extract image safely
      let image = product.image || '';
      try {
        if (!image && firstSubProduct?.images && Array.isArray(firstSubProduct.images) && firstSubProduct.images.length > 0) {
          const img = firstSubProduct.images[0];
          image = typeof img === 'string' ? img : (img?.url || '');
        }
        if (!image && firstSubProduct?.sizes && Array.isArray(firstSubProduct.sizes) && firstSubProduct.sizes.length > 0) {
          const size = firstSubProduct.sizes[0];
          if (size?.images && Array.isArray(size.images) && size.images.length > 0) {
            const img = size.images[0];
            image = typeof img === 'string' ? img : (img?.url || '');
          }
        }
        if (!image) {
          image = '/images/broken-link.png';
        }
      } catch (e) {
        image = '/images/broken-link.png';
      }
      
      // Extract subcategory information - handle both formats
      let subcategory = '';
      if (product.subcategory) {
        if (typeof product.subcategory === 'string') {
          subcategory = product.subcategory;
        } else if (typeof product.subcategory === 'object' && product.subcategory.name) {
          subcategory = product.subcategory.name;
        }
      }
      
      // Get sold count from product
      const orderCount = product.orderCount || 0;
      const soldCount = product.sold || 0;
      
      // Determine bestseller status based on sales threshold (30+ orders) or explicit flag
      const isBestsellerBySales = soldCount >= 30 || orderCount >= 30;
      const isBestsellerFlag = product.isBestseller || false;
      
      return {
        _id: product._id?.toString() || '',
        name: product.name || 'Unnamed Product',
        slug: product.slug || '',
        price,
        originalPrice,
        discount: firstSubProduct?.discount || product.discount || 0,
        category: product.category,
        brand: product.brand,
        subcategory,
        subCategories: product.subCategories || [], // Keep the original subCategories array
        isNew: product.isNew || (product.createdAt && new Date().getTime() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000),
        isBestseller: isBestsellerFlag || isBestsellerBySales, // Use either explicit flag or sales-based determination
        bestsellerRank: isBestsellerBySales ? (soldCount || orderCount) : 0, // Add rank for sorting
        isFeatured: product.isFeatured || product.featured || false,
        isOnSale: (firstSubProduct?.discount || product.discount || 0) > 0,
        stock,
        image,
        subProducts,
        rating: product.rating || 0, // Extract rating
        numReviews: product.numReviews || product.reviews || 0, // Extract number of reviews
        orderCount: orderCount,
        sold: soldCount,
      };
    } catch (error) {
      console.error('Error transforming product:', error, product);
      return null;
    }
  };

  // Check if any products have ratings
  const hasProductsWithRatings = useMemo(() => {
    return allProducts.some(product => 
      product.rating && 
      product.rating > 0 && 
      product.numReviews && 
      product.numReviews > 0
    );
  }, [allProducts]);

  // Filter products based on all filters
  const applyFilters = useCallback((filters: SelectedFiltersState, newPriceRange?: number[]) => {
    // Synchronize the price range if it's provided
    if (newPriceRange && (newPriceRange[0] !== priceRange[0] || newPriceRange[1] !== priceRange[1])) {
      setPriceRange(newPriceRange);
    }
    
    // Combine all active filters into a single function
    const filterFn = (product: Product) => {
      let matches = true;
      
      // Category filter 
      if (filters.category.length > 0) {
        const categoryMatch = filters.category.some(catId => {
          if (!product.category) return false;
          const productCategoryId = typeof product.category === 'object' ? product.category._id : product.category;
          return productCategoryId === catId;
        });
        if (!categoryMatch) matches = false;
      }
      
      // Subcategory filter
      if (filters.subcategory.length > 0) {
        const subcategoryMatch = filters.subcategory.some(subCatName => {
          // Check if the product has subcategories (can be string or object)
          if (product.subcategory) {
            const subcatName = typeof product.subcategory === 'string' ? product.subcategory : product.subcategory.name;
            return subcatName === subCatName;
          }
          // Also check the subCategories array if it exists
          if (product.subCategories && Array.isArray(product.subCategories)) {
            return product.subCategories.some(subcat => {
              const subcatName = typeof subcat === 'string' ? subcat : (subcat as any).name;
              return subcatName === subCatName;
            });
          }
          return false;
        });
        if (!subcategoryMatch) matches = false;
      }
      
      // Brand filter
      if (filters.brand.length > 0) {
        const brandMatch = filters.brand.some(brandId => {
          if (!product.brand) return false;
          const productBrandId = typeof product.brand === 'object' ? product.brand._id : product.brand;
          return productBrandId === brandId;
        });
        if (!brandMatch) matches = false;
      }
      
      // Price range filter - Use the price range from the slider
      const minPrice = newPriceRange ? newPriceRange[0] : filters.price[0];
      const maxPrice = newPriceRange ? newPriceRange[1] : filters.price[1];
      
      if (product.price !== undefined) {
        if (product.price < minPrice || product.price > maxPrice) {
          matches = false;
        }
      }
      
      // Sale filter
      if (filters.sale.includes('sale') && (!product.discount || product.discount <= 0)) {
        matches = false;
      }
      
      // Featured products filter
      if (filters.isFeatured.includes('featured') && !product.isFeatured) {
        matches = false;
      }
      
      // New products filter
      if (filters.isNew.includes('new') && !product.isNew) {
        matches = false;
      }
      
      // Best selling filter
      if (filters.bestSelling.includes('bestseller') && !product.isBestseller) {
        matches = false;
      }
      
      // Stock filter
      if (filters.inStock.includes('inStock') && (!product.stock || product.stock <= 0)) {
        matches = false;
      }
      
      // Rating filter
      if (filters.rating.length > 0) {
        if (!product.rating) {
          matches = false;
        } else {
          const ratingMatch = filters.rating.some(rating => {
            return Math.floor(product.rating!) >= parseInt(rating);
          });
          if (!ratingMatch) matches = false;
        }
      }
      
      return matches;
    };
    
    // Apply search query filter
    let filteredList = searchQuery 
      ? allProducts.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allProducts;
    
    // Apply combined filter
    filteredList = filteredList.filter(filterFn);
    
    // Update filtered products state
    setFilteredProducts(filteredList);
    
    // Update selected filters state
    setSelectedFilters(filters);
    
    // Debug log
    console.log('Applied filters:', { 
      filters, 
      priceRange: newPriceRange || priceRange,
      resultCount: filteredList.length 
    });
  }, [allProducts, searchQuery, priceRange]);
  
  // Filter products based on all criteria
  useEffect(() => {
    try {
      // If directProducts are set, use those instead of filtering allProducts
      if (directProducts.length > 0) {
        console.log(`Using ${directProducts.length} direct products instead of filtering`);
        setFilteredProducts(directProducts);
        return;
      }

      let filtered = [...allProducts];
      
      console.log('Starting filter with products:', filtered.length);
      
      // Apply category filter first if we're on a category page
      if (pageType === ShopPageType.CATEGORY && currentCategorySlug) {
        const category = categories.find(c => c.slug === currentCategorySlug);
        if (category) {
          filtered = filtered.filter(product => 
            product.category && 
            typeof product.category === 'object' && 
            product.category._id === category._id
          );
        } else {
          // If we can't find the category by slug in our categories array,
          // try to match directly by slug or name
          filtered = filtered.filter(product => {
            if (!product.category) return false;
            
            // Match by category slug
            if (typeof product.category === 'object' && product.category.slug) {
              return product.category.slug.toLowerCase() === currentCategorySlug.toLowerCase();
            }
            
            // Match by category name (convert slug to readable name)
            const categoryName = currentCategorySlug
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            if (typeof product.category === 'object' && product.category.name) {
              return product.category.name.toLowerCase() === categoryName.toLowerCase();
            }
            
            return false;
          });
        }
        console.log('After category filter:', filtered.length);
      }
      
      // Apply subcategory filter first if we're on a subcategory page
      if (pageType === ShopPageType.SUBCATEGORY && currentSubCategoryName) {
        filtered = filtered.filter(product => {
          // Enhanced subcategory matching for products with subProducts
          if (!product.subcategory && !product.subCategories) return false;
          
          // Check subcategory field (string)
          if (typeof product.subcategory === 'string') {
            if (product.subcategory.toLowerCase() === currentSubCategoryName.toLowerCase()) {
              return true;
            }
          }
          
          // Check subcategory field (object)
          if (typeof product.subcategory === 'object' && product.subcategory.name) {
            if (product.subcategory.name.toLowerCase() === currentSubCategoryName.toLowerCase()) {
              return true;
            }
          }
          
          // Check subCategories array (this is what your products actually have)
          if (Array.isArray(product.subCategories)) {
            return product.subCategories.some(subCat => {
              if (typeof subCat === 'string') {
                return subCat.toLowerCase() === currentSubCategoryName.toLowerCase();
              }
              if (typeof subCat === 'object' && subCat.name) {
                return subCat.name.toLowerCase() === currentSubCategoryName.toLowerCase();
              }
              return false;
            });
          }
          
          return false;
        });
        console.log('After subcategory filter:', filtered.length);
      }
      
      // Apply other filters
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(product => {
          if (!product) return false;
          try {
            // Safe brand name access
            const brandName = typeof product.brand === 'string' 
              ? product.brand 
              : product.brand?.name || '';
            
            // Safe subcategory access
            const subcategoryName = typeof product.subcategory === 'string' 
              ? product.subcategory 
              : product.subcategory?.name || '';
            
            // Safe category name access
            const categoryName = typeof product.category === 'string'
              ? product.category
              : product.category?.name || '';
            
            return (
              product.name?.toLowerCase().includes(query) ||
              categoryName.toLowerCase().includes(query) ||
              brandName.toLowerCase().includes(query) ||
              subcategoryName.toLowerCase().includes(query)
            );
          } catch (e) {
            return false;
          }
        });
        console.log('After search filter:', filtered.length);
      }
      
      // Category filter (only apply if not on a category page AND we have URL params)
      if (pageType !== ShopPageType.CATEGORY && selectedFilters.category.length > 0) {
        filtered = filtered.filter(product => {
          if (!product.category) return false;
          
          // Normal category ID matching for object categories
          if (typeof product.category === 'object' && product.category._id) {
            if (selectedFilters.category.includes(product.category._id)) {
              return true;
            }
          }
          
          // Try to match by category name/slug for cases where we don't have proper _id references
          return selectedFilters.category.some(categoryId => {
            const category = categories.find(c => c._id === categoryId);
            if (!category) return false;
            
            // Handle string category case with explicit type guard
            if (typeof product.category === 'string') {
              // Direct ID match
              if (product.category === categoryId) return true;
              
              // Match by name if category has a name
              if (category.name) {
                return product.category.toLowerCase() === category.name.toLowerCase();
              }
              return false;
            }
            
            // Handle object category case with explicit type guard and null check
            if (typeof product.category === 'object' && product.category !== null) {
              // Match by name
              if (product.category.name && category.name) {
                return product.category.name.toLowerCase() === category.name.toLowerCase();
              }
              
              // Match by slug
              if (product.category.slug && category.slug) {
                return product.category.slug.toLowerCase() === category.slug.toLowerCase();
              }
            }
            
            return false;
          });
        });
        console.log('After category filter (URL):', filtered.length);
      }
      
      // Subcategory filter (only apply if not on a subcategory page AND we have URL params)
      if (pageType !== ShopPageType.SUBCATEGORY && selectedFilters.subcategory.length > 0) {
        filtered = filtered.filter(product => {
          // Enhanced subcategory matching for URL filters
          if (!product.subcategory && !product.subCategories) return false;
          
          return selectedFilters.subcategory.some(sc => {
            // Check subcategory field (string)
            if (typeof product.subcategory === 'string') {
              if (product.subcategory.toLowerCase() === sc.toLowerCase()) {
                return true;
              }
            }
            
            // Check subcategory field (object)
            if (typeof product.subcategory === 'object' && product.subcategory.name) {
              if (product.subcategory.name.toLowerCase() === sc.toLowerCase()) {
                return true;
              }
            }
            
            // Check subCategories array (this is what your products actually have)
            if (Array.isArray(product.subCategories)) {
              return product.subCategories.some(subCat => {
                if (typeof subCat === 'string') {
                  return subCat.toLowerCase() === sc.toLowerCase();
                }
                if (typeof subCat === 'object' && subCat.name) {
                  return subCat.name.toLowerCase() === sc.toLowerCase();
                }
                return false;
              });
            }
            
            return false;
          });
        });
        console.log('After subcategory filter (URL):', filtered.length);
      }
      
      // Brand filter - Enhanced to handle all brand formats
      if (selectedFilters.brand.length > 0) {
        filtered = filtered.filter(product => {
          // Check if product has a brand property
          if (!product.brand) return false;
          
          // Handle case where brand is an object with _id
          if (typeof product.brand === 'object' && product.brand._id) {
            return selectedFilters.brand.includes(product.brand._id);
          }
          
          // Handle case where brand might be a string ID directly
          if (typeof product.brand === 'string') {
            return selectedFilters.brand.includes(product.brand);
          }
          
          // Handle edge case where brand ID might be stored differently
          return selectedFilters.brand.some(brandId => {
            const matchingBrand = brands.find(b => b._id === brandId);
            return matchingBrand && matchingBrand.name === (
              typeof product.brand === 'object' ? product.brand.name : product.brand
            );
          });
        });
        console.log('After brand filter:', filtered.length);
      }
      
      // Price range filter
      filtered = filtered.filter(product => {
        const productPrice = product.price || 0;
        return productPrice >= priceRange[0] && productPrice <= priceRange[1];
      });
      console.log('After price filter:', filtered.length);
      
      // Sale filter
      if (selectedFilters.sale.includes('sale')) {
        filtered = filtered.filter(product => product.isOnSale);
        console.log('After sale filter:', filtered.length);
      }
      
      // Bestseller filter
      if (selectedFilters.bestSelling.includes('bestseller')) {
        console.log('Applying bestseller filter, before filter:', filtered.length);
        // Log a sample of products to check isBestseller values
        if (filtered.length > 0) {
          console.log('Sample product bestseller status:', filtered.slice(0, 3).map(p => ({
            name: p.name,
            isBestseller: p.isBestseller,
            soldCount: p.sold || p.orderCount || 0
          })));
        }
        
        filtered = filtered.filter(product => {
          // Make sure we're checking isBestseller correctly
          const isBestsellerProduct = product.isBestseller === true;
          return isBestsellerProduct;
        });
        
        // Sort bestsellers by sold count in descending order if available
        filtered.sort((a, b) => {
          const aSoldCount = a.sold || a.orderCount || 0;
          const bSoldCount = b.sold || b.orderCount || 0;
          return bSoldCount - aSoldCount; // Descending order
        });
        
        console.log('After bestseller filter:', filtered.length);
      }

      // New products filter
      if (selectedFilters.isNew.includes('new')) {
        filtered = filtered.filter(product => product.isNew);
        console.log('After new filter:', filtered.length);
      }

      // Featured products filter
      if (selectedFilters.isFeatured.includes('featured')) {
        filtered = filtered.filter(product => product.isFeatured);
        console.log('After featured filter:', filtered.length);
      }

      // Rating filter
      if (selectedFilters.rating.length > 0) {
        filtered = filtered.filter(product => {
          // Get the minimum rating from selected filters
          const minRating = Math.min(...selectedFilters.rating.map(r => parseInt(r, 10)));
          
          // Only include products that have a rating AND have at least the minimum selected rating
          // Also ensure we only show products that have reviews
          return (
            product.rating && 
            product.numReviews && 
            product.numReviews > 0 && 
            product.rating >= minRating
          );
        });
        console.log('After rating filter:', filtered.length);
      }
      
      console.log(`Final filtered products: ${filtered.length} out of ${allProducts.length}`);
      if (filtered.length === 0 && allProducts.length > 0) {
        console.log('No products matched the filters. Applied filters:', {
          category: selectedFilters.category,
          subcategory: selectedFilters.subcategory,
          brand: selectedFilters.brand,
          pageType,
          currentCategorySlug,
          currentSubCategoryName,
          searchQuery,
          priceRange
        });
        
        // Log sample product structure for debugging
        if (allProducts.length > 0) {
          console.log('Sample product structure:', {
            category: allProducts[0].category,
            subcategory: allProducts[0].subcategory,
            subCategories: allProducts[0].subCategories,
            brand: allProducts[0].brand
          });
        }
      }
      
      setFilteredProducts(filtered);
      updateURL();
    } catch (error) {
      console.error('Error filtering products:', error);
      setFilteredProducts([]);
    }
  }, [allProducts, selectedFilters, priceRange, searchQuery, brands, pageType, currentCategorySlug, currentSubCategoryName, categories, directProducts]);

  // Update URL with current filters - modified to prevent resetting
  const updateURL = () => {
    try {
      // Store the current URL parameters to check if we're actually changing anything
      const currentParams = new URLSearchParams(window.location.search);
      const currentParamsString = currentParams.toString();
      
      const params = new URLSearchParams();
      
      if (searchQuery?.trim()) params.set('search', searchQuery);
      if (selectedFilters.category.length > 0) params.set('category', selectedFilters.category.join(','));
      if (selectedFilters.subcategory.length > 0) params.set('subcategory', selectedFilters.subcategory.join(','));
      if (selectedFilters.brand.length > 0) params.set('brand', selectedFilters.brand.join(','));
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
      if (priceRange[1] < 20000) params.set('maxPrice', priceRange[1].toString());
      if (selectedFilters.sale.includes('sale')) params.set('sale', 'true');
      if (selectedFilters.bestSelling.includes('bestseller')) params.set('bestseller', 'true');
      if (selectedFilters.isNew.includes('new')) params.set('new', 'true');
      if (selectedFilters.isFeatured.includes('featured')) params.set('featured', 'true');
      if (selectedFilters.rating.length > 0) params.set('rating', selectedFilters.rating.join(','));
      
      const paramsString = params.toString();
      
      // Only update URL if params have actually changed to prevent unnecessary resets
      if (paramsString !== currentParamsString) {
        console.log('Updating URL with new params:', paramsString);
        const newURL = paramsString ? `${pathname}?${paramsString}` : pathname;
        
        if (router && typeof router.replace === 'function' && newURL) {
          router.replace(newURL, { scroll: false });
        }
      }
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  };

  // Handle filter application
  const handleApplyFilters = (filters: SelectedFiltersState, range: number[]) => {
    setSelectedFilters(filters);
    setPriceRange(range);
    setIsMobileFilterOpen(false);
  };

  // Handle filter clearing
  const handleClearFilters = () => {
    setSelectedFilters({
      category: [],
      subcategory: [],
      sale: [],
      brand: [],
      bestSelling: [],
      isNew: [],
      isFeatured: [],
      inStock: [],
      rating: [],
      price: [0, 20000] as [number, number], // Add missing price property
      color: [], // Add missing color property
      size: [], // Add missing size property
    });
    setPriceRange([0, 20000]);
    setSearchQuery('');
  };

  // Clear all filters (including search and direct products)
  const clearAllFilters = useCallback(() => {
    setSelectedFilters({
      category: [],
      subcategory: [],
      sale: [],
      brand: [],
      bestSelling: [],
      isNew: [],
      isFeatured: [],
      inStock: [],
      rating: [],
      price: [0, 20000] as [number, number], // Add missing price property
      color: [], // Add missing color property
      size: [], // Add missing size property
    });
    setPriceRange([0, 20000]);
    setSearchQuery('');
    
    // Navigate to the main shop page when clearing all filters
    if (pathname !== '/shop') {
      router.push('/shop');
    }
  }, [pathname, router]);
  
  // Remove individual filter
  const removeFilter = (type: keyof SelectedFiltersState, value: string) => {
    console.log(`Removing filter: ${type} with value: ${value}`);
    
    // Update our filter state
    setSelectedFilters(prev => {
      // Create a copy of the previous state
      const newFilters = { ...prev };
      
      // Check if the filter type exists in our state and handle different types
      if (type === 'price') {
        // Reset price to default range if removing price filter
        newFilters[type] = [0, 20000] as [number, number];
      } else if (Array.isArray(newFilters[type])) {
        // Remove the specific value from the array for other filter types
        (newFilters[type] as string[]) = (newFilters[type] as string[]).filter(v => v !== value);
      }
      
      return newFilters;
    });
    
    // If we're on a category or subcategory page and removing that specific filter,
    // we should navigate back to the main shop page
    if (
      (pageType === ShopPageType.CATEGORY && type === 'category') ||
      (pageType === ShopPageType.SUBCATEGORY && type === 'subcategory')
    ) {
      router.push('/shop');
    } else {
      // For all other cases, just update the URL parameters to reflect the filter removal
      updateURL();
    }
  };

  // Get display name for filter values
  const getDisplayName = (type: keyof SelectedFiltersState, value: string): string => {
    try {
      switch (type) {
        case 'category':
          return categories.find(c => c._id === value)?.name || value;
        case 'brand':
          return brands.find(b => b._id === value)?.name || value;
        case 'subcategory':
          return value;
        case 'sale':
          return 'On Sale';
        case 'bestSelling':
          return 'Best Selling';
        case 'isNew':
          return 'New Arrivals';
        case 'isFeatured':
          return 'Featured';
        default:
          return value;
      }
    } catch (error) {
      console.error('Error getting display name:', error);
      return value;
    }
  };

  // Get active filters for display
  const getActiveFilters = () => {
    try {
      const activeFilters: Array<{ type: keyof SelectedFiltersState; value: string; displayName: string }> = [];
      
      Object.entries(selectedFilters).forEach(([type, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          values.forEach((value: string) => {
            activeFilters.push({
              type: type as keyof SelectedFiltersState,
              value,
              displayName: getDisplayName(type as keyof SelectedFiltersState, value)
            });
          });
        }
      });
      
      return activeFilters;
    } catch (error) {
      console.error('Error getting active filters:', error);
      return [];
    }
  };

  const shopContextValue: ShopContextType = {
    filteredProducts,
    loading,
    selectedFilters,
    priceRange,
    searchQuery,
    totalProducts: allProducts.length,
    setSearchQuery,
    setSelectedFilters,
    setPriceRange,
    clearAllFilters,
    categories,
    subcategories,
    brands,
    allSubCategoryDetails,
    pageType,
    currentCategorySlug,
    currentSubCategoryId,
    currentSubCategoryName,
    setDirectProducts, // Add the setDirectProducts function to the context
    setPageType, // Add setPageType to context
    setCurrentSubCategoryName, // Add setCurrentSubCategoryName to context
    setLoading, // Add setLoading to context
    setCurrentCategorySlug, // Add setCurrentCategorySlug to context
    removeFilter, // Add removeFilter to context
  };

  return (
    <ShopContext.Provider value={shopContextValue}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* Search Bar - Top Level */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Input
                placeholder="Search products, categories, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 text-base"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar filters - hidden on mobile */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <SidebarFilters
                  categories={categories}
                  subCategoryNames={subcategories}
                  brands={brands}
                  subCategoryDetails={allSubCategoryDetails}
                  onApplyFilters={handleApplyFilters}
                  onClearFilters={handleClearFilters}
                  initialFilters={selectedFilters}
                  initialPriceRange={priceRange}
                  className="sticky top-24"
                  isLoading={loading}
                  hasProductsWithRatings={hasProductsWithRatings}
                  // Disable the current category filter if we're on a category page
                  disabledCategories={pageType === ShopPageType.CATEGORY && currentCategorySlug 
                    ? (() => {
                        const category = categories.find(c => c.slug === currentCategorySlug);
                        return category ? [category._id] : [];
                      })() 
                    : []
                  }
                  // Disable the current subcategory filter if we're on a subcategory page
                  disabledSubcategories={pageType === ShopPageType.SUBCATEGORY && currentSubCategoryName 
                    ? [currentSubCategoryName] 
                    : []
                  }
                />
              </div>
            </div>
            
            {/* Mobile filter button - visible only on mobile */}
            <div className="lg:hidden sticky top-0 z-30 bg-gray-50 pt-2 pb-2 mb-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <Button 
                  id="mobileFilterButton"
                  onClick={() => {
                    const filterDrawer = document.getElementById('mobileFilterDrawer');
                    const overlay = document.getElementById('filterOverlay');
                    if (filterDrawer && overlay) {
                      filterDrawer.style.transform = 'translateX(0)';
                      overlay.style.display = 'block';
                      setTimeout(() => {
                        overlay.style.opacity = '1';
                      }, 10);
                    }
                  }}
                  className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all bg-white"
                  size="sm"
                  variant="outline"
                >
                  <Filter size={16} />
                  Filters
                  {getActiveFilters().length > 0 && (
                    <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                      {getActiveFilters().length}
                    </Badge>
                  )}
                </Button>
                
                <div className="text-sm text-gray-600 font-medium">
                  {loading ? 'Loading...' : `${filteredProducts.length} products`}
                </div>
              </div>
            </div>
            
            {/* Mobile filter drawer using direct DOM manipulation */}
            <div 
              id="filterOverlay" 
              className="fixed inset-0 bg-black/50 z-[100] lg:hidden" 
              style={{ display: 'none', opacity: 0, transition: 'opacity 0.3s ease' }}
              onClick={(e) => {
                const filterDrawer = document.getElementById('mobileFilterDrawer');
                const overlay = document.getElementById('filterOverlay');
                if (filterDrawer && overlay) {
                  filterDrawer.style.transform = 'translateX(-100%)';
                  overlay.style.opacity = '0';
                  setTimeout(() => {
                    overlay.style.display = 'none';
                  }, 300);
                }
              }}
            >
              <div 
                id="mobileFilterDrawer"
                className="fixed inset-y-0 left-0 w-[85%] max-w-[350px] bg-white shadow-xl z-[101] overflow-hidden"
                style={{ transform: 'translateX(-100%)', transition: 'transform 0.3s ease' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Filters</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const filterDrawer = document.getElementById('mobileFilterDrawer');
                        const overlay = document.getElementById('filterOverlay');
                        if (filterDrawer && overlay) {
                          filterDrawer.style.transform = 'translateX(-100%)';
                          overlay.style.opacity = '0';
                          setTimeout(() => {
                            overlay.style.display = 'none';
                          }, 300);
                        }
                      }}
                      className="rounded-full hover:bg-gray-100"
                    >
                      <X size={18} />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 pb-24 overflow-y-auto max-h-[calc(100vh-130px)]">
                  <SidebarFilters
                    categories={categories}
                    subCategoryNames={subcategories}
                    brands={brands}
                    subCategoryDetails={allSubCategoryDetails}
                    onApplyFilters={(filters, range) => {
                      handleApplyFilters(filters, range);
                      // Do not close the drawer automatically on individual filter changes
                      // This allows users to select multiple filters before closing
                    }}
                    onClearFilters={handleClearFilters}
                    initialFilters={selectedFilters}
                    initialPriceRange={priceRange}
                    isLoading={loading}
                    hasProductsWithRatings={hasProductsWithRatings}
                    disabledCategories={pageType === ShopPageType.CATEGORY && currentCategorySlug 
                      ? (() => {
                          const category = categories.find(c => c.slug === currentCategorySlug);
                          return category ? [category._id] : [];
                        })() 
                      : []
                    }
                    disabledSubcategories={pageType === ShopPageType.SUBCATEGORY && currentSubCategoryName 
                      ? [currentSubCategoryName] 
                      : []
                    }
                  />
                </div>
                
                <div className="p-4 border-t fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10 max-w-[350px]">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent drawer from closing
                        handleClearFilters();
                      }}
                      className="flex-1"
                    >
                      Clear All
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent drawer from closing
                        handleApplyFilters(selectedFilters, priceRange);
                        // Close drawer after applying all filters
                        const filterDrawer = document.getElementById('mobileFilterDrawer');
                        const overlay = document.getElementById('filterOverlay');
                        if (filterDrawer && overlay) {
                          filterDrawer.style.transform = 'translateX(-100%)';
                          overlay.style.opacity = '0';
                          setTimeout(() => {
                            overlay.style.display = 'none';
                          }, 300);
                        }
                      }}
                      className="flex-1"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </ShopContext.Provider>
  );
}

'use client';

import { useEffect, useState, useMemo } from "react";
import { ChevronRight, X, Filter, Rows3, Grid, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import LazyProductCardSmall from "@/components/shared/product/LazyProductCardSmall";
import SidebarFilters, { type SelectedFiltersState } from "@/components/shared/shop/SidebarFilters";
import { getAllProducts, getProductsByCategory, getProductsBySubCategory } from "@/lib/database/actions/product.actions";
import { getAllCategories, getCategoryBySlug } from "@/lib/database/actions/categories.actions";
import { getAllBrands } from "@/lib/database/actions/brands.actions";
import { getUniqueSubCategoryNames, getAllSubCategoriesByParentId, getSubCategoryBySlug } from "@/lib/database/actions/subCategory.actions";
import { handleError } from "@/lib/utils";
import InfiniteProductGrid from "@/components/shared/InfiniteProductGrid";

// Define interfaces for product data structure
interface TransformedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount?: number;
  image: string;
  images: any[];
  slug: string;
  category?: string;
  categoryId: string;
  subcategory: string;
  brandId: string;
  brandName: string;
  stock: number;
  isOnSale: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  orderCount?: number;
  sold?: number;
}

// Define interfaces for filter categories
interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface CategoryPageProps {
  categorySlug?: string;
  subcategorySlug?: string;
}

// Safe product transformation function
const transformProductSafely = (product: any): TransformedProduct | null => {
  try {
    // Basic validation
    if (!product || typeof product !== 'object' || !product._id) {
      console.warn("[transformProductSafely] Skipping invalid product data:", product);
      return null;
    }

    // Safely convert MongoDB ObjectId to string
    const safeToString = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (value.toString) return value.toString();
      return '';
    };

    // Extract and safely convert category ID
    const getCategoryId = (category: any): string => {
      if (!category) return '';
      if (typeof category === 'string') return category;
      if (category._id) return safeToString(category._id);
      return safeToString(category);
    };

    // Extract and safely convert brand ID/name
    const getBrandInfo = (brand: any): { id: string, name: string } => {
      if (!brand) return { id: '', name: '' };
      if (typeof brand === 'string') return { id: brand, name: brand };
      if (brand._id) return { id: safeToString(brand._id), name: brand.name || '' };
      return { id: safeToString(brand), name: safeToString(brand) };
    };

    // Get the primary image from the first subproduct or any available images
    const getImageUrl = (p: any): string => {
      // Check for direct image URL in transformed product
      if (p.image && typeof p.image === 'string') return p.image;
      
      // Try to get first image from subProducts
      if (Array.isArray(p.subProducts) && p.subProducts.length > 0) {
        const firstSubProduct = p.subProducts[0];
        if (Array.isArray(firstSubProduct.images) && firstSubProduct.images.length > 0) {
          const firstImage = firstSubProduct.images[0];
          if (typeof firstImage === 'string') return firstImage;
          if (firstImage && firstImage.url) return firstImage.url;
        }
      }
      
      // Fallback to placeholder
      return '/placeholder-image.jpg';
    };

    // Calculate proper price based on discount
    const calculatePriceWithDiscount = (originalPrice: number, discount: number): number => {
      if (!originalPrice || !discount || discount <= 0) return originalPrice;
      // Fix: Round the discounted price to 2 decimal places to avoid floating point issues
      return Math.round((originalPrice * (1 - discount/100)) * 100) / 100;
    };

    // Generate a slug if not available
    const getSlug = (p: any): string => {
      if (p.slug && typeof p.slug === 'string' && p.slug.trim() !== '') return p.slug.trim();
      
      const name = p.name || '';
      if (name) {
        const generatedSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        console.warn(`[transformProductSafely] Product ID ${p._id} missing slug. Generated: "${generatedSlug}"`);
        return generatedSlug;
      }
      // Fallback to ID
      console.error(`[transformProductSafely] Product ID ${p._id} missing slug and name. Falling back to ID.`);
      return safeToString(p._id); 
    };

    // Determine if the product is on sale
    const isOnSale = typeof product.discount === 'number' && product.discount > 0;

    // Determine if the product is a bestseller
    const isBestseller = !!product.isBestseller;
    
    // Handle featured status
    const isProductFeatured = 
      !!product.featured || 
      !!product.isFeatured ||
      (product._doc && (!!product._doc.featured || !!product._doc.isFeatured));
    
    const isNew = Date.now() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Get total sold count
    const mainProductSold = typeof product.sold === 'number' ? product.sold : 0;
    let totalSoldCount = mainProductSold;
    
    // If main product doesn't have a sold count, calculate from subproducts
    if (mainProductSold === 0 && Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      // Check if any subProduct has a pre-calculated sold count
      const anySubProductHasSoldCount = product.subProducts.some(
        (subProduct: any) => typeof subProduct.sold === 'number' && subProduct.sold > 0
      );
      
      if (anySubProductHasSoldCount) {
        // Sum up subProduct sold counts
        totalSoldCount = product.subProducts.reduce((total: number, subProduct: any) => {
          return total + (typeof subProduct.sold === 'number' ? subProduct.sold : 0);
        }, 0);
      } else {
        // Calculate from sizes
        totalSoldCount = product.subProducts.reduce((total: number, subProduct: any) => {
          let sizesSold = 0;
          if (subProduct.sizes && Array.isArray(subProduct.sizes)) {
            sizesSold = subProduct.sizes.reduce((sizesTotal: number, size: any) => {
              return sizesTotal + (typeof size.sold === 'number' ? size.sold : 0);
            }, 0);
          }
          return total + sizesSold;
        }, 0);
      }
    }
    
    // Use orderCount as a fallback
    if (totalSoldCount === 0 && typeof product.orderCount === 'number' && product.orderCount > 0) {
      totalSoldCount = product.orderCount;
    }
    
    // Map category info
    const categoryId = getCategoryId(product.category);
    const categoryName = product.category?.name || '';
    
    // Map brand info
    const brandInfo = getBrandInfo(product.brand);

    const slug = getSlug(product);
    if (!slug) {
      console.error(`[transformProductSafely] Failed to obtain a slug for product ID ${product._id}. Skipping product.`);
      return null;
    }

    // Get base product price
    const basePrice = typeof product.price === 'number' ? product.price : 
             (product.subProducts && product.subProducts[0]?.sizes && product.subProducts[0].sizes[0]?.price) || 
             (product.subProducts && product.subProducts[0]?.price) || 0;
           
    // Get discount percentage
    const discountPercentage = typeof product.discount === 'number' ? product.discount : 0;
    
    // Calculate final price with discount
    const finalPrice = calculatePriceWithDiscount(basePrice, discountPercentage);

    return {
      id: safeToString(product._id),
      name: product.name || '',
      description: product.description || '',
      price: finalPrice,
      originalPrice: basePrice,
      discount: discountPercentage,
      image: getImageUrl(product),
      images: Array.isArray(product.images) ? product.images : [],
      slug: slug,
      category: categoryName,
      categoryId: categoryId,
      subcategory: Array.isArray(product.subCategories) && product.subCategories.length > 0 
        ? (product.subCategories[0]?.name || '') 
        : '',
      brandId: brandInfo.id,
      brandName: brandInfo.name,
      stock: typeof product.stock === 'number' ? product.stock : 
             (product.subProducts && product.subProducts[0]?.sizes && product.subProducts[0].sizes[0]?.qty) || 
             (product.subProducts && product.subProducts[0]?.stock) ||
             (product.subProducts && product.subProducts[0]?.qty) || 0,
      isOnSale: isOnSale,
      isBestseller: isBestseller,
      isNew: isNew,
      featured: isProductFeatured,
      isFeatured: isProductFeatured,
      sold: totalSoldCount,
      orderCount: totalSoldCount,
    };
  } catch (error) {
    console.error("[transformProductSafely] Error transforming product:", product, error);
    return null;
  }
};

const CategoryShopPage: React.FC<CategoryPageProps> = ({ categorySlug, subcategorySlug }) => {
  // State for all product data
  const [initialProducts, setInitialProducts] = useState<TransformedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<string | null>(null);
  
  const [selectedFilters, setSelectedFilters] = useState<SelectedFiltersState>({
    category: [],
    subcategory: [],
    sale: [],
    brand: [],
    bestSelling: [],
    price: [0, 20000] as [number, number],
    isNew: [],
    isFeatured: [],
    inStock: [],
    rating: [],
    color: [], // Add missing color property
    size: [], // Add missing size property
  });
  const [priceRange, setPriceRange] = useState<number[]>([0, 20000]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState<boolean>(true);
  const [itemsPerPage] = useState<number>(16); // More items per page for infinite scroll

  // Fetch initial products and filter categories
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch all categories, subcategories and brands first
        const [categoriesResponse, allSubcategoriesResult, brandsResponse] = await Promise.all([
          getAllCategories(),
          getUniqueSubCategoryNames(),
          getAllBrands()
        ]);
        
        // Process categories
        let categoriesData: Category[] = [];
        if (categoriesResponse?.categories && Array.isArray(categoriesResponse.categories)) {
          categoriesData = categoriesResponse.categories;
        } else if (Array.isArray(categoriesResponse)) {
          categoriesData = categoriesResponse;
        }
        setCategories(categoriesData);
        
        // Process all subcategories
        setSubcategories(allSubcategoriesResult || []);
        
        // Process brands
        let brandsData: Brand[] = [];
        if (brandsResponse?.brands && Array.isArray(brandsResponse.brands)) {
          brandsData = brandsResponse.brands;
        } else if (Array.isArray(brandsResponse)) {
          brandsData = brandsResponse;
        }
        setBrands(brandsData);
        
        // Now handle category/subcategory specific data
        let productsResponse;
        let currentCategoryData: Category | null = null;
        let subcategoriesForCategory: string[] = [];
        
        if (categorySlug) {
          // Get the current category information
          const categoryResponse = await getCategoryBySlug(categorySlug);
          if (categoryResponse?.category) {
            currentCategoryData = categoryResponse.category;
            setCurrentCategory(currentCategoryData);
            
            // Pre-select the category in filters
            if (currentCategoryData._id) {
              setSelectedFilters(prev => ({
                ...prev,
                category: [currentCategoryData?._id || '']
              }));
            }
            
            // Get subcategories for this category
            const subcategoriesResponse = await getAllSubCategoriesByParentId(currentCategoryData._id);
            if (subcategoriesResponse?.subCategories) {
                subcategoriesForCategory = subcategoriesResponse.subCategories.map((sc: any) => sc.name);
                setFilteredSubcategories(subcategoriesForCategory);
            }
            
            // If there's also a subcategory specified
            if (subcategorySlug) {
              const subcategoryResponse = await getSubCategoryBySlug(subcategorySlug);
              if (subcategoryResponse?.subCategory) {
                const subCategoryName = subcategoryResponse.subCategory.name;
                setCurrentSubcategory(subCategoryName);
                
                // Pre-select the subcategory in filters
                setSelectedFilters(prev => ({
                  ...prev,
                  subcategory: [subCategoryName]
                }));
                
                // Get products for this specific subcategory
                productsResponse = await getProductsBySubCategory(subcategoryResponse.subCategory._id);
              }
            } else {
              // Get products for just the category
              productsResponse = await getProductsByCategory(currentCategoryData._id);
            }
          }
        } else {
          // No category specified, get all products
          productsResponse = await getAllProducts();
        }
        
        // Handle products
        if (productsResponse?.success && Array.isArray(productsResponse.products)) {
          const transformedProducts = productsResponse.products
            .filter((p: any) => p && typeof p === 'object')
            .map(transformProductSafely)
            .filter((p: TransformedProduct | null) => p !== null) as TransformedProduct[];
          
          setInitialProducts(transformedProducts);
        } else {
          console.error("[CategoryShopPage] Failed to fetch products:", productsResponse?.message || "Unknown error");
          setInitialProducts([]);
        }
      } catch (error) {
        console.error("[CategoryShopPage] Error fetching initial data:", error);
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [categorySlug, subcategorySlug]);

  // Function to fetch more products for infinite scroll
  const fetchMoreProducts = async (page: number, limit: number): Promise<TransformedProduct[]> => {
    try {
      // In a real implementation, you would call your API with pagination parameters
      // For now, we're simulating pagination by filtering the already loaded products
      
      // First apply all filters to get the filtered product set
      let filteredProducts = [...initialProducts];
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.description?.toLowerCase().includes(query) ||
          p.brandName?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.subcategory?.toLowerCase().includes(query)
        );
      }
      
      // Apply category filter - if we're already on a category page, this is redundant
      if (!categorySlug && selectedFilters.category.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedFilters.category.includes(p.categoryId));
      }
      
      // Apply subcategory filter - if we're already on a subcategory page, this is redundant
      if (!(categorySlug && subcategorySlug) && selectedFilters.subcategory.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          p.subcategory && selectedFilters.subcategory.includes(p.subcategory)
        );
      }
      
      // Apply brand filter
      if (selectedFilters.brand.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedFilters.brand.includes(p.brandId));
      }
      
      // Apply sale filter
      if (selectedFilters.sale.includes('sale')) {
        filteredProducts = filteredProducts.filter(p => p.isOnSale);
      }
      
      // Apply bestseller filter
      if (selectedFilters.bestSelling.includes('bestseller')) {
        filteredProducts = filteredProducts.filter(p => p.isBestseller);
      }
      
      // Apply price range filter
      filteredProducts = filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
      
      // Apply sorting
      switch (sortOption) {
        case 'price-asc':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'newest':
          filteredProducts.sort((a, b) => {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            return 0;
          });
          break;
      }
      
      // Calculate pagination slice
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Return the paginated slice
      return filteredProducts.slice(startIndex, endIndex);
      
    } catch (error) {
      console.error("Error fetching more products:", error);
      return [];
    }
  };

  // Handle filter application
  const handleApplyFilters = (filters: SelectedFiltersState, range: number[]) => {
    setSelectedFilters(filters);
    setPriceRange(range);
  };

  // Handle filter clearing
  const handleClearFilters = () => {
    // Keep the category selection if we're on a category page
    const categoryFilters = categorySlug && currentCategory?._id ? [currentCategory._id] : [];
    
    // Keep the subcategory selection if we're on a subcategory page
    const subcategoryFilters = subcategorySlug && currentSubcategory ? [currentSubcategory] : [];
    
    setSelectedFilters({
      category: categoryFilters,
      subcategory: subcategoryFilters,
      sale: [],
      brand: [],
      bestSelling: [],
      price: [0, 20000] as [number, number],
      isNew: [],
      isFeatured: [],
      inStock: [],
      rating: [],
      color: [],
      size: [],
    });
    setPriceRange([0, 20000]);
    setSearchQuery('');
  };
  
  // Handle removing a single filter
  const handleRemoveFilter = (type: keyof SelectedFiltersState, value: string) => {
    // Don't allow removing the current category/subcategory if we're on that page
    if (type === 'category' && categorySlug && currentCategory && value === currentCategory._id) {
      return;
    }
    
    if (type === 'subcategory' && subcategorySlug && currentSubcategory && value === currentSubcategory) {
      return;
    }
    
    setSelectedFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(v => v !== value)
    }));
  };

  // Get display names for filtered values
  const getDisplayName = (type: keyof SelectedFiltersState, value: string): string => {
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
      default:
        return value;
    }
  };

  // Display active filter badges
  const renderActiveFilters = () => {
    const activeFilters: {
      type: keyof SelectedFiltersState;
      value: string;
      displayName: string;
      isRemovable: boolean;
    }[] = [];
    
    Object.entries(selectedFilters).forEach(([type, values]) => {
      if (values.length > 0) {
        values.forEach((value: string) => {
          // Determine if this filter can be removed
          const isRemovable = !(
            (type === 'category' && categorySlug && currentCategory && value === currentCategory._id) ||
            (type === 'subcategory' && subcategorySlug && currentSubcategory && value === currentSubcategory)
          );
          
          activeFilters.push({
            type: type as keyof SelectedFiltersState,
            value,
            displayName: getDisplayName(type as keyof SelectedFiltersState, value),
            isRemovable
          });
        });
      }
    });
    
    if (activeFilters.length === 0 && searchQuery === '' && 
        priceRange[0] === 0 && priceRange[1] === 20000) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {searchQuery && (
          <Badge variant="outline" className="px-3 py-1 flex items-center gap-1 bg-gray-100">
            Search: {searchQuery}
            <button onClick={() => setSearchQuery('')} className="ml-1">
              <X size={14} />
            </button>
          </Badge>
        )}
        
        {(priceRange[0] > 0 || priceRange[1] < 20000) && (
          <Badge variant="outline" className="px-3 py-1 flex items-center gap-1 bg-gray-100">
            Price: ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
            <button onClick={() => setPriceRange([0, 20000])} className="ml-1">
              <X size={14} />
            </button>
          </Badge>
        )}
        
        {activeFilters.map((filter, index) => (
          <Badge 
            key={`${filter.type}-${filter.value}-${index}`} 
            variant="outline" 
            className={`px-3 py-1 flex items-center gap-1 ${filter.isRemovable ? 'bg-gray-100' : 'bg-gray-200'}`}
          >
            {filter.displayName}
            {filter.isRemovable && (
              <button onClick={() => handleRemoveFilter(filter.type, filter.value)} className="ml-1">
                <X size={14} />
              </button>
            )}
          </Badge>
        ))}
        
        {(activeFilters.some(f => f.isRemovable) || searchQuery || priceRange[0] > 0 || priceRange[1] < 20000) && (
          <Button 
            variant="ghost" 
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs"
          >
            Clear All
          </Button>
        )}
      </div>
    );
  };

  // Get filtered products for initial load
  const getFilteredInitialProducts = (): TransformedProduct[] => {
    let result = [...initialProducts];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.brandName?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.subcategory?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter - if we're already on a category page, this is redundant
    if (!categorySlug && selectedFilters.category.length > 0) {
      result = result.filter(p => selectedFilters.category.includes(p.categoryId));
    }
    
    // Apply subcategory filter - if we're already on a subcategory page, this is redundant
    if (!(categorySlug && subcategorySlug) && selectedFilters.subcategory.length > 0) {
      result = result.filter(p => 
        p.subcategory && selectedFilters.subcategory.includes(p.subcategory)
      );
    }
    
    // Apply brand filter
    if (selectedFilters.brand.length > 0) {
      result = result.filter(p => selectedFilters.brand.includes(p.brandId));
    }
    
    // Apply sale filter
    if (selectedFilters.sale.includes('sale')) {
      result = result.filter(p => p.isOnSale);
    }
    
    // Apply bestseller filter
    if (selectedFilters.bestSelling.includes('bestseller')) {
      result = result.filter(p => p.isBestseller);
    }
    
    // Apply price range filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    // Apply sorting
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        result.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
    }
    
    return result.slice(0, itemsPerPage);
  };

  // Generate page title based on category/subcategory
  const pageTitle = useMemo(() => {
    if (subcategorySlug && currentSubcategory) {
      return currentSubcategory;
    }
    if (categorySlug && currentCategory) {
      return currentCategory.name;
    }
    return "All Products";
  }, [categorySlug, subcategorySlug, currentCategory, currentSubcategory]);

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-black">Home</Link>
        <ChevronRight size={14} className="mx-1" />
        <Link href="/shop" className="hover:text-black">Shop</Link>
        {categorySlug && currentCategory && (
          <>
            <ChevronRight size={14} className="mx-1" />
            {subcategorySlug && currentSubcategory ? (
              <Link href={`/shop/category/${categorySlug}`} className="hover:text-black">
                {currentCategory.name}
              </Link>
            ) : (
              <span className="font-medium text-black">{currentCategory.name}</span>
            )}
          </>
        )}
        {subcategorySlug && currentSubcategory && (
          <>
            <ChevronRight size={14} className="mx-1" />
            <span className="font-medium text-black">{currentSubcategory}</span>
          </>
        )}
      </div>
      
      {/* Title and results count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-gray-500 mt-1">
            Explore our collection
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>
      
      {/* Filter and Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters - hidden on mobile */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <SidebarFilters
            categories={categories}
            subCategoryNames={categorySlug ? filteredSubcategories : subcategories}
            brands={brands}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            initialFilters={selectedFilters}
            initialPriceRange={priceRange}
            className="sticky top-24" // Keep filter sidebar sticky while scrolling
            disabledCategories={categorySlug ? [currentCategory?._id || ''] : []}
            disabledSubcategories={subcategorySlug ? [currentSubcategory || ''] : []}
          />
        </div>
        
        {/* Mobile filter button and overlay */}
        <div className="lg:hidden">
          <Button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-full mb-4 flex items-center justify-center gap-2"
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
                    subCategoryNames={categorySlug ? filteredSubcategories : subcategories}
                    brands={brands}
                    onApplyFilters={(filters, range) => {
                      handleApplyFilters(filters, range);
                      setIsMobileFilterOpen(false);
                    }}
                    onClearFilters={handleClearFilters}
                    initialFilters={selectedFilters}
                    initialPriceRange={priceRange}
                    disabledCategories={categorySlug ? [currentCategory?._id || ''] : []}
                    disabledSubcategories={subcategorySlug ? [currentSubcategory || ''] : []}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* Products area */}
        <div className="flex-1">
          {/* Sort controls and view options */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={sortOption}
                onValueChange={setSortOption}
              >
                <SelectTrigger className="w-full md:w-[200px] gap-2">
                  <ArrowUpDown size={16} />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View mode switcher */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500 hidden sm:block">View:</p>
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                  aria-label="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                  aria-label="List view"
                >
                  <Rows3 size={18} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Active filters */}
          {renderActiveFilters()}
          
          {/* Products with infinite scroll */}
          {loading ? (
            // Loading skeleton
            <div className={`grid ${viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'} gap-6`}
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex flex-col space-y-3">
                  <Skeleton className="h-60 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-2/5" />
                </div>
              ))}
            </div>
          ) : (
            <InfiniteProductGrid
              initialProducts={getFilteredInitialProducts()}
              fetchMoreProducts={fetchMoreProducts}
              className="w-full"
              gridClassName="gap-x-4 gap-y-8"
              cols={{ 
                sm: viewMode === 'grid' ? 2 : 1, 
                md: viewMode === 'grid' ? 3 : 1, 
                lg: viewMode === 'grid' ? 3 : 1, 
                xl: viewMode === 'grid' ? 4 : 1 
              }}
              emptyMessage="No products match your filters"
              loadingMessage="Loading more products..."
              endMessage="You've seen all products"
              itemsPerPage={itemsPerPage}
              cardType="small"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryShopPage;
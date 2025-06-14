'use client';

import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import LazyProductCardSmall from "@/components/shared/product/LazyProductCardSmall";
import FilterButton from "@/components/shared/shop/FilterButton";
import SidebarFilters, { type SelectedFiltersState } from "@/components/shared/shop/SidebarFilters";
import { getAllProducts } from "@/lib/database/actions/product.actions";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { getAllBrands } from "@/lib/database/actions/brands.actions";
import { getUniqueSubCategoryNames, getAllSubCategories } from "@/lib/database/actions/subCategory.actions";
import { handleError } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useMemo, Component, ErrorInfo, ReactNode } from "react";
import { ChevronRight, X, Filter, SlidersHorizontal, Rows3, Grid, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";

// ErrorBoundary component to catch client-side errors
class ErrorBoundary extends Component<{ children: ReactNode, fallback?: ReactNode }> {
  state = { hasError: false, error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Shop page error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-4 text-gray-600">We're having trouble loading the shop page.</p>
          <p className="mb-6 text-sm text-gray-500">Technical details: {this.state.error?.message || 'Unknown error'}</p>
          <Button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Define Category type
interface Category {
  _id: string;
  name: string;
  slug?: string; // Add slug as optional to match SidebarFilters
  subcategories?: any[]; // Add subcategories property
}

// Define Brand type
interface Brand {
  _id: string;
  name: string;
}

// Define SubCategory type with parent relationships
interface SubCategoryDetail {
  _id: string;
  name: string;
  parent?: string | { _id: string };
  category?: string | { _id: string };
  categoryId?: string;
  parentCategory?: string | { _id: string };
}

// Define the structure for transformed products to match ProductCard props
interface TransformedProduct {
  id: string; // Changed from _id
  name: string;
  description: string;
  price: number; // This will be the final price (after discount)
  originalPrice: number; // Original price before any discount
  discount?: number; // Discount percentage
  image: string; // Added: Expects a single image URL
  images: any[]; // Keep original images array if needed elsewhere
  slug: string; // Added: Generate a slug
  category?: string; // Changed from categoryName, made optional
  categoryId: string;
  subcategory: string;
  brandId: string;
  brandName: string;
  stock: number;
  isOnSale: boolean;
  isBestseller?: boolean; // Made optional to match ProductCard props
  isNew?: boolean; // Added optional isNew based on ProductCard props
  featured?: boolean; // Add featured property for compatibility
  isFeatured?: boolean; // Add isFeatured property for compatibility
  orderCount?: number; // Add order count for bestsellers
  sold?: number; // Add sold count from MongoDB directly
}

const transformProductSafely = (product: any): TransformedProduct | null => {
  try {
    // Basic validation
    if (!product || typeof product !== 'object' || !product._id) {
      console.warn("[transformProductSafely - ShopPage] Skipping invalid product data:", product);
      return null;
    }

    // Safely convert MongoDB ObjectId to string
    const safeToString = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (value.toString) return value.toString();
      return '';
    };

    // Extract and safely convert category ID and name
    const getCategoryInfo = (category: any): { id: string, name: string } => {
      try {
        if (!category) return { id: '', name: 'Category' };
        
        // If category is a string, use it as both ID and name
        if (typeof category === 'string') return { id: category, name: category };
        
        // If category has _id but no name (common MongoDB reference pattern)
        if (category._id) {
          // First try to get the name directly
          if (category.name) return { id: safeToString(category._id), name: category.name };
          
          // If we only have an ID reference, just use a generic name for now
          // (we'll handle the lookup from categories array after fetching)
          const categoryId = safeToString(category._id);
          return { id: categoryId, name: 'Category' }; // Will be updated later
        }
        
        // Handle other object formats - try to extract name and id
        if (typeof category === 'object' && category !== null) {
          const id = category.id || category._id || '';
          const name = category.name || category.title || category.label || 'Category';
          return { id: safeToString(id), name };
        }
        
        return { id: safeToString(category), name: 'Category' };
      } catch (error) {
        console.error("[getCategoryInfo] Error extracting category info:", error);
        return { id: '', name: 'Category' };
      }
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

    // Generate a slug if not available, with logging for missing slugs
    const getSlug = (p: any): string => {
      if (p.slug && typeof p.slug === 'string' && p.slug.trim() !== '') return p.slug.trim();
      
      const name = p.name || '';
      if (name) {
        const generatedSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        console.warn(`[transformProductSafely - ShopPage] Product ID ${p._id} (Name: "${name}") missing slug. Generated: "${generatedSlug}"`);
        return generatedSlug;
      }
      // If no name and no slug, this is a critical issue.
      // Fallback to ID is unlikely to work for user-facing URLs but provides a non-empty string.
      console.error(`[transformProductSafely - ShopPage] Product ID ${p._id} missing slug and name. Cannot generate a proper slug. Falling back to ID.`);
      return safeToString(p._id); 
    };

    // Determine if the product is on sale
    const isOnSale = typeof product.discount === 'number' && product.discount > 0;

    // Correctly determine if the product is a bestseller (using isBestseller property)
    // instead of using the featured property
    const isBestseller = !!product.isBestseller;
    
    // Explicitly handle featured status by checking both possible property names
    // This ensures we properly bridge the featured flag between backend and frontend
    const isProductFeatured = 
      !!product.featured || 
      !!product.isFeatured ||
      (product._doc && (!!product._doc.featured || !!product._doc.isFeatured));
    
    const isNew = Date.now() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Get total sold count across all subproducts and the main product
    const mainProductSold = typeof product.sold === 'number' ? product.sold : 0;
    
    // If the main product sold count is already populated, use it directly
    let totalSoldCount = mainProductSold;
    
    // If main product doesn't have a sold count, calculate from subproducts
    if (mainProductSold === 0 && Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      // First check if any subProduct has a pre-calculated sold count
      const anySubProductHasSoldCount = product.subProducts.some(
        (subProduct: any) => typeof subProduct.sold === 'number' && subProduct.sold > 0
      );
      
      if (anySubProductHasSoldCount) {
        // If subProducts have their own sold counts, sum those up
        totalSoldCount = product.subProducts.reduce((total: number, subProduct: any) => {
          return total + (typeof subProduct.sold === 'number' ? subProduct.sold : 0);
        }, 0);
      } else {
        // If subProducts don't have sold counts, calculate from sizes
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
    
    // If there's an orderCount property available, use it as a fallback
    if (totalSoldCount === 0 && typeof product.orderCount === 'number' && product.orderCount > 0) {
      totalSoldCount = product.orderCount;
    }
    
    // Map category info
    const categoryInfo = getCategoryInfo(product.category);
    
    // Map brand info
    const brandInfo = getBrandInfo(product.brand);

    const slug = getSlug(product);
    if (!slug) {
      console.error(`[transformProductSafely - ShopPage] Failed to obtain a slug for product ID ${product._id}. Skipping product.`);
      return null;
    }

    // Get base product price
    const basePrice = typeof product.price === 'number' ? product.price : 
             (product.subProducts && product.subProducts[0]?.sizes && product.subProducts[0].sizes[0]?.price) || 
             (product.subProducts && product.subProducts[0]?.price) || 0;
           
    // Get discount percentage
    const discountPercentage = typeof product.discount === 'number' ? product.discount : 0;
    
    // Calculate final price with discount, properly rounded
    const finalPrice = calculatePriceWithDiscount(basePrice, discountPercentage);

    // Get subcategory information
    const getSubcategoryName = () => {
      try {
        if (!product.subCategories) return '';
        
        // Handle array of subcategory objects
        if (Array.isArray(product.subCategories) && product.subCategories.length > 0) {
          const firstSubcat = product.subCategories[0];
          if (firstSubcat) {
            // Check if subcategory has a name property
            if (typeof firstSubcat === 'string') return firstSubcat;
            if (firstSubcat.name) return firstSubcat.name;
            if (firstSubcat._id) return String(firstSubcat._id); // At least return ID if that's all we have
          }
        }
        
        // Handle direct string subcategory value
        if (typeof product.subcategory === 'string') return product.subcategory;
        if (product.subcategory?.name) return product.subcategory.name;
        
        return '';
      } catch (error) {
        console.error("[getSubcategoryName] Error getting subcategory name:", error);
        return '';
      }
    };

    return {
      id: safeToString(product._id),
      name: product.name || '',
      description: product.description || '',
      price: finalPrice,
      originalPrice: basePrice, // Add original price field
      discount: discountPercentage,
      image: getImageUrl(product),
      images: Array.isArray(product.images) ? product.images : [], // Pass images array if available
      slug: slug, // Use the processed slug
      category: categoryInfo.name, // Use the resolved category name
      categoryId: categoryInfo.id, // Use the resolved category ID
      subcategory: getSubcategoryName(),
      brandId: brandInfo.id,
      brandName: brandInfo.name,
      stock: typeof product.stock === 'number' ? product.stock : 
             (product.subProducts && product.subProducts[0]?.sizes && product.subProducts[0].sizes[0]?.qty) || 
             (product.subProducts && product.subProducts[0]?.stock) ||
             (product.subProducts && product.subProducts[0]?.qty) || 0,
      isOnSale: isOnSale,
      isBestseller: isBestseller,
      isNew: isNew,
      featured: isProductFeatured, // Add the featured property to the returned object
      isFeatured: isProductFeatured, // Add isFeatured for compatibility with other components
      sold: totalSoldCount, // Combined sold count from main product and all subproducts
      orderCount: totalSoldCount, // For backward compatibility
    };
  } catch (error) {
    console.error("[transformProductSafely - ShopPage] Error transforming product:", product, error);
    return null;
  }
};

const ShopPage = () => {
  // State for products and filters
  const [products, setProducts] = useState<TransformedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<TransformedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subCategoryDetails, setSubCategoryDetails] = useState<SubCategoryDetail[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter states
  const [selectedFilters, setSelectedFilters] = useState<SelectedFiltersState>({
    category: [],
    subcategory: [],
    sale: [],
    brand: [],
    bestSelling: [],
    isNew: [],
    isFeatured: [],
    inStock: [],
    price: [0, 20000], // Add missing price property
    rating: [], // Add missing rating property
    color: [], // Add color property
    size: [], // Add size property
  });
  const [priceRange, setPriceRange] = useState<number[]>([0, 20000]);
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('featured'); // default sort option
  
  // UI states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // Fetch all products, categories, subcategories, and brands
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required data in parallel
        const [productsResponse, categoriesResponse, subcategoriesResult, brandsResponse, allSubCategories] = await Promise.all([
          getAllProducts(),
          getAllCategories(),
          getUniqueSubCategoryNames(),
          getAllBrands(),
          getAllSubCategories()
        ]);
        
        // Handle products
        if (!productsResponse || !productsResponse.success) {
          console.error("[ShopPage] Failed to fetch products:", productsResponse?.message || "Unknown error");
          setProducts([]);
          setFilteredProducts([]);
        } else {
          // Extract products array from the response
          const productsResult = productsResponse.products || [];
          
          // Transform products to match the ProductCard props
          const transformedProducts = productsResult
            .filter((p: any) => p && typeof p === 'object')
            .map((p: any) => {
              // Use existing transformation logic
              const transformedProduct = transformProductSafely(p);
              return transformedProduct;
            })
            .filter((p: TransformedProduct | null) => p !== null) as TransformedProduct[];
          
          setProducts(transformedProducts);
          setFilteredProducts(transformedProducts);
        }
        
        // Check and handle categories response
        if (categoriesResponse && Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse);
        } else if (categoriesResponse && categoriesResponse.categories && Array.isArray(categoriesResponse.categories)) {
          setCategories(categoriesResponse.categories);
        } else {
          console.error("[ShopPage] Failed to process categories:", categoriesResponse);
          setCategories([]);
        }
        
        // Handle subcategories
        setSubcategories(subcategoriesResult || []);
        
        // Handle all subcategory details
        if (allSubCategories && Array.isArray(allSubCategories)) {
          setSubCategoryDetails(allSubCategories);
        } else if (allSubCategories && allSubCategories.subCategories && Array.isArray(allSubCategories.subCategories)) {
          setSubCategoryDetails(allSubCategories.subCategories);
        } else {
          console.error("[ShopPage] Failed to process subcategory details:", allSubCategories);
          setSubCategoryDetails([]);
        }
        
        // Check and handle brands response
        if (brandsResponse && Array.isArray(brandsResponse)) {
          setBrands(brandsResponse);
        } else if (brandsResponse && brandsResponse.brands && Array.isArray(brandsResponse.brands)) {
          setBrands(brandsResponse.brands);
        } else {
          console.error("[ShopPage] Failed to process brands:", brandsResponse);
          setBrands([]);
        }
      } catch (error) {
        console.error("[ShopPage] Error fetching data:", error);
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Update product category names after categories are loaded
  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      const categoryMap = new Map();
      
      // Create a lookup map for faster category lookup by ID
      categories.forEach(category => {
        if (category._id) {
          categoryMap.set(category._id, category.name);
        }
      });
      
      // Update products with proper category names
      const updatedProducts = products.map(product => {
        // Always try to update the category if we have a categoryId
        if (product.categoryId) {
          const categoryName = categoryMap.get(product.categoryId);
          if (categoryName) {
            return {
              ...product,
              category: categoryName
            };
          }
        }
        return product;
      });
      
      // Update products state only if there were changes
      setProducts(updatedProducts);
      
      // Always update filtered products to ensure they have correct categories
      const updatedFilteredProducts = filteredProducts.map(product => {
        if (product.categoryId) {
          const categoryName = categoryMap.get(product.categoryId);
          if (categoryName) {
            return {
              ...product,
              category: categoryName
            };
          }
        }
        return product;
      });
      
      setFilteredProducts(updatedFilteredProducts);
    }
  }, [categories, products.length]);

  // Ensure subcategory details have parent relationship with categories
  useEffect(() => {
    if (categories.length > 0 && subCategoryDetails.length > 0) {
      console.log("Processing subcategory relationships");
      console.log("Categories:", categories);
      console.log("SubCategory details before processing:", subCategoryDetails);
      
      // Create enhanced subcategory details with parent information if missing
      const enhancedSubCategoryDetails = subCategoryDetails.map(subcategory => {
        // If subcategory already has parent info, keep it as is
        if (subcategory.parent || subcategory.categoryId || subcategory.parentCategory) {
          return subcategory;
        }
        
        // Try to find parent category through product data
        // This helps establish relationships when direct parent references are missing
        const productsWithThisSubcategory = products.filter(p => 
          p.subcategory === subcategory.name
        );
        
        if (productsWithThisSubcategory.length > 0) {
          // Get the category ID from the first product with this subcategory
          const possibleParentId = productsWithThisSubcategory[0].categoryId;
          
          if (possibleParentId) {
            console.log(`Found parent ${possibleParentId} for subcategory ${subcategory.name} through product data`);
            return {
              ...subcategory,
              parent: possibleParentId
            };
          }
        }
        
        // If we still don't have a parent, try other methods
        for (const category of categories) {
          // Check if category has subcategories array and this subcategory is in it
          if (category.subcategories && 
              Array.isArray(category.subcategories) && 
              category.subcategories.some(sc => 
                (typeof sc === 'string' && sc === subcategory.name) || 
                (sc._id && sc._id === subcategory._id)
              )) {
            console.log(`Found parent ${category._id} for subcategory ${subcategory.name} through category data`);
            return {
              ...subcategory,
              parent: category._id
            };
          }
          
          // Attempt to match by name similarity (last resort)
          if (subcategory.name.includes(category.name) || category.name.includes(subcategory.name)) {
            console.log(`Found possible parent ${category._id} for subcategory ${subcategory.name} through name similarity`);
            return {
              ...subcategory,
              parent: category._id
            };
          }
        }
        
        return subcategory;
      });
      
      console.log("Enhanced subcategory details:", enhancedSubCategoryDetails);
      // Update the subcategory details state with enhanced data
      setSubCategoryDetails(enhancedSubCategoryDetails);
    }
  }, [categories, subCategoryDetails, products]);

  // Update filtered products when filters, search, or sort changes
  useEffect(() => {
    let result = [...products];
    
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
    
    // Apply category filter
    if (selectedFilters.category.length > 0) {
      result = result.filter(p => selectedFilters.category.includes(p.categoryId));
    }
    
    // Apply subcategory filter - Enhanced with more flexible matching
    if (selectedFilters.subcategory.length > 0) {
      result = result.filter(p => {
        // If product has no subcategory data at all, it doesn't match
        if (!p.subcategory) return false;
        
        // Try multiple matching approaches to handle different data structures
        for (const selectedSubcategory of selectedFilters.subcategory) {
          // Direct string match
          if (p.subcategory === selectedSubcategory) return true;
          
          // Case-insensitive string match
          if (p.subcategory.toLowerCase() === selectedSubcategory.toLowerCase()) return true;
          
          // Slug match (convert spaces to dashes)
          const subcategorySlug = selectedSubcategory.toLowerCase().replace(/\s+/g, '-');
          if (p.subcategory.toLowerCase().replace(/\s+/g, '-') === subcategorySlug) return true;
          
          // Partial match (subcategory contains the selected value)
          if (p.subcategory.toLowerCase().includes(selectedSubcategory.toLowerCase())) return true;
        }
        
        // No match found through any method
        return false;
      });
    }
    
    // Apply brand filter - Fix: Handle both brand ID and brand name matching
    if (selectedFilters.brand.length > 0) {
      result = result.filter(p => {
        // Check if the product's brandId or brandName matches any selected brand
        return selectedFilters.brand.includes(p.brandId) || 
               selectedFilters.brand.includes(p.brandName) ||
               // Also check if the selected brand name matches the product's brand name
               selectedFilters.brand.some(selectedBrand => {
                 const matchingBrand = brands.find(b => b._id === selectedBrand);
                 return matchingBrand && (matchingBrand.name === p.brandName || matchingBrand.name === p.brandId);
               });
      });
    }
    
    // Apply sale filter
    if (selectedFilters.sale.includes('sale')) {
      result = result.filter(p => p.isOnSale);
    }
    
    // Apply bestseller filter
    if (selectedFilters.bestSelling.includes('bestseller')) {
      result = result.filter(p => p.isBestseller);
    }
    
    // Apply new arrivals filter
    if (selectedFilters.isNew.includes('new')) {
      result = result.filter(p => p.isNew);
    }
    
    // Apply featured filter
    if (selectedFilters.isFeatured.includes('featured')) {
      result = result.filter(p => p.isFeatured || p.featured);
    }
    
    // Apply in-stock filter
    if (selectedFilters.inStock && selectedFilters.inStock.includes('inStock')) {
      result = result.filter(p => {
        const stock = typeof p.stock === 'number' ? p.stock : 0;
        return stock > 0;
      });
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
        // Assuming newer products are marked with isNew flag
        result.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
      // Default is 'featured', no sorting needed
    }
    
    setFilteredProducts(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [products, selectedFilters, priceRange, searchQuery, sortOption]);

  // Handle filter application
  const handleApplyFilters = (filters: SelectedFiltersState, range: number[]) => {
    setSelectedFilters(filters);
    setPriceRange(range);
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
      price: [0, 20000] as [number, number], // Reset price range with proper typing
      rating: [], // Reset rating
      color: [], // Reset color
      size: [], // Reset size
    });
    setPriceRange([0, 20000]);
    setSearchQuery('');
  };
  
  // Handle removing a single filter
  const handleRemoveFilter = (type: keyof SelectedFiltersState, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(v => v !== value)
    }));
  };

  // Get currently paginated products
  const currentProducts = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredProducts, currentPage, itemsPerPage]);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
      case 'color':
        return 'Color: ' + value;
      case 'size':
        return 'Size: ' + value;
      case 'rating':
        return 'Rating: ' + value + ' & Up';
      case 'inStock':
        return 'In Stock';
      default:
        return value;
    }
  };

  // Define the type for active filter objects
  interface ActiveFilter {
    type: keyof SelectedFiltersState;
    value: string;
    displayName: string;
  }

  // Display active filter badges
  const renderActiveFilters = () => {
    const activeFilters: ActiveFilter[] = [];
    
    Object.entries(selectedFilters).forEach(([type, values]) => {
      if (values.length > 0) {
        values.forEach((value: string) => {
          activeFilters.push({
            type: type as keyof SelectedFiltersState,
            value,
            displayName: getDisplayName(type as keyof SelectedFiltersState, value)
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
            className="px-3 py-1 flex items-center gap-1 bg-gray-100"
          >
            {filter.displayName}
            <button onClick={() => handleRemoveFilter(filter.type, filter.value)} className="ml-1">
              <X size={14} />
            </button>
          </Badge>
        ))}
        
        {(activeFilters.length > 0 || searchQuery || priceRange[0] > 0 || priceRange[1] < 20000) && (
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

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-black">Home</Link>
        <ChevronRight size={14} className="mx-1" />
        <span className="font-medium text-black">Shop</span>
      </div>
      
      {/* Title and results count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shop All Products</h1>
          <p className="text-gray-500 mt-1">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
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
            subCategoryNames={subcategories}
            brands={brands}
            subCategoryDetails={subCategoryDetails}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            initialFilters={selectedFilters}
            initialPriceRange={priceRange}
            className="sticky top-24" // Keep filter sidebar sticky while scrolling
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
                    subCategoryNames={subcategories}
                    brands={brands}
                    onApplyFilters={(filters, range) => {
                      handleApplyFilters(filters, range);
                      setIsMobileFilterOpen(false);
                    }}
                    onClearFilters={handleClearFilters}
                    initialFilters={selectedFilters}
                    initialPriceRange={priceRange}
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
              
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 per page</SelectItem>
                  <SelectItem value="24">24 per page</SelectItem>
                  <SelectItem value="48">48 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active filters */}
          {renderActiveFilters()}
          
          {/* Products grid */}
          {loading ? (
            // Loading skeleton
            <div className={`grid ${viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8' 
              : 'space-y-6'}`}
            >
              {Array.from({ length: 8 }).map((_: any, index: number) => (
                <div key={`skeleton-${index}`} className="flex flex-col space-y-3">
                  <Skeleton className="h-60 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-2/5" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            // No results
            <div className="text-center py-10">
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
              <Button onClick={handleClearFilters}>Clear All Filters</Button>
            </div>
          ) : (
            // Product grid or list
            <>
              <div className={`${viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8' 
                : 'space-y-6'}`}
              >
                {currentProducts.map((product, index) => (
                  <LazyProductCardSmall 
                    key={product.id} 
                    product={product}
                    index={index}
                    loadingAnimation="skeleton"
                    priority={index < 4} // Load the first 4 products immediately without lazy loading
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, index) => {
                      // Show current page and nearby pages
                      const pageNum = index + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - currentPage) <= 1
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => paginate(pageNum)}
                              isActive={pageNum === currentPage}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      // Show ellipsis for skipped pages
                      if (
                        (pageNum === 2 && currentPage > 3) ||
                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Replace the default export with a wrapped version
const ShopPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <ShopPage />
  </ErrorBoundary>
);

export default ShopPageWithErrorBoundary;

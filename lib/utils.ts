// @ts-nocheck

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const handleError = (error: unknown) => {
  try {
    if (error instanceof Error) {
      // This is a native JavaScript error (e.g., TypeError, RangeError)
      console.error("Error message:", error.message);
      // Don't throw, just return the error message - this prevents crashing
      return { error: error.message };
    } else if (typeof error === "string") {
      // This is a string error message
      console.error("Error string:", error);
      return { error };
    } else {
      // This is an unknown error type
      let errorStr;
      try {
        errorStr = JSON.stringify(error, null, 2);
      } catch (jsonError) {
        errorStr = "[Unable to stringify error]";
      }
      console.error("Unknown error:", errorStr);
      return { error: "Unknown error occurred" };
    }
  } catch (err) {
    // Handle errors during the error handling process
    console.error("Error during error handling:", err);
    return { error: "An unexpected error occurred" };
  }
};

export const compareArrays = (array1: any, array2: any) => {
  if (array1.length !== array2.length) return false;
  const neww = (object: any) =>
    JSON.stringify(
      Object.keys(object)
        .sort()
        .map((key) => [key, object[key]])
    );
  array1 = new Set(array1.map(neww));
  return array2.every((object: any) => array1.has(neww(object)));
};

export const filterArray = (array: any, property: any) => {
  return array
    .filter((item: any) => item.name == property)
    .map((s: any) => {
      return s.value;
    });
};

export const removeDuplicates = (array: any) => {
  return [...new Set(array)];
};

export const randomize = (array: any) => {
  return [...array].sort(() => 0.5 - Math.random());
};

/**
 * Transforms product data into a consistent format for UI components
 * This handles various edge cases and data inconsistencies
 */
export const transformProductSafely = (product: any) => {
  if (!product) {
    console.warn("transformProductSafely received null/undefined product");
    return null;
  }

  try {
    // Basic validation of the input product
    if (!product || typeof product !== 'object' || !product._id) {
      console.warn("[transformProductSafely] Skipping invalid product data (missing product or _id):", product);
      return null;
    }

    let idString: string;
    const productIdField = product._id;

    if (typeof productIdField === 'string') {
      idString = productIdField;
    } else if (productIdField && typeof productIdField.toHexString === 'function') {
      idString = productIdField.toHexString(); // Standard for BSON/MongoDB ObjectId
    } else if (productIdField && typeof productIdField.toString === 'function') {
      idString = productIdField.toString();
    } else {
      console.warn(`[transformProductSafely] Product _id is in an unhandled format: ${JSON.stringify(productIdField)}`);
      return null;
    }

    let slug = product.slug;
    if (!slug) {
      console.warn(`[transformProductSafely] Product with ID ${idString} and name "${product.name}" is missing a slug. Generating one from name. This may cause linking issues if the database does not have a corresponding slug or if the generated slug is not unique/correct.`);
      slug = String(product.name || "").toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      if (!slug && idString) {
        console.warn(`[transformProductSafely] Product with ID ${idString} also has no name to generate slug. Using ID as fallback slug, which will likely fail for product page navigation.`);
        slug = String(idString);
      }
    }
    if (!slug) {
        console.error(`[transformProductSafely] Product (ID: ${idString}) is missing a slug and cannot generate one. Name: "${product.name}". Product data:`, product);
        return null;
    }

    // Use the first subProduct if available, otherwise use an empty object
    const subProduct = (Array.isArray(product.subProducts) && product.subProducts.length > 0)
      ? product.subProducts[0] || {}
      : {};

    // --- Enhanced Sizes and Price Calculation (Optional Sizes) --- 
    let sizes: { size: string; price: number; qty: number }[] = [];
    let price = 0;
    let defaultQuantity = 0;
    
    // Check if subProduct.sizes exists and is an array
    if (subProduct.sizes && Array.isArray(subProduct.sizes) && subProduct.sizes.length > 0) {
      // Process sizes if available - include sizes with empty strings but valid price/qty
      sizes = subProduct.sizes.map((size: any) => ({
        size: String(size?.size || ""),
        price: parseFloat(size?.price) || 0,
        qty: parseInt(size?.qty) || 0
      })).filter((size: any) => {
        // Keep sizes with valid price or quantity, even if size name is empty
        return size.price > 0 || size.qty > 0;
      });
      
      // Calculate price based on sizes
      if (sizes.length > 0) {
        const validPrices = sizes.map(s => s.price).filter(p => !isNaN(p) && p > 0);
        price = validPrices.length > 0 ? Math.min(...validPrices) : (parseFloat(subProduct.price) || parseFloat(product.price) || 0);
        // Calculate total quantity from all sizes
        defaultQuantity = sizes.reduce((total, size) => total + size.qty, 0);
      }
    } else {
      // No sizes available - use direct product/subProduct data
      const subProductPrice = typeof subProduct.price === 'number' || typeof subProduct.price === 'string' ? parseFloat(subProduct.price) : 0;
      const productPrice = typeof product.price === 'number' || typeof product.price === 'string' ? parseFloat(product.price) : 0;
      
      price = subProductPrice || productPrice || 0;
      
      // Use direct quantity/stock from product or subProduct
      const subProductQty = typeof subProduct.qty === 'number' ? subProduct.qty : 
                           typeof subProduct.qty === 'string' ? parseInt(subProduct.qty) : 0;
      const subProductStock = typeof subProduct.stock === 'number' ? subProduct.stock : 
                             typeof subProduct.stock === 'string' ? parseInt(subProduct.stock) : 0;
      const productStock = typeof product.stock === 'number' ? product.stock : 
                          typeof product.stock === 'string' ? parseInt(product.stock) : 0;
      const productQty = typeof product.qty === 'number' ? product.qty : 
                        typeof product.qty === 'string' ? parseInt(product.qty) : 0;
      
      defaultQuantity = subProductQty || subProductStock || productStock || productQty || 0;
    }

    // --- Enhanced Image Handling --- 
    let mainImage = "/images/broken-link.png";
    
    // Debug product image structure
    const hasDirectImage = !!product.image;
    const hasImagesArray = Array.isArray(product.images) && product.images.length > 0;
    const hasSubProducts = Array.isArray(product.subProducts) && product.subProducts.length > 0;
    
    let firstSubProductHasImages = false;
    if (hasSubProducts) {
      const firstSubProduct = product.subProducts[0];
      firstSubProductHasImages = Array.isArray(firstSubProduct?.images) && firstSubProduct.images.length > 0;
    }

    // Determine image URL based on available sources
    let imageUrl = "";
    if (firstSubProductHasImages) {
      const img = product.subProducts[0].images[0];
      imageUrl = typeof img === 'string' ? img : (img?.url || null);
    } else if (hasImagesArray) {
      const img = product.images[0];
      imageUrl = typeof img === 'string' ? img : (img?.url || null);
    } else if (hasDirectImage) {
      imageUrl = typeof product.image === 'string' ? product.image : (product.image?.url || null);
    }
    
    mainImage = imageUrl || "/images/broken-link.png";

    // --- Gallery Processing ---
    const gallery = [];
    
    // Add sub-product images to gallery
    if (firstSubProductHasImages) {
      product.subProducts[0].images.forEach((img: any) => {
        const imgUrl = typeof img === 'string' ? img : (img?.url || null);
        if (imgUrl) gallery.push(imgUrl);
      });
    }
    
    // Add product images array to gallery if it exists
    if (hasImagesArray) {
      product.images.forEach((img: any) => {
        const imgUrl = typeof img === 'string' ? img : (img?.url || null);
        if (imgUrl) gallery.push(imgUrl);
      });
    }
    
    // Add direct product image if it exists
    if (hasDirectImage && !gallery.includes(imageUrl)) {
      const directImgUrl = typeof product.image === 'string' ? product.image : (product.image?.url || null);
      if (directImgUrl) gallery.push(directImgUrl);
    }

    // --- Category Handling --- 
    let categoryValue = "";
    if (product.category) {
      if (typeof product.category === 'string') {
        categoryValue = product.category;
      } else if (typeof product.category === 'object') {
        if (product.category.name) {
          categoryValue = product.category.name;
        } else if (product.category._id) {
          categoryValue = product.category._id.toString();
        }
      }
    }

    // --- Featured Status Determination --- 
    // Fix for the featured bridge - ensure consistent featured status detection
    const isProductFeatured = Boolean(
      product.featured || 
      product.isFeatured || 
      (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
      (typeof product._id !== 'undefined' && (product.featured === true || product.isFeatured === true))
    );

    // Placeholder logic for subtitle and colorCountText
    // In a real scenario, these would come from product data
    let subtitle: string | undefined = undefined;
    if (product.tags?.includes("Sustainable")) {
      subtitle = "Sustainable Materials";
    } else if (product.status === "Coming Soon") {
      subtitle = "Coming Soon";
    }

    const colorCount = product.availableColors?.length || 1;
    const colorCountText = `${colorCount} Colour${colorCount > 1 ? 's' : ''}`;

    // --- Construct Plain Object --- 
    return {
      id: idString, // Use the processed idString
      name: String(product.name || "Unnamed Product"),
      category: categoryValue, // Already processed string
      image: mainImage, // Enhanced image handling
      rating: parseFloat(product.rating) || 0,
      reviews: parseInt(product.numReviews) || 0,
      price: price, // Already processed number
      originalPrice: parseFloat(subProduct.originalPrice) || price, // Fallback to calculated price
      discount: parseInt(subProduct.discount) || 0,
      isBestseller: !!product.isBestseller,
      isSale: !!subProduct.isSale,
      slug: slug, // Use the processed slug
      prices: (subProduct.sizes || [])
        .map((s: any) => parseFloat(s?.price) || 0)
        .filter((p: number) => !isNaN(p) && p > 0) // Ensure valid numbers
        .sort((a: number, b: number) => a - b),
      description: String(product.description || ""),
      gallery: gallery, // Enhanced gallery handling
      sizes: sizes, // Already processed array of plain objects
      subtitle: product.subtitle || subtitle, // Use direct product.subtitle if available, otherwise derived
      colorCountText: product.colorCountText || colorCountText, // Use direct if available
      // Featured bridge fix - add both properties for compatibility
      featured: isProductFeatured,
      isFeatured: isProductFeatured,
      sold: typeof product.sold === 'number' ? product.sold : 0, // Include sold count
      stock: defaultQuantity, // Include stock data
    };

  } catch (error) {
    console.error("[transformProductSafely] Error transforming product:", error, "Input product:", product);
    return null; // Return null on any unexpected error during transformation
  }
};

/**
 * Extract image URL safely from various product data structures
 * @param product - The product object which might contain image data
 * @param defaultImage - Optional fallback image path
 * @returns A string URL to the product image
 */
export const extractProductImage = (product: any, defaultImage: string = "/images/broken-link.png"): string => {
  if (!product) return defaultImage;

  try {
    // Based on the product schema, the most common image location is in subProducts[0].images[0]
    if (Array.isArray(product.subProducts) && product.subProducts.length > 0) {
      const firstSubProduct = product.subProducts[0];
      
      // Check if subProduct has images array with content
      if (Array.isArray(firstSubProduct.images) && firstSubProduct.images.length > 0) {
        const firstImage = firstSubProduct.images[0];
        
        // Handle different possible image formats
        if (typeof firstImage === 'string') {
          return firstImage; // Direct string URL
        } else if (firstImage && typeof firstImage === 'object') {
          // Object with url property (Cloudinary format)
          if (firstImage.url) return firstImage.url;
          
          // If it's a Cloudinary object with secure_url
          if (firstImage.secure_url) return firstImage.secure_url;
        }
      }
    }

    // Fallback to direct product.image if available
    if (product.image) {
      if (typeof product.image === 'string') return product.image;
      if (product.image.url) return product.image.url;
      if (product.image.secure_url) return product.image.secure_url;
    }
    
    // Try product.images array if available
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImg = product.images[0];
      if (typeof firstImg === 'string') return firstImg;
      if (firstImg && firstImg.url) return firstImg.url;
      if (firstImg && firstImg.secure_url) return firstImg.secure_url;
    }

    // Last resort - return default image
    return defaultImage;
  } catch (error) {
    console.error("Error extracting product image:", error);
    return defaultImage;
  }
};

/**
 * Extract category image URL safely from category data
 * @param category - The category object which might contain image data
 * @param defaultImage - Optional fallback image path
 * @returns A string URL to the category image
 */
export const extractCategoryImage = (category: any, defaultImage: string = "/images/broken-link.png"): string => {
  if (!category) return defaultImage;
  
  try {
    // Handle direct image property
    if (category.image) {
      if (typeof category.image === 'string') return category.image;
      if (category.image.url) return category.image.url;
    }
    
    // Handle images array (according to your category schema)
    if (Array.isArray(category.images) && category.images.length > 0) {
      const firstImg = category.images[0];
      if (typeof firstImg === 'string') return firstImg;
      if (firstImg && firstImg.url) return firstImg.url;
    }
    
    return defaultImage;
  } catch (error) {
    console.error("Error extracting category image:", error);
    return defaultImage;
  }
};

/**
 * Safely serializes MongoDB objects for client components
 * This converts Buffer _id objects to strings and handles nested objects/arrays
 */
export function safeSerialize<T>(obj: T): T {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Ensures consistent data serialization for client components
 * @param data Any data that needs to be passed to client components
 * @param defaultValue Optional default value if data is undefined
 */
export function ensureClientData<T>(data: T, defaultValue?: T): T {
  // Handle undefined or null input gracefully
  if (data === undefined || data === null) {
    return (defaultValue !== undefined) ? defaultValue : null as unknown as T;
  }
  
  // Ensure data is serialized properly
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error during data serialization:", error);
    return (defaultValue !== undefined) ? defaultValue : null as unknown as T;
  }
}

/**
 * Creates a properly formatted URL for filtering products by brand
 * @param brandId - The ID of the brand to filter by
 * @param brandName - Optional brand name for debugging
 * @returns A string URL to the shop page with brand filter applied
 */
export const createBrandFilterLink = (brandId: string, brandName?: string): string => {
  if (!brandId) {
    console.warn("createBrandFilterLink called without a brandId");
    return "/shop";
  }
  
  try {
    // Create URL with brand parameter
    return `/shop?brand=${encodeURIComponent(brandId)}`;
  } catch (error) {
    console.error(`Error creating brand filter link for brand ${brandName || brandId}:`, error);
    return "/shop";
  }
};

// Various utility functions used throughout the application

// Format price for display with currency symbol
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// Other utility functions can be added below...

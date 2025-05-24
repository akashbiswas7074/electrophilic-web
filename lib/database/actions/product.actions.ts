"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Category from "../models/category.model";
import Product from "../models/product.model";
import SubCategory from "../models/subCategory.model";
import User from "../models/user.model";
import { redirect } from "next/navigation";
import { revalidateTag, unstable_cache } from "next/cache";
import Size from "../models/size.model";   // Add this import

// Helper function to extract the first image URL and discount
const getFirstSubProductInfo = (product: any): { image: string; discount: number } => {
  const firstSubProduct = product.subProducts?.[0];
  return {
    image: firstSubProduct?.images?.[0]?.url || "/placeholder.png", // Ensure placeholder exists
    discount: firstSubProduct?.discount || 0, // Extract discount, default to 0
  };
};

// Get price information with optional sizes support
function getPriceInfo(product: any) {
  const subProduct = product.subProducts?.[0];
  if (!subProduct) return { price: 0, originalPrice: 0 };
  
  let price = 0;
  let originalPrice = 0;
  
  // Check if product has sizes
  if (subProduct.sizes && Array.isArray(subProduct.sizes) && subProduct.sizes.length > 0) {
    // Use first size for pricing
    const firstSize = subProduct.sizes[0];
    originalPrice = firstSize.originalPrice || firstSize.price || 0;
    price = subProduct.discount > 0 
      ? originalPrice - (originalPrice * subProduct.discount / 100)
      : originalPrice;
  } else {
    // Use direct price fields for products without sizes
    originalPrice = subProduct.originalPrice || subProduct.price || product.price || 0;
    price = subProduct.discount > 0 
      ? originalPrice - (originalPrice * subProduct.discount / 100)
      : originalPrice;
  }
  
  return { price, originalPrice };
}

// Get quantity information with optional sizes support
function getQuantityInfo(product: any) {
  const subProduct = product.subProducts?.[0];
  if (!subProduct) return 0;
  
  // Check if product has sizes
  if (subProduct.sizes && Array.isArray(subProduct.sizes) && subProduct.sizes.length > 0) {
    // Sum up quantities from all sizes
    return subProduct.sizes.reduce((total: number, size: any) => total + (size.qty || 0), 0);
  } else {
    // Use direct quantity fields for products without sizes
    return subProduct.qty || subProduct.stock || product.qty || product.stock || 0;
  }
}

// get all top selling products
export const getTopSellingProducts = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const products = await Product.find()
        .sort({ "subProduct.sold": -1 })
        .limit(4)
        .lean(); // Use lean for plain JS objects

      if (!products || products.length === 0) { // Check length too
        return {
          products: [],
          message: "No top selling products found.",
          success: false,
        };
      }

      // Add the primary image URL and discount to each product
      const productsWithDetails = products.map(p => {
        const { image, discount } = getFirstSubProductInfo(p);
        return {
          ...p,
          image,
          discount, // Add discount here
        };
      });

      return {
        products: JSON.parse(JSON.stringify(productsWithDetails)), // Use updated variable
        success: true,
        message: "Top selling products fetched successfully.",
      };
    } catch (error) {
      handleError(error);
      // Return error state
      return { products: [], success: false, message: "Failed to fetch top selling products." };
    }
  },
  ["top_selling_products"],
  {
    revalidate: 1800,
  }
);

// get all new arrival products
export const getNewArrivalProducts = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const products = await Product.find()
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(); // Use lean

      if (!products || products.length === 0) { // Check length
        return {
          message: "No new arrival products found.",
          success: false,
          products: [],
        };
      }

      // Add the primary image URL and discount
      const productsWithDetails = products.map(p => {
        const { image, discount } = getFirstSubProductInfo(p);
        return {
          ...p,
          image,
          discount, // Add discount here
        };
      });

      return {
        message: "Fetched all new arrival products",
        success: true,
        products: JSON.parse(JSON.stringify(productsWithDetails)), // Use updated variable
      };
    } catch (error) {
      handleError(error);
      return { products: [], success: false, message: "Failed to fetch new arrival products." };
    }
  },
  ["new_arrival_products"],
  {
    revalidate: 1800,
  }
);

// fetch products by query
export async function getProductsByQuery(query: string) {
  try {
    await connectToDatabase();
    const products = await Product.find({
      name: { $regex: query, $options: "i" },
    })
      .limit(4)
      .lean();
    if (!products || products.length === 0) {
      return {
        products: [],
        success: false,
        message: "No products found with this search criteria.",
      };
    }
    const productsWithDetails = products.map(p => {
        const { image, discount } = getFirstSubProductInfo(p);
        return {
          ...p,
          image,
          discount, // Add discount here
        };
      });
    return {
      products: JSON.parse(JSON.stringify(productsWithDetails)), // Use updated variable
      success: true,
      message: "Successfully fetched all query related products.",
    };
  } catch (error) {
    handleError(error);
  }
}

// get single product
export const getSingleProduct = unstable_cache(
  async (slug: string, style: number = 0, size: number = 0) => {
    console.log(`[getSingleProduct] Fetching product with slug: "${slug}", style: ${style}, size: ${size}`);
    try {
      await connectToDatabase();
      console.log("[getSingleProduct] Database connected.");

      // The model files (Category, SubCategory, User, Product) are imported at the top of this file.
      // Their execution should register them with Mongoose.

      const rawProduct = await Product.findOne({ slug });
      console.log("[getSingleProduct] Raw product from DB (before lean):", rawProduct ? "Product found" : "Product NOT found");

      if (!rawProduct) {
        console.error(`[getSingleProduct] No product found in DB for slug: "${slug}"`);
        return { success: false, message: `Product with slug '${slug}' not found.` };
      }

      let product: any = await Product.findOne({ slug })
        .populate("category") // Relies on the 'ref' in Product schema for 'category'
        .populate("subCategories") // Relies on the 'ref' in Product schema for 'subCategories' (should be "SubCategory")
        .populate("reviews.reviewBy") // Relies on the 'ref' in Product schema for 'reviews.reviewBy'
        .lean();
      
      console.log("[getSingleProduct] Product after populate and lean:", product ? "Product data exists" : "Product data is null/undefined after lean");

      if (!product) {
        // This case should ideally be caught by rawProduct check, but as a safeguard:
        console.error(`[getSingleProduct] Product became null after populate/lean for slug: "${slug}"`);
        return { success: false, message: "Failed to process product data." };
      }
      
      console.log("[getSingleProduct] Product SubProducts:", product.subProducts);
      const validStyle = style >= 0 && product.subProducts && style < product.subProducts.length ? style : 0;
      console.log(`[getSingleProduct] Original style: ${style}, Validated style: ${validStyle}`);
      
      let subProduct = product?.subProducts?.[validStyle];
      console.log("[getSingleProduct] Selected subProduct:", subProduct ? "SubProduct exists" : "SubProduct is null/undefined");
      
      if (!subProduct || !Array.isArray(subProduct.sizes) || !subProduct.sizes.length) {
        console.error(`[getSingleProduct] Invalid subProduct or sizes for product slug: "${slug}", style: ${validStyle}. SubProduct: ${JSON.stringify(subProduct)}`);
        return { success: false, message: "Invalid product configuration: Missing subProduct or sizes." };
      }
      
      console.log("[getSingleProduct] SubProduct sizes:", subProduct.sizes);
      const validSizeIndex = size >= 0 && size < subProduct.sizes.length ? size : 0;
      console.log(`[getSingleProduct] Original size index: ${size}, Validated size index: ${validSizeIndex}`);
      
      let selectedSizeData = subProduct.sizes[validSizeIndex];
      console.log("[getSingleProduct] Selected sizeData:", selectedSizeData ? "SizeData exists" : "SizeData is null/undefined");

      if (!selectedSizeData) {
        console.error(`[getSingleProduct] selectedSizeData is undefined for slug: "${slug}", style: ${validStyle}, sizeIndex: ${validSizeIndex}. Sizes array: ${JSON.stringify(subProduct.sizes)}`);
        return { success: false, message: "Invalid product configuration: Missing selected size data." };
      }

      // --- Price Calculation ---
      let originalPrice = selectedSizeData.originalPrice || selectedSizeData.price;
      let discount = subProduct.discount || 0;
      let finalPrice = discount > 0
        ? originalPrice - (originalPrice * discount / 100)
        : originalPrice;

      // --- Process and calculate prices for all sizes ---
      let prices = subProduct.sizes
        .map((s: any) => {
          let sizeOriginalPrice = s.originalPrice || s.price;
          let sizeFinalPrice = discount > 0
            ? sizeOriginalPrice - (sizeOriginalPrice * discount / 100)
            : sizeOriginalPrice;
          return sizeFinalPrice;
        })
        .sort((a: any, b: any) => a - b);
      
      // --- Process Category ---
      // Safely extract category data without buffer objects
      const processedCategory = product.category 
        ? {
            _id: product.category._id?.toString(),
            name: product.category.name || "Unknown Category",
            // Include any other safe category fields you need
          }
        : null;
      
      // --- Process SubCategories ---
      const processedSubCategories = Array.isArray(product.subCategories)
        ? product.subCategories.map((sub: any) => ({
            _id: sub._id?.toString(),
            name: sub.name || "",
            // Include other safe subCategory fields
          }))
        : [];
      
      // --- Process Reviews ---
      // Count the number of reviews for each star rating
      const ratingCount: any = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const processedReviews = Array.isArray(product.reviews)
        ? product.reviews.map((review: any) => {
            // Count the rating
            const rating = review.rating;
            if (ratingCount[rating] !== undefined) {
              ratingCount[rating]++;
            }
            
            // Process each review
            return {
              _id: review._id?.toString(),
              reviewBy: review.reviewBy
                ? {
                    _id: review.reviewBy._id?.toString(),
                    name: review.reviewBy.firstName ? `${review.reviewBy.firstName} ${review.reviewBy.lastName || ''}`.trim() : "Anonymous",
                    image: review.reviewBy.image || "",
                    // Include other safe user fields
                  }
                : null,
              rating: review.rating,
              review: review.review,
              reviewCreatedAt: review.reviewCreatedAt,
              verified: review.verified,
            };
          })
        : [];
      
      // Calculate the total number of reviews
      const totalReviews = processedReviews.length;

      // Calculate rating breakdown percentages
      const ratingBreakdown = [1, 2, 3, 4, 5].map((stars) => {
        const count = ratingCount[stars] || 0;
        const percentage: any =
          totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(2) : 0;
        return {
          stars,
          percentage: parseFloat(percentage),
          count,
        };
      });
      
      // --- Process SubProducts ---
      const processedSubProducts = Array.isArray(product.subProducts)
        ? product.subProducts.map((sub: any) => ({
            sku: sub.sku,
            images: Array.isArray(sub.images) 
              ? sub.images.map((img: any) => 
                  typeof img === 'string' ? img : (img?.url || ""))
              : [],
            description_images: Array.isArray(sub.description_images)
              ? sub.description_images.map((img: any) => 
                  typeof img === 'string' ? img : (img?.url || ""))
              : [],
            sizes: Array.isArray(sub.sizes)
              ? sub.sizes.map((s: any) => ({
                  size: s.size,
                  qty: s.qty,
                  price: s.price,
                  originalPrice: s.originalPrice || s.price,
                  sold: s.sold || 0,
                }))
              : [],
            discount: sub.discount || 0,
            sold: sub.sold || 0,
          }))
        : [];
      
      // --- Process Benefits, Details, Ingredients ---
      const processedBenefits = Array.isArray(product.benefits)
        ? product.benefits.map((b: any) => ({ name: b.name || "" }))
        : [];
        
      const processedDetails = Array.isArray(product.details)
        ? product.details.map((d: any) => ({ 
            name: d.name || "", 
            value: d.value || "" 
          }))
        : [];
        
      const processedIngredients = Array.isArray(product.ingredients)
        ? product.ingredients.map((i: any) => ({ name: i.name || "" }))
        : [];
      
      // Build the final product object with safe values
      let newProduct = {
        success: true,
        _id: product._id.toString(),
        name: product.name || "",
        description: product.description || "",
        longDescription: product.longDescription || "",
        brand: product.brand || "",
        slug: product.slug || "",
        category: processedCategory,
        subCategories: processedSubCategories,
        details: processedDetails,
        benefits: processedBenefits,
        ingredients: processedIngredients,
        reviews: processedReviews,
        rating: product.rating || 0,
        numReviews: product.numReviews || 0,
        style: validStyle,
        images: processedSubProducts[validStyle]?.images || [],
        sizes: processedSubProducts[validStyle]?.sizes || [],
        discount: discount,
        sku: processedSubProducts[validStyle]?.sku || "",
        priceRange: prices.length > 0 ? `From ₹${prices[0]} to ₹${prices[prices.length - 1]}` : '',
        price: finalPrice.toFixed(2),
        originalPrice: originalPrice,
        quantity: selectedSizeData.qty || 0,
        ratingBreakdown,
        allSizes: processedSubProducts
          .map((p: any) => p.sizes)
          .flat()
          .sort((a: any, b: any) => a.size - b.size)
          .filter(
            (element: any, index: any, array: any) =>
              array.findIndex((el2: any) => el2.size === element.size) === index
          ),
        subProducts: processedSubProducts,
        featured: product.featured || false,
        createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : null,
        updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : null,
      };
      
      console.log("[getSingleProduct] Successfully processed product:", newProduct._id);
      return newProduct;
    } catch (error: any) {
      console.error(`[getSingleProduct] Error for slug "${slug}":`, error.message, error.stack);
      if (error.message && error.message.includes("Schema hasn\'t been registered for model")) {
        console.error("Mongoose model registration error: Ensure the model name in your schema\'s 'ref' (e.g., ref: 'SubCategory') exactly matches the name used when defining the model (e.g., mongoose.model('SubCategory', schema)). Also, ensure the model file is imported/executed before this operation. The error indicates Mongoose is looking for: " + error.message.split('"')[1]);
      }
      handleError(error);
      return { success: false, message: `Failed to fetch product. Error: ${error.message}` };
    }
  },
  ["product"],
  {
    revalidate: 1800,
    tags: ["product"],
  }
);

// create a product review for individual product
export async function createProductReview(
  rating: number,
  review: string,
  clerkId: string,
  productId: string
) {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    const user = await User.findOne({ clerkId });

    if (product) {
      const exist = product.reviews.find(
        (x: any) => x.reviewBy.toString() == user._id
      );
      if (exist) {
        await Product.updateOne(
          {
            _id: productId,
            "reviews._id": exist._id,
          },
          {
            $set: {
              "reviews.$.review": review,
              "reviews.$.rating": rating,
              "reviews.$.reviewCreatedAt": Date.now(),
            },
          },
          {
            new: true,
          }
        );
        const updatedProduct = await Product.findById(productId);
        updatedProduct.numReviews = updatedProduct.reviews.length;
        updatedProduct.rating =
          updatedProduct.reviews.reduce((a: any, r: any) => r.rating + a, 0) /
          updatedProduct.reviews.length;
        await updatedProduct.save();
        await updatedProduct.populate("reviews.reviewBy");
        revalidateTag("product");
        return JSON.parse(
          JSON.stringify({ reviews: updatedProduct.reviews.reverse() })
        );
      } else {
        const full_review = {
          reviewBy: user._id,
          rating,
          review,
          reviewCreatedAt: Date.now(),
        };
        product.reviews.push(full_review);
        product.numReviews = product.reviews.length;
        product.rating =
          product.reviews.reduce((a: any, r: any) => r.rating + a, 0) /
          product.reviews.length;
        await product.save();
        await product.populate("reviews.reviewBy");
        revalidateTag("product");

        return JSON.parse(
          JSON.stringify({ reviews: product.reviews.reverse() })
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}

//get product details by its ID:

export async function getProductDetailsById(
  productId: string,
  style: number,
  size: number | string
) {
  try {
    await connectToDatabase();
    const product: any = await Product.findById(productId).lean();
    
    if (!product) {
      console.error("Product not found with ID:", productId);
      return null;
    }

    let discount = product.subProducts[style].discount;
    let priceBefore = product.subProducts[style].sizes[size].price;

    // Correct discount calculation
    let price = discount
      ? priceBefore - (priceBefore * discount) / 100
      : priceBefore;
    
    // Process images to ensure they're in a consistent format
    const images = product.subProducts[style].images.map((img: any) => {
      if (typeof img === 'string') {
        return img;
      }
      if (img && img.url) {
        return img.url;
      }
      return "/placeholder-product.png";
    });

    let data = {
      _id: product._id.toString(),
      style: Number(style),
      name: product.name,
      description: product.description,
      slug: product.slug,
      sku: product.subProducts[style].sku,
      brand: product.brand,
      category: typeof product.category === 'object' ? 
        (product.category._id ? product.category._id.toString() : product.category.toString()) : 
        product.category,
      subCategories: product.subCategories,
      shipping: product.shipping,
      // Use normalized images array
      images: images,
      size: product.subProducts[style].sizes[size].size,
      price: price.toFixed(2),
      priceBefore: priceBefore.toFixed(2),
      vendor: product.vendor,
      vendorId: product.vendorId,
      discount,
      saved: Math.round(priceBefore - price),
      quantity: product.subProducts[style].sizes[size].qty,
    };

    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.log("Error in getProductDetailsById:", error);
    throw new Error(`Failed to get product details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// get related products by subCategory Ids.
export const getRelatedProductsBySubCategoryIds = unstable_cache(
  async (subCategoryIds: string[]) => {
    try {
      await connectToDatabase();
      const query = subCategoryIds.length
        ? {
            subCategories: { $in: subCategoryIds },
          }
        : {};
      let products = await Product.find({ ...query }).limit(12).lean(); // Use lean

      if (!products || products.length === 0) { // Check length
        return {
          success: false,
          products: [],
        };
      }

      // Add the primary image URL and discount
      const productsWithDetails = products.map(p => {
        const { image, discount } = getFirstSubProductInfo(p);
        return {
          ...p,
          image,
          discount, // Add discount here
        };
      });

      return {
        success: true,
        products: JSON.parse(JSON.stringify(productsWithDetails)), // Use updated variable
      };
    } catch (error) {
      handleError(error);
      return { products: [], success: false, message: "Failed to fetch related products." };
    }
  },
  ["subCatgeory_products"],
  {
    revalidate: 1800,
  }
);

// get featured products
export const getAllFeaturedProducts = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const featuredProducts = await Product.find({ featured: true })
        .populate({
          path: "category",
          model: Category,
        })
        .lean(); // Use lean

      if (!featuredProducts || featuredProducts.length === 0) {
        return {
          featuredProducts: [],
          success: false,
          message: "No featured products found.",
        };
      }

      // Add the primary image URL and discount
      const productsWithDetails = featuredProducts.map(p => {
        const { image, discount } = getFirstSubProductInfo(p);
        return {
          ...p,
          image,
          discount, // Add discount here
        };
      });

      return {
        featuredProducts: JSON.parse(JSON.stringify(productsWithDetails)), // Use updated variable
        success: true,
        message: "Successfully fetched all featured products.",
      };
    } catch (error) {
      handleError(error);
      return { featuredProducts: [], success: false, message: "Failed to fetch featured products." };
    }
  },
  ["featured_products"],
  {
    revalidate: 1800,
  }
);

export async function getAllProducts() {
  try {
    await connectToDatabase();

    const products = await Product.find()
      // Removed population as lean() is used and we only need the first image URL
      .sort({ createdAt: -1 })
      .lean(); // Use lean

    if (!products || products.length === 0) {
      return {
        products: [],
        success: false,
        message: "No products found."
      };
    }

    // Add the primary image URL and discount
    const productsWithDetails = products.map(p => {
      const { image, discount } = getFirstSubProductInfo(p);
      return {
        ...p,
        image,
        discount, // Add discount here
        // Keep other necessary transformations if any, but avoid deep population if not needed
      };
    });

    return {
      products: JSON.parse(JSON.stringify(productsWithDetails)), // Use updated variable
      success: true,
      message: "Products fetched successfully"
    };
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    return {
      products: [],
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch products"
    };
  }
}

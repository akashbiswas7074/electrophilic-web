import { connectToDatabase } from "@/lib/database/connect";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { extractProductImage, extractCategoryImage } from "@/lib/utils"; // Import both functions

// Import your Mongoose models - make sure these paths are correct
import CategorySection from "@/lib/database/models/category-section.model";
import Category from "@/lib/database/models/category.model";
import Product from "@/lib/database/models/product.model";

export interface CategorySection {
  _id: string;
  title: string;
  categoryId: string | ObjectId;
  displayOrder: number;
  productLimit: number;
  isActive: boolean;
}

export interface CategorySectionWithDetails extends CategorySection {
  category: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
  products: any[];
}

export async function getAllCategorySections() {
  try {
    await connectToDatabase();
    
    // Get all active category sections ordered by displayOrder using Mongoose
    const sections = await CategorySection.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
    
    if (!sections || sections.length === 0) {
      return {
        success: true,
        sections: [],
        message: "No active category sections found",
      };
    }
    
    // Return success with sections
    return {
      success: true,
      sections,
    };
    
  } catch (error) {
    console.error("Error fetching category sections:", error);
    return {
      success: false,
      message: "Failed to fetch category sections",
    };
  }
}

export async function getCategorySectionsWithProducts() {
  try {
    await connectToDatabase();
    
    // Get all active category sections ordered by displayOrder using Mongoose
    const sections = await CategorySection.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
    
    if (!sections || sections.length === 0) {
      return {
        success: true,
        sections: [],
        message: "No active category sections found",
      };
    }
    
    // Create an array to hold our sections with populated data
    const populatedSections = [];
    
    // Process each section to get its category details and products
    for (const section of sections) {
      try {
        // Get category details
        const category = await Category.findOne({ 
          _id: new mongoose.Types.ObjectId(section.categoryId.toString()) 
        }).lean();
        
        if (!category) {
          console.log(`Category not found for section ${section.title}`);
          continue; // Skip if category doesn't exist
        }
        
        // Find products in this category, limited by productLimit
        // These products should retain their subProducts structure for transformProductSafely
        const productsFromDB = await Product.find({ 
          category: section.categoryId
        })
        // Ensure subProducts are populated if they are separate documents and not automatically populated.
        // If subProducts are embedded, .lean() is sufficient.
        // .populate('subProducts') // Example: uncomment if subProducts are refs
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(section.productLimit || 8)
        .lean();
        
        // console.log(`Found ${productsFromDB.length} products for category ${category.name}`);
        // The detailed mapping that created 'processedProducts' is removed.
        // We will pass productsFromDB directly, allowing transformProductSafely in CategoryProductSection
        // to handle the full transformation, including price, originalPrice, discount from subProducts.
        
        // Add populated section to our results
        populatedSections.push({
          ...section,
          category: {
            _id: category._id.toString(),
            name: category.name,
            slug: category.slug || "",
            image: extractCategoryImage(category) // Use the category image extraction utility
          },
          products: productsFromDB // Pass the products as fetched (lean objects)
        });
        
      } catch (error) {
        console.error(`Error processing section ${section.title}:`, error);
        // Continue with next section
      }
    }
    
    // Return success with populated sections
    return {
      success: true,
      sections: populatedSections,
    };
    
  } catch (error) {
    console.error("Error fetching category sections with products:", error);
    return {
      success: false,
      message: "Failed to fetch category sections with products",
    };
  }
}
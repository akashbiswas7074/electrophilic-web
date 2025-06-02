import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build query based on parameters
    let query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    // Build sort options
    let sortOptions: any = {};
    
    if (sort === "price-asc") {
      sortOptions.price = 1;
    } else if (sort === "price-desc") {
      sortOptions.price = -1;
    } else if (sort === "newest") {
      sortOptions.createdAt = -1;
    } else {
      // Default sort
      sortOptions.createdAt = -1;
    }
    
    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    // Transform products for the response
    const transformedProducts = products.map(product => {
      // CRITICAL FIX: Preserve the featured property as is
      const featuredStatus = product.featured === true;

      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images || [],
        category: product.category,
        brand: product.brand,
        inStock: product.countInStock > 0,
        countInStock: product.countInStock,
        rating: product.rating || 0,
        numReviews: product.numReviews || 0,
        // Make sure to include the featured field exactly as it is in MongoDB
        featured: featuredStatus,
        isFeatured: featuredStatus,
        createdAt: product.createdAt,
      };
    });
    
    return NextResponse.json({ 
      products: transformedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
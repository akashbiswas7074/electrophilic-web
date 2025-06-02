import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get featured products with proper population
    const featuredProducts = await Product.find({ 
      $or: [
        { featured: true },
        { isFeatured: true }
      ]
    })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform products for frontend consumption
    const transformedProducts = featuredProducts.map(product => {
      const firstSubProduct = product.subProducts?.[0];
      const firstImage = firstSubProduct?.images?.[0]?.url || '/placeholder-image.png';
      const price = firstSubProduct?.sizes?.[0]?.price || product.price || 0;
      const originalPrice = firstSubProduct?.originalPrice || product.originalPrice;
      const discount = firstSubProduct?.discount || product.discount || 0;

      return {
        id: product._id,
        name: product.name,
        slug: product.slug,
        image: firstImage,
        price: price,
        originalPrice: originalPrice,
        discount: discount,
        category: product.category?.name || 'Uncategorized',
        categoryId: product.category?._id,
        rating: product.rating || 4.5,
        reviews: product.numReviews || 0,
        isFeatured: true,
        featured: true,
        stock: product.stock,
        sizes: firstSubProduct?.sizes || [],
        colors: product.subProducts?.map((sub: { color: any }) => sub.color) || [],
        description: product.description,
        createdAt: product.createdAt
      };
    });

    const totalFeatured = await Product.countDocuments({ 
      $or: [
        { featured: true },
        { isFeatured: true }
      ]
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        total: totalFeatured,
        page,
        limit,
        totalPages: Math.ceil(totalFeatured / limit)
      }
    });
  } catch (error: any) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}
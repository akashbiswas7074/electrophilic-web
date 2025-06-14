import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Product from '@/lib/database/models/product.model';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const subcategories = searchParams.get('subcategories')?.split(',').filter(Boolean) || [];
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '20000');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const onSale = searchParams.get('onSale') === 'true';
    const featured = searchParams.get('featured') === 'true';

    // Connect to the database
    await connectToDatabase();

    // Build the query filters
    const filter: any = {};
    
    // Price filter - handle both direct price and subProducts price
    if (minPrice > 0 || maxPrice < 20000) {
      filter.$or = [
        { price: { $gte: minPrice, $lte: maxPrice } },
        { 'subProducts.price': { $gte: minPrice, $lte: maxPrice } },
        { 'subProducts.sizes.price': { $gte: minPrice, $lte: maxPrice } }
      ];
    }
    
    if (categories.length > 0) {
      filter.category = { $in: categories };
    }
    
    if (subcategories.length > 0) {
      filter.subCategories = { $in: subcategories };
    }
    
    if (brands.length > 0) {
      filter.brand = { $in: brands };
    }
    
    if (featured) {
      filter.featured = true;
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute the query with Mongoose
    const products = await Product
      .find(filter)
      .populate('category', 'name')
      .populate('subCategories', 'name')
      .populate('vendorId', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Product.countDocuments(filter);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Check if there are more products
    const hasMore = page < totalPages;
    
    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching filtered products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
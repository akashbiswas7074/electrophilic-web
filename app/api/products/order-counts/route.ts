import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Product from '@/lib/database/models/product.model';

/**
 * GET: Fetch order counts for top 5 bestselling products
 * This endpoint will return a mapping of product IDs to their order counts
 * using the 'sold' field directly from the product schema
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find top 5 products with highest sold counts
    const topSellingProducts = await Product.find({ 
      sold: { $exists: true, $gt: 0 }  // Only get products that have sales
    })
    .sort({ sold: -1 }) // Sort by sold count in descending order
    .limit(5) // Get only top 5
    .select('_id sold');

    // Format as a simple ID to count mapping
    const result = topSellingProducts.reduce((acc: Record<string, number>, product: any) => {
      acc[product._id.toString()] = product.sold || 0;
      return acc;
    }, {});

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('[API/PRODUCTS/ORDER-COUNTS GET] Error fetching product sold counts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error fetching product sold counts', error: errorMessage }, { status: 500 });
  }
}
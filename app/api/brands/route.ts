import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import { getAllBrands } from '@/lib/database/actions/brands.actions';
import { handleError } from '@/lib/utils';

/**
 * GET /api/brands
 * Fetches all brands
 */
export async function GET(request: NextRequest) {
  try {
    const brandsResult = await getAllBrands();
    
    if (brandsResult.success) {
      return NextResponse.json({
        success: true,
        brands: brandsResult.brands
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: brandsResult.message || "Failed to fetch brands"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const errorResult = handleError(error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error fetching brands",
        error: errorResult.error 
      },
      { status: 500 }
    );
  }
}
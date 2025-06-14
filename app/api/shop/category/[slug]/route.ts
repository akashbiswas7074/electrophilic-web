import { NextRequest, NextResponse } from 'next/server';
import { getProductsByCategory } from '@/lib/database/actions/product.actions';
import { getCategoryBySlug } from '@/lib/database/actions/categories.actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Category slug is required' },
        { status: 400 }
      );
    }

    // Fetch category details first
    const categoryResponse = await getCategoryBySlug(slug);
    
    if (!categoryResponse?.success || !categoryResponse.category) {
      return NextResponse.json(
        { success: false, error: `Category "${slug}" not found` },
        { status: 404 }
      );
    }

    // Fetch products for this category
    const productsResponse = await getProductsByCategory(categoryResponse.category._id);
    
    if (productsResponse?.success && Array.isArray(productsResponse.products)) {
      return NextResponse.json({
        success: true,
        data: {
          category: categoryResponse.category,
          products: productsResponse.products
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: productsResponse?.message || "No products found in this category"
      });
    }

  } catch (error) {
    console.error('Error fetching category data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category data',
        data: {
          category: null,
          products: []
        }
      },
      { status: 500 }
    );
  }
}
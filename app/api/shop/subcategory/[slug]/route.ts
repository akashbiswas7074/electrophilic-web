import { NextRequest, NextResponse } from 'next/server';
import { getProductsBySubCategory } from '@/lib/database/actions/product.actions';
import { getSubCategoryBySlug, getSubCategoryById } from '@/lib/database/actions/subCategory.actions';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subcategory slug is required',
          data: { subcategory: null, products: [] }
        },
        { status: 400 }
      );
    }

    // Check if slug is a MongoDB ObjectId (24-character hex string)
    const isObjectId = mongoose.Types.ObjectId.isValid(slug) && slug.length === 24;
    
    // Fetch subcategory data (by ID or slug)
    let subcategoryResponse;
    if (isObjectId) {
      // It's an ID, use getSubCategoryById
      subcategoryResponse = await getSubCategoryById(slug);
    } else {
      // It's a slug, use getSubCategoryBySlug
      subcategoryResponse = await getSubCategoryBySlug(slug);
    }

    if (!subcategoryResponse?.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: subcategoryResponse?.message || 'Subcategory not found',
          data: { subcategory: null, products: [] }
        },
        { status: 404 }
      );
    }

    const subcategory = subcategoryResponse.subCategory;
    
    // Fetch products for this subcategory using the subcategory ID
    const productsResponse = await getProductsBySubCategory(subcategory._id);
    
    const products = productsResponse?.success ? productsResponse.products : [];

    return NextResponse.json({
      success: true,
      data: {
        subcategory,
        products,
      }
    });

  } catch (error) {
    console.error('Error fetching subcategory data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subcategory data',
        data: { subcategory: null, products: [] }
      },
      { status: 500 }
    );
  }
}
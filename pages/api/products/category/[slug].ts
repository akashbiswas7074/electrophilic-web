import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database/connectDB';
import Product from '@/lib/database/models/product.model';
import Category from '@/lib/database/models/category.model';
import { serializeData } from '@/lib/utils/serialization';
import { isValidObjectId } from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  try {
    await dbConnect();

    let category;
    
    // Check if the slug is an ObjectId (categoryId) or a slug string
    if (isValidObjectId(slug)) {
      // It's an ObjectId, find by _id
      category = await Category.findById(slug);
    } else {
      // It's a slug, find by slug
      category = await Category.findOne({ slug });
    }
    
    if (!category) {
      // Set proper content-type and return structured error
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ 
        success: false, 
        message: `Category '${slug}' not found`,
        products: [],
        hasMore: false,
        total: 0,
        categoryName: null
      });
    }

    // Get total count for pagination
    const total = await Product.countDocuments({ category: category._id });
    
    // Get products for this category with populated category data
    const products = await Product.find({ category: category._id })
      .populate('category', 'name slug')
      .sort({ sold: -1, createdAt: -1 }) // Sort by sold count first, then by creation date
      .skip(skip)
      .limit(limit);

    // Serialize the data to avoid ObjectId issues
    const serializedProducts = serializeData(products);
    
    return res.status(200).json({
      success: true,
      products: serializedProducts,
      hasMore: skip + products.length < total,
      total,
      categoryName: category.name,
      categorySlug: category.slug,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    // Return a properly structured response even in case of error
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      products: [],
      hasMore: false,
      total: 0,
      categoryName: null
    });
  }
}

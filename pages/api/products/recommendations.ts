import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database/connectDB';
import Product from '@/lib/database/models/product.model';
import { serializeData } from '@/lib/utils/serialization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { productId, type = 'hybrid', limit = 8 } = req.query;
  const limitNum = parseInt(limit as string) || 8;

  if (!productId) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ 
      success: false, 
      message: 'Product ID is required',
      recommendations: []
    });
  }

  try {
    await dbConnect();

    // Get the current product to understand its category and other attributes
    const currentProduct = await Product.findById(productId).populate('category');
    
    if (!currentProduct) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        recommendations: []
      });
    }

    let recommendations: any[] = [];

    switch (type) {
      case 'category':
        // Get products from the same category
        recommendations = await Product.find({
          _id: { $ne: productId },
          category: currentProduct.category?._id
        })
        .populate('category')
        .sort({ sold: -1, createdAt: -1 })
        .limit(limitNum);
        break;

      case 'similar':
        // Get products with similar price range and category
        const priceRange = currentProduct.price * 0.3; // 30% price range
        recommendations = await Product.find({
          _id: { $ne: productId },
          category: currentProduct.category?._id,
          price: {
            $gte: currentProduct.price - priceRange,
            $lte: currentProduct.price + priceRange
          }
        })
        .populate('category')
        .sort({ rating: -1, sold: -1 })
        .limit(limitNum);
        break;

      case 'trending':
        // Get trending products (high sold count, recent)
        recommendations = await Product.find({
          _id: { $ne: productId }
        })
        .populate('category')
        .sort({ sold: -1, rating: -1, createdAt: -1 })
        .limit(limitNum);
        break;

      case 'hybrid':
      default:
        // Hybrid approach: mix of category-based and trending
        const categoryProducts = await Product.find({
          _id: { $ne: productId },
          category: currentProduct.category?._id
        })
        .populate('category')
        .sort({ sold: -1, rating: -1 })
        .limit(Math.ceil(limitNum * 0.7)); // 70% from same category

        const trendingProducts = await Product.find({
          _id: { $ne: productId, $nin: categoryProducts.map(p => p._id) }
        })
        .populate('category')
        .sort({ sold: -1, rating: -1, createdAt: -1 })
        .limit(limitNum - categoryProducts.length); // Fill remaining with trending

        recommendations = [...categoryProducts, ...trendingProducts];
        break;
    }

    // If we don't have enough recommendations, fill with random popular products
    if (recommendations.length < limitNum) {
      const additionalProducts = await Product.find({
        _id: { $ne: productId, $nin: recommendations.map(p => p._id) }
      })
      .populate('category')
      .sort({ sold: -1, rating: -1 })
      .limit(limitNum - recommendations.length);

      recommendations = [...recommendations, ...additionalProducts];
    }

    // Serialize the data to avoid ObjectId issues
    const serializedRecommendations = serializeData(recommendations);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      recommendations: serializedRecommendations,
      total: serializedRecommendations.length,
      type,
      message: `Found ${serializedRecommendations.length} recommendations`
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recommendations',
      recommendations: [],
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
}
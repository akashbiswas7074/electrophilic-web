"use client";
import { useEffect, useState } from 'react';
import { getAllProducts } from '@/lib/database/actions/product.actions';
import { Loader2 } from 'lucide-react';
import ProductCarousel from '../shared/home/ProductCarousel';

export default function BestSellingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const result = await getAllProducts();
        
        if (result.success && result.products) {
          // Sort the products by sold count in descending order
          const sortedProducts = [...result.products].sort((a, b) => {
            // Calculate total sold count for product A
            const aSold = typeof a.sold === 'number' ? a.sold : 0;
            
            // Calculate total sold count for product B
            const bSold = typeof b.sold === 'number' ? b.sold : 0;
            
            return bSold - aSold; // Sort in descending order
          });
          
          setProducts(sortedProducts);
        } else {
          setError(result.message || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  // Transforming product data for ProductCarousel component
  const transformedProducts = products
    .filter(product => {
      // First filter out products that don't have a valid price
      const price = 
        (product.price) || 
        (product.subProducts && product.subProducts[0] && product.subProducts[0].price) ||
        (product.subProducts && product.subProducts[0] && product.subProducts[0].sizes && 
         product.subProducts[0].sizes[0] && product.subProducts[0].sizes[0].price) || 0;
      
      // Get sold count directly from the product
      const soldCount = typeof product.sold === 'number' ? product.sold : 0;
      
      // Include products that have actual sales OR are featured products
      const isProductFeatured = Boolean(
        product.isFeatured || 
        product.featured ||
        (product._doc && (product._doc.featured || product._doc.isFeatured))
      );
      
      return price > 0 && (soldCount > 0 || isProductFeatured);
    })
    .map((product) => {
      // Get sold count directly from the product
      const soldCount = typeof product.sold === 'number' ? product.sold : 0;
      
      // Extract the first image URL
      const image = product.image || '/placeholder.png';
      
      // Get price from various possible locations
      const price = 
        (product.price) || 
        (product.subProducts && product.subProducts[0] && product.subProducts[0].price) ||
        (product.subProducts && product.subProducts[0] && product.subProducts[0].sizes && 
         product.subProducts[0].sizes[0] && product.subProducts[0].sizes[0].price) || 0;
      
      // Get original price for discount calculation
      const originalPrice = 
        (product.originalPrice) || 
        (product.subProducts && product.subProducts[0] && product.subProducts[0].originalPrice) || price;
      
      // Calculate discount
      const discount = product.discount || 
                      (product.subProducts && product.subProducts[0] && product.subProducts[0].discount) || 0;
      
      // Extract category
      const category = typeof product.category === 'object' ? 
                      (product.category?.name || '') : 
                      product.category || '';
      
      // Enhanced featured product detection for the featured bridge
      const isProductFeatured = Boolean(
        product.isFeatured || 
        product.featured ||
        (product._doc && (product._doc.featured || product._doc.isFeatured)) ||
        (typeof product._id !== 'undefined' && (product.featured === true || product.isFeatured === true))
      );
      
      return {
        id: product._id,
        name: product.name,
        price: price,
        originalPrice: originalPrice,
        discount: discount,
        image: image,
        slug: product.slug,
        sold: soldCount,
        // Only show bestseller badge if not featured (featured takes priority)
        isBestseller: !isProductFeatured && soldCount > 0, 
        isFeatured: isProductFeatured,
        featured: isProductFeatured,
        category: category,
        stock: product.stock,
        // Add a custom flag to highlight price for featured products
        highlightPrice: isProductFeatured,
        // Add missing required properties
        rating: product.rating || 0,
        reviews: product.numReviews || 0
      };
    })
    .slice(0, 12);

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </section>
    );
  }

  if (error || transformedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="w-[90%] mx-auto">
        <ProductCarousel 
          heading="Best Selling Products"
          products={transformedProducts}
          viewAllLink="/shop?sort=bestselling"
          showBestseller={true}
          showFeatured={true} // Changed to true to enable featured badges
          autoplay={true}
        />
        
        {/* Sale indicator */}
        <div className="flex justify-center mt-2">
          <div className="bg-gray-100 rounded-lg p-4 inline-flex items-center">
            <span className="text-sm text-gray-600">Products ranked by sales - Updated daily</span>
          </div>
        </div>
      </div>
    </section>
  );
}
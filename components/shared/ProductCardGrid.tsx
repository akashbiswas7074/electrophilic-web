import React from 'react';
import ProductCard from './ProductCard'; // Import the existing ProductCard

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  originalPrice?: number;
  // Add any other props required by ProductCard
}

interface ProductCardGridProps {
  products: Product[];
}

const ProductCardGrid: React.FC<ProductCardGridProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return <p>No products to display.</p>; // Or return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductCardGrid;

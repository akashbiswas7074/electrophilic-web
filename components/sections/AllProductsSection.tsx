'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/shared/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AllProductsSectionProps {
  products: any[];
  title?: string;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onProductClick?: (id: string) => void;
}

const AllProductsSection = ({ 
  products, 
  title = 'All Products',
  sortBy = 'Featured',
  onSortChange,
  isLoading = false,
  error = null,
  onProductClick
}: AllProductsSectionProps) => {
  // If sorting is managed by parent, don't use internal state
  const [internalSortBy, setInternalSortBy] = useState<string>('Featured');
  
  // Use parent's sortBy if provided, otherwise use internal state
  const effectiveSortBy = onSortChange ? sortBy : internalSortBy;

  // Handler for sort changes
  const handleSortChange = (value: string) => {
    if (onSortChange) {
      onSortChange(value);
    } else {
      setInternalSortBy(value);
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (effectiveSortBy) {
      case 'Price: Low to High':
        return a.price - b.price;
      case 'Price: High to Low':
        return b.price - a.price;
      case 'Name: A to Z':
        return a.name.localeCompare(b.name);
      case 'Name: Z to A':
        return b.name.localeCompare(a.name);
      case 'Featured':
      default:
        if (a.isBestseller && !b.isBestseller) return -1;
        if (!a.isBestseller && b.isBestseller) return 1;
        return 0;
    }
  });

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-3 sm:mb-0">{title}</h2>
          
          <div className="w-full sm:w-auto">
            <Select value={effectiveSortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Featured">Featured</SelectItem>
                <SelectItem value="Price: Low to High">Price: Low to High</SelectItem>
                <SelectItem value="Price: High to Low">Price: High to Low</SelectItem>
                <SelectItem value="Name: A to Z">Name: A to Z</SelectItem>
                <SelectItem value="Name: Z to A">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-md aspect-[3/4] mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <motion.div 
                key={product.id} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                onClick={() => onProductClick && onProductClick(product.id)}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AllProductsSection;
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Simple product type
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  slug: string;
}

interface ProductGridProps {
  products: Product[];
  viewMode?: 'grid' | 'list';
  className?: string;
}

const ProductGrid = ({ 
  products = [],
  viewMode = 'grid', 
  className 
}: ProductGridProps) => {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No products found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className={cn(
      viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' 
        : 'space-y-6',
      className
    )}>
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="relative pt-[100%]">
            <Image 
              src={product.image || '/placeholder-product.jpg'} 
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <CardContent className="p-4">
            <Link href={`/products/${product.slug}`} className="hover:underline">
              <h3 className="font-medium line-clamp-2">{product.name}</h3>
            </Link>
            <div className="mt-2">
              <span className="font-bold">₹{product.price.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
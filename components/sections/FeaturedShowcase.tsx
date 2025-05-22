import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

// Define a new interface for Featured Product
interface FeaturedProduct {
  _id: string;
  name: string;
  slug: string; // Or a direct link, depending on your routing
  imageUrl: string; // Assuming a direct image URL for simplicity
  subtitle?: string; // Optional subtitle like "For the Real Ones"
}

interface FeaturedShowcaseProps {
  featuredProducts: FeaturedProduct[];
}

const FeaturedShowcase: React.FC<FeaturedShowcaseProps> = ({ featuredProducts = [] }) => {
  if (!featuredProducts || featuredProducts.length === 0) {
    return null; // Don't render anything if there are no featured products
  }

  return (
    <section className="py-12 bg-white"> {/* Changed background to white as per image */}
      <div className=" w-[90%] mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">Featured</h2> {/* Changed title */}
        {/* Adjusted grid to show 3 items, similar to the screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {featuredProducts.map((product) => (
            <Link href={`/product/${product.slug}`} key={product._id} className="group block">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl rounded-lg"> {/* Added rounded-lg and increased shadow on hover */}
                <CardContent className="p-0 relative">
                  <div className="aspect-[3/4] relative w-full overflow-hidden"> {/* Adjusted aspect ratio to be more portrait */}
                    <Image
                      src={product.imageUrl || '/placeholder-image.png'} // Fallback placeholder
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  {/* Overlay for text and button, positioned at the bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
                    {product.subtitle && (
                      <p className="text-xs text-gray-200">{product.subtitle}</p>
                    )}
                    <h3 className="text-lg font-semibold text-white truncate group-hover:text-gray-100">
                      {product.name}
                    </h3>
                    {/* "Shop" button styled like the image */}
                    <div className="mt-2">
                      <span className="inline-block bg-white text-black text-sm font-medium py-2 px-4 rounded-full hover:bg-gray-200 transition-colors">
                        Shop
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedShowcase;

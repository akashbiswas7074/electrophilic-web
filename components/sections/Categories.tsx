import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoriesProps {
  categories: Category[];
}

const Categories: React.FC<CategoriesProps> = ({ categories = [] }) => {
  return (
    <section className="py-10">
      <div className="container">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link 
              href={`/category/${category.slug}`} 
              key={category.id} 
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 text-center"
            >
              {category.image && (
                <div className="mb-3 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Image 
                      src={category.image || '/placeholder-category.png'}
                      alt={category.name || "Category image"}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
              <h3 className="font-medium">{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;

"use client";

// Import the updated ShopPage component from the root
import dynamic from 'next/dynamic';

// Use dynamic import to avoid hydration issues
const ShopPage = dynamic(() => import('../../shopPage'), { 
  ssr: true,
  loading: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-6"></div>
        <div className="flex flex-wrap gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
});

const ShopRoutePage = () => {
  return (
    <main className="min-h-screen">
      <ShopPage />
    </main>
  );
};

export default ShopRoutePage;

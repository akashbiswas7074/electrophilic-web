import ProductCard from '../shared/ProductCard';

export default function FeaturedProducts() {
  const featuredProducts = [
    {
      id: '1',
      name: 'Air Max 270',
      price: 150,
      image: '/images/shoes/airmax-270.jpg',
      slug: 'air-max-270'
    },
    // ... more products
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Collection</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium footwear, featuring the latest trends and timeless classics.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

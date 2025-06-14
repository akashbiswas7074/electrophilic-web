import { useState, useEffect } from 'react';
import { createBrandFilterLink } from '@/lib/utils';

interface Brand {
  _id: string;
  name: string;
}

interface BrandLink {
  _id: string;
  name: string;
  href: string;
}

export function useBrandLinks() {
  const [brands, setBrands] = useState<BrandLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch brands from the API
        const response = await fetch('/api/brands');
        const data = await response.json();
        
        if (data.success) {
          // Transform brands into BrandLink format with proper URLs
          const brandLinks = data.brands.map((brand: Brand) => ({
            _id: brand._id,
            name: brand.name,
            href: createBrandFilterLink(brand._id, brand.name)
          }));
          
          // Sort brands alphabetically by name
          const sortedBrands = brandLinks.sort((a: BrandLink, b: BrandLink) => 
            a.name.localeCompare(b.name)
          );
          
          setBrands(sortedBrands);
        } else {
          setError(data.message || 'Failed to load brands');
          setBrands([]);
        }
      } catch (err) {
        console.error('Error fetching brands:', err);
        setError('An unexpected error occurred while fetching brands');
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return { brands, loading, error };
}
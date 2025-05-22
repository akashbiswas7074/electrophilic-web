import { useEffect, useState } from 'react';

interface NavbarLink {
  _id: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
}

export function useNavbarLinks() {
  const [links, setLinks] = useState<NavbarLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/navbar-links');
        const data = await response.json();
        
        if (data.success) {
          // Sort links by order field
          const sortedLinks = data.navbarLinks.sort((a: NavbarLink, b: NavbarLink) => a.order - b.order);
          // Only use active links
          const activeLinks = sortedLinks.filter((link: NavbarLink) => link.isActive);
          setLinks(activeLinks);
        } else {
          setError(data.message || 'Failed to load navigation links');
          // Use empty array if there was an error
          setLinks([]);
        }
      } catch (err) {
        console.error('Error fetching navbar links:', err);
        setError('An unexpected error occurred while fetching navigation links');
        // Use empty array if there was an error
        setLinks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  return { links, loading, error };
}
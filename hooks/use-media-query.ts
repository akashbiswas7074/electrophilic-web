import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      setMatches(media.matches);

      // Define listener function to update state
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };

      // Add event listener
      media.addEventListener('change', listener);
      
      // Clean up
      return () => media.removeEventListener('change', listener);
    }
    return undefined;
  }, [query]);

  return matches;
}
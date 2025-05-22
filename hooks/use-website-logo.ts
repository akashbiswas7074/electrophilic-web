"use client";

import { useState, useEffect, useRef } from "react";
import { useSiteConfig } from "./use-site-config";

interface WebsiteLogo {
  _id?: string;
  name: string;
  logoUrl: string;
  altText: string;
  isActive: boolean;
  mobileLogoUrl?: string;
}

interface UseWebsiteLogoResult {
  logo: WebsiteLogo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch the active website logo
 * Falls back to site config if no active logo is found
 */
export function useWebsiteLogo(): UseWebsiteLogoResult {
  const siteConfig = useSiteConfig();
  const fetchInitiated = useRef(false);
  
  // Initialize with fallback logo from the beginning to prevent flicker
  const [logo, setLogo] = useState<WebsiteLogo | null>(() => ({
    name: siteConfig.name,
    logoUrl: siteConfig.logo.imagePath,
    altText: siteConfig.name,
    isActive: true,
  }));
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogo = async () => {
    if (fetchInitiated.current && !isLoading) setIsLoading(true);
    fetchInitiated.current = true;
    setError(null);
    
    try {
      const response = await fetch("/api/website/logo", {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.logo) {
        setLogo(data.logo);
      } else if (data.defaultLogo) {
        setLogo(data.defaultLogo);
      }
    } catch (err: any) {
      console.error("Error fetching website logo:", err);
      setError(`Error: ${err.message}`);
      // We keep using the fallback logo that was set in useState
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip if we've already initiated a fetch
    if (fetchInitiated.current) return;
    
    fetchLogo();
  }, []);

  return { logo, isLoading, error, refetch: fetchLogo };
}

export default useWebsiteLogo;
"use client";

import { useEffect, useState, useRef } from "react";
import { siteConfig } from "@/lib/site-config";

export interface WebsiteFooter {
  _id?: string;
  name?: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
  companyLinks?: Array<{
    title: string;
    url: string;
  }>;
  shopLinks?: Array<{
    title: string;
    url: string;
  }>;
  helpLinks?: Array<{
    title: string;
    url: string;
  }>;
  copyrightText?: string;
  isActive?: boolean;
}

interface UseWebsiteFooterResult {
  footer: WebsiteFooter;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWebsiteFooter(): UseWebsiteFooterResult {
  const [footer, setFooter] = useState<WebsiteFooter>({
    contactInfo: {
      email: siteConfig.contact.email,
      phone: siteConfig.contact.phone,
      address: siteConfig.contact.address,
    },
    socialMedia: {
      facebook: siteConfig.social?.facebook || "",
      twitter: siteConfig.social?.twitter || "",
      instagram: siteConfig.social?.instagram || "",
      youtube: siteConfig.social?.youtube || "",
      linkedin: "",
    },
    copyrightText: `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInitiated = useRef(false);

  const fetchFooter = async () => {
    if (fetchInitiated.current && !isLoading) setIsLoading(true);
    fetchInitiated.current = true;
    setError(null);

    try {
      const response = await fetch("/api/website/footer", {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.footer) {
        setFooter(data.footer);
      } else {
        console.warn("No footer data found, using default values");
      }
    } catch (err: any) {
      console.error("Error fetching footer data:", err);
      setError("Failed to load footer data");
      // Continue using the default footer set in useState
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip if we've already initiated a fetch
    if (fetchInitiated.current) return;

    fetchFooter();
  }, []);

  return { footer, isLoading, error, refetch: fetchFooter };
}
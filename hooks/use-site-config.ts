import { siteConfig } from '@/lib/config';

/**
 * Hook to access site-wide configuration settings
 * Can be used across components for consistent branding
 */
export const useSiteConfig = () => {
  // This hook can be extended to fetch from an API or database in the future
  return {
    ...siteConfig
  };
};

export default useSiteConfig;
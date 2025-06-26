import { Metadata } from 'next';
import { getActiveWebsiteSettings } from './database/actions/website.settings.actions';

interface GenerateMetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  type?: 'website' | 'article';
}

export async function generateDynamicMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  noIndex = false,
  noFollow = false,
  type = 'website'
}: GenerateMetadataProps = {}): Promise<Metadata> {
  try {
    const result = await getActiveWebsiteSettings();
    const settings = result.success ? result.settings : null;

    // Fallback settings if none found
    const defaultSettings = {
      siteName: "Electrophilic",
      siteDescription: "Welcome to Electrophilic.in – Where Innovation Begins!",
      siteKeywords: ["electronics", "components", "microcontrollers"],
      defaultTitle: "Electrophilic - Electronics Components Store",
      titleSeparator: " | ",
      ogType: "website",
      twitterCard: "summary_large_image" as const,
      robots: "index, follow",
    };

    const activeSettings = settings || defaultSettings;

    // Generate final values
    const finalTitle = title 
      ? `${title}${activeSettings.titleSeparator}${activeSettings.siteName}`
      : activeSettings.defaultTitle || activeSettings.siteName;

    const finalDescription = description || activeSettings.siteDescription;
    const finalKeywords = [...keywords, ...(activeSettings.siteKeywords || [])];

    // Generate robots directive
    const robots = noIndex || noFollow 
      ? `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`
      : activeSettings.robots;

    // Ensure ogType is valid for Next.js OpenGraph
    const validOgType = type || (activeSettings.ogType === 'product' ? 'website' : activeSettings.ogType) || 'website';

    const metadata: Metadata = {
      title: finalTitle,
      description: finalDescription,
      keywords: finalKeywords.join(', '),
      authors: activeSettings.author ? [{ name: activeSettings.author }] : undefined,
      robots,
      
      // Open Graph
      openGraph: {
        title: title || activeSettings.ogTitle || finalTitle,
        description: description || activeSettings.ogDescription || finalDescription,
        type: validOgType as 'website' | 'article',
        siteName: activeSettings.siteName,
        images: image || activeSettings.ogImage ? [{
          url: image || activeSettings.ogImage!,
          alt: title || activeSettings.siteName
        }] : undefined,
        url: url,
      },

      // Twitter
      twitter: {
        card: activeSettings.twitterCard as any,
        title: title || activeSettings.twitterTitle || finalTitle,
        description: description || activeSettings.twitterDescription || finalDescription,
        images: image || activeSettings.twitterImage ? [image || activeSettings.twitterImage!] : undefined,
        site: activeSettings.twitterSite,
        creator: activeSettings.twitterCreator,
      },

      // Icons
      icons: {
        icon: [
          ...(activeSettings.favicon ? [{ url: activeSettings.favicon }] : []),
          ...(activeSettings.favicon16 ? [{ url: activeSettings.favicon16, sizes: '16x16', type: 'image/png' }] : []),
          ...(activeSettings.favicon32 ? [{ url: activeSettings.favicon32, sizes: '32x32', type: 'image/png' }] : []),
        ],
        apple: activeSettings.appleTouchIcon ? [{ url: activeSettings.appleTouchIcon }] : undefined,
        other: [
          ...(activeSettings.androidChrome192 ? [{ url: activeSettings.androidChrome192, sizes: '192x192', type: 'image/png' }] : []),
          ...(activeSettings.androidChrome512 ? [{ url: activeSettings.androidChrome512, sizes: '512x512', type: 'image/png' }] : []),
        ]
      },

      // Other meta
      other: {
        ...(activeSettings.msTileColor ? { 'msapplication-TileColor': activeSettings.msTileColor } : {}),
        ...(activeSettings.themeColor ? { 'theme-color': activeSettings.themeColor } : {}),
      },

      // Canonical URL
      alternates: url ? { canonical: url } : undefined,
    };

    return metadata;

  } catch (error) {
    console.error('Error generating dynamic metadata:', error);
    
    // Return fallback metadata
    return {
      title: title ? `${title} | Electrophilic` : "Electrophilic - Electronics Components Store",
      description: description || "Welcome to Electrophilic.in – Where Innovation Begins!",
    };
  }
}

// Convenience function for common page types
export async function generatePageMetadata(
  pageTitle: string,
  pageDescription?: string,
  options?: Omit<GenerateMetadataProps, 'title' | 'description'>
) {
  return generateDynamicMetadata({
    title: pageTitle,
    description: pageDescription,
    ...options
  });
}

// Convenience function for product pages
export async function generateProductMetadata(
  productName: string,
  productDescription: string,
  productImage?: string,
  productUrl?: string
) {
  return generateDynamicMetadata({
    title: productName,
    description: productDescription,
    image: productImage,
    url: productUrl,
    type: 'website', // Use 'website' instead of 'product' for Next.js compatibility
    keywords: ['electronics', 'components', 'buy online']
  });
}
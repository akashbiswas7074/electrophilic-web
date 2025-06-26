"use client";

import { useEffect, useState } from 'react';
import Head from 'next/head';

interface WebsiteSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string[];
  defaultTitle: string;
  titleSeparator: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard: string;
  twitterSite?: string;
  twitterCreator?: string;
  favicon?: string;
  favicon16?: string;
  favicon32?: string;
  appleTouchIcon?: string;
  androidChrome192?: string;
  androidChrome512?: string;
  safariPinnedTab?: string;
  msTileColor: string;
  themeColor: string;
  author?: string;
  robots: string;
  canonical?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationType: string;
}

interface DynamicHeadProps {
  pageTitle?: string;
  pageDescription?: string;
  pageKeywords?: string[];
  pageImage?: string;
  pageUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  children?: React.ReactNode;
}

export default function DynamicHead({
  pageTitle,
  pageDescription,
  pageKeywords = [],
  pageImage,
  pageUrl,
  noIndex = false,
  noFollow = false,
  children
}: DynamicHeadProps) {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/website/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to fetch website settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading || !settings) {
    return null; // Or return a minimal head with defaults
  }

  // Generate dynamic title
  const finalTitle = pageTitle 
    ? `${pageTitle}${settings.titleSeparator}${settings.siteName}`
    : settings.defaultTitle || settings.siteName;

  // Generate dynamic description
  const finalDescription = pageDescription || settings.siteDescription;

  // Generate dynamic keywords
  const finalKeywords = [...(pageKeywords || []), ...(settings.siteKeywords || [])];

  // Generate dynamic OG data
  const ogTitle = pageTitle || settings.ogTitle || settings.defaultTitle;
  const ogDescription = pageDescription || settings.ogDescription || settings.siteDescription;
  const ogImage = pageImage || settings.ogImage;

  // Generate dynamic Twitter data
  const twitterTitle = pageTitle || settings.twitterTitle || settings.defaultTitle;
  const twitterDescription = pageDescription || settings.twitterDescription || settings.siteDescription;
  const twitterImage = pageImage || settings.twitterImage || settings.ogImage;

  // Generate robots directive
  const robotsContent = noIndex || noFollow 
    ? `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`
    : settings.robots;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {finalKeywords.length > 0 && (
        <meta name="keywords" content={finalKeywords.join(', ')} />
      )}
      {settings.author && <meta name="author" content={settings.author} />}
      <meta name="robots" content={robotsContent} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Canonical URL */}
      {(pageUrl || settings.canonical) && (
        <link rel="canonical" href={pageUrl || settings.canonical} />
      )}

      {/* Favicons */}
      {settings.favicon && <link rel="icon" href={settings.favicon} />}
      {settings.favicon16 && <link rel="icon" type="image/png" sizes="16x16" href={settings.favicon16} />}
      {settings.favicon32 && <link rel="icon" type="image/png" sizes="32x32" href={settings.favicon32} />}
      {settings.appleTouchIcon && <link rel="apple-touch-icon" href={settings.appleTouchIcon} />}
      {settings.androidChrome192 && <link rel="icon" type="image/png" sizes="192x192" href={settings.androidChrome192} />}
      {settings.androidChrome512 && <link rel="icon" type="image/png" sizes="512x512" href={settings.androidChrome512} />}
      {settings.safariPinnedTab && <link rel="mask-icon" href={settings.safariPinnedTab} color={settings.themeColor} />}
      
      {/* Theme Colors */}
      <meta name="msapplication-TileColor" content={settings.msTileColor} />
      <meta name="theme-color" content={settings.themeColor} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:type" content={settings.ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:site_name" content={settings.siteName} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={settings.twitterCard} />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}
      {settings.twitterSite && <meta name="twitter:site" content={settings.twitterSite} />}
      {settings.twitterCreator && <meta name="twitter:creator" content={settings.twitterCreator} />}

      {/* Organization Schema.org JSON-LD */}
      {settings.organizationName && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": settings.organizationType,
              name: settings.organizationName,
              url: settings.organizationUrl,
              logo: settings.organizationLogo,
              description: settings.siteDescription,
            })
          }}
        />
      )}

      {/* Analytics Scripts */}
      {settings.googleAnalyticsId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}');
              `
            }}
          />
        </>
      )}

      {settings.googleTagManagerId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${settings.googleTagManagerId}');
            `
          }}
        />
      )}

      {settings.facebookPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${settings.facebookPixelId}');
              fbq('track', 'PageView');
            `
          }}
        />
      )}

      {/* Custom children */}
      {children}
    </Head>
  );
}
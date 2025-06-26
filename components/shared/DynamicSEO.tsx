"use client";

import { useEffect, useState } from 'react';
import Head from 'next/head';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  author?: string;
  robots?: string;
}

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
  msTileColor?: string;
  themeColor?: string;
  author?: string;
  robots?: string;
  canonical?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationType: string;
}

interface DynamicSEOProps {
  pageTitle?: string;
  pageDescription?: string;
  pageKeywords?: string[];
  pageImage?: string;
  pageUrl?: string;
  pageType?: 'website' | 'article' | 'product' | 'profile';
  noIndex?: boolean;
  noFollow?: boolean;
  children?: React.ReactNode;
}

export default function DynamicSEO({
  pageTitle,
  pageDescription,
  pageKeywords = [],
  pageImage,
  pageUrl,
  pageType = 'website',
  noIndex = false,
  noFollow = false,
  children
}: DynamicSEOProps) {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebsiteSettings();
  }, []);

  const fetchWebsiteSettings = async () => {
    try {
      const response = await fetch('/api/website-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch website settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings) {
    return null;
  }

  // Build title
  const title = pageTitle 
    ? `${pageTitle}${settings.titleSeparator}${settings.siteName}`
    : settings.defaultTitle || settings.siteName;

  // Build description
  const description = pageDescription || settings.siteDescription;

  // Build keywords
  const keywords = [...settings.siteKeywords, ...pageKeywords].join(', ');

  // Build robots
  let robots = settings.robots || 'index, follow';
  if (noIndex || noFollow) {
    const robotsArray = [];
    robotsArray.push(noIndex ? 'noindex' : 'index');
    robotsArray.push(noFollow ? 'nofollow' : 'follow');
    robots = robotsArray.join(', ');
  }

  // Build Open Graph data
  const ogTitle = settings.ogTitle || pageTitle || settings.defaultTitle;
  const ogDescription = settings.ogDescription || description;
  const ogImage = pageImage || settings.ogImage;
  const ogType = pageType === 'website' ? settings.ogType : pageType;

  // Build Twitter data
  const twitterTitle = settings.twitterTitle || ogTitle;
  const twitterDescription = settings.twitterDescription || ogDescription;
  const twitterImage = settings.twitterImage || ogImage;

  // Build canonical URL
  const canonical = pageUrl || settings.canonical || (typeof window !== 'undefined' ? window.location.href : '');

  // Build structured data for organization
  const organizationSchema = settings.organizationName ? {
    "@context": "https://schema.org",
    "@type": settings.organizationType,
    "name": settings.organizationName,
    "url": settings.organizationUrl,
    "logo": settings.organizationLogo,
  } : null;

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        {settings.author && <meta name="author" content={settings.author} />}
        <meta name="robots" content={robots} />
        {canonical && <link rel="canonical" href={canonical} />}

        {/* Favicons */}
        {settings.favicon && <link rel="icon" href={settings.favicon} />}
        {settings.favicon16 && <link rel="icon" type="image/png" sizes="16x16" href={settings.favicon16} />}
        {settings.favicon32 && <link rel="icon" type="image/png" sizes="32x32" href={settings.favicon32} />}
        {settings.appleTouchIcon && <link rel="apple-touch-icon" sizes="180x180" href={settings.appleTouchIcon} />}
        {settings.androidChrome192 && <link rel="icon" type="image/png" sizes="192x192" href={settings.androidChrome192} />}
        {settings.androidChrome512 && <link rel="icon" type="image/png" sizes="512x512" href={settings.androidChrome512} />}
        {settings.safariPinnedTab && <link rel="mask-icon" href={settings.safariPinnedTab} color="#5bbad5" />}
        {settings.msTileColor && <meta name="msapplication-TileColor" content={settings.msTileColor} />}
        {settings.themeColor && <meta name="theme-color" content={settings.themeColor} />}

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content={ogType} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {canonical && <meta property="og:url" content={canonical} />}
        <meta property="og:site_name" content={settings.siteName} />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content={settings.twitterCard} />
        <meta name="twitter:title" content={twitterTitle} />
        <meta name="twitter:description" content={twitterDescription} />
        {twitterImage && <meta name="twitter:image" content={twitterImage} />}
        {settings.twitterSite && <meta name="twitter:site" content={settings.twitterSite} />}
        {settings.twitterCreator && <meta name="twitter:creator" content={settings.twitterCreator} />}

        {/* Viewport and other essential meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />

        {/* Structured Data */}
        {organizationSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema)
            }}
          />
        )}

        {/* Google Analytics */}
        {settings.googleAnalyticsId && settings.googleAnalyticsId.startsWith('G-') && (
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

        {/* Universal Analytics (Legacy) */}
        {settings.googleAnalyticsId && settings.googleAnalyticsId.startsWith('UA-') && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
                ga('create', '${settings.googleAnalyticsId}', 'auto');
                ga('send', 'pageview');
              `
            }}
          />
        )}

        {/* Google Tag Manager */}
        {settings.googleTagManagerId && (
          <>
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
          </>
        )}

        {/* Facebook Pixel */}
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
      </Head>

      {/* Google Tag Manager (noscript) */}
      {settings.googleTagManagerId && (
        <noscript>
          <iframe 
            src={`https://www.googletagmanager.com/ns.html?id=${settings.googleTagManagerId}`}
            height="0" 
            width="0" 
            style={{display: 'none', visibility: 'hidden'}}
          />
        </noscript>
      )}

      {/* Facebook Pixel (noscript) */}
      {settings.facebookPixelId && (
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src={`https://www.facebook.com/tr?id=${settings.facebookPixelId}&ev=PageView&noscript=1`}
          />
        </noscript>
      )}

      {children}
    </>
  );
}
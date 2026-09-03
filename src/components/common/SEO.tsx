import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
  noIndex?: boolean;
}

const BASE_URL = 'https://myalphabag.com';
const DEFAULT_TITLE = 'AlphaBAG | Professional Crypto Intelligence';
const DEFAULT_DESC = 'AlphaBAG is a crypto intelligence platform for multi-chain portfolio tracking, whale movement alerts, AI market analysis, and leverage simulation.';
const DEFAULT_KEYWORDS = 'crypto portfolio tracker, whale tracker, AI crypto analysis, multi-chain dashboard, leverage calculator, web3 analytics, alpha passes';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  structuredData,
  noIndex = false,
}) => {
  const fullCanonicalUrl = canonicalUrl
    ? canonicalUrl.startsWith('http')
      ? canonicalUrl
      : `${BASE_URL}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`
    : BASE_URL;

  const fullOgImage = ogImage.startsWith('http')
    ? ogImage
    : `${BASE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonicalUrl} />

      <meta
        name="robots"
        content={
          noIndex
            ? 'noindex, nofollow, noarchive, nosnippet'
            : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="AlphaBAG" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData)
              ? {
                  '@context': 'https://schema.org',
                  '@graph': structuredData.map((item) => {
                    const { '@context': _, ...rest } = item;
                    return rest;
                  }),
                }
              : structuredData
          )}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

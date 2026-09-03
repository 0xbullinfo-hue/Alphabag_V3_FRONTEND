const BASE_URL = 'https://myalphabag.com';

export interface BreadcrumbItem {
  name: string;
  path?: string;
}

export const buildBreadcrumbs = (crumbs: BreadcrumbItem[], baseUrl = BASE_URL) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    ...(crumb.path ? { item: `${baseUrl}${crumb.path.startsWith('/') ? '' : '/'}${crumb.path}` } : {}),
  })),
});

export const buildFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const buildProductSchema = (product: {
  name: string;
  description: string;
  price: string | number;
  currency?: string;
  url?: string;
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image || `${BASE_URL}/og-image.png`,
  brand: {
    '@type': 'Brand',
    name: 'AlphaBAG',
  },
  offers: {
    '@type': 'Offer',
    price: product.price.toString(),
    priceCurrency: product.currency || 'BAG',
    availability: 'https://schema.org/InStock',
    url: product.url ? `${BASE_URL}${product.url}` : `${BASE_URL}/alpha-passes`,
  },
});

export const buildWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AlphaBAG',
  url: BASE_URL,
  description:
    'AlphaBAG is a crypto intelligence platform for multi-chain portfolio tracking, whale movement alerts, AI market analysis, and leverage simulation.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/markets?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const buildOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AlphaBAG',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: ['https://x.com/myalphabag', 'https://t.me/alphabag_access'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'support',
    url: 'https://t.me/alphabag_access',
  },
});

export const buildSoftwareAppSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AlphaBAG',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  url: BASE_URL,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Beta access and public tools',
  },
  featureList: [
    'Multi-chain portfolio tracking',
    'Whale wallet movement alerts',
    'AI market intelligence and analysis',
    'Leverage and PnL simulation calculator',
    'AlphaBAG Genesis Pass NFT ecosystem',
  ],
});

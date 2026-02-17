/**
 * SEO Helpers for structured data and meta information
 * Now supports dynamic company configuration from database
 */

import { CompanyConfig } from '@/contexts/CompanyConfigContext';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

// Default site config - used as fallback if company config is not available
const DEFAULT_SITE_CONFIG = {
  siteName: '&gt;&gt; Medical Supplies',
  url: 'https://medplusafrica.com',
  logo: 'https://medplusafrica.com/assets/medplus-logo.webp',
  description: 'Trusted distributor of critical care supplies, hospital consumables, and furniture across Africa.',
  email: 'info@medplusafrica.com',
  phone: '+254 741 207 690',
  address: 'P.O. Box 85988-00200, Nairobi, Eastern Bypass, Membley',
};

/**
 * Create SITE_CONFIG from company configuration
 * Used to generate SEO metadata and structured data
 */
export function createSiteConfig(companyConfig: CompanyConfig | null) {
  if (!companyConfig) {
    return DEFAULT_SITE_CONFIG;
  }

  return {
    siteName: companyConfig.name || DEFAULT_SITE_CONFIG.siteName,
    url: `https://${companyConfig.name?.toLowerCase().replace(/\s+/g, '')}` || DEFAULT_SITE_CONFIG.url,
    logo: companyConfig.logo_url || DEFAULT_SITE_CONFIG.logo,
    description: companyConfig.description || DEFAULT_SITE_CONFIG.description,
    email: companyConfig.email || DEFAULT_SITE_CONFIG.email,
    phone: companyConfig.phone || DEFAULT_SITE_CONFIG.phone,
    address: companyConfig.address || DEFAULT_SITE_CONFIG.address,
  };
}

// Export default for backward compatibility
export const SITE_CONFIG = DEFAULT_SITE_CONFIG;

/**
 * Generate structured data for Organization
 */
export const generateOrganizationSchema = (companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.siteName,
    url: config.url,
    logo: config.logo,
    description: config.description,
    email: config.email,
    telephone: config.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address,
      addressCountry: 'KE',
    },
    sameAs: [
      'https://www.facebook.com/medplusafrica',
      'https://www.instagram.com/medplusafrica',
    ],
  };
};

/**
 * Generate structured data for WebPage
 */
export const generateWebPageSchema = (metadata: SEOMetadata, companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: metadata.title,
    description: metadata.description,
    url: metadata.url || config.url,
    image: metadata.image || config.logo,
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      logo: {
        '@type': 'ImageObject',
        url: config.logo,
      },
    },
  };
};

/**
 * Generate structured data for Product
 */
export const generateProductSchema = (product: {
  name: string;
  description: string;
  image?: string;
  url?: string;
  category?: string;
  price?: number;
}, companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || config.logo,
    url: product.url,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: config.siteName,
    },
    offers: {
      '@type': 'AggregateOffer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'KES',
      ...(product.price && { highPrice: product.price.toString() }),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
    },
  };
};

/**
 * Generate structured data for LocalBusiness
 */
export const generateLocalBusinessSchema = (companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: config.siteName,
    description: config.description,
    url: config.url,
    logo: config.logo,
    telephone: config.phone,
    email: config.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address,
      addressCountry: 'KE',
    },
    areaServed: {
      '@type': 'Region',
      name: 'East Africa',
    },
  };
};

/**
 * Generate breadcrumb schema
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>, companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${config.url}${item.url}`,
    })),
  };
};

/**
 * Use breadcrumb schema and add to page
 */
export const useBreadcrumbSchema = (items: Array<{ name: string; url: string }>, companyConfig?: CompanyConfig | null) => {
  addStructuredData(generateBreadcrumbSchema(items, companyConfig));
};

/**
 * Generate structured data for Product Collection/Listing
 */
export const generateCollectionSchema = (products: Array<{
  name: string;
  description: string;
  image?: string;
  url?: string;
  price?: number;
}>, companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Product Collection',
    description: 'Collection of medical products and equipment',
    url: `${config.url}/products`,
    mainEntity: products.map((product) => ({
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image || config.logo,
      url: product.url || `${config.url}/products`,
      brand: {
        '@type': 'Brand',
        name: config.siteName,
      },
      offers: {
        '@type': 'AggregateOffer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'KES',
        ...(product.price && { highPrice: product.price.toString() }),
      },
    })),
  };
};

/**
 * Generate Contact Page schema
 */
export const generateContactPageSchema = (companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${config.siteName}`,
    description: `Get in touch with ${config.siteName} for inquiries and support regarding medical supplies and hospital equipment.`,
    url: `${config.url}/contact`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: config.phone,
      contactType: 'Customer Service',
      email: config.email,
      areaServed: 'East Africa',
    },
  };
};

/**
 * Generate FAQ schema
 */
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>, companyConfig?: CompanyConfig | null) => ({
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

/**
 * Update document meta tags
 */
export const updateMetaTags = (metadata: SEOMetadata, companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);

  // Title
  document.title = `${metadata.title} | ${config.siteName}`;

  // Meta tags
  updateOrCreateMetaTag('name', 'description', metadata.description);
  updateOrCreateMetaTag('name', 'keywords', metadata.keywords || '');

  // Open Graph
  updateOrCreateMetaTag('property', 'og:title', `${metadata.title}`);
  updateOrCreateMetaTag('property', 'og:description', metadata.description);
  updateOrCreateMetaTag('property', 'og:url', metadata.url || config.url);
  updateOrCreateMetaTag('property', 'og:image', metadata.image || config.logo);
  updateOrCreateMetaTag('property', 'og:type', metadata.type || 'website');

  // Twitter
  updateOrCreateMetaTag('name', 'twitter:title', metadata.title);
  updateOrCreateMetaTag('name', 'twitter:description', metadata.description);
  updateOrCreateMetaTag('name', 'twitter:image', metadata.image || config.logo);

  // Canonical
  updateOrCreateCanonical(metadata.url || config.url);
};

/**
 * Helper to update or create meta tags
 */
const updateOrCreateMetaTag = (type: 'name' | 'property', attribute: string, content: string) => {
  let tag = document.querySelector(`meta[${type}="${attribute}"]`) as HTMLMetaElement;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(type, attribute);
    document.head.appendChild(tag);
  }
  tag.content = content;
};

/**
 * Helper to update or create canonical link
 */
const updateOrCreateCanonical = (url: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
};

/**
 * Add structured data script to head
 */
export const addStructuredData = (schema: any) => {
  let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
};

/**
 * Update favicon and apple-touch-icon dynamically
 * Should be called when company config is loaded
 */
export const updateFavicon = (logoUrl?: string, companyConfig?: CompanyConfig | null) => {
  const config = createSiteConfig(companyConfig || null);
  const faviconUrl = logoUrl || config.logo;

  if (!faviconUrl) return;

  // Update favicon link
  let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    faviconLink.type = 'image/webp';
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = faviconUrl;

  // Update apple-touch-icon link
  let appleTouchLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
  if (!appleTouchLink) {
    appleTouchLink = document.createElement('link');
    appleTouchLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchLink);
  }
  appleTouchLink.href = faviconUrl;
};

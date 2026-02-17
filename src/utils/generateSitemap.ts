/**
 * Generates XML sitemap for SEO
 * Run this during build or deploy to create public/sitemap.xml
 */

const SITE_URL = 'https://medplusafrica.com';
const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about-us', priority: 0.9, changefreq: 'monthly' },
  { path: '/products', priority: 0.9, changefreq: 'weekly' },
  { path: '/contact', priority: 0.8, changefreq: 'monthly' },
  { path: '/media', priority: 0.7, changefreq: 'weekly' },
  { path: '/offers', priority: 0.8, changefreq: 'weekly' },
];

interface SitemapEntry {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
}

/**
 * Generates XML sitemap content
 */
export const generateSitemapXML = (dynamicRoutes: SitemapEntry[] = []): string => {
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];
  const lastmod = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  allRoutes.forEach((route) => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${route.lastmod || lastmod}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return xml;
};

/**
 * Generates a sitemap index for large sites with multiple sitemaps
 */
export const generateSitemapIndex = (sitemapUrls: string[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  sitemapUrls.forEach((url) => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });

  xml += '</sitemapindex>';

  return xml;
};

/**
 * Gets dynamic product routes for sitemap
 */
export const getProductRoutes = (categories: Array<{ slug: string; updatedAt?: string }>): SitemapEntry[] => {
  return categories.map((cat) => ({
    path: `/products/${cat.slug}`,
    priority: 0.8,
    changefreq: 'weekly' as const,
    lastmod: cat.updatedAt,
  }));
};

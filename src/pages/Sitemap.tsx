import { useEffect } from 'react';
import { generateSitemapXML, getProductRoutes } from '@/utils/generateSitemap';
import { useWebCategories } from '@/hooks/useWebCategories';

export default function Sitemap() {
  const { categories } = useWebCategories();

  useEffect(() => {
    // Generate sitemap with dynamic product routes
    const dynamicRoutes = getProductRoutes(
      categories.map((cat) => ({
        slug: cat.slug,
        updatedAt: new Date().toISOString().split('T')[0],
      }))
    );

    const sitemapXML = generateSitemapXML(dynamicRoutes);

    // Create a blob with proper XML content type and trigger download
    const blob = new Blob([sitemapXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';

    // Trigger the download by simulating a click
    link.click();

    // Clean up the object URL to prevent memory leaks
    URL.revokeObjectURL(url);
  }, [categories]);

  return null;
}

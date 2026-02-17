import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { generateBreadcrumbSchema, addStructuredData, SITE_CONFIG } from '@/utils/seoHelpers';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className = '' }: BreadcrumbNavProps) {
  useEffect(() => {
    // Generate and add breadcrumb schema
    const breadcrumbItems = [
      { name: 'Home', url: `${SITE_CONFIG.url}/` },
      ...items.map(item => ({
        name: item.label,
        url: `${SITE_CONFIG.url}${item.href}`,
      })),
    ];
    addStructuredData(generateBreadcrumbSchema(breadcrumbItems));
  }, [items]);

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`bg-gray-50 border-b border-gray-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <li>
            <Link 
              to="/" 
              className="hover:text-primary transition-colors"
            >
              Home
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-2">
              <span>/</span>
              {index === items.length - 1 ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link 
                  to={item.href}
                  className="hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

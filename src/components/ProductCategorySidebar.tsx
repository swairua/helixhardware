import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useWebCategories } from '@/hooks/useWebCategories';

interface ProductCategory {
  name: string;
}

interface ProductCategorySidebarProps {
  categories?: ProductCategory[];
  activeCategory?: string;
}

// Helper function to convert category name to slug
const getCategorySlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export default function ProductCategorySidebar({
  categories: providedCategories,
  activeCategory,
}: ProductCategorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { categories: dynamicCategories } = useWebCategories();

  // Use provided categories or fall back to dynamic categories
  const categories = providedCategories || dynamicCategories.map((cat) => ({ name: cat.name }));

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full mb-6 px-4 py-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:border-primary transition-colors"
      >
        <span className="font-semibold text-gray-900">Product Categories</span>
        <ChevronDown
          size={20}
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'block' : 'hidden'
        } md:block md:sticky md:top-24 w-full md:w-64 flex-shrink-0 mb-8 md:mb-0`}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {/* Sidebar Header */}
          <div className="hidden md:block px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <h3 className="font-bold text-gray-900 text-lg">Product Categories</h3>
          </div>

          {/* Categories List */}
          <nav className="divide-y divide-gray-100 md:max-h-96 md:overflow-y-auto">
            {categories.map((category) => {
              const isActive = activeCategory === category.name;
              const slug = getCategorySlug(category.name);
              return (
                <Link
                  key={category.name}
                  to={`/products/${slug}`}
                  onClick={() => setIsOpen(false)}
                  className={`block px-6 py-4 transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-orange-50 text-primary font-semibold border-l-4 border-primary'
                      : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-primary/50'
                  }`}
                >
                  {/* Left colored bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                  {/* Category Text */}
                  <span className={isActive ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Contact CTA */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg shadow-md text-center hidden md:block">
          <p className="text-sm font-semibold mb-3">Need Help?</p>
          <Link
            to="/contact"
            className="inline-block w-full bg-white text-primary font-bold py-2 px-4 rounded hover:bg-gray-100 transition-colors text-sm"
          >
            Contact Us
          </Link>
        </div>
      </aside>
    </>
  );
}

import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { getProductBySlug } from '@/data/products';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';

interface ProductCategory {
  name?: string;
  icon?: string;
  description?: string;
  slug?: string;
}

interface PublicFooterProps {
  productCategories?: (ProductCategory | string)[];
}

export const PublicFooter = ({ productCategories = [] }: PublicFooterProps) => {
  const company = useCompanyConfig();
  const getCategoryName = (category: ProductCategory | string): string => {
    return typeof category === 'string' ? category : category.name || '';
  };

  const getProductSlug = (category: string) => {
    const product = getProductBySlug(category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    return product?.slug || category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <footer className="bg-gray-900 text-white py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-blue-500 to-green-500"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {productCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12 pb-8 sm:pb-12 border-b border-gray-700">
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Products
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                {productCategories.slice(0, 5).map((cat) => {
                  const catName = getCategoryName(cat);
                  return (
                    <li key={catName}>
                      <Link
                        to={`/products/${getProductSlug(catName)}`}
                        className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-block py-1"
                      >
                        {catName}
                      </Link>
                    </li>
                  );
                })}
                <li className="pt-2">
                  <Link
                    to="/products"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 py-1"
                  >
                    View More →
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Contact Us
              </h3>
              <address className="text-gray-300 space-y-3 text-sm not-italic">
                <div>
                  <p className="font-semibold">{company.name}</p>
                  <p>{company.address}</p>
                  <p>{company.city}, {company.country}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Phone:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <a href={`tel:${company.phone}`} className="hover:text-white transition-colors py-1 block" aria-label={`Call us at ${company.phone}`}>
                        {company.phone}
                      </a>
                      <a
                        href={`https://api.whatsapp.com/send?phone=${company.phone?.replace(/\D/g, '')}&text=Hello%20${company.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chat on WhatsApp"
                        className="text-green-400 hover:text-green-300 transition-colors p-1"
                        aria-label="Chat with us on WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </a>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-1">Email:</p>
                  <p>
                    <a href={`mailto:${company.email}`} className="hover:text-white transition-colors py-1 block" aria-label={`Email us at ${company.email}`}>
                      {company.email}
                    </a>
                  </p>
                </div>
              </address>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Quick Links
              </h3>
              <ul className="text-gray-300 space-y-2 sm:space-y-3 text-sm">
                <li>
                  <Link
                    to="/about-us"
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-block py-1"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-block py-1"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-block py-1"
                  >
                    Our Products
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.medplusafrica.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 inline-block py-1"
                  >
                    Visit Website
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-6 sm:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs sm:text-sm">
              © 2025 {company.name}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="https://www.facebook.com/medplusafrica" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1" aria-label="Visit us on Facebook">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/medplusafrica" className="text-gray-400 hover:text-green-400 transition-colors duration-200 p-1" aria-label="Visit us on Instagram">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.398.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

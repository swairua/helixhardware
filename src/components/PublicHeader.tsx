import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Bandage, Package, Pipette, Wind, Baby, Hand, Monitor, Sofa, Wrench, Shirt, Shield, MoreHorizontal, Droplet, Syringe, AlertCircle } from 'lucide-react';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { getProductBySlug } from '@/data/products';

interface PublicHeaderProps {
  currentPage?: string;
}

export function PublicHeader({ currentPage }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  const productIconMap: { [key: string]: React.ReactNode } = {
    'Bandages, Tapes and Dressings': <Bandage size={24} className="text-red-500" />,
    'Bottles and Containers': <Package size={24} className="text-orange-600" />,
    'Catheters and Tubes': <Pipette size={24} className="text-amber-600" />,
    'Cotton Wool': <Wind size={24} className="text-gray-500" />,
    'Diapers and Sanitary': <Baby size={24} className="text-pink-500" />,
    'Gloves': <Hand size={24} className="text-yellow-600" />,
    'Hospital Equipments': <Monitor size={24} className="text-indigo-600" />,
    'Hospital Furniture': <Sofa size={24} className="text-amber-600" />,
    'Hospital Instruments': <Wrench size={24} className="text-orange-600" />,
    'Hospital Linen': <Shirt size={24} className="text-cyan-600" />,
    'Infection Control': <Shield size={24} className="text-green-600" />,
    'Others': <MoreHorizontal size={24} className="text-slate-600" />,
    'PPE': <AlertCircle size={24} className="text-rose-600" />,
    'Spirits, Detergents and Disinfectants': <Droplet size={24} className="text-teal-600" />,
    'Syringes and Needles': <Syringe size={24} className="text-lime-600" />,
  };

  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '#about' },
    {
      label: 'Our Products',
      href: '#',
      submenu: [
        'Bandages, Tapes and Dressings',
        'Bottles and Containers',
        'Catheters and Tubes',
        'Cotton Wool',
        'Diapers and Sanitary',
        'Gloves',
        'Hospital Equipments',
        'Hospital Furniture',
        'Hospital Instruments',
        'Hospital Linen',
        'Infection Control',
        'Others',
        'PPE',
        'Spirits, Detergents and Disinfectants',
        'Syringes and Needles',
      ],
    },
    { label: 'Talk to us', href: '#talk-to-us' },
  ];

  const isCurrentPage = (page: string) => currentPage === page;

  return (
    <header className="sticky top-0 bg-white shadow-md z-50 border-b border-transparent bg-gradient-to-r from-white via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20 gap-8">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <BiolegendLogo size="md" showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-auto">
            {navigationItems.map((item) => {
              if (item.label === 'Talk to us') {
                return (
                  <Link
                    key={item.label}
                    to="/contact"
                    className={`transition-colors font-medium ${
                      isCurrentPage('contact')
                        ? 'text-primary'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              if (item.label === 'About Us') {
                return (
                  <Link
                    key={item.label}
                    to="/about-us"
                    className={`transition-colors font-medium ${
                      isCurrentPage('about')
                        ? 'text-primary'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              if (item.label === 'Home') {
                return (
                  <Link
                    key={item.label}
                    to="/"
                    className={`transition-colors font-medium ${
                      isCurrentPage('home')
                        ? 'text-primary'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <div key={item.label} className="relative group">
                  <a
                    href={item.href}
                    className={`transition-colors flex items-center gap-1 font-medium ${
                      isCurrentPage('products')
                        ? 'text-primary'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-200" />}
                  </a>
                  {item.submenu && (
                    <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 border border-gray-100 before:absolute before:bottom-full before:right-8 before:w-6 before:h-4 before:bg-white before:border-t-2 before:border-l-2 before:border-gray-100 before:rotate-45" style={{ minWidth: '750px' }}>
                      <div className="grid grid-cols-5 gap-x-8 gap-y-4 p-6">
                        {item.submenu.map((sub) => {
                          const product = getProductBySlug(sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                          const productSlug = product?.slug || sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          return (
                            <Link
                              key={sub}
                              to={`/products/${productSlug}`}
                              className="flex flex-col items-center text-center group/item transition-all duration-200 hover:scale-110"
                            >
                              <div className="mb-2 transition-transform group-hover/item:scale-125">
                                {productIconMap[sub]}
                              </div>
                              <span className="text-xs text-gray-700 group-hover/item:text-primary group-hover/item:font-semibold transition-colors leading-tight">
                                {sub}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-auto"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            {navigationItems.map((item) => (
              <div key={item.label}>
                {item.label === 'Talk to us' ? (
                  <Link
                    to="/contact"
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-primary/10 rounded font-medium"
                  >
                    {item.label}
                  </Link>
                ) : item.label === 'About Us' ? (
                  <Link
                    to="/about-us"
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-primary/10 rounded font-medium"
                  >
                    {item.label}
                  </Link>
                ) : item.label === 'Home' ? (
                  <Link
                    to="/"
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-primary/10 rounded font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        item.submenu && setProductsDropdownOpen(!productsDropdownOpen)
                      }
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-primary/10 rounded flex justify-between items-center font-medium"
                    >
                      {item.label}
                      {item.submenu && (
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${productsDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>
                    {item.submenu && productsDropdownOpen && (
                      <div className="bg-gray-50 space-y-1 px-4 py-2">
                        {item.submenu.map((sub) => {
                          const product = getProductBySlug(sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                          const productSlug = product?.slug || sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          return (
                            <Link
                              key={sub}
                              to={`/products/${productSlug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 rounded"
                            >
                              {sub}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

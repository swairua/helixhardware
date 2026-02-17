import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { PublicFooter } from '@/components/PublicFooter';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useSEO } from '@/hooks/useSEO';
import { generateWebPageSchema, useBreadcrumbSchema } from '@/utils/seoHelpers';
import { useWebCategories } from '@/hooks/useWebCategories';

export default function Offers() {
  const { categories } = useWebCategories();
  useSEO(
    {
      title: 'Special Offers & Promotions',
      description: 'Exclusive deals and promotions on quality medical products and equipment. Save on hospital supplies, furniture, and more.',
      keywords: 'special offers, medical supplies discount, hospital equipment sale, promotions',
      url: 'https://medplusafrica.com/offers',
    },
    generateWebPageSchema({
      title: 'Special Offers & Promotions',
      description: 'Exclusive deals on quality medical products and equipment',
      url: 'https://medplusafrica.com/offers',
    })
  );

  useBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Special Offers', url: '/offers' }
  ]);
  const activeOffers = [
    {
      id: 1,
      title: 'Hospital Equipment Clearance Sale',
      discount: '25% OFF',
      description: 'Limited time offer on selected hospital equipment. Perfect for facility upgrades.',
      validUntil: 'January 31, 2025',
      category: 'Equipment',
      featured: true
    },
    {
      id: 2,
      title: 'Medical Supplies Bundle Package',
      discount: '20% OFF',
      description: 'Buy our curated bundle of essential medical supplies and save big.',
      validUntil: 'February 15, 2025',
      category: 'Supplies',
      featured: true
    },
    {
      id: 3,
      title: 'Infection Control Products Special',
      discount: '15% OFF',
      description: 'Enhanced protection with our infection control range at special pricing.',
      validUntil: 'February 28, 2025',
      category: 'Safety',
      featured: false
    },
    {
      id: 4,
      title: 'Hospital Furniture Mega Sale',
      discount: '30% OFF',
      description: 'Transform your facility with quality furniture at unbeatable prices.',
      validUntil: 'January 31, 2025',
      category: 'Furniture',
      featured: true
    },
    {
      id: 5,
      title: 'Bulk Order Discount Program',
      discount: 'UP TO 35% OFF',
      description: 'Special pricing for bulk orders. Perfect for large healthcare facilities.',
      validUntil: 'Ongoing',
      category: 'Program',
      featured: false
    },
    {
      id: 6,
      title: 'New Year Clearance on Old Stock',
      discount: '40% OFF',
      description: 'Make room for new inventory. Selected items heavily discounted.',
      validUntil: 'January 20, 2025',
      category: 'Clearance',
      featured: false
    },
  ];

  const featuredOffers = activeOffers.filter(offer => offer.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0">
              <BiolegendLogo size="md" showText={true} />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-700 hover:text-primary transition-colors font-medium">Home</a>
              <a href="/about-us" className="text-gray-700 hover:text-primary transition-colors font-medium">About Us</a>
              <a href="/products" className="text-gray-700 hover:text-primary transition-colors font-medium">Our Products</a>
              <a href="/offers" className="text-primary font-medium">Offers</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <BreadcrumbNav items={[{ label: 'Special Offers', href: '/offers' }]} />

      {/* Page Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Special Offers & Promotions</h1>
          <p className="text-xl text-white/90">Exclusive deals on quality medical products and equipment</p>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Offers</h2>
          <p className="text-gray-600 mb-12">Limited time promotions - don't miss out!</p>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredOffers.map((offer) => (
              <div
                key={offer.id}
                className="relative bg-white border-2 border-primary rounded-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                {/* Ribbon */}
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  {offer.discount}
                </div>

                <div className="p-8">
                  <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {offer.category}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-3">
                    {offer.title}
                  </h3>
                  <p className="text-gray-600 mb-6">{offer.description}</p>
                  <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                    <span>⏱️</span>
                    Valid until: {offer.validUntil}
                  </p>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
                    Claim Offer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Offers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">All Active Offers</h2>
          <div className="space-y-4">
            {activeOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {offer.category}
                    </span>
                    <span className="text-sm font-bold text-red-600">{offer.discount}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {offer.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{offer.description}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <span>⏱️</span>
                    Valid until: {offer.validUntil}
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold whitespace-nowrap">
                  Learn More
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Our Offers Are The Best</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
                  🏆
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Guaranteed Quality</h3>
              <p className="text-gray-600 text-sm">All discounted products maintain our quality standards</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
                  🚚
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Free Delivery</h3>
              <p className="text-gray-600 text-sm">On selected offers for orders above minimum value</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
                  💳
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Flexible Payment</h3>
              <p className="text-gray-600 text-sm">Multiple payment options and credit terms available</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
                  ✅
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Money Back Guarantee</h3>
              <p className="text-gray-600 text-sm">Unsatisfied? Return within 30 days for a full refund</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Save?</h2>
          <p className="text-xl text-white/90 mb-8">
            Contact us now to discuss our custom offers for your facility
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold">
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter productCategories={categories} />
    </div>
  );
}

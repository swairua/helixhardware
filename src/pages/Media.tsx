import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { PublicFooter } from '@/components/PublicFooter';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useSEO } from '@/hooks/useSEO';
import { generateWebPageSchema, useBreadcrumbSchema } from '@/utils/seoHelpers';
import { useWebCategories } from '@/hooks/useWebCategories';

export default function Media() {
  const { categories } = useWebCategories();
  useSEO(
    {
      title: 'Media Center',
      description: 'Latest news, CME sessions, and events from Medplus Africa. Stay updated on industry news and healthcare developments.',
      keywords: 'healthcare news, medical news, healthcare events, CME sessions',
      url: 'https://medplusafrica.com/media',
    },
    generateWebPageSchema({
      title: 'Media Center - News & Events',
      description: 'News, CME sessions, and events',
      url: 'https://medplusafrica.com/media',
    })
  );

  useBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Media Center', url: '/media' }
  ]);
  const newsItems = [
    {
      id: 1,
      date: 'January 15, 2025',
      title: '&gt;&gt; Medical Supplies Expands Operations to East Africa',
      excerpt: 'We are excited to announce the opening of our new distribution center in Kampala, Uganda...',
      category: 'News'
    },
    {
      id: 2,
      date: 'January 8, 2025',
      title: 'New Partnership with International Healthcare Organization',
      excerpt: 'Medplus Africa has partnered with leading international healthcare organizations to improve access...,',
      category: 'News'
    },
    {
      id: 3,
      date: 'December 28, 2024',
      title: 'Year-End Special: Up to 20% Discount on Selected Products',
      excerpt: 'As a token of our appreciation, we are offering exclusive discounts on our entire range...',
      category: 'Offers'
    },
    {
      id: 4,
      date: 'December 15, 2024',
      title: '&gt;&gt; Medical Supplies Achieves ISO 9001 Certification',
      excerpt: 'We are proud to announce that we have successfully obtained ISO 9001 certification...',
      category: 'News'
    },
  ];

  const cmeEvents = [
    {
      id: 1,
      date: 'February 20, 2025',
      title: 'CME: Best Practices in Hospital Infection Control',
      location: 'Nairobi, Kenya',
      description: 'Join us for an educational session on the latest infection control protocols and best practices.',
      type: 'CME'
    },
    {
      id: 2,
      date: 'March 5, 2025',
      title: 'Workshop: Optimizing Hospital Procurement',
      location: 'Virtual',
      description: 'Learn strategies to optimize procurement processes and reduce costs while maintaining quality.',
      type: 'Workshop'
    },
    {
      id: 3,
      date: 'March 20, 2025',
      title: 'Product Demo: New Hospital Equipment Solutions',
      location: 'Nairobi & Mombasa',
      description: 'Experience our latest hospital equipment and furniture solutions with live demonstrations.',
      type: 'Demo'
    },
  ];

  const events = [
    {
      id: 1,
      date: 'February 10, 2025',
      title: 'East Africa Healthcare Summit 2025',
      location: 'Nairobi Convention Center',
      description: 'Annual summit bringing together healthcare professionals to discuss industry trends.',
    },
    {
      id: 2,
      date: 'February 28, 2025',
      title: '&gt;&gt; Medical Supplies Product Exhibition',
      location: 'Kenyatta International Convention Center',
      description: 'Showcase of our latest products and solutions in medical supplies and equipment.',
    },
    {
      id: 3,
      date: 'March 15, 2025',
      title: 'Healthcare Facility Management Training',
      location: 'Multiple Locations',
      description: 'Training program for healthcare facility managers on best practices and new products.',
    },
  ];

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
              <a href="/media" className="text-primary font-medium">Media</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <BreadcrumbNav items={[{ label: 'Media', href: '/media' }]} />

      {/* Page Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Media Center</h1>
          <p className="text-xl text-white/90">News, CME sessions, and events</p>
        </div>
      </section>

      {/* News Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Latest News</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {newsItems.map((item) => (
              <article
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{item.excerpt}</p>
                  <Link to="/media" className="text-primary font-medium hover:text-primary/80 transition">
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CME Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">CME & Training</h2>
          <div className="space-y-6">
            {cmeEvents.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {item.type}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {item.date}</span>
                      <span>�� {item.location}</span>
                    </div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-white font-semibold whitespace-nowrap">
                    Register
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Upcoming Events</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {events.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-6 py-4 border-b border-gray-200">
                  <p className="text-sm font-semibold text-primary">📅 {item.date}</p>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm flex items-center gap-2">
                    <span>📍</span>
                    {item.location}
                  </p>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-white/90 mb-8">
            Subscribe to our newsletter to receive the latest news and updates
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none"
            />
            <Button className="bg-white text-primary hover:bg-gray-100 font-semibold">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter productCategories={categories} />
    </div>
  );
}

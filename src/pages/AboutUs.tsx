import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useSEO } from '@/hooks/useSEO';
import { generateWebPageSchema, useBreadcrumbSchema } from '@/utils/seoHelpers';
import { useWebCategories } from '@/hooks/useWebCategories';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';

export default function AboutUs() {
  const { categories } = useWebCategories();
  const companyConfig = useCompanyConfig();

  useSEO(
    {
      title: `About ${companyConfig.name}`,
      description: `Learn about ${companyConfig.name}, our journey, mission, and commitment to healthcare excellence. Over 10 years of trusted service in medical supplies and hospital equipment distribution.`,
      keywords: 'about company, healthcare distributor, medical supplies, hospital equipment, Africa',
      url: '/about-us',
    },
    generateWebPageSchema({
      title: `About ${companyConfig.name}`,
      description: 'Learn about our company, mission, and commitment to healthcare excellence',
      url: '/about-us',
    }, companyConfig)
  );

  useBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About Us', url: '/about-us' }
  ], companyConfig);
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader currentPage="about" />

      {/* Breadcrumb */}
      <BreadcrumbNav items={[{ label: 'About Us', href: '/about-us' }]} />

      {/* Page Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">About Medplus Africa</h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90">Learn about our journey, mission, and commitment to healthcare excellence</p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  With over 10 years of trusted service, Medplus Africa has been a leading distributor of critical care, hospital consumables, and furniture. What started as a small operation has grown into a leading healthcare solutions provider across Africa.
                </p>
                <p>
                  Our journey is built on the foundation of quality, reliability, and a deep commitment to improving healthcare delivery. We understand the challenges faced by hospitals and healthcare facilities, and we're dedicated to providing solutions that make a difference.
                </p>
                <p>
                  Today, we work with hundreds of healthcare institutions, from small clinics to large teaching hospitals, ensuring they have access to the best medical supplies and equipment at competitive prices.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-8 border border-primary/20">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">30+</div>
                  <p className="text-gray-700 font-medium">Years of Service</p>
                </div>
                <div className="text-center border-t border-primary/20 pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <p className="text-gray-700 font-medium">Healthcare Partners</p>
                </div>
                <div className="text-center border-t border-primary/20 pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">15000+</div>
                  <p className="text-gray-700 font-medium">Products in Stock</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Mission & Vision</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-primary mb-4">Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                Our Mission: Driving healthcare forward with reliable, innovative, and sustainable medical supply solutions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-primary mb-4">Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                Our Vision: Leading the delivery of trusted healthcare solutions across Africa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality & Reliability</h3>
              <p className="text-gray-600">Commitment to excellence by ensuring all products meet the highest standards of quality and safety. We deliver consistent, dependable healthcare solutions that professionals can trust.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Integrity</h3>
              <p className="text-gray-600">Conducting business with honesty, transparency, and ethical standards. We strictly adhere to all relevant regulations, laws, and industry standards in the medical and safety sectors.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM5 20h10a2 2 0 002-2v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Focus</h3>
              <p className="text-gray-600">Prioritizing the needs and satisfaction of healthcare providers and patients. We offer responsive support and provide customized solutions tailored to specific client requirements.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5-5l-3 3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation & Sustainability</h3>
              <p className="text-gray-600">Continuously seeking ways to innovate and improve products and services. We embrace modern, effective solutions and support long-term, responsible healthcare systems that advance the industry.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Safety</h3>
              <p className="text-gray-600">Ensuring all products are safe for use and protect both patient care and healthcare worker safety. We provide equipment and PPEs that prevent harm and contribute positively to healthcare environments.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Collaboration & Professionalism</h3>
              <p className="text-gray-600">Building strong, mutually beneficial partnerships with suppliers, customers, and industry partners. We maintain high levels of expertise and professionalism in all interactions, treating all stakeholders with respect.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Partner With Us?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold">
                Get in Touch
              </Button>
            </Link>
            <Link to="/products">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter productCategories={categories} />
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Globe, Users } from 'lucide-react';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';

export default function IntroSection() {
  const companyConfig = useCompanyConfig();

  return (
    <section className="py-12 sm:py-24 bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Intro Content */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8">
            <div className="animate-fadeInUp">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
                Welcome to {companyConfig.name}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Your trusted partner in healthcare excellence across the African continent. For over a decade, we've been committed to delivering premium medical supplies and hospital equipment to healthcare facilities, ensuring quality care reaches every corner of Africa.
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-4 animate-fadeInUp-delay-1">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Quality Assured</h3>
                  <p className="text-gray-600 text-sm">Premium medical supplies and equipment meeting international standards</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Wide Coverage</h3>
                  <p className="text-gray-600 text-sm">Serving hospitals, clinics, and healthcare facilities across Africa</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Trusted Partners</h3>
                  <p className="text-gray-600 text-sm">Working with leading healthcare institutions and organizations across the continent</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fadeInUp-delay-2">
              <Link to="/products">
                <button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-3 px-6 sm:px-10 rounded-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-base">
                  Explore Products
                  <ArrowRight size={18} />
                </button>
              </Link>
              <Link to="/about-us">
                <button className="w-full sm:w-auto border-2 border-blue-500 text-blue-600 font-bold py-3 px-6 sm:px-10 rounded-lg hover:bg-blue-50 transition-all duration-300 text-base">
                  Learn More
                </button>
              </Link>
            </div>
          </div>

          {/* Right Image/Stats */}
          <div className="space-y-6 animate-fadeInUp-delay-3">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                  10+
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Years of Experience</p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                  100+
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Healthcare Partners</p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                  15+
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Product Categories</p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                  500K+
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Products Supplied</p>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-blue-100">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">Our Mission</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Driving healthcare forward with reliable, innovative, and sustainable medical supply solutions.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">Our Vision</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Leading the delivery of trusted healthcare solutions across Africa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

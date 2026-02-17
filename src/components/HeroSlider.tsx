import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';

interface Slide {
  id: number;
  image: string;
  alt: string;
}

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const companyConfig = useCompanyConfig();

  const slides: Slide[] = [
    {
      id: 1,
      image: 'https://cdn.builder.io/api/v1/image/assets%2F61f5e6f266e944e8a52ca608d3d23214%2F1f0c36a192784b5987fa0711827198f8?format=webp&width=800',
      alt: 'Electrosurgical Generator 400W - Advanced surgical equipment for precise tissue cutting and coagulation'
    },
    {
      id: 2,
      image: 'https://cdn.builder.io/api/v1/image/assets%2F61f5e6f266e944e8a52ca608d3d23214%2F496df3358cdb47939a419c9e84363fdb?format=webp&width=800',
      alt: 'Digital Humidifier and Nebulizer - Advanced respiratory care equipment for patient treatment'
    },
    {
      id: 3,
      image: 'https://cdn.builder.io/api/v1/image/assets%2F61f5e6f266e944e8a52ca608d3d23214%2Fb4917e9b1dab4de889749c3beb055718?format=webp&width=800',
      alt: 'Digital Baby Scale - Precision weighing equipment for pediatric care and monitoring'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative min-h-screen sm:h-screen bg-white overflow-hidden">
      {/* Slider Background */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-transform duration-1200 ease-out"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: `translateX(${(index - currentSlide) * 100}%)`
            }}
          >
            {/* Gradient overlay - orange to amber */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-40"></div>
          </div>
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen sm:h-full flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center py-20 md:py-0">

            {/* Left: Information Section (Floating, Transparent) */}
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 md:p-12 border border-white/20">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <span className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                      OVER 10 YEARS
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                      OF TRUSTED SERVICE
                    </h1>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white font-semibold leading-relaxed">
                      World Class Critical Care, Hospital Consumables and Furniture Distributors.
                    </p>
                    <p className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed">
                      Bettering lives together.
                    </p>
                  </div>

                  <div className="pt-4 sm:pt-6">
                    <Link to="/about-us" className="block sm:inline-block">
                      <button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-lg font-semibold hover:shadow-lg active:shadow-md transform hover:scale-105 active:scale-100 transition-all duration-200 text-base sm:text-base min-h-[44px] sm:min-h-auto flex items-center justify-center"
                        aria-label={`Learn more about ${companyConfig.name}`}>
                        Learn More
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Slide Indicators */}
              <div className="flex items-center gap-2 sm:gap-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-white w-6 sm:w-8'
                        : 'bg-white/50 w-2 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-pressed={index === currentSlide}
                  />
                ))}
              </div>
            </div>

            {/* Right: Image Section */}
            <div className="hidden md:flex justify-center items-center h-full">
              <div className="relative w-full max-w-md h-96 overflow-hidden rounded-2xl">
                {/* Main Image */}
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="absolute inset-0 transition-transform duration-1200 ease-out rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                      transform: `translateX(${(index - currentSlide) * 100}%)`
                    }}
                  >
                    <img
                      src={slide.image}
                      alt={slide.alt}
                      className="w-full h-full object-cover"
                    />
                    {/* Subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                ))}

                {/* Navigation Arrows */}
                <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4">
                  <button
                    onClick={prevSlide}
                    className="bg-white/30 hover:bg-white/50 active:bg-white/40 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="bg-white/30 hover:bg-white/50 active:bg-white/40 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-20 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full">
        <p className="text-white text-xs sm:text-sm font-semibold">
          {currentSlide + 1} / {slides.length}
        </p>
      </div>
    </section>
  );
}

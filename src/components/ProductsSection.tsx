import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export default function ProductsSection() {
  const products: Product[] = [
    {
      id: '1',
      name: 'Bandages, Tapes and Dressings',
      slug: 'bandages-tapes-and-dressings',
      description: 'High-quality bandages, tapes, and medical dressings for wound care and protection.',
      image: 'https://images.pexels.com/photos/5146554/pexels-photo-5146554.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '2',
      name: 'Bottles and Containers',
      slug: 'bottles-and-containers',
      description: 'Medical-grade bottles and containers for safe storage and transportation.',
      image: 'https://images.pexels.com/photos/5921726/pexels-photo-5921726.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '3',
      name: 'Catheters and Tubes',
      slug: 'catheters-and-tubes',
      description: 'Premium catheters and medical tubing for various clinical procedures.',
      image: 'https://images.pexels.com/photos/8442032/pexels-photo-8442032.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '4',
      name: 'Cotton Wool',
      slug: 'cotton-wool',
      description: 'Pure cotton wool products for medical and healthcare applications.',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '5',
      name: 'Diapers and Sanitary',
      slug: 'diapers-and-sanitary',
      description: 'Medical-grade incontinence and sanitary supplies for healthcare facilities.',
      image: 'https://images.pexels.com/photos/7692192/pexels-photo-7692192.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '6',
      name: 'Gloves',
      slug: 'gloves',
      description: 'Protective medical gloves in latex, nitrile, and vinyl options.',
      image: 'https://images.pexels.com/photos/6627783/pexels-photo-6627783.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '7',
      name: 'Hospital Equipments',
      slug: 'hospital-equipments',
      description: 'Essential hospital equipment including monitors and critical care devices.',
      image: 'https://images.pexels.com/photos/3844581/pexels-photo-3844581.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '8',
      name: 'Hospital Furniture',
      slug: 'hospital-furniture',
      description: 'Professional hospital beds, patient chairs, and examination tables.',
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '9',
      name: 'Hospital Instruments',
      slug: 'hospital-instruments',
      description: 'Surgical and diagnostic instruments including precision medical tools.',
      image: 'https://images.pexels.com/photos/4269355/pexels-photo-4269355.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '10',
      name: 'Hospital Linen',
      slug: 'hospital-linen',
      description: 'Medical-grade linens including sheets, pillowcases, and gowns.',
      image: 'https://images.pexels.com/photos/5049242/pexels-photo-5049242.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '11',
      name: 'Infection Control',
      slug: 'infection-control',
      description: 'Comprehensive infection prevention products and sterilization equipment.',
      image: 'https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '12',
      name: 'PPE',
      slug: 'ppe',
      description: 'Personal Protective Equipment including gowns, masks, and face shields.',
      image: 'https://images.pexels.com/photos/9574531/pexels-photo-9574531.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '13',
      name: 'Spirits, Detergents and Disinfectants',
      slug: 'spirits-detergents-and-disinfectants',
      description: 'Pharmaceutical-grade disinfectants and sterilization solutions.',
      image: 'https://images.pexels.com/photos/5217889/pexels-photo-5217889.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '14',
      name: 'Syringes and Needles',
      slug: 'syringes-and-needles',
      description: 'Sterile syringes and needles in various gauges and sizes.',
      image: 'https://images.pexels.com/photos/7723205/pexels-photo-7723205.jpeg?w=500&h=400&fit=crop'
    },
    {
      id: '15',
      name: 'Others',
      slug: 'others',
      description: 'Additional medical supplies and healthcare products.',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop'
    }
  ];


  return (
    <section className="py-12 sm:py-24 bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Our Products
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Comprehensive range of medical supplies and healthcare products for hospitals, clinics, and healthcare facilities
          </p>
        </div>

        {/* Products Grid - Show limited number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden hover:-translate-y-1 hover:border-blue-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-green-500/0 group-hover:from-blue-500/5 group-hover:to-green-500/5 transition-all duration-300 pointer-events-none"></div>

              {/* Product Image */}
              <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-200">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 relative z-10">
                {/* Title */}
                <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2">
                  {product.description}
                </p>

                {/* View More Button */}
                <Link
                  to={`/products/${product.slug}`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                >
                  View More....
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center mt-8 sm:mt-12">
          <Link to="/products">
            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-base sm:text-lg w-full sm:w-auto">
              View All Products
              <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

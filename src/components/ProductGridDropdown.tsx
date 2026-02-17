import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  name: string;
  icon: string;
}

interface ProductCategory {
  name: string;
  icon: string;
  products: Product[];
  slug: string;
}

const productCategories: ProductCategory[] = [
  {
    name: 'Bandages, Tapes and Dressings',
    icon: '🩹',
    slug: 'bandages-tapes-and-dressings',
    products: [
      { name: 'Sterile Adhesive Bandages', icon: '🩹' },
      { name: 'Medical Tape', icon: '📋' },
      { name: 'Wound Dressings', icon: '🧴' },
      { name: 'Gauze Pads', icon: '🧻' },
    ]
  },
  {
    name: 'Bottles and Containers',
    icon: '🧴',
    slug: 'bottles-and-containers',
    products: [
      { name: 'Sample Collection Bottles', icon: '🧪' },
      { name: 'Pharmaceutical Containers', icon: '🧴' },
      { name: 'Specimen Jars', icon: '🫙' },
    ]
  },
  {
    name: 'Catheters and Tubes',
    icon: '🔬',
    slug: 'catheters-and-tubes',
    products: [
      { name: 'Urinary Catheters', icon: '💉' },
      { name: 'Peritoneal Dialysis Catheters', icon: '🔬' },
      { name: 'Central Line Catheters', icon: '🧬' },
    ]
  },
  {
    name: 'Cotton Wool',
    icon: '☁️',
    slug: 'cotton-wool',
    products: [
      { name: 'Sterilized Cotton Wool Balls', icon: '☁️' },
      { name: 'Medical Grade Cotton Wool', icon: '🧻' },
      { name: 'Cotton Wool Rolls', icon: '📦' },
    ]
  },
  {
    name: 'Diapers and Sanitary',
    icon: '👶',
    slug: 'diapers-and-sanitary',
    products: [
      { name: 'Incontinence Diapers', icon: '👶' },
      { name: 'Sanitary Pads', icon: '🩸' },
      { name: 'Briefs and Underwear', icon: '👕' },
    ]
  },
  {
    name: 'Gloves',
    icon: '🧤',
    slug: 'gloves',
    products: [
      { name: 'Latex Examination Gloves', icon: '🧤' },
      { name: 'Nitrile Gloves', icon: '🧤' },
      { name: 'Vinyl Gloves', icon: '🧤' },
    ]
  },
  {
    name: 'Hospital Equipments',
    icon: '🏥',
    slug: 'hospital-equipments',
    products: [
      { name: 'Patient Monitors', icon: '📊' },
      { name: 'Hospital Carts', icon: '🛒' },
      { name: 'Infusion Pumps', icon: '💧' },
    ]
  },
  {
    name: 'Hospital Furniture',
    icon: '🛏️',
    slug: 'hospital-furniture',
    products: [
      { name: 'Hospital Beds', icon: '🛏️' },
      { name: 'Patient Chairs', icon: '🪑' },
      { name: 'Examination Tables', icon: '📋' },
    ]
  },
  {
    name: 'Hospital Instruments',
    icon: '⚕️',
    slug: 'hospital-instruments',
    products: [
      { name: 'Surgical Scissors', icon: '✂️' },
      { name: 'Specula', icon: '⚕️' },
      { name: 'Forceps', icon: '🔧' },
    ]
  },
  {
    name: 'Hospital Linen',
    icon: '🧻',
    slug: 'hospital-linen',
    products: [
      { name: 'Hospital Bed Sheets', icon: '🧻' },
      { name: 'Pillowcases', icon: '🛏️' },
      { name: 'Surgical Gowns', icon: '👔' },
    ]
  },
  {
    name: 'Infection Control',
    icon: '🛡️',
    slug: 'infection-control',
    products: [
      { name: 'Disinfectants', icon: '🧼' },
      { name: 'Sterilization Equipment', icon: '🔬' },
      { name: 'Protective Barriers', icon: '🛡️' },
    ]
  },
  {
    name: 'PPE',
    icon: '👕',
    slug: 'ppe',
    products: [
      { name: 'Face Masks', icon: '😷' },
      { name: 'Protective Gowns', icon: '👕' },
      { name: 'Face Shields', icon: '🥽' },
    ]
  },
  {
    name: 'Spirits, Detergents and Disinfectants',
    icon: '🧼',
    slug: 'spirits-detergents-and-disinfectants',
    products: [
      { name: 'Hand Sanitizer', icon: '🧴' },
      { name: 'Surface Disinfectant', icon: '🧼' },
      { name: 'Surgical Spirit', icon: '🧪' },
    ]
  },
  {
    name: 'Syringes and Needles',
    icon: '💉',
    slug: 'syringes-and-needles',
    products: [
      { name: 'Sterile Syringes', icon: '💉' },
      { name: 'Hypodermic Needles', icon: '💉' },
      { name: 'Syringe Filters', icon: '🔬' },
    ]
  },
  {
    name: 'Others',
    icon: '📦',
    slug: 'others',
    products: [
      { name: 'Medical Supplies', icon: '📦' },
      { name: 'Healthcare Products', icon: '🏥' },
      { name: 'Misc Items', icon: '📦' },
    ]
  },
];

export default function ProductGridDropdown() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  return (
    <>
      {/* Grid Dropdown */}
      <div className="absolute top-full mt-2 bg-white shadow-2xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-6 px-4 sm:py-8 sm:px-8 z-50 border border-gray-100" style={{ left: '0.5rem', right: 'auto', width: 'calc(100vw - 1rem)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
          {productCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category)}
              className="group/item flex flex-col items-center justify-center p-2 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-green-50 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-3 group-hover/item:scale-125 transition-transform duration-300">
                {category.icon}
              </div>
              <p className="text-center text-xs sm:text-xs font-semibold text-gray-700 leading-tight line-clamp-2 group-hover/item:text-blue-600 transition-colors">
                {category.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Side Drawer */}
      {selectedCategory && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setSelectedCategory(null)}
          />

          {/* Drawer - Positioned relative to viewport with proper constraints */}
          <div className="fixed inset-y-0 right-0 bg-white shadow-2xl z-50 overflow-y-auto w-full sm:w-96 max-w-full animate-slideInRight" style={{ maxWidth: 'calc(100vw - 0px)' }}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 md:p-6 flex items-center justify-between gap-4">
              <div className="flex-grow">
                <div className="text-3xl md:text-4xl mb-2">{selectedCategory.icon}</div>
                <h2 className="text-lg md:text-2xl font-bold leading-tight">{selectedCategory.name}</h2>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            {/* Products List */}
            <div className="p-4 md:p-6 space-y-3 pb-20">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Available Products</h3>
              {selectedCategory.products.map((product) => (
                <div
                  key={product.name}
                  className="group/product flex items-center gap-3 p-3 md:p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-2xl md:text-3xl flex-shrink-0">{product.icon}</div>
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-900 group-hover/product:text-blue-600 transition-colors text-sm md:text-base truncate">
                      {product.name}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">In stock • Quick delivery</p>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover/product:text-blue-600 transition-colors flex-shrink-0 w-5 h-5" />
                </div>
              ))}

              {/* CTA Button - Sticky at bottom with proper positioning */}
              <div className="fixed bottom-0 right-0 w-full sm:w-96 max-w-full p-4 bg-gradient-to-t from-white via-white to-white/95 border-t border-gray-200" style={{ maxWidth: 'calc(100vw - 0px)' }}>
                <Link
                  to={`/products/${selectedCategory.slug}`}
                  className="block w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all duration-300 text-center text-sm"
                >
                  View More....
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

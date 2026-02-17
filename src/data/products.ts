export interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  longDescription: string;
  category?: string;
  sku?: string;
  pricing: {
    basePrice: string;
    currency: string;
    unit: string;
    minOrder?: string;
  };
  specifications: {
    label: string;
    value: string;
  }[];
  features: string[];
}

export const products: Product[] = [
  {
    id: 'bandages-tapes-dressings',
    slug: 'bandages-tapes-and-dressings',
    name: 'Bandages, Tapes and Dressings',
    image: 'https://images.pexels.com/photos/5146554/pexels-photo-5146554.jpeg?w=500&h=400&fit=crop',
    description: 'Complete range of medical dressings and bandages for wound care',
    longDescription: 'Our comprehensive collection of bandages, tapes, and dressings includes sterile and non-sterile options suitable for various wound care applications. All products meet international medical standards and are suitable for hospitals, clinics, and healthcare facilities.',
    pricing: {
      basePrice: 'From 50',
      currency: 'KES',
      unit: 'per box',
      minOrder: '10 boxes'
    },
    specifications: [
      { label: 'Material', value: 'Medical-grade fabric and adhesive' },
      { label: 'Sterility', value: 'Sterile and non-sterile options' },
      { label: 'Sizes', value: 'Multiple sizes available' },
      { label: 'Packaging', value: 'Individual boxes or bulk orders' }
    ],
    features: [
      'Hypoallergenic adhesive',
      'Breathable material',
      'Easy application and removal',
      'Long-lasting adhesion',
      'Water-resistant options available'
    ]
  },
  {
    id: 'bottles-containers',
    slug: 'bottles-and-containers',
    name: 'Bottles and Containers',
    image: 'https://images.pexels.com/photos/5921726/pexels-photo-5921726.jpeg?w=500&h=400&fit=crop',
    description: 'Sterile containers for specimen collection and storage',
    longDescription: 'Medical-grade bottles and containers for specimen collection, sample storage, and laboratory use. Our containers are manufactured with food-grade plastics and meet all regulatory requirements for medical use.',
    pricing: {
      basePrice: '5',
      currency: 'KES',
      unit: 'per piece',
      minOrder: '100 pieces'
    },
    specifications: [
      { label: 'Material', value: 'Food-grade plastic and glass options' },
      { label: 'Capacity', value: '5ml to 500ml' },
      { label: 'Sterility', value: 'Pre-sterilized' },
      { label: 'Closure', value: 'Screw cap, snap cap, and push-pin options' }
    ],
    features: [
      'Clear visibility for specimen inspection',
      'Graduated markings',
      'Chemical resistant',
      'Leakproof design',
      'Autoclavable options'
    ]
  },
  {
    id: 'catheters-tubes',
    slug: 'catheters-and-tubes',
    name: 'Catheters and Tubes',
    image: 'https://images.pexels.com/photos/8442032/pexels-photo-8442032.jpeg?w=500&h=400&fit=crop',
    description: 'Medical-grade catheters and tubing systems',
    longDescription: 'Complete range of catheters and tubes including urinary, nasogastric, endotracheal, and feeding tubes. All products are manufactured from medical-grade materials and meet international safety standards.',
    pricing: {
      basePrice: '150',
      currency: 'KES',
      unit: 'per unit',
      minOrder: '50 units'
    },
    specifications: [
      { label: 'Types', value: 'Urinary, NG, endotracheal, feeding' },
      { label: 'Material', value: 'Silicone, latex-free PVC, or polyurethane' },
      { label: 'Sizes', value: '12Fr to 28Fr' },
      { label: 'Sterility', value: 'Pre-sterilized, individually packaged' }
    ],
    features: [
      'Smooth insertion coating',
      'Radiopaque for X-ray visibility',
      'Double lumen options',
      'Latex-free materials',
      'Individually sterile packed'
    ]
  },
  {
    id: 'cotton-wool',
    slug: 'cotton-wool',
    name: 'Cotton Wool',
    image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
    description: 'High-quality absorbent cotton products',
    longDescription: 'Pure, high-quality cotton wool suitable for medical applications, wound care, and general use in healthcare facilities. Our cotton wool is naturally absorbent and gentle on skin.',
    pricing: {
      basePrice: '200',
      currency: 'KES',
      unit: 'per kg',
      minOrder: '5 kg'
    },
    specifications: [
      { label: 'Composition', value: '100% pure cotton' },
      { label: 'Weight', value: 'Bulk rolls or individual packages' },
      { label: 'Purity', value: 'Bleached and dyed variants' },
      { label: 'Packaging', value: 'Vacuum-sealed rolls' }
    ],
    features: [
      'High absorbency',
      'Soft and gentle',
      'Lint-free option',
      'Non-irritating',
      'Cost-effective'
    ]
  },
  {
    id: 'diapers-sanitary',
    slug: 'diapers-and-sanitary',
    name: 'Diapers and Sanitary',
    image: 'https://images.pexels.com/photos/7692272/pexels-photo-7692272.jpeg?w=500&h=400&fit=crop',
    description: 'Adult and pediatric incontinence products',
    longDescription: 'Comprehensive range of incontinence management products for both adults and pediatric patients. All products feature advanced moisture-absorbing technology and skin-friendly materials.',
    pricing: {
      basePrice: '800',
      currency: 'KES',
      unit: 'per pack',
      minOrder: '10 packs'
    },
    specifications: [
      { label: 'Types', value: 'Adult, pediatric, unisex' },
      { label: 'Sizes', value: 'XS to XXL' },
      { label: 'Absorbency', value: 'Light, regular, heavy, super-heavy' },
      { label: 'Features', value: 'Wetness indicators, odor control' }
    ],
    features: [
      'Advanced absorption technology',
      'Breathable material',
      'Hypoallergenic',
      'Dermatologically tested',
      'Eco-friendly options'
    ]
  },
  {
    id: 'gloves',
    slug: 'gloves',
    name: 'Gloves',
    image: 'https://images.pexels.com/photos/4021267/pexels-photo-4021267.jpeg?w=500&h=400&fit=crop',
    description: 'Medical examination and surgical gloves',
    longDescription: 'High-quality medical gloves for examination and surgical use. Available in latex, nitrile, and latex-free options. All gloves are sterile, pre-powdered or powder-free, and meet international medical standards.',
    pricing: {
      basePrice: '15',
      currency: 'KES',
      unit: 'per pair',
      minOrder: '100 pairs'
    },
    specifications: [
      { label: 'Material', value: 'Latex, nitrile, or polyisoprene' },
      { label: 'Type', value: 'Examination or surgical' },
      { label: 'Powder', value: 'Powdered or powder-free' },
      { label: 'Sterility', value: 'Sterile and non-sterile' }
    ],
    features: [
      'Superior grip',
      'High tear resistance',
      'Latex-free options',
      'AQL 1.5 standard',
      'Individually packed or bulk'
    ]
  },
  {
    id: 'hospital-equipments',
    slug: 'hospital-equipments',
    name: 'Hospital Equipments',
    image: 'https://images.pexels.com/photos/3844581/pexels-photo-3844581.jpeg?w=500&h=400&fit=crop',
    description: 'Advanced medical equipment and monitors',
    longDescription: 'State-of-the-art hospital equipment including vital sign monitors, oxygen concentrators, suction machines, and diagnostic equipment. All equipment is certified, fully functional, and backed by comprehensive warranty.',
    pricing: {
      basePrice: 'Custom',
      currency: 'KES',
      unit: 'per unit',
      minOrder: '1 unit'
    },
    specifications: [
      { label: 'Categories', value: 'Monitoring, oxygen, suction, diagnostic' },
      { label: 'Brand', value: 'ISO certified manufacturers' },
      { label: 'Warranty', value: '1-2 years warranty' },
      { label: 'Certification', value: 'CE, FDA approved' }
    ],
    features: [
      'Digital displays',
      'Portable options',
      'Multiple alarm features',
      'Data logging capability',
      'Easy maintenance'
    ]
  },
  {
    id: 'hospital-furniture',
    slug: 'hospital-furniture',
    name: 'Hospital Furniture',
    image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?w=500&h=400&fit=crop',
    description: 'Hospital beds, trolleys, and medical furniture',
    longDescription: 'Durable and comfortable hospital furniture including adjustable beds, trolleys, examination tables, and storage solutions. All furniture is designed for easy cleaning and long-term durability.',
    pricing: {
      basePrice: '5000',
      currency: 'KES',
      unit: 'per piece',
      minOrder: '1 piece'
    },
    specifications: [
      { label: 'Materials', value: 'Stainless steel, medical-grade plastic, wood' },
      { label: 'Types', value: 'Beds, trolleys, tables, cabinets' },
      { label: 'Features', value: 'Adjustable, mobile, lockable' },
      { label: 'Finish', value: 'Powder-coated, polished' }
    ],
    features: [
      'Ergonomic design',
      'Easy to clean',
      'Durable construction',
      'Weight capacity rated',
      'Customizable options'
    ]
  },
  {
    id: 'hospital-instruments',
    slug: 'hospital-instruments',
    name: 'Hospital Instruments',
    image: 'https://images.pexels.com/photos/4269355/pexels-photo-4269355.jpeg?w=500&h=400&fit=crop',
    description: 'Surgical and diagnostic instruments',
    longDescription: 'Comprehensive range of surgical and diagnostic instruments manufactured from high-quality stainless steel. All instruments are precision-engineered and suitable for surgical, diagnostic, and clinical applications.',
    pricing: {
      basePrice: '500',
      currency: 'KES',
      unit: 'per instrument',
      minOrder: '10 pieces'
    },
    specifications: [
      { label: 'Material', value: 'Surgical-grade stainless steel' },
      { label: 'Types', value: 'Forceps, scissors, clamps, specula' },
      { label: 'Finish', value: 'Mirror polished or matt' },
      { label: 'Sterilization', value: 'Autoclavable' }
    ],
    features: [
      'Precision engineering',
      'Non-corrosive',
      'Sharp and durable blades',
      'Ergonomic handles',
      'Lifetime durability'
    ]
  },
  {
    id: 'hospital-linen',
    slug: 'hospital-linen',
    name: 'Hospital Linen',
    image: 'https://images.pexels.com/photos/4108807/pexels-photo-4108807.jpeg?w=500&h=400&fit=crop',
    description: 'Medical-grade sheets, pillows, and linens',
    longDescription: 'Medical-grade bed linens, pillows, and blankets designed for hospital and healthcare facility use. Our linens are durable, easy to clean, and maintain hygiene standards.',
    pricing: {
      basePrice: '300',
      currency: 'KES',
      unit: 'per piece',
      minOrder: '20 pieces'
    },
    specifications: [
      { label: 'Material', value: '100% cotton or cotton-polyester blend' },
      { label: 'Types', value: 'Sheets, pillows, blankets, covers' },
      { label: 'Thread count', value: '200+ TC' },
      { label: 'Sizes', value: 'Single, double, queen' }
    ],
    features: [
      'Hypoallergenic',
      'High thread count',
      'Machine washable',
      'Fade-resistant',
      'Quick-drying'
    ]
  },
  {
    id: 'infection-control',
    slug: 'infection-control',
    name: 'Infection Control',
    image: 'https://images.pexels.com/photos/5128226/pexels-photo-5128226.jpeg?w=500&h=400&fit=crop',
    description: 'Disinfectants, sanitizers, and safety equipment',
    longDescription: 'Complete infection control solutions including hospital-grade disinfectants, hand sanitizers, and safety equipment. All products are EPA-approved and effective against bacteria, viruses, and fungi.',
    pricing: {
      basePrice: '800',
      currency: 'KES',
      unit: 'per liter',
      minOrder: '5 liters'
    },
    specifications: [
      { label: 'Types', value: 'Surface disinfectants, hand sanitizers, sterilants' },
      { label: 'Active ingredients', value: 'Alcohol, chlorine, quaternary ammonium' },
      { label: 'Effectiveness', value: 'Effective against COVID-19, bacteria, fungi' },
      { label: 'Packaging', value: '1L, 5L, 20L containers' }
    ],
    features: [
      'Broad-spectrum action',
      'Fast-acting formula',
      'Safe for healthcare workers',
      'Cost-effective',
      'Non-corrosive'
    ]
  },
  {
    id: 'ppe',
    slug: 'ppe',
    name: 'PPE',
    image: 'https://images.pexels.com/photos/3951356/pexels-photo-3951356.jpeg?w=500&h=400&fit=crop',
    description: 'Personal protective equipment and safety gear',
    longDescription: 'Comprehensive personal protective equipment (PPE) including face masks, gowns, face shields, and protective aprons. All products meet international safety standards and provide excellent protection.',
    pricing: {
      basePrice: '20',
      currency: 'KES',
      unit: 'per piece',
      minOrder: '100 pieces'
    },
    specifications: [
      { label: 'Items', value: 'Masks, gowns, shields, aprons, goggles' },
      { label: 'Levels', value: 'Level 1, 2, and 3' },
      { label: 'Material', value: 'Non-woven fabrics, polycarbonate' },
      { label: 'Certification', value: 'CE, FDA certified' }
    ],
    features: [
      'Comfortable fit',
      'Long-wearing comfort',
      'Breathable materials',
      'Latex-free',
      'Cost-effective'
    ]
  },
  {
    id: 'spirits-detergents',
    slug: 'spirits-detergents-and-disinfectants',
    name: 'Spirits, Detergents and Disinfectants',
    image: 'https://images.pexels.com/photos/4099260/pexels-photo-4099260.jpeg?w=500&h=400&fit=crop',
    description: 'Cleaning and sterilization products',
    longDescription: 'Professional-grade cleaning and sterilization products for hospitals and healthcare facilities. Our range includes isopropyl alcohol, surgical spirits, and hospital-grade detergents.',
    pricing: {
      basePrice: '600',
      currency: 'KES',
      unit: 'per liter',
      minOrder: '5 liters'
    },
    specifications: [
      { label: 'Types', value: 'Isopropyl alcohol, surgical spirits, detergents' },
      { label: 'Concentration', value: '70%, 95%, or 100%' },
      { label: 'Uses', value: 'Surface cleaning, instrument sterilization' },
      { label: 'Packaging', value: '1L, 5L, 20L bottles' }
    ],
    features: [
      'Hospital-grade strength',
      'Rapid evaporation',
      'Non-toxic formulation',
      'Pleasant odor',
      'Economical'
    ]
  },
  {
    id: 'syringes-needles',
    slug: 'syringes-and-needles',
    name: 'Syringes and Needles',
    image: 'https://images.pexels.com/photos/7723193/pexels-photo-7723193.jpeg?w=500&h=400&fit=crop',
    description: 'Sterile syringes and hypodermic needles',
    longDescription: 'Sterile, disposable syringes and needles for medical use. All products are individually packaged, pre-sterilized, and meet international medical standards. Available in various sizes and gauges.',
    pricing: {
      basePrice: '5',
      currency: 'KES',
      unit: 'per unit',
      minOrder: '100 units'
    },
    specifications: [
      { label: 'Syringe sizes', value: '1ml to 60ml' },
      { label: 'Needle gauges', value: '25G to 18G' },
      { label: 'Tip type', value: 'Luer lock or slip' },
      { label: 'Sterility', value: 'Sterile, pre-sterilized' }
    ],
    features: [
      'Clear measurement markings',
      'Luer lock compatibility',
      'Latex-free plungers',
      'Sharp needles',
      'Individually sterile packed'
    ]
  },
  {
    id: 'others',
    slug: 'others',
    name: 'Others',
    image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
    description: 'Additional medical supplies and accessories',
    longDescription: 'Miscellaneous medical supplies and healthcare accessories including thermometers, blood pressure monitors, stethoscopes, and other diagnostic aids. All products are high-quality and reliable.',
    pricing: {
      basePrice: 'Varies',
      currency: 'KES',
      unit: 'per unit',
      minOrder: 'Varies'
    },
    specifications: [
      { label: 'Items', value: 'Various medical accessories' },
      { label: 'Quality', value: 'Medical-grade materials' },
      { label: 'Certification', value: 'ISO, FDA approved' },
      { label: 'Support', value: 'Technical support available' }
    ],
    features: [
      'Wide variety',
      'Competitive pricing',
      'Reliable quality',
      'Technical support',
      'Bulk discounts available'
    ]
  }
];

export const categoryProducts: Record<string, Product[]> = {
  'bandages-tapes-and-dressings': [
    {
      id: 'bandages-tapes-001',
      name: 'Sterile Adhesive Bandages',
      slug: 'sterile-adhesive-bandages',
      sku: 'BTD-001',
      image: 'https://images.pexels.com/photos/5146554/pexels-photo-5146554.jpeg?w=500&h=400&fit=crop',
      description: 'Sterile adhesive bandages for wound care',
      longDescription: '',
      category: 'Bandages, Tapes and Dressings',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'bandages-tapes-002',
      name: 'Medical Tape Roll',
      slug: 'medical-tape-roll',
      sku: 'BTD-002',
      image: 'https://images.pexels.com/photos/5146554/pexels-photo-5146554.jpeg?w=500&h=400&fit=crop',
      description: 'Medical tape roll for secure fastening',
      longDescription: '',
      category: 'Bandages, Tapes and Dressings',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'bandages-tapes-003',
      name: 'Wound Dressings Pad',
      slug: 'wound-dressings-pad',
      sku: 'BTD-003',
      image: 'https://images.pexels.com/photos/5146554/pexels-photo-5146554.jpeg?w=500&h=400&fit=crop',
      description: 'Sterile wound dressing pads',
      longDescription: '',
      category: 'Bandages, Tapes and Dressings',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'bandages-tapes-004',
      name: 'Gauze Pads',
      slug: 'gauze-pads',
      sku: 'BTD-004',
      image: 'https://images.pexels.com/photos/5146554/pexels-photo-5146554.jpeg?w=500&h=400&fit=crop',
      description: 'High-quality gauze pads for medical use',
      longDescription: '',
      category: 'Bandages, Tapes and Dressings',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'bottles-and-containers': [
    {
      id: 'bottles-001',
      name: 'Sample Collection Bottle',
      slug: 'sample-collection-bottle',
      sku: 'BC-001',
      image: 'https://images.pexels.com/photos/5921726/pexels-photo-5921726.jpeg?w=500&h=400&fit=crop',
      description: 'Sterile sample collection bottles',
      longDescription: '',
      category: 'Bottles and Containers',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'bottles-002',
      name: 'Specimen Jar 100ml',
      slug: 'specimen-jar-100ml',
      sku: 'BC-002',
      image: 'https://images.pexels.com/photos/5921726/pexels-photo-5921726.jpeg?w=500&h=400&fit=crop',
      description: '100ml specimen jar with screw cap',
      longDescription: '',
      category: 'Bottles and Containers',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'bottles-003',
      name: 'Specimen Jar 500ml',
      slug: 'specimen-jar-500ml',
      sku: 'BC-003',
      image: 'https://images.pexels.com/photos/5921726/pexels-photo-5921726.jpeg?w=500&h=400&fit=crop',
      description: '500ml specimen jar for large samples',
      longDescription: '',
      category: 'Bottles and Containers',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'catheters-and-tubes': [
    {
      id: 'catheters-001',
      name: 'Urinary Catheter 16Fr',
      slug: 'urinary-catheter-16fr',
      sku: 'CAT-001',
      image: 'https://images.pexels.com/photos/8442032/pexels-photo-8442032.jpeg?w=500&h=400&fit=crop',
      description: 'Sterile urinary catheter 16Fr',
      longDescription: '',
      category: 'Catheters and Tubes',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'catheters-002',
      name: 'Nasogastric Tube',
      slug: 'nasogastric-tube',
      sku: 'CAT-002',
      image: 'https://images.pexels.com/photos/8442032/pexels-photo-8442032.jpeg?w=500&h=400&fit=crop',
      description: 'Medical-grade nasogastric tube',
      longDescription: '',
      category: 'Catheters and Tubes',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'catheters-003',
      name: 'Feeding Tube',
      slug: 'feeding-tube',
      sku: 'CAT-003',
      image: 'https://images.pexels.com/photos/8442032/pexels-photo-8442032.jpeg?w=500&h=400&fit=crop',
      description: 'Sterile feeding tube for patient nutrition',
      longDescription: '',
      category: 'Catheters and Tubes',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'cotton-wool': [
    {
      id: 'cotton-wool-001',
      name: 'Cotton Wool -50Gms Net Kings',
      slug: 'cotton-wool-50gms',
      sku: 'CW-050',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
      description: 'Pure cotton wool 50gms',
      longDescription: '',
      category: 'Cotton Wool',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'cotton-wool-002',
      name: 'Cotton Wool -500Gms Net Kings',
      slug: 'cotton-wool-500gms',
      sku: 'CW-500',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
      description: 'Pure cotton wool 500gms',
      longDescription: '',
      category: 'Cotton Wool',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'cotton-wool-003',
      name: 'Cotton Wool -400Gms Net Kings',
      slug: 'cotton-wool-400gms',
      sku: 'CW-400',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
      description: 'Pure cotton wool 400gms',
      longDescription: '',
      category: 'Cotton Wool',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'cotton-wool-004',
      name: 'Cotton Wool -1kg Roll',
      slug: 'cotton-wool-1kg',
      sku: 'CW-1KG',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
      description: 'Pure cotton wool 1kg roll',
      longDescription: '',
      category: 'Cotton Wool',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'diapers-and-sanitary': [
    {
      id: 'diapers-001',
      name: 'Adult Incontinence Diapers',
      slug: 'adult-incontinence-diapers',
      sku: 'DIP-001',
      image: 'https://images.pexels.com/photos/7692272/pexels-photo-7692272.jpeg?w=500&h=400&fit=crop',
      description: 'Adult incontinence diapers',
      longDescription: '',
      category: 'Diapers and Sanitary',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'diapers-002',
      name: 'Pediatric Diapers',
      slug: 'pediatric-diapers',
      sku: 'DIP-002',
      image: 'https://images.pexels.com/photos/7692272/pexels-photo-7692272.jpeg?w=500&h=400&fit=crop',
      description: 'High-quality pediatric diapers',
      longDescription: '',
      category: 'Diapers and Sanitary',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'diapers-003',
      name: 'Sanitary Pads',
      slug: 'sanitary-pads',
      sku: 'DIP-003',
      image: 'https://images.pexels.com/photos/7692272/pexels-photo-7692272.jpeg?w=500&h=400&fit=crop',
      description: 'Sanitary pads for women',
      longDescription: '',
      category: 'Diapers and Sanitary',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'gloves': [
    {
      id: 'gloves-001',
      name: 'Latex Examination Gloves',
      slug: 'latex-examination-gloves',
      sku: 'GLV-001',
      image: 'https://images.pexels.com/photos/4021267/pexels-photo-4021267.jpeg?w=500&h=400&fit=crop',
      description: 'Medical latex examination gloves',
      longDescription: '',
      category: 'Gloves',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'gloves-002',
      name: 'Nitrile Gloves',
      slug: 'nitrile-gloves',
      sku: 'GLV-002',
      image: 'https://images.pexels.com/photos/4021267/pexels-photo-4021267.jpeg?w=500&h=400&fit=crop',
      description: 'Latex-free nitrile gloves',
      longDescription: '',
      category: 'Gloves',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'gloves-003',
      name: 'Surgical Gloves',
      slug: 'surgical-gloves',
      sku: 'GLV-003',
      image: 'https://images.pexels.com/photos/4021267/pexels-photo-4021267.jpeg?w=500&h=400&fit=crop',
      description: 'Sterile surgical gloves',
      longDescription: '',
      category: 'Gloves',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'gloves-004',
      name: 'Vinyl Gloves',
      slug: 'vinyl-gloves',
      sku: 'GLV-004',
      image: 'https://images.pexels.com/photos/4021267/pexels-photo-4021267.jpeg?w=500&h=400&fit=crop',
      description: 'Vinyl examination gloves',
      longDescription: '',
      category: 'Gloves',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'hospital-equipments': [
    {
      id: 'hospital-equip-001',
      name: 'Patient Monitor',
      slug: 'patient-monitor',
      sku: 'HE-001',
      image: 'https://images.pexels.com/photos/3844581/pexels-photo-3844581.jpeg?w=500&h=400&fit=crop',
      description: 'Digital patient vital signs monitor',
      longDescription: '',
      category: 'Hospital Equipments',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-equip-002',
      name: 'Oxygen Concentrator',
      slug: 'oxygen-concentrator',
      sku: 'HE-002',
      image: 'https://images.pexels.com/photos/3844581/pexels-photo-3844581.jpeg?w=500&h=400&fit=crop',
      description: 'Medical oxygen concentrator',
      longDescription: '',
      category: 'Hospital Equipments',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-equip-003',
      name: 'Suction Machine',
      slug: 'suction-machine',
      sku: 'HE-003',
      image: 'https://images.pexels.com/photos/3844581/pexels-photo-3844581.jpeg?w=500&h=400&fit=crop',
      description: 'Hospital-grade suction machine',
      longDescription: '',
      category: 'Hospital Equipments',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'hospital-furniture': [
    {
      id: 'hospital-furn-001',
      name: 'Hospital Bed Manual',
      slug: 'hospital-bed-manual',
      sku: 'HF-001',
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?w=500&h=400&fit=crop',
      description: 'Manual hospital bed',
      longDescription: '',
      category: 'Hospital Furniture',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-furn-002',
      name: 'Electric Hospital Bed',
      slug: 'electric-hospital-bed',
      sku: 'HF-002',
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?w=500&h=400&fit=crop',
      description: 'Electric adjustable hospital bed',
      longDescription: '',
      category: 'Hospital Furniture',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-furn-003',
      name: 'Examination Table',
      slug: 'examination-table',
      sku: 'HF-003',
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?w=500&h=400&fit=crop',
      description: 'Medical examination table',
      longDescription: '',
      category: 'Hospital Furniture',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-furn-004',
      name: 'Hospital Trolley',
      slug: 'hospital-trolley',
      sku: 'HF-004',
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?w=500&h=400&fit=crop',
      description: 'Medical equipment trolley',
      longDescription: '',
      category: 'Hospital Furniture',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'hospital-instruments': [
    {
      id: 'hospital-inst-001',
      name: 'Surgical Scissors',
      slug: 'surgical-scissors',
      sku: 'HI-001',
      image: 'https://images.pexels.com/photos/4269355/pexels-photo-4269355.jpeg?w=500&h=400&fit=crop',
      description: 'Stainless steel surgical scissors',
      longDescription: '',
      category: 'Hospital Instruments',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-inst-002',
      name: 'Forceps',
      slug: 'forceps',
      sku: 'HI-002',
      image: 'https://images.pexels.com/photos/4269355/pexels-photo-4269355.jpeg?w=500&h=400&fit=crop',
      description: 'Medical forceps instrument',
      longDescription: '',
      category: 'Hospital Instruments',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-inst-003',
      name: 'Surgical Clamp',
      slug: 'surgical-clamp',
      sku: 'HI-003',
      image: 'https://images.pexels.com/photos/4269355/pexels-photo-4269355.jpeg?w=500&h=400&fit=crop',
      description: 'Hemostatic surgical clamp',
      longDescription: '',
      category: 'Hospital Instruments',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'hospital-linen': [
    {
      id: 'hospital-linen-001',
      name: 'Hospital Bed Sheet',
      slug: 'hospital-bed-sheet',
      sku: 'HL-001',
      image: 'https://images.pexels.com/photos/4108807/pexels-photo-4108807.jpeg?w=500&h=400&fit=crop',
      description: 'Medical-grade bed sheet',
      longDescription: '',
      category: 'Hospital Linen',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-linen-002',
      name: 'Pillowcase',
      slug: 'pillowcase',
      sku: 'HL-002',
      image: 'https://images.pexels.com/photos/4108807/pexels-photo-4108807.jpeg?w=500&h=400&fit=crop',
      description: 'Hospital pillowcase',
      longDescription: '',
      category: 'Hospital Linen',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'hospital-linen-003',
      name: 'Hospital Blanket',
      slug: 'hospital-blanket',
      sku: 'HL-003',
      image: 'https://images.pexels.com/photos/4108807/pexels-photo-4108807.jpeg?w=500&h=400&fit=crop',
      description: 'Medical blanket for patients',
      longDescription: '',
      category: 'Hospital Linen',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'infection-control': [
    {
      id: 'infection-001',
      name: 'Hospital Disinfectant',
      slug: 'hospital-disinfectant',
      sku: 'IC-001',
      image: 'https://images.pexels.com/photos/5128226/pexels-photo-5128226.jpeg?w=500&h=400&fit=crop',
      description: 'Hospital-grade disinfectant solution',
      longDescription: '',
      category: 'Infection Control',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'infection-002',
      name: 'Hand Sanitizer',
      slug: 'hand-sanitizer',
      sku: 'IC-002',
      image: 'https://images.pexels.com/photos/5128226/pexels-photo-5128226.jpeg?w=500&h=400&fit=crop',
      description: 'Antibacterial hand sanitizer',
      longDescription: '',
      category: 'Infection Control',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'infection-003',
      name: 'Surface Sterilant',
      slug: 'surface-sterilant',
      sku: 'IC-003',
      image: 'https://images.pexels.com/photos/5128226/pexels-photo-5128226.jpeg?w=500&h=400&fit=crop',
      description: 'Surface sterilization solution',
      longDescription: '',
      category: 'Infection Control',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'ppe': [
    {
      id: 'ppe-001',
      name: 'Face Mask N95',
      slug: 'face-mask-n95',
      sku: 'PPE-001',
      image: 'https://images.pexels.com/photos/3951356/pexels-photo-3951356.jpeg?w=500&h=400&fit=crop',
      description: 'N95 protective face mask',
      longDescription: '',
      category: 'PPE',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'ppe-002',
      name: 'Protective Gown',
      slug: 'protective-gown',
      sku: 'PPE-002',
      image: 'https://images.pexels.com/photos/3951356/pexels-photo-3951356.jpeg?w=500&h=400&fit=crop',
      description: 'Isolation protective gown',
      longDescription: '',
      category: 'PPE',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'ppe-003',
      name: 'Face Shield',
      slug: 'face-shield',
      sku: 'PPE-003',
      image: 'https://images.pexels.com/photos/3951356/pexels-photo-3951356.jpeg?w=500&h=400&fit=crop',
      description: 'Clear face shield protection',
      longDescription: '',
      category: 'PPE',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'ppe-004',
      name: 'Protective Apron',
      slug: 'protective-apron',
      sku: 'PPE-004',
      image: 'https://images.pexels.com/photos/3951356/pexels-photo-3951356.jpeg?w=500&h=400&fit=crop',
      description: 'Waterproof protective apron',
      longDescription: '',
      category: 'PPE',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'spirits-detergents-and-disinfectants': [
    {
      id: 'spirits-001',
      name: 'Isopropyl Alcohol 70%',
      slug: 'isopropyl-alcohol-70',
      sku: 'SDD-001',
      image: 'https://images.pexels.com/photos/4099260/pexels-photo-4099260.jpeg?w=500&h=400&fit=crop',
      description: 'Medical-grade isopropyl alcohol',
      longDescription: '',
      category: 'Spirits, Detergents and Disinfectants',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'spirits-002',
      name: 'Surgical Spirit',
      slug: 'surgical-spirit',
      sku: 'SDD-002',
      image: 'https://images.pexels.com/photos/4099260/pexels-photo-4099260.jpeg?w=500&h=400&fit=crop',
      description: 'Surgical spirit disinfectant',
      longDescription: '',
      category: 'Spirits, Detergents and Disinfectants',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'spirits-003',
      name: 'Hospital Detergent',
      slug: 'hospital-detergent',
      sku: 'SDD-003',
      image: 'https://images.pexels.com/photos/4099260/pexels-photo-4099260.jpeg?w=500&h=400&fit=crop',
      description: 'Hospital-grade cleaning detergent',
      longDescription: '',
      category: 'Spirits, Detergents and Disinfectants',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'syringes-and-needles': [
    {
      id: 'syringes-001',
      name: 'Sterile Syringe 5ml',
      slug: 'sterile-syringe-5ml',
      sku: 'SYR-005',
      image: 'https://images.pexels.com/photos/7723193/pexels-photo-7723193.jpeg?w=500&h=400&fit=crop',
      description: '5ml sterile syringe',
      longDescription: '',
      category: 'Syringes and Needles',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'syringes-002',
      name: 'Sterile Syringe 10ml',
      slug: 'sterile-syringe-10ml',
      sku: 'SYR-010',
      image: 'https://images.pexels.com/photos/7723193/pexels-photo-7723193.jpeg?w=500&h=400&fit=crop',
      description: '10ml sterile syringe',
      longDescription: '',
      category: 'Syringes and Needles',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'syringes-003',
      name: 'Hypodermic Needle 25G',
      slug: 'hypodermic-needle-25g',
      sku: 'HYP-025',
      image: 'https://images.pexels.com/photos/7723193/pexels-photo-7723193.jpeg?w=500&h=400&fit=crop',
      description: '25G hypodermic needle',
      longDescription: '',
      category: 'Syringes and Needles',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'syringes-004',
      name: 'Hypodermic Needle 18G',
      slug: 'hypodermic-needle-18g',
      sku: 'HYP-018',
      image: 'https://images.pexels.com/photos/7723193/pexels-photo-7723193.jpeg?w=500&h=400&fit=crop',
      description: '18G hypodermic needle',
      longDescription: '',
      category: 'Syringes and Needles',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ],
  'others': [
    {
      id: 'others-001',
      name: 'Digital Thermometer',
      slug: 'digital-thermometer',
      sku: 'OTH-001',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
      description: 'Digital clinical thermometer',
      longDescription: '',
      category: 'Others',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'others-002',
      name: 'Blood Pressure Monitor',
      slug: 'blood-pressure-monitor',
      sku: 'OTH-002',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
      description: 'Digital blood pressure monitor',
      longDescription: '',
      category: 'Others',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    },
    {
      id: 'others-003',
      name: 'Stethoscope',
      slug: 'stethoscope',
      sku: 'OTH-003',
      image: 'https://images.pexels.com/photos/6129902/pexels-photo-6129902.jpeg?w=500&h=400&fit=crop',
      description: 'Medical stethoscope',
      longDescription: '',
      category: 'Others',
      pricing: { basePrice: '', currency: 'KES', unit: '', minOrder: '' },
      specifications: [],
      features: []
    }
  ]
};

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find(product => product.slug === slug);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  return categoryProducts[categorySlug] || [];
};

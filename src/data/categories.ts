export const productCategories = [
  { name: 'Bandages, Tapes and Dressings', icon: '🩹', description: 'Complete range of medical dressings and bandages for wound care', slug: 'bandages-tapes-and-dressings' },
  { name: 'Bottles and Containers', icon: '🧴', description: 'Sterile containers for specimen collection and storage', slug: 'bottles-and-containers' },
  { name: 'Catheters and Tubes', icon: '💉', description: 'Medical-grade catheters and tubing systems', slug: 'catheters-and-tubes' },
  { name: 'Cotton Wool', icon: '☁️', description: 'High-quality absorbent cotton products', slug: 'cotton-wool' },
  { name: 'Diapers and Sanitary', icon: '👶', description: 'Adult and pediatric incontinence products', slug: 'diapers-and-sanitary' },
  { name: 'Gloves', icon: '🧤', description: 'Medical examination and surgical gloves', slug: 'gloves' },
  { name: 'Hospital Equipments', icon: '🏥', description: 'Advanced medical equipment and monitors', slug: 'hospital-equipments' },
  { name: 'Hospital Furniture', icon: '🛏️', description: 'Hospital beds, trolleys, and medical furniture', slug: 'hospital-furniture' },
  { name: 'Hospital Instruments', icon: '⚕️', description: 'Surgical and diagnostic instruments', slug: 'hospital-instruments' },
  { name: 'Hospital Linen', icon: '🧺', description: 'Medical-grade sheets, pillows, and linens', slug: 'hospital-linen' },
  { name: 'Infection Control', icon: '🛡️', description: 'Disinfectants, sanitizers, and safety equipment', slug: 'infection-control' },
  { name: 'Others', icon: '📦', description: 'Additional medical supplies and accessories', slug: 'others' },
  { name: 'PPE', icon: '🦺', description: 'Personal protective equipment and safety gear', slug: 'ppe' },
  { name: 'Spirits, Detergents and Disinfectants', icon: '🧼', description: 'Cleaning and sterilization products', slug: 'spirits-detergents-and-disinfectants' },
  { name: 'Syringes and Needles', icon: '💊', description: 'Sterile syringes and hypodermic needles', slug: 'syringes-and-needles' },
];

export const productCategoryNames = productCategories.map(cat => cat.name);

/**
 * Utility functions and constants for Geodeels Customer Shop
 */

export const BRAND = {
  name: 'Geodeels',
  tagline: 'High-Grade Hygiene & Cleaning Solutions',
  primaryGreen: '#196C36',
  darkGreen: '#145C2E',
  phone: '2348000000000', // Default sales phone
  whatsapp: '2348000000000',
};

export const CATEGORIES = [
  'All',
  'Disinfectant',
  'Toilet wash',
  'Dishwash',
  'Bleach'
];

/**
 * Demo / Sample catalog items specified by the brief.
 * Clearly marked as sample data so they are never mistaken for live inventory.
 */
export const DEMO_PRODUCTS = [
  {
    id: 'sample-izal-4l',
    name: 'Izal Germicide',
    category: 'Disinfectant',
    size: '4L',
    price_ngn: 10000,
    stock: 50,
    active: true,
    is_sample: true,
    description: 'High-potency concentrated disinfectant and germicide for deep cleaning, sanitation, and odour control in homes, clinics, and offices.',
    photo_url: '/products/izal.svg'
  },
  {
    id: 'sample-izal-1l',
    name: 'Izal Germicide',
    category: 'Disinfectant',
    size: '1L',
    price_ngn: 4000,
    stock: 65,
    active: true,
    is_sample: true,
    description: 'Household-size germicidal disinfectant fluid. Kills 99.9% of germs on floors, drains, and outdoor surrounds.',
    photo_url: '/products/izal.svg'
  },
  {
    id: 'sample-toilet-wash-4l',
    name: 'Toilet Wash Cleaner',
    category: 'Toilet wash',
    size: '4L',
    price_ngn: 7500,
    stock: 40,
    active: true,
    is_sample: true,
    description: 'Commercial 4L thick formula toilet cleaner. Dissolves stubborn limescale, kills germs, and deodorises ceramic bowls and urinals.',
    photo_url: '/products/toilet-wash.svg'
  },
  {
    id: 'sample-toilet-wash-1l',
    name: 'Toilet Wash Cleaner',
    category: 'Toilet wash',
    size: '1L',
    price_ngn: 3000,
    stock: 80,
    active: true,
    is_sample: true,
    description: 'Active cleaning formula toilet bowl descaler and stain remover for fresh, sanitary restrooms.',
    photo_url: '/products/toilet-wash.svg'
  },
  {
    id: 'sample-dishwash-1l',
    name: 'Dishwash Liquid',
    category: 'Dishwash',
    size: '1L',
    price_ngn: 2500,
    stock: 90,
    active: true,
    is_sample: true,
    description: 'Ultra-degreasing foaming dishwashing liquid. Tough on baked-on grease, gentle on hands, fresh citrus clean scent.',
    photo_url: '/products/dishwash.svg'
  },
  {
    id: 'sample-disgerm-500ml',
    name: 'Dis-germ Disinfectant',
    category: 'Disinfectant',
    size: '500ml',
    price_ngn: 5000,
    stock: 45,
    active: true,
    is_sample: true,
    description: 'Hospital-grade antiseptic germicide and surface disinfectant. Formulated for high-touch surface hygiene.',
    photo_url: '/products/dis-germ.svg'
  },
  {
    id: 'sample-disgerm-250ml',
    name: 'Dis-germ Disinfectant',
    category: 'Disinfectant',
    size: '250ml',
    price_ngn: 3000,
    stock: 60,
    active: true,
    is_sample: true,
    description: 'Compact personal/first-aid antiseptic disinfectant fluid for instant pathogen neutralisation.',
    photo_url: '/products/dis-germ.svg'
  },
  {
    id: 'sample-bleach-4l',
    name: 'Multipurpose Bleach',
    category: 'Bleach',
    size: '4L',
    price_ngn: 7500,
    stock: 35,
    active: true,
    is_sample: true,
    description: 'Industrial-strength sodium hypochlorite bleaching liquid. Whitens fabrics, disinfects tile surfaces, and sterilises washrooms.',
    photo_url: '/products/bleach.svg'
  },
  {
    id: 'sample-bleach-1l',
    name: 'Multipurpose Bleach',
    category: 'Bleach',
    size: '1L',
    price_ngn: 3000,
    stock: 75,
    active: true,
    is_sample: true,
    description: 'Everyday household chlorine bleach for brilliant white laundry, stain elimination, and bathroom sanitation.',
    photo_url: '/products/bleach.svg'
  }
];

/**
 * Format a number as Nigerian Naira (e.g. 10000 -> ₦10,000)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num) || num < 0) return '₦0';
  return `₦${Math.round(num).toLocaleString('en-US')}`;
}

/**
 * Filter product list by category and search keyword
 * @param {Array} products
 * @param {{ category?: string, search?: string }} options
 * @returns {Array}
 */
export function filterProducts(products = [], { category = 'All', search = '' } = {}) {
  if (!Array.isArray(products)) return [];

  return products.filter((p) => {
    if (!p) return false;

    // Category match
    const categoryMatch =
      !category ||
      category === 'All' ||
      (p.category && p.category.toLowerCase().trim() === category.toLowerCase().trim());

    if (!categoryMatch) return false;

    // Search query match
    if (!search || !search.trim()) return true;

    const q = search.toLowerCase().trim();
    const nameMatch = p.name && p.name.toLowerCase().includes(q);
    const catMatch = p.category && p.category.toLowerCase().includes(q);
    const sizeMatch = p.size && p.size.toLowerCase().includes(q);
    const descMatch = p.description && p.description.toLowerCase().includes(q);

    return Boolean(nameMatch || catMatch || sizeMatch || descMatch);
  });
}

/**
 * Determine if demo mode is enabled via URL search params or hash query
 * @param {string} searchString - e.g. location.search or location.hash
 * @returns {boolean}
 */
export function isDemoMode(searchString = '') {
  if (typeof searchString !== 'string') return false;
  // Checks ?demo=1 or &demo=1 or demo=true
  return (
    searchString.includes('demo=1') ||
    searchString.includes('demo=true') ||
    searchString.includes('demo=yes')
  );
}

/**
 * Escape HTML to prevent XSS in template literals
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build prefilled WhatsApp URL for instant customer inquiry or ordering
 * @param {string} phone
 * @param {{ name: string, size?: string, price?: number|string }} product
 * @returns {string}
 */
export function buildProductWhatsAppUrl(phone = BRAND.whatsapp, product = {}) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const productName = product.name || 'product';
  const sizeText = product.size ? ` (${product.size})` : '';
  const priceText = product.price_ngn != null ? ` for ${formatPrice(product.price_ngn)}` : '';
  const message = `Hello Geodeels, I would like to order ${productName}${sizeText}${priceText}. Please confirm delivery availability and payment details.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Utility functions and constants for Geodeels Customer Shop
 */

export const BRAND = {
  name: 'Geodeels',
  tagline: 'Hygiene & Cleaning Chemicals',
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
    description: 'Izal Germicide 4L',
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
    description: 'Izal Germicide 1L',
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
    description: 'Toilet Wash Cleaner 4L',
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
    description: 'Toilet Wash Cleaner 1L',
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
    description: 'Dishwash Liquid 1L',
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
    description: 'Dis-germ Disinfectant 500ml',
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
    description: 'Dis-germ Disinfectant 250ml',
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
    description: 'Multipurpose Bleach 4L',
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
    description: 'Multipurpose Bleach 1L',
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
 * Build prefilled WhatsApp URL for customer order
 * @param {string} phone
 * @param {{ name: string, size?: string, price_ngn?: number|string }} product
 * @param {{ name?: string, phone?: string }} [customer]
 * @returns {string}
 */
export function buildProductWhatsAppUrl(phone = BRAND.whatsapp, product = {}, customer = {}) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const productName = product.name || 'product';
  const sizeText = product.size ? ` ${product.size}` : '';
  const priceText = product.price_ngn != null ? ` for ${formatPrice(product.price_ngn)}` : '';
  let message = `Hello Geodeels, I would like to order ${productName}${sizeText}${priceText}.`;
  if (customer && (customer.name || customer.phone)) {
    const details = [];
    if (customer.name) details.push(`Name: ${customer.name}`);
    if (customer.phone) details.push(`Phone: ${customer.phone}`);
    message += ` ${details.join(', ')}.`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

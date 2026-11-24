import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  formatPrice,
  DEMO_PRODUCTS,
  filterProducts,
  isDemoMode,
  escapeHtml,
  buildProductWhatsAppUrl,
  CATEGORIES,
  BRAND
} from '../src/utils.js';
import { createShopOrder } from '../src/supabase.js';

describe('formatPrice', () => {
  it('formats whole numbers to standard Nigerian Naira currency format', () => {
    expect(formatPrice(10000)).toBe('₦10,000');
    expect(formatPrice(4000)).toBe('₦4,000');
    expect(formatPrice(7500)).toBe('₦7,500');
    expect(formatPrice(3000)).toBe('₦3,000');
    expect(formatPrice(2500)).toBe('₦2,500');
    expect(formatPrice(5000)).toBe('₦5,000');
  });

  it('handles numeric string inputs correctly', () => {
    expect(formatPrice('10000')).toBe('₦10,000');
    expect(formatPrice('7500')).toBe('₦7,500');
  });

  it('gracefully handles 0, negative, and invalid values', () => {
    expect(formatPrice(0)).toBe('₦0');
    expect(formatPrice(-500)).toBe('₦0');
    expect(formatPrice('invalid')).toBe('₦0');
    expect(formatPrice(null)).toBe('₦0');
    expect(formatPrice(undefined)).toBe('₦0');
  });
});

describe('Demo mode and sample catalog specifications', () => {
  it('contains all 9 required demo products specified by the brief', () => {
    expect(DEMO_PRODUCTS).toHaveLength(9);

    const expectedProducts = [
      { name: 'Izal Germicide', size: '4L', price: 10000 },
      { name: 'Izal Germicide', size: '1L', price: 4000 },
      { name: 'Toilet Wash Cleaner', size: '4L', price: 7500 },
      { name: 'Toilet Wash Cleaner', size: '1L', price: 3000 },
      { name: 'Dishwash Liquid', size: '1L', price: 2500 },
      { name: 'Dis-germ Disinfectant', size: '500ml', price: 5000 },
      { name: 'Dis-germ Disinfectant', size: '250ml', price: 3000 },
      { name: 'Multipurpose Bleach', size: '4L', price: 7500 },
      { name: 'Multipurpose Bleach', size: '1L', price: 3000 }
    ];

    expectedProducts.forEach((expected) => {
      const match = DEMO_PRODUCTS.find(
        (p) =>
          p.name === expected.name &&
          p.size === expected.size &&
          p.price_ngn === expected.price
      );
      expect(match).toBeDefined();
    });
  });

  it('marks all demo products clearly with is_sample = true', () => {
    DEMO_PRODUCTS.forEach((product) => {
      expect(product.is_sample).toBe(true);
      expect(product.stock).toBeGreaterThan(0);
      expect(product.active).toBe(true);
    });
  });

  it('detects demo query parameter correctly', () => {
    expect(isDemoMode('?demo=1')).toBe(true);
    expect(isDemoMode('&demo=1')).toBe(true);
    expect(isDemoMode('?ref=share&demo=1')).toBe(true);
    expect(isDemoMode('?demo=true')).toBe(true);
    expect(isDemoMode('#/?demo=1')).toBe(true);
    expect(isDemoMode('')).toBe(false);
    expect(isDemoMode('?live=1')).toBe(false);
    expect(isDemoMode(null)).toBe(false);
  });
});

describe('filterProducts', () => {
  it('returns all products when category is All and no search query', () => {
    const results = filterProducts(DEMO_PRODUCTS, { category: 'All' });
    expect(results).toHaveLength(9);
  });

  it('filters accurately by category chip', () => {
    const disinfectants = filterProducts(DEMO_PRODUCTS, { category: 'Disinfectant' });
    expect(disinfectants).toHaveLength(4);

    const toiletWashes = filterProducts(DEMO_PRODUCTS, { category: 'Toilet wash' });
    expect(toiletWashes).toHaveLength(2);

    const dishwashes = filterProducts(DEMO_PRODUCTS, { category: 'Dishwash' });
    expect(dishwashes).toHaveLength(1);

    const bleaches = filterProducts(DEMO_PRODUCTS, { category: 'Bleach' });
    expect(bleaches).toHaveLength(2);
  });

  it('filters accurately by search query', () => {
    const izalResults = filterProducts(DEMO_PRODUCTS, { search: 'izal' });
    expect(izalResults).toHaveLength(2);

    const fourLiterResults = filterProducts(DEMO_PRODUCTS, { search: '4L' });
    expect(fourLiterResults.length).toBeGreaterThanOrEqual(3);

    const nonExistent = filterProducts(DEMO_PRODUCTS, { search: 'nonexistentproductXYZ' });
    expect(nonExistent).toHaveLength(0);
  });

  it('handles empty or malformed inputs safely', () => {
    expect(filterProducts([])).toEqual([]);
    expect(filterProducts(null)).toEqual([]);
    expect(filterProducts(undefined)).toEqual([]);
  });
});

describe('escapeHtml', () => {
  it('escapes special characters to prevent XSS attacks', () => {
    const dirty = '<script>alert("xss")</script>&"\'';
    const clean = escapeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('&lt;script&gt;');
    expect(clean).toContain('&quot;');
    expect(clean).toContain('&#39;');
    expect(clean).toContain('&amp;');
  });

  it('handles null and undefined gracefully', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('buildProductWhatsAppUrl', () => {
  it('builds a prefilled WhatsApp link with product details and no delivery claims', () => {
    const url = buildProductWhatsAppUrl('2348000000000', {
      name: 'Izal Germicide',
      size: '4L',
      price_ngn: 10000
    });

    expect(url).toContain('https://wa.me/2348000000000?text=');
    const decoded = decodeURIComponent(url.split('?text=')[1]);
    expect(decoded).toContain('Izal Germicide');
    expect(decoded).toContain('4L');
    expect(decoded).toContain('₦10,000');
    expect(decoded.toLowerCase()).not.toContain('delivery');
  });

  it('includes customer name and phone when provided', () => {
    const url = buildProductWhatsAppUrl(
      '2348000000000',
      { name: 'Dishwash Liquid', size: '1L', price_ngn: 2500 },
      { name: 'Tunde Adebayo', phone: '08012345678' }
    );

    const decoded = decodeURIComponent(url.split('?text=')[1]);
    expect(decoded).toContain('Dishwash Liquid');
    expect(decoded).toContain('1L');
    expect(decoded).toContain('₦2,500');
    expect(decoded).toContain('Name: Tunde Adebayo');
    expect(decoded).toContain('Phone: 08012345678');
    expect(decoded.toLowerCase()).not.toContain('delivery');
  });
});

describe('Brand specifications and true claims compliance', () => {
  it('uses the brand name Geodeels with an s', () => {
    expect(BRAND.name).toBe('Geodeels');
    expect(BRAND.primaryGreen).toBe('#196C36');
    expect(BRAND.darkGreen).toBe('#145C2E');
    expect(BRAND.primaryGreen).not.toBe('#166534');
  });

  it('has categories matching customer shop requirements', () => {
    expect(CATEGORIES).toContain('All');
    expect(CATEGORIES).toContain('Disinfectant');
    expect(CATEGORIES).toContain('Toilet wash');
    expect(CATEGORIES).toContain('Dishwash');
    expect(CATEGORIES).toContain('Bleach');
  });

  it('enforces true claims only across demo catalog items with plain descriptions', () => {
    DEMO_PRODUCTS.forEach((product) => {
      const desc = (product.description || '').toLowerCase();
      expect(desc).not.toContain('hospital-grade');
      expect(desc).not.toContain('high-potency');
      expect(desc).not.toContain('ultra-degreasing');
      expect(desc).not.toContain('industrial-strength');
      expect(desc).not.toContain('antiseptic');
      expect(desc).not.toContain('pure active ingredients');
      expect(desc).not.toContain('nationwide delivery');
      expect(desc).not.toContain('direct factory supply');
      expect(desc).not.toContain('factory-direct');
      expect(desc).not.toContain('99.9');
      expect(desc).not.toContain('sanitis');
      expect(desc).not.toContain('kills');
      expect(desc).not.toContain('clinic');
      expect(desc).not.toContain('citrus');
      expect(product.size).not.toBe('25L');
    });
  });

  it('ensures product SVG label artwork is free of unconfirmed marketing and efficacy claims', () => {
    const svgDir = path.resolve(__dirname, '../public/products');
    const svgFiles = fs.readdirSync(svgDir).filter((file) => file.endsWith('.svg'));
    expect(svgFiles.length).toBeGreaterThanOrEqual(5);

    svgFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(svgDir, file), 'utf8');
      expect(content).not.toContain('99.9');
      expect(content).not.toContain('99.9%');
      expect(content.toLowerCase()).not.toContain('sanitising');
      expect(content.toLowerCase()).not.toContain('hospital-grade');
      expect(content.toLowerCase()).not.toContain('direct factory supply');
      expect(content.toLowerCase()).not.toContain('factory-direct');
      expect(content.toLowerCase()).not.toContain('antiseptic');
      expect(content).not.toContain('3.5%');
    });
  });

  it('ensures banned claims are absent from UI markup and metadata', () => {
    const mainJsContent = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');
    const indexHtmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    const utilsContent = fs.readFileSync(path.resolve(__dirname, '../src/utils.js'), 'utf8');

    const combined = `${mainJsContent}\n${indexHtmlContent}\n${utilsContent}`;

    expect(combined).not.toContain('Direct factory supply');
    expect(combined).not.toContain('Factory-Direct');
    expect(combined).not.toContain('factory-direct');
    expect(combined).not.toContain('hospital-grade');
    expect(combined).not.toContain('High-grade');
    expect(combined).not.toContain('high-potency');
    expect(combined).not.toContain('industrial-strength');
    expect(combined).not.toContain('ultra-degreasing');
    expect(combined).not.toContain('antiseptic');
    expect(combined).not.toContain('99.9%');
    expect(combined.toLowerCase()).not.toContain('clinics');
    expect(combined.toLowerCase()).not.toContain('delivery availability');

    // Button label does not contain dev/internal query param
    expect(mainJsContent).not.toContain('(?demo=1)</button>');
    expect(mainJsContent).toContain('View sample products');

    // Product card clutter removed
    expect(mainJsContent).not.toContain('Single flat price');
    expect(mainJsContent).not.toContain('hero-eyebrow');
  });

  it('uses each allowed true claim exactly once in the storefront view', () => {
    const mainJsContent = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');

    // "Fixed factory pricing" should occur exactly once in page template
    const fixedPricingMatches = mainJsContent.match(/Fixed factory pricing/g) || [];
    expect(fixedPricingMatches).toHaveLength(1);

    // "One price for everyone" should occur exactly once (removed duplicate pricing-promise pill)
    const onePriceMatches = mainJsContent.match(/One price for everyone/gi) || [];
    expect(onePriceMatches).toHaveLength(1);
  });
});

describe('Simple order flow specifications', () => {
  it('defines order sheet modal with required customer name and phone inputs', () => {
    const mainJsContent = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');

    // Order modal elements
    expect(mainJsContent).toContain('order-modal-backdrop');
    expect(mainJsContent).toContain('order-modal-sheet');
    expect(mainJsContent).toContain('modal-customer-name');
    expect(mainJsContent).toContain('modal-customer-phone');
    expect(mainJsContent).toContain('modal-submit-btn');

    // Enforces validation check
    expect(mainJsContent).toContain('Please enter both your name and phone number.');
  });

  it('allows switching size variants in order modal when multiple sizes exist', () => {
    const mainJsContent = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');

    // Size selector rendering
    expect(mainJsContent).toContain('modal-size-selector');
    expect(mainJsContent).toContain('modal-size-pill');
    expect(mainJsContent).toContain('data-variant-id');
  });

  it('handles order insertion non-blockingly without throwing', async () => {
    // Attempt insert when table does not exist or client returns error
    const res = await createShopOrder({
      customerName: 'Test Buyer',
      customerPhone: '08000000000',
      product: { id: 'sample-1', name: 'Izal', size: '1L', price_ngn: 4000 }
    });

    // Should return result object with data/error, never throws
    expect(res).toBeDefined();
    expect(typeof res).toBe('object');
  });
});

describe('Design tokens and responsiveness compliance', () => {
  it('maintains slim slate #1E293B demo bar and brand colors', () => {
    const styleContent = fs.readFileSync(path.resolve(__dirname, '../src/style.css'), 'utf8');

    expect(styleContent).toContain('var(--color-demo-bar-bg, #1E293B)');
    expect(styleContent).toContain('var(--color-demo-bar-text, #F8FAFC)');
    expect(styleContent).toContain('--color-brand-primary: #196C36;');
    expect(styleContent).toContain('--color-brand-hover: #145C2E;');
    expect(styleContent).not.toContain('#166534');
  });

  it('includes styles for bottom sheet modal on mobile and dialog on desktop', () => {
    const styleContent = fs.readFileSync(path.resolve(__dirname, '../src/style.css'), 'utf8');

    expect(styleContent).toContain('.modal-backdrop');
    expect(styleContent).toContain('.modal-sheet');
    expect(styleContent).toContain('body.modal-open');
    expect(styleContent).toContain('.modal-submit-btn');
  });
});

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
    // Izal 4L, Izal 1L, Dis-germ 500ml, Dis-germ 250ml
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
  it('builds a prefilled WhatsApp link with product details', () => {
    const url = buildProductWhatsAppUrl('2348000000000', {
      name: 'Izal Germicide',
      size: '4L',
      price_ngn: 10000
    });

    expect(url).toContain('https://wa.me/2348000000000?text=');
    const decoded = decodeURIComponent(url.split('?text=')[1]);
    expect(decoded).toContain('Izal Germicide');
    expect(decoded).toContain('(4L)');
    expect(decoded).toContain('₦10,000');
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

  it('enforces true claims only across demo catalog items', () => {
    DEMO_PRODUCTS.forEach((product) => {
      const desc = (product.description || '').toLowerCase();
      expect(desc).not.toContain('hospital-grade');
      expect(desc).not.toContain('pure active ingredients');
      expect(desc).not.toContain('nationwide delivery');
      expect(desc).not.toContain('direct factory supply');
      expect(desc).not.toContain('factory-direct');
      expect(desc).not.toContain('99.9');
      expect(desc).not.toContain('99.9% sanitising');
      expect(desc).not.toContain('kills');
      expect(desc).not.toContain('pathogen');
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
      expect(content).not.toContain('3.5%');
    });
  });

  it('ensures unconfirmed claims ("Direct factory supply", "Factory-direct sanitation") are absent from UI markup', () => {
    const mainJsPath = path.resolve(__dirname, '../src/main.js');
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

    expect(mainJsContent).not.toContain('Direct factory supply');
    expect(mainJsContent).not.toContain('Factory-Direct Sanitation');
    expect(mainJsContent).not.toContain('Factory-direct');
    expect(mainJsContent).not.toContain('99.9%');
    expect(mainJsContent.toLowerCase()).not.toContain('hospital-grade');

    // Confirm required confirmed claims are preserved
    expect(mainJsContent).toContain('Fixed factory pricing');
    expect(mainJsContent).toContain('One price for everyone');
  });

  it('correctly pluralizes item counts', () => {
    const pluralize = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;
    expect(pluralize(1)).toBe('1 item');
    expect(pluralize(9)).toBe('9 items');
    expect(pluralize(0)).toBe('0 items');
  });
});

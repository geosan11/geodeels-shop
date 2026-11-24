import {
  BRAND,
  CATEGORIES,
  DEMO_PRODUCTS,
  formatPrice,
  filterProducts,
  isDemoMode,
  escapeHtml,
  buildProductWhatsAppUrl
} from './utils.js';
import { fetchStorefrontProducts, isSupabaseConfigured } from './supabase.js';

// SVG Icons (clean, high-contrast strokes)
const ICONS = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  clear: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  whatsapp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.782-.879-2.057-.98-.276-.1-.477-.15-.678.15-.201.301-.778.98-.954 1.18-.176.2-.352.226-.653.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.785-1.676-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.1-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.237-.245-.588-.493-.508-.678-.518l-.578-.01c-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.124 3.244 5.146 4.549.719.31 1.28.496 1.718.636.722.229 1.378.197 1.898.119.579-.088 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zm-5.467 7.426h-.005a9.882 9.882 0 0 1-5.034-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 0 1-1.514-5.26c0-5.46 4.444-9.904 9.909-9.904 2.646 0 5.132 1.031 7.001 2.903a9.839 9.839 0 0 1 2.899 7.003c-.002 5.462-4.447 9.906-9.914 9.906zM20.52 3.484C18.257 1.22 15.245 0 12.005 0 5.44 0 .092 5.347.09 11.913a11.85 11.85 0 0 0 1.815 6.275L0 24l5.986-1.57a11.89 11.89 0 0 0 5.998 1.62h.005c6.564 0 11.913-5.348 11.915-11.915 0-3.182-1.24-6.195-3.384-8.651z"/></svg>`,
  shield: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  truck: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  package: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`
};

// Application State
export const state = {
  products: [],
  currentCategory: 'All',
  searchQuery: '',
  isLoading: true,
  isDemo: false,
  error: null
};

/**
 * Determine default visual for category when photo_url is missing
 */
function getProductPhoto(product) {
  if (product.photo_url) return product.photo_url;

  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  if (name.includes('izal')) return '/products/izal.svg';
  if (name.includes('toilet') || cat.includes('toilet')) return '/products/toilet-wash.svg';
  if (name.includes('dish') || cat.includes('dish')) return '/products/dishwash.svg';
  if (name.includes('dis-germ') || name.includes('germ')) return '/products/dis-germ.svg';
  if (name.includes('bleach') || cat.includes('bleach')) return '/products/bleach.svg';

  return '/products/izal.svg';
}

/**
 * Render product cards
 */
function renderProductCards(products, isDemo) {
  return products
    .map((product) => {
      const photo = getProductPhoto(product);
      const isSample = isDemo || Boolean(product.is_sample);
      const whatsAppUrl = buildProductWhatsAppUrl(BRAND.whatsapp, product);

      return `
        <article class="product-card" data-product-id="${escapeHtml(product.id)}">
          <div class="product-image-container">
            ${
              isSample
                ? `<span class="sample-badge"><span class="sample-dot" aria-hidden="true"></span>Demo Item</span>`
                : ''
            }
            <span class="size-tag">${escapeHtml(product.size)}</span>
            <img
              src="${escapeHtml(photo)}"
              alt="${escapeHtml(product.name)} ${escapeHtml(product.size)}"
              class="product-image"
              loading="lazy"
            />
          </div>

          <div class="product-info">
            <div class="product-category-row">
              <span class="product-category">${escapeHtml(product.category)}</span>
            </div>

            <h2 class="product-title">${escapeHtml(product.name)}</h2>

            <div class="product-size-desc">
              <span>Size:</span>
              <span class="size-pill-inline">${escapeHtml(product.size)}</span>
            </div>

            <div class="product-price-row">
              <div>
                <span class="product-price">${escapeHtml(formatPrice(product.price_ngn))}</span>
              </div>
              <span class="price-subtext">Single flat price</span>
            </div>

            <a
              href="${escapeHtml(whatsAppUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              class="product-card-btn"
              aria-label="Order ${escapeHtml(product.name)} ${escapeHtml(product.size)} on WhatsApp"
            >
              ${ICONS.whatsapp}
              <span>Order on WhatsApp</span>
            </a>
          </div>
        </article>
      `;
    })
    .join('');
}

/**
 * Render complete application UI
 */
export function renderApp() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  const filtered = filterProducts(state.products, {
    category: state.currentCategory,
    search: state.searchQuery
  });

  const demoQueryString = state.isDemo ? '?demo=1' : '';
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const searchPlaceholder = isMobile
    ? 'Search Izal, bleach, dishwash...'
    : 'Search Izal, bleach, dishwash, toilet wash...';

  appEl.innerHTML = `
    <!-- Demo Mode Top Banner -->
    ${
      state.isDemo
        ? `
      <div class="demo-banner" role="status" aria-live="polite">
        <div class="demo-banner-content">
          <span class="demo-banner-pill">Demo Mode</span>
          <span>Showing ${state.products.length} sample catalog ${state.products.length === 1 ? 'item' : 'items'} for testing. These are not live inventory.</span>
        </div>
        <a href="/" class="demo-banner-exit" id="exit-demo-link" aria-label="Switch to live store">Exit Demo</a>
      </div>
    `
        : ''
    }

    <!-- Site Header -->
    <header class="site-header">
      <div class="page-container">
        <div class="header-inner">
          <a href="/${demoQueryString}" class="brand-link" aria-label="Geodeels Home">
            <img
              src="/logo-geodeels.png"
              alt="Geodeels Logo"
              class="brand-logo-img"
              width="40"
              height="40"
            />
            <div class="brand-text-block">
              <span class="brand-name">${BRAND.name}</span>
              <span class="brand-tagline">Chemical &amp; Hygiene Solutions</span>
            </div>
          </a>

          <div class="header-actions">
            <a
              href="https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hello Geodeels, I would like to order hygiene and cleaning chemicals.')}"
              target="_blank"
              rel="noopener noreferrer"
              class="header-whatsapp-btn"
              aria-label="Order on WhatsApp"
            >
              ${ICONS.whatsapp}
              <span>Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </header>

    <main class="page-container" id="main-content">
      <!-- Clean Hero Value Card -->
      <section class="hero-section" aria-label="Overview">
        <div class="hero-card">
          <div class="hero-content">
            <div class="hero-pill">
              <span>Geodeels</span>
            </div>
            <h1 class="hero-title">Hygiene &amp; Disinfectant Chemicals</h1>
            <p class="hero-desc">
              Reliable cleaning and disinfectant chemicals for Nigerian households, offices, hotels, and businesses. Fixed factory pricing.
            </p>
            <div class="hero-badges">
              <span class="hero-badge-item">${ICONS.check} Fixed factory pricing</span>
              <span class="hero-badge-item">${ICONS.check} One price for everyone</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Search & Filters -->
      <section class="controls-section" aria-label="Catalog Search and Filter">
        <div class="search-input-wrapper">
          <span class="search-icon-left" aria-hidden="true">${ICONS.search}</span>
          <input
            type="search"
            id="catalog-search"
            class="search-input"
            placeholder="${searchPlaceholder}"
            value="${escapeHtml(state.searchQuery)}"
            aria-label="Search chemical products"
          />
          ${
            state.searchQuery
              ? `
            <button
              type="button"
              class="search-clear-btn"
              id="clear-search-btn"
              aria-label="Clear search input"
            >
              ${ICONS.clear}
            </button>
          `
              : ''
          }
        </div>
      </section>

      <!-- Category Chips Bar (Mobile Tap Target >= 44px) -->
      <nav class="categories-section" aria-label="Product Categories">
        <ul class="categories-list" role="tablist">
          ${CATEGORIES.map(
            (cat) => `
            <li role="presentation">
              <button
                type="button"
                role="tab"
                class="category-chip ${state.currentCategory === cat ? 'active' : ''}"
                data-category="${escapeHtml(cat)}"
                aria-selected="${state.currentCategory === cat}"
                aria-label="Show ${escapeHtml(cat)} products"
              >
                ${escapeHtml(cat)}
              </button>
            </li>
          `
          ).join('')}
        </ul>
      </nav>

      <!-- Catalog Section -->
      <section class="catalog-section" aria-label="Product Catalog">
        <div class="section-header">
          <div class="section-title-group">
            <h2 class="section-title">
              ${state.currentCategory === 'All' ? 'All Products' : escapeHtml(state.currentCategory)}
            </h2>
            <span class="section-count">${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}</span>
          </div>

          <span class="pricing-promise">One Price For Everyone</span>
        </div>

        ${
          state.isLoading
            ? `
          <div class="empty-state" role="status">
            <p class="empty-state-text">Loading catalog products...</p>
          </div>
        `
            : filtered.length === 0
            ? `
          <div class="empty-state" role="status">
            <div class="empty-state-icon">
              ${ICONS.package}
            </div>
            <h3 class="empty-state-title">
              ${
                state.searchQuery
                  ? `No products matching "${escapeHtml(state.searchQuery)}"`
                  : state.isDemo
                  ? 'No products in this category'
                  : 'No Products in Live Catalog Yet'
              }
            </h3>
            <p class="empty-state-text">
              ${
                state.searchQuery
                  ? 'Try checking for spelling errors or clear your search query to see all available products.'
                  : state.isDemo
                  ? 'Try selecting "All" or a different category to view available sample chemical items.'
                  : 'Our live inventory is currently restocking. You can preview our sample catalog (?demo=1) or contact our sales team directly.'
              }
            </p>
            <div class="empty-state-actions">
              ${
                state.searchQuery || state.currentCategory !== 'All'
                  ? `<button type="button" class="btn-secondary" id="reset-filters-btn">Reset All Filters</button>`
                  : ''
              }
              ${
                !state.isDemo
                  ? `<button type="button" class="btn-primary" id="activate-demo-btn">View Sample Catalog (?demo=1)</button>`
                  : ''
              }
              <a
                href="https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hello Geodeels, I want to inquire about your product pricing and stock.')}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-secondary"
              >
                ${ICONS.whatsapp}
                <span>Chat With Sales</span>
              </a>
            </div>
          </div>
        `
            : `
          <div class="product-grid" id="product-grid">
            ${renderProductCards(filtered, state.isDemo)}
          </div>
        `
        }
      </section>
    </main>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="page-container">
        <div class="footer-inner">
          <div class="footer-brand-col">
            <img src="/logo-geodeels.png" alt="Geodeels" class="footer-logo" width="36" height="36" />
            <p class="footer-copy">
              <strong>${BRAND.name}</strong> • High-grade hygiene &amp; cleaning chemicals.<br />
              Lagos, Nigeria.
            </p>
          </div>
          <div class="footer-links">
            <span class="footer-copy">© 2026 ${BRAND.name}. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  `;

  attachEventHandlers();
}

/**
 * Attach UI event listeners
 */
function attachEventHandlers() {
  // Category chips
  const chips = document.querySelectorAll('.category-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const category = chip.getAttribute('data-category');
      if (category && category !== state.currentCategory) {
        state.currentCategory = category;
        renderApp();
      }
    });
  });

  // Search input
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderApp();
      // Keep focus on input after re-render
      const newSearch = document.getElementById('catalog-search');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
      }
    });
  }

  // Clear search
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      renderApp();
    });
  }

  // Reset filters
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.searchQuery = '';
      state.currentCategory = 'All';
      renderApp();
    });
  }

  // Toggle demo mode button
  const toggleDemoBtn = document.getElementById('toggle-demo-btn');
  if (toggleDemoBtn) {
    toggleDemoBtn.addEventListener('click', () => {
      toggleDemoMode();
    });
  }

  // Activate demo button in empty state
  const activateDemoBtn = document.getElementById('activate-demo-btn');
  if (activateDemoBtn) {
    activateDemoBtn.addEventListener('click', () => {
      activateDemoMode();
    });
  }

  // Exit demo link in banner
  const exitDemoLink = document.getElementById('exit-demo-link');
  if (exitDemoLink) {
    exitDemoLink.addEventListener('click', (e) => {
      e.preventDefault();
      deactivateDemoMode();
    });
  }
}

function activateDemoMode() {
  state.isDemo = true;
  state.products = DEMO_PRODUCTS;
  state.isLoading = false;
  const url = new URL(window.location.href);
  url.searchParams.set('demo', '1');
  window.history.pushState({}, '', url.toString());
  renderApp();
}

function deactivateDemoMode() {
  state.isDemo = false;
  state.isLoading = true;
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  window.history.pushState({}, '', url.toString());
  loadStorefrontData();
}

function toggleDemoMode() {
  if (state.isDemo) {
    deactivateDemoMode();
  } else {
    activateDemoMode();
  }
}

/**
 * Load initial catalog data (Supabase or Demo fallback)
 */
async function loadStorefrontData() {
  const currentSearch = window.location.search || window.location.hash || '';
  const demoActive = isDemoMode(currentSearch);

  if (demoActive) {
    state.isDemo = true;
    state.products = DEMO_PRODUCTS;
    state.isLoading = false;
    renderApp();
    return;
  }

  state.isDemo = false;
  state.isLoading = true;
  renderApp();

  try {
    const { data, error } = await fetchStorefrontProducts();
    if (error || !data || data.length === 0) {
      // Supabase has no rows yet or returned error: friendly empty state
      state.products = [];
      state.error = error;
    } else {
      state.products = data;
      state.error = null;
    }
  } catch (err) {
    state.products = [];
    state.error = err;
  } finally {
    state.isLoading = false;
    renderApp();
  }
}

// Expose state and render helper for debugging and headless Chrome testing
window.__appState = state;
window.__renderApp = renderApp;
window.__loadStorefrontData = loadStorefrontData;

// Bootstrap on DOM content loaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    loadStorefrontData();
  });

  window.addEventListener('resize', () => {
    const input = document.getElementById('catalog-search');
    if (input) {
      input.placeholder = window.innerWidth <= 640
        ? 'Search Izal, bleach, dishwash...'
        : 'Search Izal, bleach, dishwash, toilet wash...';
    }
  });
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xuebdwvffaucivgcctai.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_84Yi1icWBZYiQB6ZaSGafg_tGaEEy4N';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.trim().startsWith('http') &&
  supabaseKey.trim().length > 10
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Fetch storefront products from Supabase.
 * Only returns active products with stock > 0 as permitted by RLS.
 * Handles table non-existence or network errors safely.
 * @returns {Promise<{ data: Array, error: Error|null, isFallback: boolean }>}
 */
export async function fetchStorefrontProducts() {
  if (!supabase) {
    return { data: [], error: new Error('Supabase client is not configured'), isFallback: true };
  }

  try {
    const { data, error } = await supabase
      .from('shop_products')
      .select('id, name, category, size, price_ngn, stock, photo_url, active, sort, created_at')
      .eq('active', true)
      .gt('stock', 0)
      .order('sort', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch shop_products from Supabase:', error.message);
      return { data: [], error, isFallback: true };
    }

    return { data: data || [], error: null, isFallback: false };
  } catch (err) {
    console.warn('Network or database exception fetching shop_products:', err);
    return { data: [], error: err, isFallback: true };
  }
}

/**
 * Attempt to record an order into shop_orders table if it exists.
 * Does not throw and does not block the customer if table does not exist.
 * @param {{ customerName: string, customerPhone: string, product: object }} orderData
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export async function createShopOrder({ customerName, customerPhone, product }) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  try {
    const { data, error } = await supabase.from('shop_orders').insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      items: [
        {
          product_id: product?.id || null,
          name: product?.name || '',
          size: product?.size || '',
          price_ngn: product?.price_ngn || 0,
          quantity: 1
        }
      ],
      total_ngn: product?.price_ngn || 0,
      status: 'new'
    });

    if (error) {
      console.warn('Could not insert into shop_orders:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.warn('Exception during shop_orders insert:', err);
    return { data: null, error: err };
  }
}

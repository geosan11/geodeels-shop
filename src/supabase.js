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

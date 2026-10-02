import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lakuqxnlgqaquvssyhed.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_59HDyjltZ_CRAI44P5Kv8w_3dXbKfnP';

// Retrieve credentials from .env or browser localStorage, with default to production project
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    '';
  const envKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY ||
    '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('atelier_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('atelier_supabase_anon_key') || '' : '';

  const rawUrl = (envUrl || localUrl || DEFAULT_SUPABASE_URL).trim();
  const rawKey = (envKey || localKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  // If placeholder URL was configured, override with real production project
  const url = rawUrl.includes('placeholder') ? DEFAULT_SUPABASE_URL : rawUrl;
  const anonKey = rawKey.includes('placeholder') ? DEFAULT_SUPABASE_ANON_KEY : rawKey;

  // Basic check: must have http/https and key must not be empty
  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 20 &&
    !url.includes('placeholder')
  );

  return { url, anonKey, isConfigured };
}

let supabaseInstance: SupabaseClient | null = null;

function initSupabase(): SupabaseClient {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (isConfigured) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize live Supabase client, using fallback placeholder', e);
    }
  }

  // Safe fallback placeholder client to avoid runtime null-reference crashes
  const fallbackUrl = 'https://placeholder.supabase.co';
  const fallbackKey = 'placeholder-anon-key-that-prevents-crashing-1234567890';
  supabaseInstance = createClient(fallbackUrl, fallbackKey);
  return supabaseInstance;
}

export const supabase = initSupabase();

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().isConfigured;
}

export function saveSupabaseCredentials(url: string, anonKey: string): boolean {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://')) {
      return false;
    }

    localStorage.setItem('atelier_supabase_url', cleanUrl);
    localStorage.setItem('atelier_supabase_anon_key', cleanKey);
    // Re-initialize client
    initSupabase();
    return true;
  } catch (e) {
    console.error('Error saving Supabase credentials', e);
    return false;
  }
}

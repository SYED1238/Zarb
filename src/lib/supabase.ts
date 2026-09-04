import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from .env or browser localStorage
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('atelier_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('atelier_supabase_anon_key') || '' : '';

  const url = (envUrl || localUrl).trim();
  const anonKey = (envKey || localKey).trim();

  // Basic check: must have http/https and key must not be empty
  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 20 &&
    !url.includes('your-project-id')
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

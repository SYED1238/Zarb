/**
 * ZARB Haute Couture — Luxury Geolocation & Address Resolution Utility
 * 
 * Provides high-precision GPS detection via browser Geolocation API with:
 * 1. OpenStreetMap Nominatim reverse geocoding (exact street, colony, city, state, PIN code)
 * 2. BigDataCloud reverse geocoding fallback
 * 3. Network / IP-based locality fallback if GPS permission is denied or unavailable
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DetectedAddress {
  address: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  source: 'gps' | 'ip';
  accuracy?: number;
  displayName?: string;
}

export interface GeolocationResult {
  success: boolean;
  address?: DetectedAddress;
  error?: string;
  isPermissionDenied?: boolean;
}

/**
 * Format raw city string by cleaning up municipal administrative suffixes
 */
function cleanCityName(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s+(City\s+)?District/i, '')
    .replace(/\s+Zone\s+\d+/i, '')
    .replace(/\s+Corporation/i, '')
    .trim();
}

/**
 * Reverse geocoding via OpenStreetMap Nominatim
 */
export async function reverseGeocodeCoordinates(lat: number, lon: number): Promise<DetectedAddress | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ZarbLuxuryBoutique/1.0 (client-concierge@zarb-couture.com)',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });

    if (!res.ok) {
      // Fallback to secondary reverse geocoder
      return await reverseGeocodeBigDataCloud(lat, lon);
    }
    const data = await res.json();
    const a = data.address || {};

    // Construct street address
    const streetParts = [
      a.house_number,
      a.building,
      a.road || a.pedestrian || a.suburb,
      a.neighbourhood || a.residential,
    ].filter(Boolean);

    const street =
      streetParts.join(', ') ||
      (data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : '');

    // Apartment / Building
    const apartment = a.building || (a.house_number ? `Building ${a.house_number}` : '');

    // Clean city
    const city = cleanCityName(
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.city_district ||
      a.state_district ||
      a.suburb ||
      ''
    );

    const state = a.state || a.state_district || '';
    const postalCode = a.postcode || '';
    const country = a.country || 'India';

    return {
      address: street,
      apartment,
      city,
      state,
      postalCode,
      country,
      source: 'gps',
      displayName: data.display_name || `${city}, ${state}`,
    };
  } catch (err) {
    console.warn('Nominatim reverse geocode failed, attempting secondary provider:', err);
    return await reverseGeocodeBigDataCloud(lat, lon);
  }
}

/**
 * Search autocomplete for Indian addresses, landmarks, and localities
 */
export async function searchIndiaAddress(query: string): Promise<Array<{
  lat: number;
  lon: number;
  displayName: string;
  postcode?: string;
  city?: string;
  state?: string;
}>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const q = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&countrycodes=in&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ZarbLuxuryBoutique/1.0 (client-concierge@zarb-couture.com)',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((d: any) => ({
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
      displayName: d.display_name,
      postcode: d.address?.postcode || '',
      city: cleanCityName(d.address?.city || d.address?.town || d.address?.locality || ''),
      state: d.address?.state || '',
    }));
  } catch (e) {
    console.warn('Error searching Indian addresses:', e);
    return [];
  }
}

/**
 * Secondary reverse geocode via BigDataCloud
 */
async function reverseGeocodeBigDataCloud(lat: number, lon: number): Promise<DetectedAddress | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const localityParts = [data.locality, data.city].filter(Boolean);
    const uniqueLocality = Array.from(new Set(localityParts)).join(', ');

    return {
      address: uniqueLocality || data.city || 'Detected Location',
      apartment: '',
      city: cleanCityName(data.city || data.locality || ''),
      state: data.principalSubdivision || '',
      postalCode: data.postcode || '',
      country: data.countryName || 'India',
      source: 'gps',
      displayName: `${data.city || data.locality || ''}, ${data.principalSubdivision || ''}`,
    };
  } catch (err) {
    console.warn('BigDataCloud reverse geocode failed:', err);
    return null;
  }
}

/**
 * Tertiary fallback: Detect locality via Network / IP
 */
export async function detectLocationByIP(): Promise<GeolocationResult> {
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
    if (!res.ok) throw new Error('IP geolocation network response failed');
    const data = await res.json();

    const city = cleanCityName(data.city || data.locality || '');
    const state = data.principalSubdivision || '';
    const postalCode = data.postcode || '';
    const country = data.countryName || 'India';

    return {
      success: true,
      address: {
        address: data.locality ? `${data.locality} Area` : `${city} Central`,
        apartment: '',
        city,
        state,
        postalCode,
        country,
        source: 'ip',
        displayName: `${city}, ${state} (${country})`,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Unable to detect approximate location via IP. Please enter address manually.',
    };
  }
}

/**
 * Main function: Detect high-accuracy user location via GPS with full fallback pipeline
 */
export async function detectUserLocation(): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    // Fallback to IP if navigator.geolocation not supported
    return detectLocationByIP();
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // 1. Try Nominatim (precise street level)
        let resolved = await reverseGeocodeCoordinates(latitude, longitude);

        // 2. Fallback to BigDataCloud if Nominatim failed
        if (!resolved) {
          resolved = await reverseGeocodeBigDataCloud(latitude, longitude);
        }

        if (resolved) {
          resolved.accuracy = Math.round(accuracy);
          resolve({
            success: true,
            address: resolved,
          });
        } else {
          // If both failed, try IP as graceful fallback
          const ipFallback = await detectLocationByIP();
          resolve(ipFallback);
        }
      },
      async (err) => {
        const isDenied = err.code === err.PERMISSION_DENIED;
        console.warn('Geolocation error:', err.message, 'Permission denied:', isDenied);

        if (isDenied) {
          resolve({
            success: false,
            isPermissionDenied: true,
            error: 'Location permission was denied in your browser settings. You can enter details manually or auto-fill with IP location.',
          });
        } else {
          // Attempt IP fallback on timeout / unavailable
          const ipFallback = await detectLocationByIP();
          if (ipFallback.success) {
            resolve({
              ...ipFallback,
              error: 'GPS satellite signal weak — approximated via high-speed network.',
            });
          } else {
            resolve({
              success: false,
              error: 'Unable to acquire satellite lock. Please enter your address manually.',
            });
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Local storage keys for saved address
 */
export const SAVED_ADDRESS_STORAGE_KEY = 'zarb_saved_delivery_address';

export function getSavedAddress(): Partial<DetectedAddress> | null {
  try {
    const raw = localStorage.getItem(SAVED_ADDRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAddressToStorage(address: Partial<DetectedAddress>): void {
  try {
    localStorage.setItem(SAVED_ADDRESS_STORAGE_KEY, JSON.stringify(address));
  } catch (e) {
    console.warn('Failed to save address to localStorage:', e);
  }
}

export function clearSavedAddressStorage(): void {
  try {
    localStorage.removeItem(SAVED_ADDRESS_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear address from localStorage:', e);
  }
}

/**
 * Permanently load customer address from Supabase cloud database
 */
export async function fetchCustomerAddressFromSupabase(userId: string): Promise<Partial<DetectedAddress> | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    // 1. Try public.profiles table
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('shipping_address')
      .eq('id', userId)
      .maybeSingle();

    if (!profileErr && profile?.shipping_address && typeof profile.shipping_address === 'object') {
      return profile.shipping_address as Partial<DetectedAddress>;
    }

    // 2. Check authenticated user metadata in Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId && user.user_metadata?.shipping_address) {
      return user.user_metadata.shipping_address as Partial<DetectedAddress>;
    }

    // 3. Fallback: check customer's most recent order in Supabase
    const { data: latestOrder } = await supabase
      .from('orders')
      .select('shipping_address')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestOrder?.shipping_address && typeof latestOrder.shipping_address === 'object') {
      return latestOrder.shipping_address as Partial<DetectedAddress>;
    }
  } catch (e) {
    console.warn('Could not load customer address from Supabase:', e);
  }
  return null;
}

/**
 * Permanently save customer shipping address to Supabase cloud database
 */
export async function saveCustomerAddressToSupabase(
  userId: string,
  address: Partial<DetectedAddress>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return false;
  let isSaved = false;

  // 1. Save to Supabase Auth User Metadata (permanent per user_id across devices & reloads)
  try {
    const { error: authErr } = await supabase.auth.updateUser({
      data: { shipping_address: address },
    });
    if (!authErr) {
      isSaved = true;
    }
  } catch (e) {
    console.warn('Could not update user metadata address in Supabase:', e);
  }

  // 2. Upsert into public.profiles table
  try {
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        shipping_address: address,
        updated_at: new Date().toISOString(),
      });
    if (!profileErr) {
      isSaved = true;
    }
  } catch (e) {
    console.warn('Could not upsert profile address in Supabase:', e);
  }

  return isSaved;
}

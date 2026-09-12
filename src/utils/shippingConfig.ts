// =========================================================================
// ZARB — SHIPPING CONFIGURATION UTILITY
// Shared shipping config read/write between AdminPortal, Cart, and Checkout
// Dual-layer persistence: Supabase cloud (store_settings) + localStorage cache
// Event-driven reactive synchronization across components and browser tabs
// =========================================================================

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type ShippingMode = 'free' | 'flat' | 'tiered';

export interface ShippingTier {
  id: string;
  label: string;          // e.g. "Standard"
  minOrderAmount: number;  // min cart subtotal for this tier
  cost: number;            // shipping cost for this tier
  estimatedDays: string;  // e.g. "3-5 days"
}

export interface ShippingConfig {
  mode: ShippingMode;
  flatRate: number;                  // used when mode === 'flat'
  freeAbove: number;                 // cart amount above which shipping is free (for 'flat' mode)
  tiers: ShippingTier[];             // used when mode === 'tiered'
  freeShippingMessage: string;       // shown to customers in checkout
  returnDays: number;                // return window in calendar days (e.g. 7, 14, 30; 0 = final sale)
  returnPolicyNote: string;          // customer-facing policy copy
  updatedAt: string;
}

const STORAGE_KEY = 'zarb_shipping_config';
export const SHIPPING_EVENT = 'zarb_shipping_updated';

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  mode: 'free',
  flatRate: 0,
  freeAbove: 0,
  tiers: [
    {
      id: 'tier_standard',
      label: 'Standard Delivery',
      minOrderAmount: 0,
      cost: 99,
      estimatedDays: '5-7 business days',
    },
    {
      id: 'tier_express',
      label: 'White-Glove Express',
      minOrderAmount: 2000,
      cost: 0,
      estimatedDays: '2-3 business days',
    },
  ],
  freeShippingMessage: 'Complimentary White-Glove Delivery on all orders',
  returnDays: 30,
  returnPolicyNote: 'Prepaid complimentary returns and exchanges within 30 calendar days of delivery.',
  updatedAt: new Date().toISOString(),
};

/**
 * Load shipping config synchronously from localStorage cache, falling back to defaults.
 */
export function loadShippingConfig(): ShippingConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_SHIPPING_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SHIPPING_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_SHIPPING_CONFIG };
}

/**
 * Fetch latest shipping config from Supabase cloud store_settings table.
 * Automatically refreshes local storage cache and broadcasts updates to UI.
 */
export async function fetchShippingConfig(): Promise<ShippingConfig> {
  if (!isSupabaseConfigured()) {
    return loadShippingConfig();
  }

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'shipping_config')
      .single();

    if (!error && data?.value) {
      const cloudConfig: ShippingConfig = {
        ...DEFAULT_SHIPPING_CONFIG,
        ...data.value,
        updatedAt: data.value.updatedAt || new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudConfig));
        window.dispatchEvent(new CustomEvent(SHIPPING_EVENT, { detail: cloudConfig }));
      }
      return cloudConfig;
    }
  } catch (err) {
    console.warn('[SHIPPING] Cloud sync fetch fallback to local cache:', err);
  }

  return loadShippingConfig();
}

/**
 * Save shipping config to localStorage AND synchronize to Supabase cloud.
 * Dispatches an event so all active components instantly reflect changes.
 */
export async function saveShippingConfig(config: ShippingConfig): Promise<{ success: boolean; error?: string }> {
  const payload: ShippingConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately update localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(SHIPPING_EVENT, { detail: payload }));
    } catch {}
  }

  // 2. Persist to Supabase cloud store_settings table
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert(
          {
            key: 'shipping_config',
            value: payload,
            updated_at: payload.updatedAt,
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.warn('[SHIPPING] Cloud persist error:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('[SHIPPING] Cloud persist exception:', err);
      return { success: false, error: err?.message };
    }
  }

  return { success: true };
}

/**
 * React hook for consuming live shipping config with automatic cloud sync & event listening.
 */
export function useShippingConfig(): ShippingConfig {
  const [config, setConfig] = useState<ShippingConfig>(() => loadShippingConfig());

  useEffect(() => {
    // Initial fetch from cloud
    fetchShippingConfig().then((latest) => {
      setConfig(latest);
    });

    // Event listener for local changes & cross-tab changes
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<ShippingConfig>;
      if (customEvt.detail) {
        setConfig(customEvt.detail);
      } else {
        setConfig(loadShippingConfig());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setConfig(loadShippingConfig());
      }
    };

    window.addEventListener(SHIPPING_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SHIPPING_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return config;
}

/**
 * Calculate shipping cost for a given cart subtotal using given or cached config.
 */
export function calculateShippingCost(subtotal: number, customConfig?: ShippingConfig): number {
  const config = customConfig || loadShippingConfig();

  switch (config.mode) {
    case 'free':
      return 0;

    case 'flat': {
      if (config.freeAbove > 0 && subtotal >= config.freeAbove) {
        return 0;
      }
      return config.flatRate;
    }

    case 'tiered': {
      const sorted = [...config.tiers].sort((a, b) => b.minOrderAmount - a.minOrderAmount);
      for (const tier of sorted) {
        if (subtotal >= tier.minOrderAmount) {
          return tier.cost;
        }
      }
      return config.tiers[0]?.cost ?? 0;
    }

    default:
      return 0;
  }
}

/**
 * Get human-readable shipping label for display in cart and checkout.
 */
export function getShippingLabel(subtotal: number, customConfig?: ShippingConfig): string {
  const config = customConfig || loadShippingConfig();

  switch (config.mode) {
    case 'free':
      return config.freeShippingMessage || 'Complimentary Delivery';

    case 'flat': {
      if (config.freeAbove > 0 && subtotal >= config.freeAbove) {
        return 'Complimentary Delivery (Free above ₹' + config.freeAbove.toLocaleString('en-IN') + ')';
      }
      if (config.flatRate === 0) return 'Complimentary Delivery';
      return `Flat Rate Delivery — ₹${config.flatRate}`;
    }

    case 'tiered': {
      const sorted = [...config.tiers].sort((a, b) => b.minOrderAmount - a.minOrderAmount);
      for (const tier of sorted) {
        if (subtotal >= tier.minOrderAmount) {
          return `${tier.label} — ${tier.cost === 0 ? 'Complimentary' : '₹' + tier.cost} (${tier.estimatedDays})`;
        }
      }
      return 'Standard Delivery';
    }

    default:
      return 'Complimentary Delivery';
  }
}

// =========================================================================
// ZARB CUSTOMER ID LINKING & OFFLINE ORDER SYNC SERVICE
// Handles:
// 1. E.164 Indian Phone Normalization
// 2. Stable Supabase Customer ID Resolution for Phone & Google Auth
// 3. Cross-Provider Identity Unification (Preventing Duplicate Accounts)
// 4. Reliable Offline Order Sync Queue with Idempotency & Retry
// =========================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { OrderRecord, UserProfile } from '../context/AuthContext';

const CUSTOMER_LINKS_KEY = 'zarb_customer_identities';
const PENDING_SYNC_KEY = 'atelier_pending_sync_orders';
const LOCAL_ORDERS_KEY = 'atelier_local_orders';

export interface NormalizedPhone {
  e164: string;      // e.g. "+919876543210"
  national: string;  // e.g. "9876543210"
  formatted: string; // e.g. "+91 98765 43210"
  isValid: boolean;
}

/**
 * Standardize any Indian phone number into E.164 and clean national formats
 */
export function normalizeIndianPhone(input?: string | null): NormalizedPhone {
  if (!input) {
    return { e164: '', national: '', formatted: '', isValid: false };
  }

  const digits = input.replace(/\D/g, '');
  let national = '';

  if (digits.startsWith('91') && digits.length === 12) {
    national = digits.slice(2);
  } else if (digits.length >= 10) {
    national = digits.slice(-10);
  } else {
    national = digits;
  }

  const isValid = national.length === 10 && /^[6-9]\d{9}$/.test(national);
  const e164 = isValid ? `+91${national}` : (national ? `+91${national}` : '');
  const formatted = isValid
    ? `+91 ${national.slice(0, 5)} ${national.slice(5)}`
    : (national ? `+91 ${national}` : '');

  return { e164, national, formatted, isValid };
}

/**
 * Customer Identity Mapping Structure
 */
interface CustomerIdentityEntry {
  customerId: string; // Valid Supabase UUID
  e164Phone?: string;
  email?: string;
  fullName?: string;
  linkedAt: number;
}

function getStoredIdentityLinks(): Record<string, CustomerIdentityEntry> {
  try {
    const raw = localStorage.getItem(CUSTOMER_LINKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredIdentityLinks(links: Record<string, CustomerIdentityEntry>) {
  try {
    localStorage.setItem(CUSTOMER_LINKS_KEY, JSON.stringify(links));
  } catch (e) {
    console.warn('Error saving customer identity links', e);
  }
}

/**
 * Resolve or generate a stable Supabase Customer UUID for MSG91 Phone OTP users.
 * 1. Checks local cross-provider identity cache.
 * 2. Checks if there is an existing customer order with this phone that already has a user_id.
 * 3. Idempotently signs up/retrieves the persistent auth.users record via Supabase.
 */
export async function resolvePhoneCustomerId(phone: string): Promise<{
  customerId: string;
  email: string;
  fullName: string;
  phone: string;
}> {
  const norm = normalizeIndianPhone(phone);
  const national = norm.national || '9876543210';
  const e164 = norm.e164 || `+91${national}`;
  const syntheticEmail = `phone_${national}@zarb.shop`;
  const defaultName = `Client (${norm.formatted || e164})`;

  // 1. Check local identity links
  const links = getStoredIdentityLinks();
  if (links[e164]?.customerId) {
    return {
      customerId: links[e164].customerId,
      email: links[e164].email || syntheticEmail,
      fullName: links[e164].fullName || defaultName,
      phone: e164,
    };
  }

  // 2. Check if a past order in Supabase already has a user_id for this phone
  if (isSupabaseConfigured()) {
    try {
      const { data: pastOrders } = await supabase
        .from('orders')
        .select('user_id, customer_name, customer_email')
        .eq('customer_phone', e164)
        .not('user_id', 'is', null)
        .limit(1);

      if (pastOrders && pastOrders.length > 0 && pastOrders[0].user_id) {
        const foundUserId = pastOrders[0].user_id;
        const entry: CustomerIdentityEntry = {
          customerId: foundUserId,
          e164Phone: e164,
          email: pastOrders[0].customer_email || syntheticEmail,
          fullName: pastOrders[0].customer_name || defaultName,
          linkedAt: Date.now(),
        };
        links[e164] = entry;
        links[syntheticEmail] = entry;
        saveStoredIdentityLinks(links);

        return {
          customerId: foundUserId,
          email: entry.email || syntheticEmail,
          fullName: entry.fullName || defaultName,
          phone: e164,
        };
      }
    } catch (e) {
      console.warn('Could not query past order user_id for phone link', e);
    }
  }

  // 3. Resolve persistent auth.users ID via Supabase signUp
  let resolvedId = '';
  if (isSupabaseConfigured()) {
    try {
      const deterministicSecret = `ZarbClient_${national}_LuxuryAuth2026!`;
      const res = await supabase.auth.signUp({
        email: syntheticEmail,
        password: deterministicSecret,
        options: {
          data: {
            phone: e164,
            full_name: defaultName,
            auth_provider: 'msg91_phone_otp',
          },
        },
      });

      if (res.data?.user?.id) {
        resolvedId = res.data.user.id;
      }
    } catch (e) {
      console.warn('Error creating/resolving auth.users for phone customer', e);
    }
  }

  // If Supabase is offline or not configured, generate a stable deterministic UUID v4
  if (!resolvedId) {
    // Generate deterministic UUID format from phone national digits to keep customer ID stable across reloads
    resolvedId = generateDeterministicUuid(national);
  }

  const identity: CustomerIdentityEntry = {
    customerId: resolvedId,
    e164Phone: e164,
    email: syntheticEmail,
    fullName: defaultName,
    linkedAt: Date.now(),
  };
  links[e164] = identity;
  links[syntheticEmail] = identity;
  saveStoredIdentityLinks(links);

  return {
    customerId: resolvedId,
    email: syntheticEmail,
    fullName: defaultName,
    phone: e164,
  };
}

/**
 * Link Google Sign-In user with their phone profile to prevent duplicate customer accounts
 */
export function linkGoogleCustomerAccount(googleUser: UserProfile, phone?: string): void {
  if (!googleUser.id) return;
  const links = getStoredIdentityLinks();

  const norm = normalizeIndianPhone(phone || googleUser.phone);
  if (norm.isValid) {
    const entry: CustomerIdentityEntry = {
      customerId: googleUser.id,
      e164Phone: norm.e164,
      email: googleUser.email,
      fullName: googleUser.fullName,
      linkedAt: Date.now(),
    };
    links[norm.e164] = entry;
    if (googleUser.email) {
      links[googleUser.email.toLowerCase()] = entry;
    }
    saveStoredIdentityLinks(links);
  } else if (googleUser.email) {
    links[googleUser.email.toLowerCase()] = {
      customerId: googleUser.id,
      email: googleUser.email,
      fullName: googleUser.fullName,
      linkedAt: Date.now(),
    };
    saveStoredIdentityLinks(links);
  }
}

/**
 * Generate a deterministic UUID v4 format from input digits
 */
function generateDeterministicUuid(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-48a9-40b2-9a00-${hex.padEnd(12, '1').slice(0, 12)}`;
}

// =========================================================================
// OFFLINE ORDER SYNC QUEUE & IDEMPOTENCY
// =========================================================================

/**
 * Get all pending orders from the retry queue
 */
export function getPendingSyncOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add an order to the pending sync queue
 */
export function queuePendingOrder(order: OrderRecord): void {
  try {
    const queue = getPendingSyncOrders();
    const existingIndex = queue.findIndex(o => o.order_number === order.order_number || o.id === order.id);
    const updated = existingIndex >= 0
      ? queue.map((o, idx) => idx === existingIndex ? { ...order, sync_status: 'pending_sync' as const } : o)
      : [{ ...order, sync_status: 'pending_sync' as const }, ...queue];

    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated));

    // Also update local orders list status
    updateLocalOrderStatus(order.order_number, 'pending_sync');
  } catch (e) {
    console.warn('Error queueing pending order', e);
  }
}

/**
 * Remove an order from the pending sync queue and mark as synced locally
 */
export function markOrderAsSynced(orderNumber: string): void {
  try {
    const queue = getPendingSyncOrders();
    const filtered = queue.filter(o => o.order_number !== orderNumber);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));

    // Update local orders list
    updateLocalOrderStatus(orderNumber, 'synced');
  } catch (e) {
    console.warn('Error marking order as synced', e);
  }
}

/**
 * Update the sync_status on an order in atelier_local_orders
 */
function updateLocalOrderStatus(orderNumber: string, syncStatus: 'synced' | 'pending_sync'): void {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return;
    const orders: OrderRecord[] = JSON.parse(raw);
    const updated = orders.map(o => o.order_number === orderNumber ? { ...o, sync_status: syncStatus } : o);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error updating local order status', e);
  }
}

/**
 * Background retry processor:
 * Attempts to upload all pending orders in the queue to Supabase.
 * Uses order_number & client UUID idempotency to ensure zero duplicate insertions.
 */
let isSyncing = false;
export async function syncPendingOrders(): Promise<{
  syncedCount: number;
  remainingCount: number;
  errors: string[];
}> {
  if (isSyncing) {
    return { syncedCount: 0, remainingCount: getPendingSyncOrders().length, errors: [] };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, remainingCount: getPendingSyncOrders().length, errors: ['Offline'] };
  }

  if (!isSupabaseConfigured()) {
    return { syncedCount: 0, remainingCount: getPendingSyncOrders().length, errors: ['Supabase not configured'] };
  }

  const queue = getPendingSyncOrders();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0, errors: [] };
  }

  isSyncing = true;
  let syncedCount = 0;
  const errors: string[] = [];

  for (const order of queue) {
    try {
      // 1. Idempotency Check: see if order already exists in Supabase
      const { data: existing, error: checkErr } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('order_number', order.order_number)
        .maybeSingle();

      if (checkErr) {
        console.warn(`Error verifying idempotency for order ${order.order_number}:`, checkErr.message);
      }

      if (existing) {
        // Order is already safely in Supabase! Mark synced and remove from retry queue.
        markOrderAsSynced(order.order_number);
        syncedCount++;
        continue;
      }

      // 2. Insert into Supabase with verified customer user_id
      const isUuid = Boolean(
        order.user_id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.user_id)
      );

      const isOrderUuid = Boolean(
        order.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id)
      );

      // Deterministic UUID fallback if order.id is not a standard UUID
      const validOrderId = isOrderUuid
        ? order.id
        : (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : generateDeterministicUuid(order.order_number));

      const insertPayload: Record<string, any> = {
        id: validOrderId,
        order_number: order.order_number,
        user_id: isUuid ? order.user_id : null,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        shipping_address: order.shipping_address,
        items: order.items,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        discount_amount: order.discount_amount ?? 0,
        coupon_code: order.coupon_code ?? null,
        status_history: order.status_history ?? [],
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        updated_at: order.updated_at || new Date().toISOString(),
      };

      let { error: insertErr } = await supabase.from('orders').insert(insertPayload);

      // Handle foreign key error (23503: user_id does not exist in auth.users table yet)
      if (insertErr && insertErr.code === '23503') {
        insertPayload.user_id = null;
        const fkRetry = await supabase.from('orders').insert(insertPayload);
        insertErr = fkRetry.error;
      }

      // If extra columns do not exist yet (code 42703), encapsulate in shipping_address.order_meta
      if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('does not exist'))) {
        const fallbackPayload: Record<string, any> = {
          id: validOrderId,
          order_number: order.order_number,
          user_id: insertPayload.user_id,
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          shipping_address: {
            ...order.shipping_address,
            order_meta: {
              discount_amount: order.discount_amount,
              coupon_code: order.coupon_code,
              status_history: order.status_history,
            },
          },
          items: order.items,
          subtotal: order.subtotal,
          shipping_cost: order.shipping_cost,
          total_amount: order.total_amount,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          order_status: order.order_status,
          updated_at: order.updated_at || new Date().toISOString(),
        };
        const retryRes = await supabase.from('orders').insert(fallbackPayload);
        insertErr = retryRes.error;
      }

      if (insertErr) {
        // If duplicate key error, the order is already in the database
        if (insertErr.code === '23505') {
          markOrderAsSynced(order.order_number);
          syncedCount++;
        } else {
          console.warn(`Failed to sync pending order ${order.order_number}:`, insertErr.message);
          errors.push(`${order.order_number}: ${insertErr.message}`);
        }
      } else {
        // Successfully inserted into Supabase
        markOrderAsSynced(order.order_number);
        syncedCount++;
      }
    } catch (e: any) {
      console.warn(`Sync exception for order ${order.order_number}:`, e);
      errors.push(`${order.order_number}: ${e?.message || 'Network error'}`);
    }
  }

  isSyncing = false;
  return {
    syncedCount,
    remainingCount: getPendingSyncOrders().length,
    errors,
  };
}

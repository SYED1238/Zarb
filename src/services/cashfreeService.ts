// =========================================================================
// ZARB PRODUCTION CASHFREE CLIENT SERVICE
// Integrates Cashfree JS SDK v3 (https://sdk.cashfree.com/js/v3/cashfree.js)
// Communicates with Supabase Edge Functions for secure server-side operations
// =========================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CartItem } from '../types/product';
import type { OrderRecord } from '../context/AuthContext';

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'production' | 'sandbox' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_blank' | '_modal';
      }) => Promise<{ error?: { message: string }; redirect?: boolean; paymentDetails?: any }>;
    };
  }
}

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

let sdkLoadPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Cashfree JS SDK v3 on demand
 * Guarantees zero overhead on pages where checkout is not active.
 */
export function loadCashfreeSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);

  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    // Check if script element already exists
    const existing = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Cashfree)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.onload = () => {
      console.log('[CASHFREE] SDK v3 loaded successfully.');
      resolve(Boolean(window.Cashfree));
    };
    script.onerror = () => {
      console.error('[CASHFREE] Failed to load Cashfree JS SDK.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

export interface CashfreeOrderSessionResponse {
  success: boolean;
  payment_session_id?: string;
  order_id?: string;
  cf_order_id?: string;
  order_number?: string;
  total_amount?: number;
  environment?: 'production' | 'sandbox';
  error?: string;
}

export interface CashfreeVerifyResponse {
  success: boolean;
  verified: boolean;
  payment_status?: string;
  order?: OrderRecord;
  message?: string;
  error?: string;
}

/**
 * Creates an authoritative Cashfree payment session via Supabase Edge Function
 */
export async function createCashfreeOrderSession(params: {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    userId?: string | null;
  };
  shippingAddress: any;
  shippingCost?: number;
  couponCode?: string;
}): Promise<CashfreeOrderSessionResponse> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Store cloud connection is not configured.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('cashfree-checkout', {
      body: {
        action: 'create-order',
        items: params.items.map((it) => ({
          id: it.productId,
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          size: it.size,
          color: it.color,
          image: it.image,
        })),
        customer: params.customer,
        shippingAddress: params.shippingAddress,
        shippingCost: params.shippingCost ?? 0,
        couponCode: params.couponCode,
        returnUrl: `https://zarb.shop/payment-return?order_id={order_id}`,
      },
    });

    if (error) {
      console.error('[CASHFREE CLIENT] Edge function invoke error:', error);
      return {
        success: false,
        error: error.message || 'Payment server failed to initialize session.',
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return data;
  } catch (err: any) {
    console.error('[CASHFREE CLIENT] Session creation exception:', err);
    return {
      success: false,
      error: err?.message || 'Network error while contacting payment gateway.',
    };
  }
}

/**
 * Launches the hosted Cashfree Web Checkout modal or redirect
 */
export async function launchCashfreeCheckout(options: {
  paymentSessionId: string;
  environment?: 'production' | 'sandbox';
  redirectTarget?: '_self' | '_modal';
}): Promise<{ error?: string; redirect?: boolean; paymentDetails?: any; cancelled?: boolean }> {
  const isLoaded = await loadCashfreeSdk();
  if (!isLoaded || !window.Cashfree) {
    return { error: 'Failed to initialize Cashfree Payment Gateway library.' };
  }

  try {
    const mode = options.environment || 'production';
    const cashfree = window.Cashfree({ mode });

    const result = await cashfree.checkout({
      paymentSessionId: options.paymentSessionId,
      redirectTarget: options.redirectTarget || '_modal',
    });

    if (result.error) {
      const msg = result.error.message || '';
      // Treat user-closed modal as a cancellation, not an error
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('close')) {
        console.warn('[CASHFREE CLIENT] User closed payment modal.');
        return { cancelled: true };
      }
      console.warn('[CASHFREE CLIENT] Checkout error:', result.error);
      return { error: msg };
    }

    return { redirect: result.redirect, paymentDetails: (result as any).paymentDetails };
  } catch (err: any) {
    console.error('[CASHFREE CLIENT] Checkout launch exception:', err);
    return { error: err?.message || 'Failed to open Cashfree checkout.' };
  }
}

/**
 * Verifies payment status with the server after Cashfree redirect
 */
export async function verifyCashfreePayment(orderId: string): Promise<CashfreeVerifyResponse> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      verified: false,
      error: 'Store cloud connection not available.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('cashfree-checkout', {
      body: {
        action: 'verify-order',
        order_id: orderId,
      },
    });

    if (error) {
      return {
        success: false,
        verified: false,
        error: error.message,
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      verified: false,
      error: err?.message || 'Failed to verify payment with server.',
    };
  }
}

/**
 * Initiates an official Cashfree refund (Admin only)
 */
export async function initiateCashfreeRefund(params: {
  orderId: string;
  refundAmount: number;
  refundNote?: string;
  callerEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('cashfree-checkout', {
      body: {
        action: 'initiate-refund',
        order_id: params.orderId,
        refund_amount: params.refundAmount,
        refund_note: params.refundNote,
        caller_email: params.callerEmail,
      },
    });

    if (error || data?.error) {
      return { success: false, error: error?.message || data?.error };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Refund request failed' };
  }
}

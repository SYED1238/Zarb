// =========================================================================
// ZARB CENTRALIZED TRANSACTIONAL EMAIL SERVICE
// Production client-side service communicating with Supabase Edge Functions
// Guaranteed Non-Blocking: Failures never break checkout, orders, or auth
// =========================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { OrderRecord } from '../context/AuthContext';

export interface WelcomeEmailParams {
  email: string;
  fullName?: string;
  userId?: string;
}

export interface WelcomeBackEmailParams {
  email: string;
  fullName?: string;
  userId?: string;
}

export interface VerificationEmailParams {
  email: string;
  fullName?: string;
  verificationUrl?: string;
}

export interface PasswordResetEmailParams {
  email: string;
  fullName?: string;
  resetUrl?: string;
}

export interface OrderStatusMeta {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cancellationReason?: string;
  refundAmount?: number;
}

// In-memory set to prevent duplicate invocations within the same session/page load
const inMemoryDispatchedKeys = new Set<string>();

function hasBeenDispatchedRecently(key: string): boolean {
  if (inMemoryDispatchedKeys.has(key)) return true;
  try {
    const raw = sessionStorage.getItem(`zarb_dispatched_${key}`);
    return raw === 'true';
  } catch {
    return false;
  }
}

function markAsDispatchedRecently(key: string): void {
  inMemoryDispatchedKeys.add(key);
  try {
    sessionStorage.setItem(`zarb_dispatched_${key}`, 'true');
  } catch {}
}

/**
 * Low-level safe dispatcher to Supabase Edge Function
 */
async function dispatchEmail(payload: {
  event_type: string;
  recipient_email: string;
  event_key?: string;
  user_id?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  data?: Record<string, any>;
}): Promise<{ success: boolean; deduplicated?: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    console.warn('[EMAIL SERVICE] Supabase is not configured. Skipping email dispatch.');
    return { success: false, error: 'Supabase not configured' };
  }

  const eventKey = payload.event_key?.toLowerCase().trim();
  if (eventKey && hasBeenDispatchedRecently(eventKey)) {
    console.log(`[EMAIL SERVICE] Client-side deduplication caught event: ${eventKey}`);
    return { success: true, deduplicated: true };
  }

  try {
    console.log(`[EMAIL SERVICE] Dispatching ${payload.event_type} to ${payload.recipient_email}`);
    
    // Mark as dispatched client-side immediately to throttle rapid bursts
    if (eventKey) {
      markAsDispatchedRecently(eventKey);
    }

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    });

    if (error) {
      console.warn(`[EMAIL SERVICE] Edge function returned notice for ${payload.event_type}:`, error.message);
      return { success: false, error: error.message };
    }

    return {
      success: Boolean(data?.success),
      deduplicated: Boolean(data?.deduplicated),
    };
  } catch (err: any) {
    // Non-blocking guarantee: Never let email dispatch crash callers
    console.warn(`[EMAIL SERVICE] Dispatch exception for ${payload.event_type}:`, err?.message || err);
    return { success: false, error: err?.message || 'Network exception' };
  }
}

// =========================================================================
// PUBLIC CENTRALIZED EMAIL SERVICE API
// =========================================================================

export const emailService = {
  /**
   * 1. Send Welcome Email on New Account Creation
   */
  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
    if (!params.email || !params.email.includes('@')) return;
    const cleanEmail = params.email.toLowerCase().trim();
    const eventKey = `welcome:${params.userId || cleanEmail}`;

    await dispatchEmail({
      event_type: 'welcome',
      recipient_email: cleanEmail,
      event_key: eventKey,
      user_id: params.userId || null,
      data: {
        customerName: params.fullName || cleanEmail.split('@')[0],
        actionUrl: 'https://zarb.shop',
      },
    });
  },

  /**
   * 2. Send Welcome Back Email on Genuine Successful Sign-In
   * Deduplicated so it only triggers once per day / login session
   */
  async sendWelcomeBackEmail(params: WelcomeBackEmailParams): Promise<void> {
    if (!params.email || !params.email.includes('@')) return;
    const cleanEmail = params.email.toLowerCase().trim();
    const today = new Date().toISOString().slice(0, 10);
    const eventKey = `welcome_back:${params.userId || cleanEmail}:${today}`;

    await dispatchEmail({
      event_type: 'welcome_back',
      recipient_email: cleanEmail,
      event_key: eventKey,
      user_id: params.userId || null,
      data: {
        customerName: params.fullName || cleanEmail.split('@')[0],
        actionUrl: 'https://zarb.shop',
      },
    });
  },

  /**
   * 3. Send Email Verification Link
   */
  async sendEmailVerificationEmail(params: VerificationEmailParams): Promise<void> {
    if (!params.email || !params.email.includes('@')) return;
    const cleanEmail = params.email.toLowerCase().trim();
    const eventKey = `verify:${cleanEmail}:${Date.now()}`;

    await dispatchEmail({
      event_type: 'verify_email',
      recipient_email: cleanEmail,
      event_key: eventKey,
      data: {
        customerName: params.fullName,
        actionUrl: params.verificationUrl || 'https://zarb.shop',
      },
    });
  },

  /**
   * 4. Send Password Reset Link
   */
  async sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
    if (!params.email || !params.email.includes('@')) return;
    const cleanEmail = params.email.toLowerCase().trim();
    const eventKey = `pwd_reset:${cleanEmail}:${Date.now()}`;

    await dispatchEmail({
      event_type: 'password_reset',
      recipient_email: cleanEmail,
      event_key: eventKey,
      data: {
        customerName: params.fullName,
        actionUrl: params.resetUrl || 'https://zarb.shop',
      },
    });
  },

  /**
   * 5. Send Order Confirmation Email immediately after successful placement
   */
  async sendOrderConfirmationEmail(order: OrderRecord | any): Promise<void> {
    if (!order || !order.customer_email || !order.customer_email.includes('@')) return;
    const num = order.order_number;
    const eventKey = `order_confirmation:${num}`;

    await dispatchEmail({
      event_type: 'order_confirmation',
      recipient_email: order.customer_email.toLowerCase().trim(),
      event_key: eventKey,
      order_id: order.id || null,
      order_number: num,
      user_id: order.user_id || null,
      data: {
        customerName: order.customer_name,
        orderNumber: num,
        orderDate: order.created_at,
        items: order.items || [],
        subtotal: order.subtotal || order.total_amount,
        shippingCost: order.shipping_cost || 0,
        discountAmount: order.discount_amount || 0,
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status || 'paid',
        orderStatus: order.order_status || 'confirmed',
        shippingAddress: order.shipping_address,
        actionUrl: `https://zarb.shop`,
      },
    });
  },

  /**
   * 6. Send Order Status Email on legitimate transition
   * Supports: confirmed, processing, dispatched/shipped, out_for_delivery, delivered, cancelled, refunded
   */
  async sendOrderStatusEmail(
    order: OrderRecord | any,
    newStatus: string,
    meta?: OrderStatusMeta
  ): Promise<void> {
    if (!order || !order.customer_email || !order.customer_email.includes('@')) return;
    const cleanStatus = newStatus.toLowerCase().trim();
    const num = order.order_number;
    const eventKey = `order_status:${num}:${cleanStatus}`;

    // Map status to email event type
    const statusTypeMap: Record<string, string> = {
      confirmed: 'order_confirmation',
      processing: 'order_status_processing',
      dispatched: 'order_status_dispatched',
      shipped: 'order_status_shipped',
      out_for_delivery: 'order_status_out_for_delivery',
      delivered: 'order_status_delivered',
      cancelled: 'order_status_cancelled',
      refunded: 'order_status_refunded',
    };

    const eventType = statusTypeMap[cleanStatus] || `order_status_${cleanStatus}`;

    await dispatchEmail({
      event_type: eventType,
      recipient_email: order.customer_email.toLowerCase().trim(),
      event_key: eventKey,
      order_id: order.id || null,
      order_number: num,
      user_id: order.user_id || null,
      data: {
        customerName: order.customer_name,
        orderNumber: num,
        orderStatus: cleanStatus,
        items: order.items || [],
        subtotal: order.subtotal || order.total_amount,
        shippingCost: order.shipping_cost || 0,
        discountAmount: order.discount_amount || 0,
        totalAmount: order.total_amount,
        shippingAddress: order.shipping_address,
        carrier: meta?.carrier,
        trackingNumber: meta?.trackingNumber,
        estimatedDelivery: meta?.estimatedDelivery,
        cancellationReason: meta?.cancellationReason,
        refundAmount: meta?.refundAmount || order.total_amount,
        actionUrl: 'https://zarb.shop',
      },
    });
  },

  /**
   * 7. Send Refund Email when refund is processed
   */
  async sendRefundEmail(
    order: OrderRecord | any,
    refundAmount?: number,
    meta?: OrderStatusMeta
  ): Promise<void> {
    if (!order || !order.customer_email || !order.customer_email.includes('@')) return;
    const num = order.order_number;
    const eventKey = `order_refund:${num}:${refundAmount || order.total_amount}`;

    await dispatchEmail({
      event_type: 'refund_processed',
      recipient_email: order.customer_email.toLowerCase().trim(),
      event_key: eventKey,
      order_id: order.id || null,
      order_number: num,
      user_id: order.user_id || null,
      data: {
        customerName: order.customer_name,
        orderNumber: num,
        refundAmount: refundAmount || order.total_amount,
        totalAmount: order.total_amount,
        actionUrl: 'https://zarb.shop',
        ...meta,
      },
    });
  },
};

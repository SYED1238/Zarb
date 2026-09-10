// =========================================================================
// ZARB PRODUCTION CASHFREE PAYMENT GATEWAY EDGE FUNCTION
// API Version: 2023-08-01 (Cashfree Standard)
// Handles:
// 1. Server-side price recalculation & order creation (POST /pg/orders)
// 2. Client return payment verification (GET /pg/orders/{order_id}/payments)
// 3. Official HMAC-SHA256 signature verified webhooks
// 4. Idempotent inventory deduction & transactional email dispatch
// 5. Admin refund initiation
// =========================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const ALLOWED_ORIGINS = [
  'https://zarb.shop',
  'https://www.zarb.shop',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp',
    'Access-Control-Max-Age': '86400',
  };
}

// Cashfree Endpoints
function getCashfreeBaseUrl(environment: string): string {
  return environment?.toUpperCase() === 'SANDBOX'
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg';
}

// Compute HMAC-SHA256 in base64 using Web Crypto API
async function computeHmacSha256(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payload)
  );
  const bytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  // 2. Read server secrets
  const cfAppId = Deno.env.get('CASHFREE_APP_ID') || '';
  const cfSecretKey = Deno.env.get('CASHFREE_SECRET_KEY') || '';
  const cfEnvironment = Deno.env.get('CASHFREE_ENVIRONMENT') || 'PRODUCTION';
  const cfApiVersion = Deno.env.get('CASHFREE_API_VERSION') || '2023-08-01';

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const cfBaseUrl = getCashfreeBaseUrl(cfEnvironment);

  // Read raw body once for signature verification and JSON parsing
  const rawBody = await req.text();
  const webhookSignature = req.headers.get('x-webhook-signature');
  const webhookTimestamp = req.headers.get('x-webhook-timestamp');

  // =========================================================================
  // CASE A: CASHFREE WEBHOOK NOTIFICATION
  // Signature headers present: verify HMAC-SHA256 signature on raw payload
  // =========================================================================
  if (webhookSignature && webhookTimestamp) {
    if (!cfSecretKey) {
      console.error('[CASHFREE WEBHOOK] CASHFREE_SECRET_KEY not configured.');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    try {
      // 1. Verify Timestamp Freshness (prevent replay attacks, allow 10 min window)
      const tsNumber = Number(webhookTimestamp);
      const nowMs = Date.now();
      if (!isNaN(tsNumber) && Math.abs(nowMs - tsNumber) > 10 * 60 * 1000) {
        console.warn('[CASHFREE WEBHOOK] Replay attack protection: expired timestamp', webhookTimestamp);
        return new Response(JSON.stringify({ error: 'Webhook timestamp expired' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // 2. Construct signature payload: timestamp + raw body
      const signaturePayload = `${webhookTimestamp}${rawBody}`;
      const expectedSignature = await computeHmacSha256(cfSecretKey, signaturePayload);

      if (!timingSafeEqual(expectedSignature, webhookSignature)) {
        console.error('[CASHFREE WEBHOOK] Signature mismatch! Unauthorized webhook request.');
        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          status: 401,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // 3. Signature valid -> process webhook event
      const eventData = JSON.parse(rawBody);
      const eventType = eventData.type || eventData.event;
      console.log(`[CASHFREE WEBHOOK] Verified event: ${eventType}`);

      const paymentObj = eventData.data?.payment;
      const orderObj = eventData.data?.order;
      const cfOrderId = orderObj?.order_id || paymentObj?.order_id;
      const paymentStatus = paymentObj?.payment_status;

      if (!cfOrderId) {
        return new Response(JSON.stringify({ status: 'ignored', reason: 'No order_id in event' }), {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Find Zarb order in database
      const { data: zarbOrder, error: findErr } = await supabase
        .from('orders')
        .select('*')
        .eq('cashfree_order_id', cfOrderId)
        .maybeSingle();

      if (findErr || !zarbOrder) {
        console.warn(`[CASHFREE WEBHOOK] Order not found for CF ID: ${cfOrderId}`);
        return new Response(JSON.stringify({ status: 'received_not_found' }), {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      if (paymentStatus === 'SUCCESS') {
        const timestamp = new Date().toISOString();
        const existingHistory = Array.isArray(zarbOrder.status_history) ? zarbOrder.status_history : [];
        const updatedHistory = [
          ...existingHistory,
          {
            status: 'confirmed',
            timestamp,
            note: `Payment verified via Cashfree Webhook (Payment ID: ${paymentObj?.cf_payment_id || 'N/A'}, Mode: ${paymentObj?.payment_group || 'Online'})`,
            updatedBy: 'Cashfree Webhook',
          },
        ];

        // Idempotently update order to paid
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'confirmed',
            cashfree_payment_id: String(paymentObj?.cf_payment_id || zarbOrder.cashfree_payment_id || ''),
            payment_method: paymentObj?.payment_group || zarbOrder.payment_method || 'Online',
            payment_verified_at: timestamp,
            status_history: updatedHistory,
            updated_at: timestamp,
          })
          .eq('id', zarbOrder.id);

        // Idempotently deduct inventory in database
        try {
          await supabase.rpc('idempotent_deduct_order_inventory', { p_order_id: zarbOrder.id });
        } catch (invErr) {
          console.warn('[CASHFREE WEBHOOK] Inventory deduction notice:', invErr);
        }

        // Trigger transactional order confirmation email
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              event_type: 'order_confirmation',
              recipient_email: zarbOrder.customer_email,
              order_id: zarbOrder.id,
              order_number: zarbOrder.order_number,
              data: zarbOrder,
            },
          });
        } catch (mailErr) {
          console.warn('[CASHFREE WEBHOOK] Email notification notice:', mailErr);
        }
      } else if (paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED') {
        await supabase
          .from('orders')
          .update({
            payment_status: paymentStatus.toLowerCase(),
            order_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', zarbOrder.id);
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.error('[CASHFREE WEBHOOK] Error processing webhook:', err);
      return new Response(JSON.stringify({ error: err?.message || 'Processing error' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  }

  // =========================================================================
  // CASE B: CLIENT API CALLS (JSON POST)
  // Actions: 'create-order', 'verify-order', 'initiate-refund'
  // =========================================================================
  let payload: any = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const action = payload.action;

  // -------------------------------------------------------------------------
  // ACTION 1: CREATE ORDER
  // Authoritative server-side price validation & Cashfree Order creation
  // -------------------------------------------------------------------------
  if (action === 'create-order') {
    if (!cfAppId || !cfSecretKey) {
      return new Response(
        JSON.stringify({
          error: 'Cashfree API credentials are not configured on the server. Please add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to Supabase Edge Function secrets.',
        }),
        { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { items = [], customer = {}, shippingAddress = {}, couponCode = '', shippingCost: clientShippingCost } = payload;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cannot checkout with empty bag.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!customer.email || !customer.phone) {
      return new Response(JSON.stringify({ error: 'Customer email and phone are required.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch Authoritative Product Prices from Database (Zero Client Trust)
    const productIds = items.map((it: any) => it.id || it.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, stock, images')
      .in('id', productIds);

    if (prodErr || !dbProducts) {
      return new Response(JSON.stringify({ error: 'Failed to verify catalog pricing.' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));
    let authoritativeSubtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const pid = item.id || item.productId;
      const dbProd = productMap.get(pid);
      if (!dbProd) {
        return new Response(JSON.stringify({ error: `Product "${item.name || pid}" is no longer available.` }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const itemPrice = Number(dbProd.price);
      authoritativeSubtotal += itemPrice * qty;

      validatedItems.push({
        id: dbProd.id,
        name: dbProd.name,
        price: itemPrice,
        quantity: qty,
        size: item.size || 'One Size',
        color: item.color || 'Standard',
        image: item.image || (dbProd.images && dbProd.images[0]) || '',
      });
    }

    // 2. Compute Discounts & Shipping Server-Side from Database Store Settings
    let shippingCost = 0;
    try {
      const { data: settingRow } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'shipping_config')
        .maybeSingle();

      if (settingRow?.value) {
        const config = settingRow.value;
        if (config.mode === 'free') {
          shippingCost = 0;
        } else if (config.mode === 'flat') {
          if (config.freeAbove > 0 && authoritativeSubtotal >= config.freeAbove) {
            shippingCost = 0;
          } else {
            shippingCost = Math.max(0, Number(config.flatRate) || 0);
          }
        } else if (config.mode === 'tiered' && Array.isArray(config.tiers)) {
          const sorted = [...config.tiers].sort((a: any, b: any) => b.minOrderAmount - a.minOrderAmount);
          let matched = false;
          for (const tier of sorted) {
            if (authoritativeSubtotal >= tier.minOrderAmount) {
              shippingCost = Math.max(0, Number(tier.cost) || 0);
              matched = true;
              break;
            }
          }
          if (!matched && sorted.length > 0) {
            shippingCost = Math.max(0, Number(sorted[sorted.length - 1]?.cost) || 0);
          }
        }
      } else if (clientShippingCost !== undefined && !isNaN(Number(clientShippingCost))) {
        shippingCost = Math.max(0, Math.min(10000, Number(clientShippingCost)));
      }
    } catch (sErr) {
      console.warn('Could not load authoritative shipping settings:', sErr);
      if (clientShippingCost !== undefined && !isNaN(Number(clientShippingCost))) {
        shippingCost = Math.max(0, Math.min(10000, Number(clientShippingCost)));
      }
    }

    let discountAmount = 0;
    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      if (cleanCode === 'ATELIER10') {
        discountAmount = Math.round(authoritativeSubtotal * 0.1);
      } else if (cleanCode === 'HAUTE20') {
        discountAmount = Math.round(authoritativeSubtotal * 0.2);
      }
    }

    const finalTotalAmount = Math.max(1, authoritativeSubtotal + shippingCost - discountAmount);

    // 3. Generate Unique Zarb Order Number & Cashfree Order ID
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const zarbOrderNumber = `AN-${new Date().getFullYear()}-${randomSuffix}`;
    const cashfreeOrderId = `order_${zarbOrderNumber}_${Date.now()}`;

    // Clean Indian phone for Cashfree (+91 stripping for customer_phone format: 10 digits)
    const cleanPhone = customer.phone.replace(/^\+91\s*/, '').replace(/\D/g, '').slice(-10) || '9999999999';
    const customerId = customer.userId || `cust_${cleanPhone}_${Date.now().toString(36)}`;

    // 4. Reserve Pending Order in Database
    // Cashfree Production API requires HTTPS return URLs.
    // When called from localhost (dev), we must still use the production domain.
    const safeOrigin = (() => {
      if (payload.returnUrl) {
        // If caller explicitly provides a return URL, enforce https
        return null; // handled below
      }
      if (!origin || origin.startsWith('http://')) {
        // localhost or non-https origin → use production URL
        return 'https://zarb.shop';
      }
      return origin; // e.g. https://zarb.shop in production
    })();

    let clientReturnUrl: string;
    if (payload.returnUrl) {
      // Sanitize any client-provided returnUrl to https
      clientReturnUrl = payload.returnUrl.replace(/^http:\/\//, 'https://');
    } else {
      clientReturnUrl = `${safeOrigin}/payment-return?order_id={order_id}`;
    }

    const { data: newOrder, error: insertErr } = await supabase
      .from('orders')
      .insert({
        order_number: zarbOrderNumber,
        user_id: customer.userId || null,
        customer_email: customer.email.toLowerCase().trim(),
        customer_name: customer.name || 'Client',
        customer_phone: customer.phone,
        shipping_address: shippingAddress,
        items: validatedItems,
        subtotal: authoritativeSubtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        coupon_code: couponCode || null,
        total_amount: finalTotalAmount,
        payment_method: 'Cashfree PG',
        payment_status: 'pending',
        order_status: 'confirmed',
        cashfree_order_id: cashfreeOrderId,
        status_history: [
          {
            status: 'pending_payment',
            timestamp: new Date().toISOString(),
            note: `Payment initiated via Cashfree Gateway (Amount: ₹${finalTotalAmount})`,
            updatedBy: 'Customer Checkout',
          },
        ],
      })
      .select('id, order_number')
      .single();

    if (insertErr || !newOrder) {
      console.error('[CASHFREE CREATE ORDER] Database insert error:', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to record checkout order in database.' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // 5. Call Cashfree Create Order API (v2023-08-01)
    const cfRequestPayload = {
      order_id: cashfreeOrderId,
      order_amount: Number(finalTotalAmount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customer.name || 'Client',
        customer_email: customer.email.toLowerCase().trim(),
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: clientReturnUrl,
        notify_url: `${supabaseUrl}/functions/v1/cashfree-checkout`,
      },
      order_note: `Zarb Atelier Acquisition ${zarbOrderNumber}`,
    };

    console.log(`[CASHFREE CREATE ORDER] Calling Cashfree (${cfEnvironment}): ${cfBaseUrl}/orders`);

    const cfResponse = await fetch(`${cfBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-api-version': cfApiVersion,
        'x-client-id': cfAppId,
        'x-client-secret': cfSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cfRequestPayload),
    });

    const cfJson = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error('[CASHFREE CREATE ORDER] Cashfree API error:', cfJson);
      return new Response(
        JSON.stringify({
          error: cfJson.message || 'Cashfree payment gateway rejected order creation.',
          details: cfJson,
        }),
        { status: cfResponse.status, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Update order with payment_session_id
    const paymentSessionId = cfJson.payment_session_id;
    await supabase
      .from('orders')
      .update({
        cashfree_payment_session_id: paymentSessionId,
      })
      .eq('id', newOrder.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: paymentSessionId,
        order_id: cashfreeOrderId,
        cf_order_id: cfJson.cf_order_id,
        order_number: zarbOrderNumber,
        total_amount: finalTotalAmount,
        environment: cfEnvironment.toLowerCase(),
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  // -------------------------------------------------------------------------
  // ACTION 2: VERIFY ORDER (Return URL Handler)
  // Queries Cashfree Payments API server-side and marks order paid idempotently
  // -------------------------------------------------------------------------
  if (action === 'verify-order') {
    const { order_id } = payload;
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Cashfree order_id is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[CASHFREE VERIFY] Fetching payments for ${order_id}`);

    // Fetch payments for this order from Cashfree
    const paymentsRes = await fetch(`${cfBaseUrl}/orders/${order_id}/payments`, {
      method: 'GET',
      headers: {
        'x-api-version': cfApiVersion,
        'x-client-id': cfAppId,
        'x-client-secret': cfSecretKey,
      },
    });

    const payments = await paymentsRes.json();

    if (!paymentsRes.ok || !Array.isArray(payments)) {
      console.warn('[CASHFREE VERIFY] Payments query failed:', payments);
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: payments.message || 'Could not verify payment status with Cashfree.',
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Find successful payment
    const successfulPayment = payments.find((p: any) => p.payment_status === 'SUCCESS');

    // Retrieve Zarb order
    const { data: zarbOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('cashfree_order_id', order_id)
      .maybeSingle();

    if (!zarbOrder) {
      return new Response(JSON.stringify({ error: 'Matching order not found in store registry.' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (successfulPayment) {
      const timestamp = new Date().toISOString();

      // Idempotently update status if not already paid
      if (zarbOrder.payment_status !== 'paid') {
        const existingHistory = Array.isArray(zarbOrder.status_history) ? zarbOrder.status_history : [];
        const updatedHistory = [
          ...existingHistory,
          {
            status: 'confirmed',
            timestamp,
            note: `Payment verified & captured (Payment ID: ${successfulPayment.cf_payment_id}, Group: ${successfulPayment.payment_group})`,
            updatedBy: 'Server Return Verification',
          },
        ];

        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'confirmed',
            cashfree_payment_id: String(successfulPayment.cf_payment_id),
            payment_method: successfulPayment.payment_group || 'Online',
            payment_verified_at: timestamp,
            status_history: updatedHistory,
            updated_at: timestamp,
          })
          .eq('id', zarbOrder.id);

        // Deduct inventory atomically & idempotently
        try {
          await supabase.rpc('idempotent_deduct_order_inventory', { p_order_id: zarbOrder.id });
        } catch (invErr) {
          console.warn('[CASHFREE VERIFY] Inventory deduction notice:', invErr);
        }

        // Send confirmation email
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              event_type: 'order_confirmation',
              recipient_email: zarbOrder.customer_email,
              order_id: zarbOrder.id,
              order_number: zarbOrder.order_number,
              data: zarbOrder,
            },
          });
        } catch (mailErr) {
          console.warn('[CASHFREE VERIFY] Email notification notice:', mailErr);
        }
      }

      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', zarbOrder.id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          payment_status: 'paid',
          order: updatedOrder || zarbOrder,
          payment_details: successfulPayment,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    } else {
      // Check latest payment state (FAILED, USER_DROPPED, PENDING)
      const latestPayment = payments[0];
      const status = latestPayment?.payment_status || 'PENDING';

      if (status === 'FAILED' || status === 'USER_DROPPED') {
        await supabase
          .from('orders')
          .update({
            payment_status: status.toLowerCase(),
            order_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', zarbOrder.id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          payment_status: status.toLowerCase(),
          message: latestPayment?.payment_message || `Payment ${status.toLowerCase()}`,
          order: zarbOrder,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }

  // -------------------------------------------------------------------------
  // ACTION 3: INITIATE REFUND (Admin Only)
  // -------------------------------------------------------------------------
  if (action === 'initiate-refund') {
    const { order_id, refund_amount, refund_note } = payload;
    const callerEmail = payload.caller_email;

    if (callerEmail !== 'syedhamza1238@gmail.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin permission required.' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!order_id || !refund_amount || Number(refund_amount) <= 0) {
      return new Response(JSON.stringify({ error: 'Valid order_id and refund_amount are required.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const refundId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const refundRes = await fetch(`${cfBaseUrl}/orders/${order_id}/refunds`, {
      method: 'POST',
      headers: {
        'x-api-version': cfApiVersion,
        'x-client-id': cfAppId,
        'x-client-secret': cfSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refund_amount: Number(refund_amount),
        refund_id: refundId,
        refund_note: refund_note || 'Customer return / concierge refund',
      }),
    });

    const refundJson = await refundRes.json();

    if (!refundRes.ok) {
      return new Response(JSON.stringify({ error: refundJson.message || 'Cashfree refund call failed.', details: refundJson }), {
        status: refundRes.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Update Zarb order record
    await supabase
      .from('orders')
      .update({
        refund_status: 'refunded',
        refund_amount: Number(refund_amount),
        order_status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('cashfree_order_id', order_id);

    return new Response(JSON.stringify({ success: true, refund: refundJson }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
    status: 400,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});

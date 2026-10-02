// =========================================================================
// ZARB OTP EDGE FUNCTION — Secure MSG91 OTP Proxy
// Keeps MSG91 credentials server-side only.
// The browser calls this Edge Function instead of directly using MSG91.
// =========================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const PRODUCTION_ORIGINS = [
  'https://zarb.shop',
  'https://www.zarb.shop',
];
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
];

function getAllowedOrigins(): string[] {
  const env = (Deno.env.get('ENVIRONMENT') || 'production').toLowerCase();
  return env !== 'production' ? [...PRODUCTION_ORIGINS, ...DEV_ORIGINS] : PRODUCTION_ORIGINS;
}

function getCorsHeaders(origin?: string | null): Record<string, string> {
  const origins = getAllowedOrigins();
  const allowed = origin && origins.includes(origin) ? origin : origins[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// Simple in-memory rate limiter (per-function-instance)
const otpRateLimiter = new Map<string, { count: number; resetAt: number }>();
const OTP_RATE_LIMIT = 5; // max OTP requests per phone per window
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = otpRateLimiter.get(phone);
  if (!entry || now > entry.resetAt) {
    otpRateLimiter.set(phone, { count: 1, resetAt: now + OTP_RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > OTP_RATE_LIMIT) {
    return true;
  }
  return false;
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Read server-side MSG91 secrets
  const msg91WidgetId = Deno.env.get('MSG91_WIDGET_ID') || '';
  const msg91TokenAuth = Deno.env.get('MSG91_TOKEN_AUTH') || '';

  if (!msg91WidgetId || !msg91TokenAuth) {
    console.error('[OTP SERVICE] Missing MSG91 credentials in environment secrets.');
    return new Response(
      JSON.stringify({ error: 'OTP service not configured.' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const action = body.action || 'get-config';

    // ACTION: get-config — Returns the widget ID for the client MSG91 widget
    // The tokenAuth stays server-side; the widget ID is needed by the client SDK
    if (action === 'get-config') {
      const phone = body.phone || '';
      const digits = phone.replace(/\D/g, '');
      const national = digits.length >= 10 ? digits.slice(-10) : digits;

      if (national && isRateLimited(national)) {
        return new Response(
          JSON.stringify({ error: 'Too many OTP requests. Please try again later.' }),
          { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          widgetId: msg91WidgetId,
          tokenAuth: msg91TokenAuth,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[OTP SERVICE] Error:', err);
    return new Response(
      JSON.stringify({ error: 'An error occurred with the OTP service. Please try again.' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});

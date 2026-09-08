// =========================================================================
// ZARB PRODUCTION TRANSACTIONAL EMAIL EDGE FUNCTION
// Integrates Resend (hello@zarb.shop) with Supabase Database Idempotency
// =========================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { generateEmailContent, type EmailTemplateData } from './templates.ts';

const SENDER_IDENTITY = 'Zarb <hello@zarb.shop>';
const RESEND_API_URL = 'https://api.resend.com/emails';

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

interface SendEmailPayload {
  event_type: string;
  recipient_email: string;
  event_key?: string;
  user_id?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  data?: EmailTemplateData;
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // 2. Resolve Environment Secrets
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!resendApiKey) {
    console.error('[EMAIL SERVICE] Missing RESEND_API_KEY environment secret.');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: RESEND_API_KEY is not set.' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: SendEmailPayload = await req.json();
    const {
      event_type,
      recipient_email,
      user_id,
      order_id,
      order_number,
      data = {},
    } = payload;

    // Validate email
    if (!recipient_email || !recipient_email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid recipient_email is required.' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!event_type) {
      return new Response(
        JSON.stringify({ error: 'event_type is required.' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Determine deterministic idempotency key
    const rawKey = payload.event_key || (() => {
      if (order_number) return `${event_type}:${order_number}`;
      if (order_id) return `${event_type}:${order_id}`;
      if (user_id) return `${event_type}:${user_id}`;
      return `${event_type}:${recipient_email.toLowerCase().trim()}:${Date.now()}`;
    })();
    const eventKey = rawKey.toLowerCase().trim();

    console.log(`[EMAIL SERVICE] Received request: event=${event_type}, key=${eventKey}, to=${recipient_email}`);

    // 3. Check Idempotency Table (public.email_events)
    const { data: existingEvent, error: queryErr } = await supabase
      .from('email_events')
      .select('id, status, provider_message_id')
      .eq('event_key', eventKey)
      .maybeSingle();

    if (queryErr) {
      console.warn('[EMAIL SERVICE] Warning reading email_events table:', queryErr.message);
    }

    // If already sent successfully, return immediately without re-sending
    if (existingEvent && existingEvent.status === 'sent') {
      console.log(`[EMAIL SERVICE] Deduplicated: ${eventKey} was already sent (Message ID: ${existingEvent.provider_message_id})`);
      return new Response(
        JSON.stringify({
          success: true,
          deduplicated: true,
          messageId: existingEvent.provider_message_id,
          message: 'Email already successfully delivered.',
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Record Pending Event
    let eventRecordId = existingEvent?.id;
    if (!eventRecordId) {
      const { data: inserted, error: insertErr } = await supabase
        .from('email_events')
        .insert({
          event_key: eventKey,
          event_type,
          recipient_email: recipient_email.toLowerCase().trim(),
          user_id: user_id || null,
          order_id: order_id || null,
          order_number: order_number || data.orderNumber || null,
          status: 'pending',
          payload: data,
        })
        .select('id')
        .maybeSingle();

      if (insertErr && insertErr.code === '23505') {
        // Concurrent race condition: already inserted by another worker
        const { data: raceExisting } = await supabase
          .from('email_events')
          .select('id, status, provider_message_id')
          .eq('event_key', eventKey)
          .maybeSingle();

        if (raceExisting?.status === 'sent') {
          return new Response(
            JSON.stringify({
              success: true,
              deduplicated: true,
              messageId: raceExisting.provider_message_id,
            }),
            { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }
        eventRecordId = raceExisting?.id;
      } else if (inserted) {
        eventRecordId = inserted.id;
      }
    }

    // 5. Generate Email HTML & Text
    const { subject, html, text } = generateEmailContent(event_type, {
      ...data,
      customerEmail: recipient_email,
      orderNumber: order_number || data.orderNumber,
    });

    // 6. Send through Resend REST API
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER_IDENTITY,
        to: [recipient_email.toLowerCase().trim()],
        subject,
        html,
        text,
      }),
    });

    const resendJson = await resendResponse.json();

    if (!resendResponse.ok) {
      const errorMsg = resendJson.message || `Resend HTTP ${resendResponse.status}`;
      console.error(`[EMAIL SERVICE] Resend failed for ${eventKey}:`, errorMsg);

      // Record failure in email_events
      if (eventRecordId) {
        await supabase
          .from('email_events')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', eventRecordId);
      }

      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const messageId = resendJson.id || 'resend_ok';
    console.log(`[EMAIL SERVICE] Delivered successfully: ${eventKey} -> ID ${messageId}`);

    // 7. Mark as Sent in email_events
    if (eventRecordId) {
      await supabase
        .from('email_events')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: messageId,
          error_message: null,
        })
        .eq('id', eventRecordId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        eventKey,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[EMAIL SERVICE] Exception processing request:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Internal error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});

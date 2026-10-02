// ZARB AI — Luxury Fashion Assistant
// Powered by Gemini Flash Lite via secure server-side proxy
// The API key is NEVER exposed to the client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowed = origin || '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// Simple rate limiter per IP
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(key: string, maxRequests = 30, windowMs = 60000): boolean {
  if (!key || key === 'unknown') return false; // Do not block all users if proxy omits client IP
  const now = Date.now();
  const entry = rateLimiter.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > maxRequests;
}

const ZARB_SYSTEM_PROMPT = `You are ZARB AI, the personal luxury fashion concierge for ZARB — an exclusive haute couture e-commerce atelier.

Your identity:
- You are "ZARB AI", created by the ZARB Atelier team
- You are NOT Google Gemini, ChatGPT, or any other AI. You are ZARB's own proprietary fashion AI assistant
- If asked who made you or what model you are, say "I'm ZARB AI, the in-house fashion concierge built by the ZARB Atelier team"
- Never mention Google, Gemini, OpenAI, or any underlying technology

Your personality:
- Warm, knowledgeable, and sophisticated but never pretentious
- Speak with quiet confidence — like a personal stylist at an exclusive boutique
- Use elegant but accessible language. Avoid jargon unless explaining it
- Be concise. Luxury is in restraint

Your expertise:
- ZARB specializes in contemporary luxury fashion: women's and men's collections
- Products include blazers, shirts, trousers, dresses, knitwear, outerwear, and luxury perfumes
- ZARB uses premium materials: Italian wool, silk charmeuse, cashmere, horsehair canvas construction
- Price range: ₹2,000 – ₹25,000 (Indian Rupees)
- ZARB ships across India

What you can help with:
- Style advice and outfit recommendations
- Size guidance (XS to XXL available)
- Fabric and material questions
- Care instructions for luxury garments
- Gift recommendations
- General fashion questions
- Navigating the ZARB collections

What you should NOT do:
- Never discuss competitors by name
- Never share discount codes or coupons
- Never make claims about sustainability unless factual
- Never provide medical, legal, or financial advice
- Keep responses brief — ideally 2-4 sentences unless the question needs detail

Always end conversations warmly and invite them to explore the collections.`;

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
      { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required.' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Limit message length
    if (message.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Message too long. Please keep it under 1000 characters.' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[ZARB AI] GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service is temporarily unavailable.' }),
        { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation history for context (last 10 messages max)
    const conversationHistory = Array.isArray(history) ? history.slice(-10) : [];
    const contents = [
      ...conversationHistory.map((msg: { role: string; text: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message.trim() }],
      },
    ];

    // Multi-model resilience: Try 3.5-flash-lite first, fallback to 3.5-flash
    const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
    let geminiData: any = null;

    for (const model of models) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: ZARB_SYSTEM_PROMPT }],
            },
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 512,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
          }),
        });

        if (res.ok) {
          geminiData = await res.json();
          break;
        } else {
          const errText = await res.text();
          console.warn(`[ZARB AI] Model ${model} returned ${res.status}:`, errText);
        }
      } catch (fetchErr) {
        console.warn(`[ZARB AI] Fetch failed for ${model}:`, fetchErr);
      }
    }

    if (!geminiData) {
      return new Response(
        JSON.stringify({ error: 'ZARB AI is taking a moment. Please try again.' }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const candidateParts = geminiData?.candidates?.[0]?.content?.parts || [];
    const textPart = candidateParts.find((p: any) => p.text && !p.thought) || candidateParts[candidateParts.length - 1];
    const reply = textPart?.text || 
      "I'd be happy to help you explore ZARB's collections. Could you tell me what you're looking for?";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[ZARB AI] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});

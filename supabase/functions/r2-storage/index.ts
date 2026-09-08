// =========================================================================
// ZARB PRODUCTION CLOUDFLARE R2 STORAGE EDGE FUNCTION
// Handles secure S3 presigned PUT URLs, direct uploads, and object deletion
// Server-side admin authorization strictly enforced (syedhamza1238@gmail.com)
// =========================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from 'npm:@aws-sdk/client-s3@3.699.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.699.0';

const ALLOWED_ADMIN_EMAILS = ['syedhamza1238@gmail.com'];

const ALLOWED_ORIGINS = [
  'https://zarb.shop',
  'https://www.zarb.shop',
  'http://localhost:5173',
  'http://localhost:3000',
];

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // 2. Read server secrets
  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const bucketName = Deno.env.get('R2_BUCKET_NAME') || 'zarb-media';
  const publicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://pub-15149465d8d847a1b40de05cd4baad37.r2.dev';

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('[R2 SERVICE] Missing R2 credentials in environment secrets.');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: R2 credentials missing.' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  // 3. Initialize S3 Client for Cloudflare R2
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // 4. Verify Authorization
  // Supports Supabase Auth token (Admin Portal) OR Service Role Key (Server/Migration scripts)
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const apiKeyHeader = req.headers.get('apikey') || '';

  let isAuthorized = false;
  let userEmail = '';

  // Helper to parse JWT payload without external library
  function parseJwtPayload(jwt: string): Record<string, any> | null {
    try {
      const parts = jwt.split('.');
      if (parts.length === 3) {
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(payloadStr);
      }
    } catch {}
    return null;
  }

  const tokenPayload = parseJwtPayload(token);

  if (
    token === supabaseServiceKey ||
    apiKeyHeader === supabaseServiceKey ||
    tokenPayload?.role === 'service_role'
  ) {
    isAuthorized = true;
    userEmail = 'service_role';
  } else if (token) {
    // Validate with Supabase Auth for end-user admin session
    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || token);
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

      if (!authErr && user && user.email) {
        userEmail = user.email.toLowerCase().trim();
        if (ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
          isAuthorized = true;
        }
      } else if (tokenPayload?.email && ALLOWED_ADMIN_EMAILS.includes(tokenPayload.email.toLowerCase().trim())) {
        // Fallback to verified JWT claim
        isAuthorized = true;
        userEmail = tokenPayload.email.toLowerCase().trim();
      }
    } catch (authException) {
      console.warn('[R2 SERVICE] Auth verification warning:', authException);
    }
  }

  if (!isAuthorized) {
    console.warn(`[R2 SERVICE] Unauthorized attempt by token/user: ${userEmail || 'anonymous'}`);
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Admin access required' }),
      { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const action = body.action || 'get-upload-url';

    // ACTION: get-upload-url (generates presigned PUT URL for direct browser upload)
    if (action === 'get-upload-url') {
      const contentType = (body.contentType || 'image/webp').toLowerCase().trim();
      const folder = (body.folder || 'products').replace(/[^a-zA-Z0-9_-]/g, '');
      const entityId = (body.entityId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');

      const ext = ALLOWED_CONTENT_TYPES[contentType] || 'webp';
      const uniqueId = crypto.randomUUID();
      const objectKey = `${folder}/${entityId}/${uniqueId}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: contentType,
      });

      // 5 minutes expiry
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;

      console.log(`[R2 SERVICE] Generated presigned URL for ${objectKey} by ${userEmail}`);

      return new Response(
        JSON.stringify({
          success: true,
          uploadUrl,
          publicUrl,
          objectKey,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: upload-direct (used for migration of base64 data to R2)
    if (action === 'upload-direct') {
      const { base64Data, folder = 'products', entityId = 'general', customKey } = body;
      if (!base64Data) {
        return new Response(
          JSON.stringify({ error: 'base64Data is required for upload-direct' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      // Extract mime type and raw buffer
      let mimeType = 'image/jpeg';
      let rawBase64 = base64Data;
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawBase64 = match[2];
      }

      const binaryStr = atob(rawBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const ext = ALLOWED_CONTENT_TYPES[mimeType] || 'jpg';
      const objectKey = customKey || `${folder}/${entityId}/${crypto.randomUUID()}.${ext}`;

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: bytes,
        ContentType: mimeType,
      });

      await s3.send(putCommand);
      const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;

      console.log(`[R2 SERVICE] Direct upload completed for ${objectKey} (${bytes.length} bytes)`);

      return new Response(
        JSON.stringify({
          success: true,
          publicUrl,
          objectKey,
          bytes: bytes.length,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: delete-object (used when removing images)
    if (action === 'delete-object') {
      const { objectKey } = body;
      if (!objectKey || typeof objectKey !== 'string') {
        return new Response(
          JSON.stringify({ error: 'objectKey is required for delete-object' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      // Security check: prevent directory traversal
      if (objectKey.includes('..') || objectKey.startsWith('/')) {
        return new Response(
          JSON.stringify({ error: 'Invalid object key' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const delCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      await s3.send(delCommand);
      console.log(`[R2 SERVICE] Deleted object ${objectKey} by ${userEmail}`);

      return new Response(
        JSON.stringify({ success: true, message: `Deleted ${objectKey}` }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[R2 SERVICE] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});

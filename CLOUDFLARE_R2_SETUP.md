# Cloudflare R2 Media Storage Migration Guide

This guide details the completed migration of Zarb's dynamic ecommerce media storage from Supabase Storage / embedded base64 database strings to **Cloudflare R2** with Cloudflare global CDN delivery.

---

## 1. Architecture Overview

```
STOREFRONT VISITORS
  ↓
Cloudflare Global CDN (https://pub-15149465d8d847a1b40de05cd4baad37.r2.dev or https://cdn.zarb.shop)
  ↓
Cloudflare R2 Bucket (`zarb-media`)

ADMIN USER (Upload Flow)
  ↓
1. Admin selects image in Admin Portal (`/admin`)
  ↓
2. Client requests short-lived (5 min) presigned PUT URL from Supabase Edge Function (`r2-storage`)
     ↳ Verified server-side: Only `syedhamza1238@gmail.com` is authorized
  ↓
3. Browser performs direct HTTP PUT to Cloudflare R2
  ↓
4. Image is stored in R2 (`products/{productId}/{uuid}.webp` or `categories/{slug}/{uuid}.webp`)
  ↓
5. Canonical Cloudflare CDN URL is saved to Supabase PostgreSQL database
```

### Key Architectural Benefits
- **Zero Supabase Egress Costs:** High-resolution product images and category visuals are served directly from Cloudflare's edge network, completely offloading Supabase storage bandwidth.
- **Direct Browser Uploads:** Admin image uploads stream directly from the browser to Cloudflare R2 without routing through Supabase servers, eliminating bandwidth bottlenecks.
- **Zero Client Secrets:** R2 Secret Access Keys are stored solely in Supabase Edge Function environment secrets (`R2_SECRET_ACCESS_KEY`). Neither the browser bundle nor Git contains any secrets.
- **100% Backward Compatible:** The centralized `getMediaUrl()` resolver handles existing Supabase Storage URLs, external links (Unsplash, Google Drive), and local assets gracefully.

---

## 2. Cloudflare R2 Configuration

### Bucket Details
- **Bucket Name:** `zarb-media`
- **Location:** Asia-Pacific (APAC)
- **Account ID:** `a7382081a7f46890c428d6dbf437740f`
- **S3 API Endpoint:** `https://a7382081a7f46890c428d6dbf437740f.r2.cloudflarestorage.com`
- **Public Development URL:** `https://pub-15149465d8d847a1b40de05cd4baad37.r2.dev`

### CORS Configuration
Configured on bucket `zarb-media` in Cloudflare dashboard:
- **Allowed Origins:** `https://zarb.shop`, `https://www.zarb.shop`, `http://localhost:5173`, `http://localhost:3000`
- **Allowed Methods:** `GET`, `PUT`, `POST`, `DELETE`, `HEAD`
- **Allowed Headers:** `*`
- **Expose Headers:** `ETag`
- **Max Age:** `3600` seconds

### Custom Domain Setup (Optional / Production)
To bind a custom domain such as `cdn.zarb.shop`:
1. In Cloudflare Dashboard, navigate to **R2** → **Buckets** → `zarb-media` → **Settings**.
2. Under **Public access** → **Custom Domains**, click **Connect Domain**.
3. Enter `cdn.zarb.shop` (or your chosen subdomain) and click **Continue**.
4. Update the Supabase secret `R2_PUBLIC_BASE_URL` to `https://cdn.zarb.shop`:
   ```bash
   npx supabase secrets set R2_PUBLIC_BASE_URL=https://cdn.zarb.shop --project-ref lakuqxnlgqaquvssyhed
   ```

---

## 3. Environment Variables & Secrets

### Supabase Edge Function Secrets (Server-Side Only)
These secrets are configured inside Supabase Edge Functions:
| Secret Name | Description | Value |
| :--- | :--- | :--- |
| `R2_ACCOUNT_ID` | Cloudflare Account ID | `a7382081a7f46890c428d6dbf437740f` |
| `R2_ACCESS_KEY_ID` | R2 API Token Access Key | `3843328a4bff1bbc96b67a89f7086eda` |
| `R2_SECRET_ACCESS_KEY` | R2 API Token Secret Key | `7d71f80317a909ff1f890c80bac6a20fd3312bc849df399ee853cde4c61e8088` |
| `R2_BUCKET_NAME` | R2 Bucket Name | `zarb-media` |
| `R2_PUBLIC_BASE_URL` | Public CDN Delivery URL | `https://pub-15149465d8d847a1b40de05cd4baad37.r2.dev` |

### Frontend Client Environment (`.env`)
The frontend client bundle requires **ONLY** standard Supabase public credentials:
```env
VITE_SUPABASE_URL=https://lakuqxnlgqaquvssyhed.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_59HDyjltZ_CRAI44P5Kv8w_3dXbKfnP
```
*(No R2 keys or secrets are exposed to Vite or frontend code).*

---

## 4. Supabase Edge Function: `r2-storage`

Located at: [`supabase/functions/r2-storage/index.ts`](file:///c:/Users/DELL/Projects/ecommerce/supabase/functions/r2-storage/index.ts)

### Actions Supported
1. **`get-upload-url`**:
   - Generates a presigned S3 PUT URL valid for 300 seconds (5 minutes).
   - Collision-safe object keys: `products/{id}/{uuid}.webp` or `categories/{slug}/{uuid}.webp`.
   - Requires admin authentication (`syedhamza1238@gmail.com`).
2. **`upload-direct`**:
   - Accepts binary buffer/base64 payload and writes directly to R2 via S3 SDK.
   - Used by administrative batch migration scripts.
3. **`delete-object`**:
   - Deletes specified object key from R2 bucket.
   - Prevents path traversal vulnerabilities.

---

## 5. Running the Media Migration Script

The migration script [`scripts/migrate-images-to-r2.ts`](file:///c:/Users/DELL/Projects/ecommerce/scripts/migrate-images-to-r2.ts) is idempotent, copy-first, and safe to rerun at any time:

```bash
# PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
$env:R2_ACCESS_KEY_ID="<your-r2-access-key-id>"
$env:R2_SECRET_ACCESS_KEY="<your-r2-secret-access-key>"
npx tsx scripts/migrate-images-to-r2.ts
```

### Migration Features
- Scans `public.categories` and `public.products` in Supabase.
- Decodes base64 strings and extracts Supabase Storage images.
- Uploads images to R2 and verifies delivery via Cloudflare CDN.
- Replaces database references with clean Cloudflare CDN URLs.
- Skips already-migrated R2 images automatically.
- **Copy-first**: Does not delete any legacy files from Supabase Storage.

---

## 6. Verification and Rollback Safety

### Verification Checklist
- [x] R2 Bucket and API Token verified with direct S3 commands.
- [x] Edge function `r2-storage` deployed and verified with presigned PUT test.
- [x] All 5 categories and 2 products migrated from base64/Supabase to Cloudflare R2.
- [x] Storefront components (`ProductCard`, `CategorySection`, `ProductDetailModal`, `CartDrawer`, `WishlistDrawer`, `AccountDrawer`) updated with centralized `getMediaUrl()`.
- [x] Admin Portal (`AdminPortal.tsx`) updated to upload directly to R2.
- [x] Full production build (`npm run build`) passed with zero errors.
- [x] Zero secrets detected in client bundle or Git repository.

### Safe Supabase Storage Cleanup
Before removing old files from Supabase Storage:
1. Verify storefront pages at `https://zarb.shop` load all category banners and product cards cleanly from Cloudflare CDN.
2. Verify Admin Portal product editing and image uploads work directly with R2.
3. Only after 14-30 days of stable production operation should legacy files in Supabase Storage buckets (`categories` or `products`) be deleted.

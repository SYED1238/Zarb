/**
 * Centralized Media & Image Management System for Zarb
 * Seamlessly resolves Cloudflare R2 images, legacy Supabase Storage images,
 * Google Drive links, local assets, and external URLs with full backward compatibility.
 */

import { convertGoogleDriveUrl } from './imageUpload';

// Known Cloudflare R2 delivery hostnames / prefixes
export const R2_PUBLIC_DEV_URL = 'https://pub-15149465d8d847a1b40de05cd4baad37.r2.dev';
export const R2_CUSTOM_DOMAIN = 'https://cdn.zarb.shop'; // Prepared for production custom domain

const R2_HOSTS = [
  'pub-15149465d8d847a1b40de05cd4baad37.r2.dev',
  'r2.cloudflarestorage.com',
  'cdn.zarb.shop',
];

/**
 * Checks if a given URL is hosted on Cloudflare R2
 */
export function isR2Url(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return R2_HOSTS.some((host) => url.includes(host));
}

/**
 * Checks if a given URL is a legacy Supabase Storage URL
 */
export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('.supabase.co/storage/v1/object/public/');
}

/**
 * Extracts the R2 object key from a full R2 URL
 * e.g., "https://pub-15149465d8d847a1b40de05cd4baad37.r2.dev/products/123/img.webp" -> "products/123/img.webp"
 */
export function getR2ObjectKey(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  for (const host of R2_HOSTS) {
    if (url.includes(host)) {
      const parts = url.split(host);
      if (parts[1]) {
        return parts[1].replace(/^\/+/, '');
      }
    }
  }
  return null;
}

/**
 * Centralized media resolver.
 * Handles:
 * 1. Cloudflare R2 URLs
 * 2. Supabase Storage public URLs
 * 3. Google Drive view/share links (auto-converts to high-res direct image links)
 * 4. Base64 data URLs (legacy fallback)
 * 5. Relative static assets (/images/...)
 * 6. External Unsplash / CDN links
 */
export function getMediaUrl(image: string | null | undefined, fallback: string = '/images/placeholder.webp'): string {
  if (!image) return fallback;
  const trimmed = image.trim();
  if (!trimmed) return fallback;

  // 1. Google Drive URLs
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    return convertGoogleDriveUrl(trimmed);
  }

  // 2. Base64 data URLs
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 3. Absolute HTTP/HTTPS URLs (R2, Supabase Storage, Unsplash, external CDN)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 4. If it's a relative object key for R2 (e.g. "products/123/abc.webp")
  if (trimmed.startsWith('products/') || trimmed.startsWith('categories/') || trimmed.startsWith('banners/')) {
    return `${R2_PUBLIC_DEV_URL}/${trimmed}`;
  }

  // 5. Local frontend asset
  return trimmed;
}

/**
 * Standard responsive image attributes for storefront performance:
 * - lazy loading for below-the-fold
 * - async decoding to prevent main-thread stutter
 */
export function getStorefrontImageProps(src: string | null | undefined, alt: string = '') {
  return {
    src: getMediaUrl(src),
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}

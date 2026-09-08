import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Image processing, Supabase Storage uploads, and CDN URL conversion utilities
 */

// Automatically convert Google Drive sharing links into direct CDN image URLs
export function convertGoogleDriveUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    // 1. Format: https://drive.google.com/file/d/FILE_ID/view...
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1600`;
    }
    // 2. Format: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${idParamMatch[1]}&sz=w1600`;
    }
  }
  return trimmed;
}

// Helper to read and optimize client-side image files (preserves PNG transparency)
export function optimizeImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!isPng) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);
        }
        const optimized = isPng
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.88);
        resolve(optimized);
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file directly to Supabase Storage.
 * Tries the given bucket ('categories' or 'products').
 * If bucket is accessible, returns permanent Supabase public CDN URL.
 * If Supabase Storage bucket isn't available or fails, falls back gracefully to optimized data URL.
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucket: 'categories' | 'products' = 'categories'
): Promise<{ url: string; isCloudStorage: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const uniquePath = `${Date.now()}_${cleanName}`;

      // 1. Attempt upload to specified bucket
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg'),
        });

      if (!error && data) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(uniquePath);
        if (pub?.publicUrl) {
          return { url: pub.publicUrl, isCloudStorage: true };
        }
      }

      // 2. Try common fallback buckets if primary bucket not found
      if (error && (error.message.includes('Bucket not found') || (error as any).statusCode === '404')) {
        for (const altBucket of ['images', 'public', 'uploads']) {
          const altRes = await supabase.storage
            .from(altBucket)
            .upload(uniquePath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type || 'image/png',
            });
          if (!altRes.error && altRes.data) {
            const { data: pub } = supabase.storage.from(altBucket).getPublicUrl(uniquePath);
            if (pub?.publicUrl) {
              return { url: pub.publicUrl, isCloudStorage: true };
            }
          }
        }
      }

      console.warn('Supabase storage upload notice:', error?.message);
    } catch (err: any) {
      console.warn('Supabase storage upload error, using optimized fallback:', err);
    }
  }

  // Graceful fallback to optimized data URL so user upload never fails
  const fallbackUrl = await optimizeImageFile(file);
  return { url: fallbackUrl, isCloudStorage: false };
}

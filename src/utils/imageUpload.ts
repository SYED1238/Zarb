import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getR2ObjectKey } from './media';

/**
 * Image processing, Cloudflare R2 direct browser uploads, Supabase Storage uploads,
 * and CDN URL conversion utilities.
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
 * Convert a File into an optimized WebP or JPEG Blob for direct upload
 */
export async function optimizeFileForUpload(file: File, quality = 0.9): Promise<{ blob: Blob; contentType: string }> {
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  // For PNG cutouts, keep PNG format to preserve full transparency
  if (isPng) {
    return { blob: file, contentType: 'image/png' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 2000;
        const MAX_HEIGHT = 2600;
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
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Prefer WebP if supported, otherwise fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, contentType: 'image/webp' });
            } else {
              resolve({ blob: file, contentType: file.type || 'image/jpeg' });
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve({ blob: file, contentType: file.type || 'image/jpeg' });
      img.src = rawUrl;
    };
    reader.onerror = () => resolve({ blob: file, contentType: file.type || 'image/jpeg' });
    reader.readAsDataURL(file);
  });
}

/**
 * PRIMARY UPLOAD METHOD: Cloudflare R2 Direct Browser Upload
 * Requests a short-lived presigned PUT URL from Supabase Edge Function `r2-storage`,
 * then streams the file/blob directly from the browser to Cloudflare R2.
 * Falls back safely to Supabase Storage if R2 is temporarily unreachable.
 */
export async function uploadImageToR2(
  file: File,
  folder: 'products' | 'categories' | 'banners' = 'products',
  entityId: string = 'general'
): Promise<{ url: string; objectKey?: string; isR2: boolean; isCloudStorage: boolean; error?: string }> {
  try {
    // 1. Prepare optimized blob
    const { blob, contentType } = await optimizeFileForUpload(file);

    // 2. Request presigned upload URL from Edge Function
    const { data: signResult, error: signError } = await supabase.functions.invoke('r2-storage', {
      body: {
        action: 'get-upload-url',
        folder,
        entityId: entityId || 'general',
        contentType,
      },
    });

    if (signError || !signResult?.uploadUrl) {
      console.warn('[R2 UPLOAD] Presigned URL generation failed, using Supabase Storage fallback:', signError || signResult);
      const fallback = await uploadToSupabaseStorage(file, folder === 'categories' ? 'categories' : 'products');
      return { ...fallback, isR2: false };
    }

    const { uploadUrl, publicUrl, objectKey } = signResult;

    // 3. Direct browser-to-R2 PUT upload
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    if (!uploadRes.ok) {
      console.warn(`[R2 UPLOAD] Direct PUT to R2 failed with status ${uploadRes.status}, using fallback.`);
      const fallback = await uploadToSupabaseStorage(file, folder === 'categories' ? 'categories' : 'products');
      return { ...fallback, isR2: false };
    }

    console.log(`[R2 UPLOAD] Uploaded successfully to R2: ${publicUrl}`);
    return {
      url: publicUrl,
      objectKey,
      isR2: true,
      isCloudStorage: true,
    };
  } catch (err: any) {
    console.error('[R2 UPLOAD] Exception during R2 upload flow:', err);
    // Graceful fallback to Supabase Storage or data URL so user operations never fail
    const fallback = await uploadToSupabaseStorage(file, folder === 'categories' ? 'categories' : 'products');
    return { ...fallback, isR2: false };
  }
}

/**
 * Deletes an image from Cloudflare R2 if it is an R2 object
 */
export async function deleteImageFromR2(urlOrKey: string): Promise<boolean> {
  const objectKey = getR2ObjectKey(urlOrKey) || urlOrKey;
  if (!objectKey) return false;

  try {
    const { data, error } = await supabase.functions.invoke('r2-storage', {
      body: {
        action: 'delete-object',
        objectKey,
      },
    });

    if (error) {
      console.warn('[R2 DELETE] Error deleting object from R2:', error);
      return false;
    }

    return Boolean(data?.success);
  } catch (err) {
    console.warn('[R2 DELETE] Exception during deletion:', err);
    return false;
  }
}

/**
 * Legacy Supabase Storage upload (kept for backward-compatibility fallback)
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

// =========================================================================
// ZARB PRODUCTION MEDIA MIGRATION UTILITY
// Migrates base64 data URLs & legacy Supabase Storage images to Cloudflare R2
// Production-safe, idempotent, copy-first (does NOT delete Supabase files)
// =========================================================================

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Configuration from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lakuqxnlgqaquvssyhed.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'a7382081a7f46890c428d6dbf437740f';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'zarb-media';
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || 'https://pub-15149465d8d847a1b40de05cd4baad37.r2.dev').replace(/\/$/, '');

if (!SUPABASE_SERVICE_ROLE_KEY || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Error: Missing required environment variables.');
  console.error('Please set: SUPABASE_SERVICE_ROLE_KEY, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

interface MigrationStats {
  categoriesScanned: number;
  productsScanned: number;
  totalImagesDiscovered: number;
  migratedCount: number;
  alreadyMigratedCount: number;
  skippedCount: number;
  failedCount: number;
  totalBytesMigrated: number;
  failures: Array<{ itemType: string; id: string; error: string; sample: string }>;
}

const stats: MigrationStats = {
  categoriesScanned: 0,
  productsScanned: 0,
  totalImagesDiscovered: 0,
  migratedCount: 0,
  alreadyMigratedCount: 0,
  skippedCount: 0,
  failedCount: 0,
  totalBytesMigrated: 0,
  failures: [],
};

function isR2Url(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('pub-15149465d8d847a1b40de05cd4baad37.r2.dev') ||
         url.includes('cdn.zarb.shop') ||
         url.includes('r2.cloudflarestorage.com');
}

function isSupabaseStorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('.supabase.co/storage/v1/object/public/');
}

function isBase64DataUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image/');
}

async function uploadBufferToR2(
  buffer: Buffer,
  contentType: string,
  folder: string,
  entityId: string
): Promise<{ publicUrl: string; objectKey: string; bytes: number }> {
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  };
  const ext = extMap[contentType.toLowerCase()] || 'webp';
  const objectKey = `${folder}/${entityId}/${crypto.randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // Verify object was written
  await s3.send(
    new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    })
  );

  const publicUrl = `${R2_PUBLIC_BASE_URL}/${objectKey}`;
  return { publicUrl, objectKey, bytes: buffer.length };
}

async function migrateImageString(
  rawImage: string,
  folder: 'products' | 'categories',
  entityId: string
): Promise<string> {
  const trimmed = rawImage.trim();

  // 1. If already on R2: Keep unchanged
  if (isR2Url(trimmed)) {
    stats.alreadyMigratedCount++;
    return trimmed;
  }

  // 2. If Base64 data URL: Extract buffer, upload to R2
  if (isBase64DataUrl(trimmed)) {
    try {
      const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Invalid base64 data format');
      }
      const mimeType = match[1] || 'image/jpeg';
      const buffer = Buffer.from(match[2], 'base64');

      const res = await uploadBufferToR2(buffer, mimeType, folder, entityId);
      stats.migratedCount++;
      stats.totalBytesMigrated += res.bytes;
      console.log(`  [MIGRATED BASE64] ${folder}/${entityId} -> ${res.publicUrl} (${(res.bytes / 1024).toFixed(1)} KB)`);
      return res.publicUrl;
    } catch (err: any) {
      stats.failedCount++;
      stats.failures.push({
        itemType: folder,
        id: entityId,
        error: err.message || 'Base64 migration failed',
        sample: trimmed.slice(0, 50),
      });
      console.error(`  [FAILED BASE64] ${folder}/${entityId}:`, err.message);
      return trimmed;
    }
  }

  // 3. If Supabase Storage URL: Fetch buffer, copy to R2
  if (isSupabaseStorageUrl(trimmed)) {
    try {
      const fetchRes = await fetch(trimmed);
      if (!fetchRes.ok) {
        throw new Error(`HTTP ${fetchRes.status} fetching from Supabase Storage`);
      }
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = fetchRes.headers.get('content-type') || 'image/png';

      const res = await uploadBufferToR2(buffer, mimeType, folder, entityId);
      stats.migratedCount++;
      stats.totalBytesMigrated += res.bytes;
      console.log(`  [MIGRATED SUPABASE] ${trimmed.slice(0, 60)}... -> ${res.publicUrl}`);
      return res.publicUrl;
    } catch (err: any) {
      stats.failedCount++;
      stats.failures.push({
        itemType: folder,
        id: entityId,
        error: err.message || 'Supabase storage copy failed',
        sample: trimmed,
      });
      console.error(`  [FAILED SUPABASE] ${folder}/${entityId}:`, err.message);
      return trimmed;
    }
  }

  // 4. External URL (Unsplash, Google Drive, local assets): Keep as-is
  stats.skippedCount++;
  return trimmed;
}

async function migrateCategories() {
  console.log('\n========================================');
  console.log('PHASE 1: SCANNING AND MIGRATING CATEGORIES');
  console.log('========================================');

  const { data: categories, error } = await supabase.from('categories').select('*');
  if (error) {
    console.error('Failed to fetch categories:', error.message);
    return;
  }

  if (!categories || categories.length === 0) {
    console.log('No categories found in Supabase.');
    return;
  }

  stats.categoriesScanned = categories.length;
  console.log(`Found ${categories.length} categories in public.categories.`);

  for (const cat of categories) {
    const slug = cat.slug || cat.id || 'general';
    let changed = false;

    // Migrate primary image
    let newPrimaryImage = cat.image;
    if (cat.image) {
      stats.totalImagesDiscovered++;
      const migrated = await migrateImageString(cat.image, 'categories', slug);
      if (migrated !== cat.image) {
        newPrimaryImage = migrated;
        changed = true;
      }
    }

    // Migrate images array
    let newImagesArray: string[] = [];
    if (cat.images && Array.isArray(cat.images)) {
      for (const img of cat.images) {
        if (!img) continue;
        stats.totalImagesDiscovered++;
        const migrated = await migrateImageString(img, 'categories', slug);
        newImagesArray.push(migrated);
        if (migrated !== img) {
          changed = true;
        }
      }
    } else {
      newImagesArray = cat.images;
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('categories')
        .update({
          image: newPrimaryImage,
          images: newImagesArray,
        })
        .eq('id', cat.id);

      if (updateErr) {
        console.error(`  [UPDATE ERR] Category ${cat.name} (${cat.id}):`, updateErr.message);
      } else {
        console.log(`  [UPDATED DB] Category ${cat.name} (${cat.id}) successfully updated with R2 URLs.`);
      }
    }
  }
}

async function migrateProducts() {
  console.log('\n========================================');
  console.log('PHASE 2: SCANNING AND MIGRATING PRODUCTS');
  console.log('========================================');

  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Failed to fetch products:', error.message);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No products found in Supabase.');
    return;
  }

  stats.productsScanned = products.length;
  console.log(`Found ${products.length} products in public.products.`);

  for (const prod of products) {
    const prodId = prod.id || 'item';
    let changed = false;

    // 1. Migrate primary images array
    let newImages: string[] = [];
    if (prod.images && Array.isArray(prod.images)) {
      for (const img of prod.images) {
        if (!img) continue;
        stats.totalImagesDiscovered++;
        const migrated = await migrateImageString(img, 'products', prodId);
        newImages.push(migrated);
        if (migrated !== img) {
          changed = true;
        }
      }
    } else {
      newImages = prod.images;
    }

    // 2. Migrate color variants images
    let newColors = prod.colors;
    if (prod.colors && Array.isArray(prod.colors)) {
      newColors = [];
      for (const col of prod.colors) {
        let colChanged = false;
        const colorName = col.name ? col.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'color';
        const entityKey = `${prodId}-${colorName}`;

        let newColorImage = col.image;
        if (col.image) {
          stats.totalImagesDiscovered++;
          const migrated = await migrateImageString(col.image, 'products', entityKey);
          if (migrated !== col.image) {
            newColorImage = migrated;
            colChanged = true;
          }
        }

        let newColorImages: string[] = [];
        if (col.images && Array.isArray(col.images)) {
          for (const cImg of col.images) {
            if (!cImg) continue;
            stats.totalImagesDiscovered++;
            const migrated = await migrateImageString(cImg, 'products', entityKey);
            newColorImages.push(migrated);
            if (migrated !== cImg) {
              colChanged = true;
            }
          }
        } else {
          newColorImages = col.images;
        }

        if (colChanged) {
          changed = true;
          newColors.push({
            ...col,
            image: newColorImage,
            images: newColorImages,
          });
        } else {
          newColors.push(col);
        }
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          images: newImages,
          colors: newColors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prod.id);

      if (updateErr) {
        console.error(`  [UPDATE ERR] Product ${prod.name} (${prod.id}):`, updateErr.message);
      } else {
        console.log(`  [UPDATED DB] Product ${prod.name} (${prod.id}) successfully updated with R2 URLs.`);
      }
    }
  }
}

async function main() {
  console.log('********************************************************');
  console.log('Starting Zarb Media -> Cloudflare R2 Migration');
  console.log(`R2 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`R2 Delivery Base URL: ${R2_PUBLIC_BASE_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('********************************************************');

  const startTime = Date.now();

  try {
    await migrateCategories();
    await migrateProducts();
  } catch (err: any) {
    console.error('Fatal migration error:', err);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('MIGRATION SUMMARY REPORT');
  console.log('========================================');
  console.log(`Duration:                  ${durationSec}s`);
  console.log(`Categories Scanned:        ${stats.categoriesScanned}`);
  console.log(`Products Scanned:          ${stats.productsScanned}`);
  console.log(`Total Media Discovered:    ${stats.totalImagesDiscovered}`);
  console.log(`Successfully Migrated:     ${stats.migratedCount}`);
  console.log(`Already on Cloudflare R2:  ${stats.alreadyMigratedCount}`);
  console.log(`External/Static Skipped:   ${stats.skippedCount}`);
  console.log(`Failed Migrations:         ${stats.failedCount}`);
  console.log(`Total Data Uploaded to R2: ${(stats.totalBytesMigrated / (1024 * 1024)).toFixed(2)} MB`);

  if (stats.failures.length > 0) {
    console.log('\nFailures detail:');
    stats.failures.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.itemType}] ID ${f.id}: ${f.error} (sample: ${f.sample})`);
    });
  }

  console.log('\nMigration complete. All Supabase storage files have been preserved (copy-first).');
  console.log('========================================\n');
}

main();

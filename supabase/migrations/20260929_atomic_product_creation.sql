-- =========================================================================
-- ZARB E-COMMERCE — PRODUCTION CATALOG TRANSACTION & PERFORMANCE FIX
-- Resolves Statement Timeout during product creation & provides atomic upsert
-- =========================================================================

-- -------------------------------------------------------------------------
-- ROOT CAUSE ANALYSIS:
-- 1. Heavy Payload Size: When Cloudflare R2 uploads fallback to Base64 data URLs
--    (due to missing admin auth headers or local passkey sessions), multi-megabyte
--    Base64 strings are stored in JSONB columns (images and colors).
-- 2. PostgREST RETURNING Clause: Direct upsert with .select() forces PostgreSQL
--    to read all TOAST-compressed blocks back from disk and stream them over HTTP,
--    exceeding the default 8-second statement_timeout.
-- 3. Lack of Idempotent Transaction: Client retries with new IDs cause slug
--    collisions on the UNIQUE slug constraint.
--
-- PROPOSED SCHEMA / RPC FIX:
-- An atomic stored procedure (plpgsql) that:
-- - Runs within an isolated transaction.
-- - Performs atomic upsert based on product id.
-- - Automatically detects and resolves slug collisions without failing.
-- - Validates inventory stock counts (ensuring non-negative values).
-- - Adds server-side diagnostics logging via RAISE NOTICE without exposing secrets.
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_or_update_product_atomic(p_product JSONB)
RETURNS JSONB AS $$
DECLARE
  v_id TEXT;
  v_name TEXT;
  v_slug TEXT;
  v_gender TEXT;
  v_category TEXT;
  v_description TEXT;
  v_price NUMERIC;
  v_compare_at NUMERIC;
  v_images JSONB;
  v_colors JSONB;
  v_sizes JSONB;
  v_stock INT;
  v_sku TEXT;
  v_rating NUMERIC;
  v_reviews INT;
  v_featured BOOLEAN;
  v_new_arrival BOOLEAN;
  v_best_seller BOOLEAN;
  v_materials TEXT;
  v_fit TEXT;
  v_season TEXT;
  v_existing_id TEXT;
BEGIN
  -- 1. Extract values safely from JSONB payload
  v_id := p_product->>'id';
  IF v_id IS NULL OR trim(v_id) = '' THEN
    v_id := 'prod-' || floor(extract(epoch from now()) * 1000)::text;
  END IF;

  v_name := COALESCE(p_product->>'name', 'Untitled Piece');
  v_slug := COALESCE(p_product->>'slug', lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')));
  v_gender := COALESCE(p_product->>'gender', 'women');
  v_category := COALESCE(p_product->>'category', 'all');
  v_description := COALESCE(p_product->>'description', '');
  v_price := COALESCE((p_product->>'price')::NUMERIC, 0);
  v_compare_at := (p_product->>'compare_at_price')::NUMERIC;
  v_images := COALESCE(p_product->'images', '[]'::jsonb);
  v_colors := COALESCE(p_product->'colors', '[]'::jsonb);
  v_sizes := COALESCE(p_product->'sizes', '["One Size"]'::jsonb);
  v_stock := GREATEST(0, COALESCE((p_product->>'stock')::INT, 0));
  v_sku := COALESCE(p_product->>'sku', 'AT-' || right(v_id, 4));
  v_rating := COALESCE((p_product->>'rating')::NUMERIC, 5.0);
  v_reviews := COALESCE((p_product->>'reviews')::INT, 1);
  v_featured := COALESCE((p_product->>'featured')::BOOLEAN, false);
  v_new_arrival := COALESCE((p_product->>'new_arrival')::BOOLEAN, true);
  v_best_seller := COALESCE((p_product->>'best_seller')::BOOLEAN, false);
  v_materials := COALESCE(p_product->>'materials', '');
  v_fit := COALESCE(p_product->>'fit', '');
  v_season := COALESCE(p_product->>'season', '');

  -- 2. Idempotent Slug Collision Protection
  -- Check if another product already uses this slug
  SELECT id INTO v_existing_id
  FROM public.products
  WHERE slug = v_slug AND id <> v_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    v_slug := v_slug || '-' || floor(extract(epoch from now()))::text;
    RAISE NOTICE '[ATOMIC PRODUCT] Slug collision detected; deduplicated to: %', v_slug;
  END IF;

  -- 3. Atomic Upsert
  INSERT INTO public.products (
    id, name, slug, gender, category, description,
    price, compare_at_price, images, colors, sizes,
    stock, sku, rating, reviews, featured,
    new_arrival, best_seller, materials, fit, season,
    updated_at
  ) VALUES (
    v_id, v_name, v_slug, v_gender, v_category, v_description,
    v_price, v_compare_at, v_images, v_colors, v_sizes,
    v_stock, v_sku, v_rating, v_reviews, v_featured,
    v_new_arrival, v_best_seller, v_materials, v_fit, v_season,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    images = EXCLUDED.images,
    colors = EXCLUDED.colors,
    sizes = EXCLUDED.sizes,
    stock = EXCLUDED.stock,
    sku = EXCLUDED.sku,
    rating = EXCLUDED.rating,
    reviews = EXCLUDED.reviews,
    featured = EXCLUDED.featured,
    new_arrival = EXCLUDED.new_arrival,
    best_seller = EXCLUDED.best_seller,
    materials = EXCLUDED.materials,
    fit = EXCLUDED.fit,
    season = EXCLUDED.season,
    updated_at = NOW();

  RAISE NOTICE '[ATOMIC PRODUCT] Successfully saved piece: % (id: %, stock: %)', v_name, v_id, v_stock;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'slug', v_slug,
    'stock', v_stock,
    'updated_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[ATOMIC PRODUCT ERROR] Code: %, Detail: %', SQLSTATE, SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.create_or_update_product_atomic(JSONB) TO anon, authenticated, service_role;

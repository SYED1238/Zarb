-- =========================================================================
-- ZARB E-COMMERCE — ADD STOREFRONT VISIBILITY TOGGLE (HIDDEN COLUMN)
-- Enables hiding/unhiding categories and products without deleting them
-- =========================================================================

-- 1. Add hidden column to products
ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- 2. Add hidden column to categories
ALTER TABLE IF EXISTS public.categories 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- 3. Create index for fast visibility filtering
CREATE INDEX IF NOT EXISTS idx_products_hidden ON public.products(hidden);
CREATE INDEX IF NOT EXISTS idx_categories_hidden ON public.categories(hidden);

-- 4. Update create_or_update_product_atomic to support hidden column
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
  v_hidden BOOLEAN;
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
  v_hidden := COALESCE((p_product->>'hidden')::BOOLEAN, false);
  v_materials := COALESCE(p_product->>'materials', '');
  v_fit := COALESCE(p_product->>'fit', '');
  v_season := COALESCE(p_product->>'season', '');

  -- 2. Idempotent Slug Collision Protection
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
    new_arrival, best_seller, hidden, materials, fit, season,
    updated_at
  ) VALUES (
    v_id, v_name, v_slug, v_gender, v_category, v_description,
    v_price, v_compare_at, v_images, v_colors, v_sizes,
    v_stock, v_sku, v_rating, v_reviews, v_featured,
    v_new_arrival, v_best_seller, v_hidden, v_materials, v_fit, v_season,
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
    hidden = EXCLUDED.hidden,
    materials = EXCLUDED.materials,
    fit = EXCLUDED.fit,
    season = EXCLUDED.season,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'slug', v_slug,
    'hidden', v_hidden,
    'operation', CASE WHEN v_existing_id IS NOT NULL THEN 'upsert_resolved' ELSE 'upsert' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

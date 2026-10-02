-- =========================================================================
-- ZARB FINAL SECURITY CLOSURE MIGRATION
-- File: supabase/migrations/20261002_final_security_closure.sql
-- Date: 2026-10-02
--
-- Closes all remaining database permission gaps:
-- 1. Introduces is_admin() SECURITY DEFINER helper function.
-- 2. Restricts idempotent_deduct_order_inventory execution strictly to service_role.
-- 3. Injects internal admin authorization check inside create_or_update_product_atomic.
-- 4. Extends orders RLS policies to allow verified admins in admin_users to
--    view and update order statuses from the Admin Portal.
-- =========================================================================

-- 1. Helper Function: Check if current authenticated user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = lower(trim(auth.jwt() ->> 'email'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Secure idempotent_deduct_order_inventory
REVOKE EXECUTE ON FUNCTION public.idempotent_deduct_order_inventory(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.idempotent_deduct_order_inventory(UUID) TO service_role;

-- 3. Secure create_or_update_product_atomic with internal admin check
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
  v_caller_role TEXT;
BEGIN
  -- Strict Admin Authorization Check
  v_caller_role := (current_setting('request.jwt.claims', true)::jsonb ->> 'role');
  IF v_caller_role <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required to modify products.';
  END IF;

  v_id := p_product->>'id';
  IF v_id IS NULL OR trim(v_id) = '' THEN
    v_id := 'prod-' || floor(extract(epoch from now()) * 1000)::text;
  END IF;

  v_name := COALESCE(p_product->>'name', 'Untitled Piece');
  v_slug := COALESCE(p_product->>'slug', lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')));
  v_gender := COALESCE(p_product->>'gender', 'women');
  v_category := COALESCE(p_product->>'category', 'all');
  v_description := COALESCE(p_product->>'description', '');
  v_price := GREATEST(0, COALESCE((p_product->>'price')::NUMERIC, 0));
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

  -- Slug collision protection
  SELECT id INTO v_existing_id
  FROM public.products
  WHERE slug = v_slug AND id <> v_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    v_slug := v_slug || '-' || floor(extract(epoch from now()))::text;
  END IF;

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

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'slug', v_slug,
    'stock', v_stock,
    'updated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable verified Admin in Orders RLS
DROP POLICY IF EXISTS "orders_owner_select" ON public.orders;
CREATE POLICY "orders_owner_select"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "orders_service_role_update" ON public.orders;
CREATE POLICY "orders_service_role_update"
  ON public.orders FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR public.is_admin()
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR public.is_admin()
  );

-- 5. Enable verified Admin in Products RLS for direct mutations
DROP POLICY IF EXISTS "products_service_role_insert" ON public.products;
CREATE POLICY "products_admin_insert"
  ON public.products FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "products_service_role_update" ON public.products;
CREATE POLICY "products_admin_update"
  ON public.products FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR public.is_admin()
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "products_service_role_delete" ON public.products;
CREATE POLICY "products_admin_delete"
  ON public.products FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR public.is_admin()
  );

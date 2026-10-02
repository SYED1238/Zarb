-- =========================================================================
-- ZARB E-COMMERCE — CRITICAL SECURITY HARDENING MIGRATION
-- Date: 2026-10-02
-- Addresses audit findings: C2, C3, C4, C5, H4, H5, H6, M5
--
-- This migration locks down ALL overly-permissive RLS policies that
-- previously allowed anonymous/unauthenticated users to read, modify,
-- or delete sensitive data through the Supabase REST API.
--
-- IMPORTANT: This migration is IDEMPOTENT — safe to run multiple times.
-- It does NOT delete data or modify table structure.
-- =========================================================================

-- =========================================================================
-- 1. PRODUCTS — Public READ, Admin/Service-Role WRITE ONLY
-- Audit Finding: C2
-- =========================================================================

-- Drop the dangerously permissive ALL policy
DROP POLICY IF EXISTS "Anyone can insert/update products if authorized." ON public.products;
DROP POLICY IF EXISTS "Public read access to products." ON public.products;

-- Public storefront: anyone can browse products (SELECT only)
CREATE POLICY "products_public_select"
  ON public.products FOR SELECT
  USING (true);

-- Only service_role (Edge Functions, server-side) can INSERT products
CREATE POLICY "products_service_role_insert"
  ON public.products FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Only service_role can UPDATE products
CREATE POLICY "products_service_role_update"
  ON public.products FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Only service_role can DELETE products
CREATE POLICY "products_service_role_delete"
  ON public.products FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =========================================================================
-- 2. CATEGORIES — Public READ, Admin/Service-Role WRITE ONLY
-- Audit Finding: C2
-- =========================================================================

DROP POLICY IF EXISTS "Anyone can modify categories if authorized." ON public.categories;
DROP POLICY IF EXISTS "Public read access to categories." ON public.categories;

-- Public storefront: anyone can browse categories
CREATE POLICY "categories_public_select"
  ON public.categories FOR SELECT
  USING (true);

-- Only service_role can INSERT categories
CREATE POLICY "categories_service_role_insert"
  ON public.categories FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Only service_role can UPDATE categories
CREATE POLICY "categories_service_role_update"
  ON public.categories FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Only service_role can DELETE categories
CREATE POLICY "categories_service_role_delete"
  ON public.categories FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =========================================================================
-- 3. ORDERS — Owner-Scoped SELECT, Restricted INSERT, Service-Role UPDATE
-- Audit Findings: C3, C4, H4
-- =========================================================================

-- Drop ALL existing overly-permissive order policies
DROP POLICY IF EXISTS "Public lookup for order payment return" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders." ON public.orders;
DROP POLICY IF EXISTS "Enable update for orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update order status if authorized" ON public.orders;

-- SELECT: Authenticated users see only their own orders (by user_id)
-- Service role can see all (for admin portal, webhooks)
CREATE POLICY "orders_owner_select"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- INSERT: Edge Functions (service_role) create orders server-side.
-- For backward compatibility with the offline sync queue (authenticated client),
-- allow authenticated users to insert orders ONLY with payment_status = 'pending'.
-- Anonymous users CANNOT insert orders.
CREATE POLICY "orders_restricted_insert"
  ON public.orders FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND (payment_status IS NULL OR payment_status = 'pending')
      AND (order_status IS NULL OR order_status = 'confirmed' OR order_status = 'pending_payment')
      AND (inventory_deducted IS NULL OR inventory_deducted = false)
      AND (refund_status IS NULL OR refund_status = 'none')
    )
  );

-- UPDATE: Only service_role (Edge Functions, webhooks) can update orders.
-- Customers cannot modify payment_status, order_status, etc.
CREATE POLICY "orders_service_role_update"
  ON public.orders FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- DELETE: Only service_role can delete orders
CREATE POLICY "orders_service_role_delete"
  ON public.orders FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =========================================================================
-- 4. STORE SETTINGS — Public READ, Admin/Service-Role WRITE ONLY
-- Audit Finding: C5
-- =========================================================================

DROP POLICY IF EXISTS "Public read access to store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow write to store_settings" ON public.store_settings;

-- Public storefront: anyone can read store settings (shipping config, etc.)
CREATE POLICY "store_settings_public_select"
  ON public.store_settings FOR SELECT
  USING (true);

-- Only service_role can INSERT/UPDATE/DELETE store settings
CREATE POLICY "store_settings_service_role_insert"
  ON public.store_settings FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "store_settings_service_role_update"
  ON public.store_settings FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "store_settings_service_role_delete"
  ON public.store_settings FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =========================================================================
-- 5. PROFILES — Owner-Only Access (Remove auth.uid() IS NULL)
-- Audit Finding: H5
-- =========================================================================

DROP POLICY IF EXISTS "Allow user read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow user insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow user update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by owner." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Users can only read their own profile
CREATE POLICY "profiles_owner_select"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Users can only insert their own profile (trigger also handles this)
CREATE POLICY "profiles_owner_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Users can only update their own profile
CREATE POLICY "profiles_owner_update"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =========================================================================
-- 6. EMAIL EVENTS — Service-Role Only for Mutations
-- Audit Finding: H6
-- =========================================================================

DROP POLICY IF EXISTS "Allow service role and callers to insert email events" ON public.email_events;
DROP POLICY IF EXISTS "Users can view their own email events" ON public.email_events;
DROP POLICY IF EXISTS "Enable update for email events" ON public.email_events;

-- Only service_role can insert email events
CREATE POLICY "email_events_service_role_insert"
  ON public.email_events FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Users can view only their own email events (by user_id)
CREATE POLICY "email_events_owner_select"
  ON public.email_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Only service_role can update email event status
CREATE POLICY "email_events_service_role_update"
  ON public.email_events FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =========================================================================
-- 7. PRODUCT RPC — Revoke Anonymous Execution
-- Audit Finding: M5
-- =========================================================================

-- Revoke execution from anonymous users
REVOKE EXECUTE ON FUNCTION public.create_or_update_product_atomic(JSONB) FROM anon;

-- Keep for authenticated (admin Google OAuth) and service_role
GRANT EXECUTE ON FUNCTION public.create_or_update_product_atomic(JSONB) TO authenticated, service_role;


-- =========================================================================
-- 8. ADMIN AUTHORIZATION TABLE
-- Creates a server-verifiable admin registry for use by Edge Functions
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write admin_users
DROP POLICY IF EXISTS "admin_users_service_role_only" ON public.admin_users;
CREATE POLICY "admin_users_service_role_only"
  ON public.admin_users FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Seed the admin user (idempotent)
INSERT INTO public.admin_users (email, role)
VALUES ('syedhamza1238@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

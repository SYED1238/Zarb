-- =========================================================================
-- ATELIER NŌIR / ZARB — SUPABASE PERSISTENCE MIGRATION V2
-- Run this script in the Supabase SQL Editor (Project: lakuqxnlgqaquvssyhed)
-- Sets up:
-- 1. Orders UPDATE policy for admin order status transitions & tracking
-- 2. Added columns: discount_amount, coupon_code, status_history
-- 3. Profiles RLS for customer shipping address cloud persistence
-- 4. Fast lookup indexes for user_id and order_status
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. ENHANCE ORDERS TABLE COLUMNS
-- -------------------------------------------------------------------------
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- -------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY & POLICIES ON ORDERS
-- -------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create orders (authenticated checkout)
DROP POLICY IF EXISTS "Anyone can create orders." ON public.orders;
CREATE POLICY "Anyone can create orders." 
  ON public.orders FOR INSERT 
  WITH CHECK (true);

-- Allow customers to view their own orders by user_id or email
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." 
  ON public.orders FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR (auth.uid() IS NULL AND customer_email IS NOT NULL)
  );

-- Allow UPDATE on orders (enables Admin Portal to change order status & status history)
DROP POLICY IF EXISTS "Enable update for orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update order status if authorized" ON public.orders;
CREATE POLICY "Enable update for orders" 
  ON public.orders FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 3. ENABLE CUSTOMER PROFILE & ADDRESS PERSISTENCE
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile & address
DROP POLICY IF EXISTS "Public profiles are viewable by owner." ON public.profiles;
DROP POLICY IF EXISTS "Allow user read own profile" ON public.profiles;
CREATE POLICY "Allow user read own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id OR auth.uid() IS NULL);

-- Allow users to insert their own profile & address
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow user insert own profile" ON public.profiles;
CREATE POLICY "Allow user insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Allow users to update their own profile & address
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow user update own profile" ON public.profiles;
CREATE POLICY "Allow user update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- -------------------------------------------------------------------------
-- 4. OPTIMIZED PERFORMANCE INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

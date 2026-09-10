-- =========================================================================
-- ZARB E-COMMERCE — CASHFREE PAYMENT GATEWAY INTEGRATION MIGRATION
-- Adds Cashfree order tracking, payment verification, idempotency flags,
-- and atomic inventory management to public.orders and public.products.
-- =========================================================================

-- 1. Add Cashfree tracking columns to public.orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cashfree_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS cashfree_payment_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS inventory_deducted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;

-- 2. Performance indexes for fast webhook and verification lookups
CREATE INDEX IF NOT EXISTS idx_orders_cf_order_id ON public.orders(cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_cf_payment_id ON public.orders(cashfree_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 3. Atomic & Idempotent inventory deduction function
-- Ensures that stock in public.products is decremented only once per order,
-- preventing duplicate deductions from retried webhooks or customer page refreshes.
CREATE OR REPLACE FUNCTION public.idempotent_deduct_order_inventory(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item JSONB;
  v_product_id TEXT;
  v_qty INT;
  v_current_stock INT;
  v_items JSONB;
BEGIN
  -- Lock order row for update
  SELECT id, items, inventory_deducted, payment_status, order_number
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- If inventory already deducted, return idempotent success immediately
  IF v_order.inventory_deducted = true THEN
    RETURN jsonb_build_object(
      'success', true, 
      'already_deducted', true, 
      'order_number', v_order.order_number
    );
  END IF;

  v_items := v_order.items;

  -- Iterate through items in order JSONB array and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id := COALESCE(v_item->>'id', v_item->>'productId');
    v_qty := COALESCE((v_item->>'quantity')::INT, 1);

    IF v_product_id IS NOT NULL THEN
      -- Atomic decrement with floor at 0
      UPDATE public.products
      SET 
        stock = GREATEST(0, stock - v_qty),
        updated_at = NOW()
      WHERE id = v_product_id;
    END IF;
  END LOOP;

  -- Mark inventory as deducted on the order
  UPDATE public.orders
  SET 
    inventory_deducted = true,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true, 
    'deducted', true, 
    'order_number', v_order.order_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS and verification read policy
-- Ensure customers can view orders by order_number or cashfree_order_id
DROP POLICY IF EXISTS "Public lookup for order payment return" ON public.orders;
CREATE POLICY "Public lookup for order payment return"
  ON public.orders FOR SELECT
  USING (true);

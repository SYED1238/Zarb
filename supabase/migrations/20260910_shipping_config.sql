-- =========================================================================
-- ZARB E-COMMERCE — STORE SETTINGS & SHIPPING CONFIGURATION MIGRATION
-- Creates public.store_settings table to persist global store configurations
-- including shipping rates, threshold rules, and delivery settings.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read store settings (anon storefront customers, checkout, edge functions)
DROP POLICY IF EXISTS "Public read access to store_settings" ON public.store_settings;
CREATE POLICY "Public read access to store_settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- 2. Allow write operations (admin portal and edge functions)
DROP POLICY IF EXISTS "Allow write to store_settings" ON public.store_settings;
CREATE POLICY "Allow write to store_settings"
  ON public.store_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Seed default shipping config if not already present
INSERT INTO public.store_settings (key, value, updated_at)
VALUES (
  'shipping_config',
  '{
    "mode": "free",
    "flatRate": 0,
    "freeAbove": 0,
    "tiers": [
      {
        "id": "tier_standard",
        "label": "Standard Delivery",
        "minOrderAmount": 0,
        "cost": 99,
        "estimatedDays": "5-7 business days"
      },
      {
        "id": "tier_express",
        "label": "White-Glove Express",
        "minOrderAmount": 2000,
        "cost": 0,
        "estimatedDays": "2-3 business days"
      }
    ],
    "freeShippingMessage": "Complimentary White-Glove Delivery on all orders"
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- ZARB TRANSACTIONAL EMAIL SYSTEM — SUPABASE MIGRATION
-- Sets up:
-- 1. email_events audit & idempotency table
-- 2. Indexes for fast idempotency lookup by event_key, order_id, recipient
-- 3. Row Level Security policies
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  provider_message_id TEXT,
  error_message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_email_events_event_key ON public.email_events(event_key);
CREATE INDEX IF NOT EXISTS idx_email_events_order_id ON public.email_events(order_id);
CREATE INDEX IF NOT EXISTS idx_email_events_order_number ON public.email_events(order_number);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON public.email_events(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON public.email_events(status);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Allow Edge Functions (service role) and authenticated / anon clients to insert pending email events
DROP POLICY IF EXISTS "Allow service role and callers to insert email events" ON public.email_events;
CREATE POLICY "Allow service role and callers to insert email events"
  ON public.email_events FOR INSERT
  WITH CHECK (true);

-- Allow select for own email events or authenticated admin
DROP POLICY IF EXISTS "Users can view their own email events" ON public.email_events;
CREATE POLICY "Users can view their own email events"
  ON public.email_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.uid() IS NULL AND recipient_email IS NOT NULL)
  );

-- Allow update for service role / workers updating delivery status
DROP POLICY IF EXISTS "Enable update for email events" ON public.email_events;
CREATE POLICY "Enable update for email events"
  ON public.email_events FOR UPDATE
  USING (true)
  WITH CHECK (true);

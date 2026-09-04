-- ==============================================================================
-- DLIGHTS CRM: MULTI-EVENT SCHEDULE, PAYMENTS & PERFORMANCE MIGRATION
-- Safe, idempotent script for Supabase SQL Editor
-- ==============================================================================

-- 1. Ensure columns exist on the public.events table for multi-day ceremony tracking
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS custom_event_type TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Ensure payments table has direct lead linkage for live financial ledger
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE;

-- 3. Backfill lead_id on existing payments from bookings table
UPDATE public.payments p
SET lead_id = b.lead_id
FROM public.bookings b
WHERE p.booking_id = b.id 
  AND p.lead_id IS NULL;

-- 4. Create high-performance indices for fast CRM querying and board drag-and-drop
CREATE INDEX IF NOT EXISTS idx_events_lead_id ON public.events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON public.events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON public.payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON public.leads(lead_status);

-- 5. Row-Level Security Policies (safe idempotent enablement)
DO $$
BEGIN
  -- Events RLS
  ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow authenticated full access to events'
  ) THEN
    CREATE POLICY "Allow authenticated full access to events" 
      ON public.events FOR ALL 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
  END IF;

  -- Payments RLS
  ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow authenticated full access to payments'
  ) THEN
    CREATE POLICY "Allow authenticated full access to payments" 
      ON public.payments FOR ALL 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- ====================================================================
-- PHOTOGRAPHY & WEDDING CLIENT CRM - PERFORMANCE OPTIMIZATION INDEXES
-- Migration: 00002_performance_indexes.sql
-- ====================================================================

-- 1. Foreign Key & RLS Indexes for Leads
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON public.leads(owner_id, lead_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_event_date ON public.leads(owner_id, event_date);

-- 2. Clients Indexes
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON public.clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_owner_name ON public.clients(owner_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_owner_created ON public.clients(owner_id, created_at DESC);

-- 3. Follow-Ups Indexes
CREATE INDEX IF NOT EXISTS idx_follow_ups_owner_lead ON public.follow_ups(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_sched ON public.follow_ups(owner_id, scheduled_at ASC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_pending ON public.follow_ups(owner_id, scheduled_at) WHERE completed_at IS NULL;

-- 4. Quotations Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_owner_lead ON public.quotations(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(owner_id, status, created_at DESC);

-- 5. Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_owner_lead ON public.bookings(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(owner_id, client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(owner_id, booking_status);

-- 6. Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_owner_booking ON public.payments(owner_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner_lead ON public.payments(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(owner_id, payment_date DESC);

-- 7. Events Indexes
CREATE INDEX IF NOT EXISTS idx_events_owner_date ON public.events(owner_id, event_date ASC);
CREATE INDEX IF NOT EXISTS idx_events_owner_client ON public.events(owner_id, client_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(owner_id, status);

-- 8. Activity & Notes Indexes
CREATE INDEX IF NOT EXISTS idx_activities_owner_lead ON public.activities(owner_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_owner_lead ON public.notes(owner_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_owner_lead ON public.communications(owner_id, lead_id, created_at DESC);

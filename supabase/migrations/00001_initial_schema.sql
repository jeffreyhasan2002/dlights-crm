-- ====================================================================
-- PHOTOGRAPHY & WEDDING CLIENT CRM - INITIAL DATABASE SCHEMA
-- Migration: 00001_initial_schema.sql
-- ====================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper Function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    business_name TEXT DEFAULT 'Dlights Photography Studio',
    phone TEXT,
    whatsapp TEXT,
    default_location TEXT DEFAULT 'Mumbai, India',
    currency TEXT DEFAULT 'INR',
    date_format TEXT DEFAULT 'dd/MM/yyyy',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'Wedding', 'Engagement', 'Sangeet', 'Reception', 'Muhurtham', 
        'Pre-Wedding', 'Post-Wedding', 'Birthday', 'Baby Shoot', 'Portrait', 'Corporate', 'Other'
    )),
    event_date DATE,
    location TEXT,
    budget NUMERIC(12, 2),
    source TEXT CHECK (source IN (
        'Instagram', 'WhatsApp', 'Referral', 'Website', 'Google', 'Facebook', 'Phone', 'Existing Client', 'Other'
    )),
    enquiry_message TEXT,
    lead_status TEXT NOT NULL DEFAULT 'New Enquiry' CHECK (lead_status IN (
        'New Enquiry', 'Contacted', 'Follow-up Required', 'Quotation Sent', 
        'Negotiation', 'Accepted / Booked', 'Rejected / Lost'
    )),
    contact_status TEXT NOT NULL DEFAULT 'Not Contacted' CHECK (contact_status IN (
        'Not Contacted', 'Contacted – Waiting for Response', 'Responded', 'No Response'
    )),
    last_contacted_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    follow_up_count INTEGER NOT NULL DEFAULT 0,
    next_action TEXT,
    next_action_due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. FOLLOW_UPS TABLE
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    contact_method TEXT NOT NULL CHECK (contact_method IN ('Call', 'WhatsApp', 'Email', 'Instagram', 'In-person', 'Other')),
    notes TEXT,
    client_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_follow_ups_updated_at
BEFORE UPDATE ON public.follow_ups
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. COMMUNICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_method TEXT NOT NULL CHECK (contact_method IN ('Call', 'WhatsApp', 'Email', 'Instagram', 'In-person', 'Other')),
    direction TEXT NOT NULL DEFAULT 'Outgoing' CHECK (direction IN ('Outgoing', 'Incoming')),
    message TEXT NOT NULL,
    client_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'ENQUIRY_CREATED', 'CONTACTED', 'FOLLOW_UP', 'STATUS_CHANGED', 
        'QUOTATION_CREATED', 'QUOTATION_SENT', 'QUOTATION_VIEWED', 
        'NEGOTIATION_STARTED', 'QUOTATION_ACCEPTED', 'QUOTATION_REJECTED', 
        'BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', 'EVENT_UPCOMING', 
        'EVENT_COMPLETED', 'NOTE_ADDED'
    )),
    title TEXT NOT NULL,
    description TEXT,
    contact_method TEXT,
    client_response TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quotation_number TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    valid_until DATE,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Negotiating', 'Accepted', 'Rejected')),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT CHECK (rejection_reason IS NULL OR rejection_reason IN (
        'Price too high', 'Date unavailable', 'Chose another photographer', 
        'Project cancelled', 'No response', 'Budget issue', 'Changed plans', 
        'Found another package', 'Other'
    )),
    rejection_reason_other TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_status TEXT NOT NULL DEFAULT 'Accepted / Booked' CHECK (booking_status IN (
        'Accepted / Booked', 'Booking Confirmed', 'Advance Payment', 
        'Upcoming Event', 'Event Completed', 'Final Payment', 'Completed', 'Cancelled'
    )),
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    confirmed_at TIMESTAMPTZ,
    total_amount NUMERIC(12, 2) NOT NULL,
    advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_due_date DATE,
    advance_paid_at TIMESTAMPTZ,
    remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    final_payment_due_date DATE,
    final_payment_paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('Advance', 'Partial Payment', 'Final Payment', 'Other')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'Bank Transfer', 'Cash', 'Card', 'Cheque', 'Other')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_clients_owner ON public.clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);

CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_client ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_contact_status ON public.leads(contact_status);
CREATE INDEX IF NOT EXISTS idx_leads_event_date ON public.leads(event_date);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON public.leads(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_owner ON public.follow_ups(owner_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON public.follow_ups(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_communications_lead ON public.communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_communications_owner ON public.communications(owner_id);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_client ON public.activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner ON public.activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotations_lead ON public.quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_owner ON public.quotations(owner_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);

CREATE INDEX IF NOT EXISTS idx_bookings_lead ON public.bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_lead ON public.events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_client ON public.events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_owner ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date ASC);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

CREATE INDEX IF NOT EXISTS idx_notes_lead ON public.notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_owner ON public.notes(owner_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients Policies
CREATE POLICY "Users can view own clients" ON public.clients
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own clients" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own clients" ON public.clients
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own clients" ON public.clients
    FOR DELETE USING (auth.uid() = owner_id);

-- Leads Policies
CREATE POLICY "Users can view own leads" ON public.leads
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own leads" ON public.leads
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own leads" ON public.leads
    FOR DELETE USING (auth.uid() = owner_id);

-- Follow-ups Policies
CREATE POLICY "Users can view own follow_ups" ON public.follow_ups
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own follow_ups" ON public.follow_ups
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own follow_ups" ON public.follow_ups
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own follow_ups" ON public.follow_ups
    FOR DELETE USING (auth.uid() = owner_id);

-- Communications Policies
CREATE POLICY "Users can view own communications" ON public.communications
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own communications" ON public.communications
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own communications" ON public.communications
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own communications" ON public.communications
    FOR DELETE USING (auth.uid() = owner_id);

-- Activities Policies
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE USING (auth.uid() = owner_id);

-- Quotations Policies
CREATE POLICY "Users can view own quotations" ON public.quotations
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own quotations" ON public.quotations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own quotations" ON public.quotations
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own quotations" ON public.quotations
    FOR DELETE USING (auth.uid() = owner_id);

-- Bookings Policies
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = owner_id);

-- Payments Policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own payments" ON public.payments
    FOR DELETE USING (auth.uid() = owner_id);

-- Events Policies
CREATE POLICY "Users can view own events" ON public.events
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own events" ON public.events
    FOR DELETE USING (auth.uid() = owner_id);

-- Notes Policies
CREATE POLICY "Users can view own notes" ON public.notes
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own notes" ON public.notes
    FOR DELETE USING (auth.uid() = owner_id);

-- Automatic Profile Creation on Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS \$\$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Photographer Admin'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- DLIGHT STUDIOS CRM — COMPLETE FRESH SUPABASE SCHEMA & AUTH SEED
-- Studio Email: dlightstudios@gmail.com
-- Studio Pass:  dlights@2002
-- Execute this script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- Enable required cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. CORE CRM TABLES
-- =========================================================================

-- 1. Profiles (Studio Owner / Photographer admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'Bruno Sangeeth',
  business_name TEXT NOT NULL DEFAULT 'Dlight Studios',
  phone TEXT DEFAULT '+91 94888 88717',
  whatsapp TEXT DEFAULT '+91 94888 88717',
  email TEXT DEFAULT 'dlightstudios@gmail.com',
  avatar_url TEXT,
  default_location TEXT DEFAULT 'Nagercoil, Tamil Nadu, India',
  currency TEXT NOT NULL DEFAULT 'INR',
  date_format TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Leads (Enquiries & CRM Deals)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE,
  location TEXT,
  budget NUMERIC(12, 2),
  source TEXT DEFAULT 'Instagram',
  enquiry_message TEXT,
  lead_status TEXT NOT NULL DEFAULT 'New Enquiry',
  contact_status TEXT NOT NULL DEFAULT 'Not Contacted',
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  follow_up_count INTEGER NOT NULL DEFAULT 0,
  next_action TEXT,
  next_action_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Follow-ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  contact_method TEXT NOT NULL DEFAULT 'WhatsApp',
  notes TEXT,
  client_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Communications (Calls, WhatsApp, Emails)
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_method TEXT NOT NULL DEFAULT 'WhatsApp',
  direction TEXT NOT NULL DEFAULT 'Outgoing',
  message TEXT NOT NULL,
  client_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Activities (Chronological CRM timeline)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contact_method TEXT,
  client_response TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Quotations / Proposals
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'Draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  rejection_reason_other TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Bookings (Confirmed wedding contracts)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  booking_status TEXT NOT NULL DEFAULT 'Booking Confirmed',
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_amount NUMERIC(12, 2) NOT NULL,
  advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_due_date DATE,
  advance_paid_at TIMESTAMPTZ,
  remaining_amount NUMERIC(12, 2) NOT NULL,
  final_payment_due_date DATE,
  final_payment_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'Advance',
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Events (Shoot production & ceremonies)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 2. INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_at ON public.follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_quotations_lead_id ON public.quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON public.bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON public.activities(lead_id);

-- =========================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
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

DROP POLICY IF EXISTS "Public full access profiles" ON public.profiles;
CREATE POLICY "Public full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access clients" ON public.clients;
CREATE POLICY "Public full access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access leads" ON public.leads;
CREATE POLICY "Public full access leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access follow_ups" ON public.follow_ups;
CREATE POLICY "Public full access follow_ups" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access communications" ON public.communications;
CREATE POLICY "Public full access communications" ON public.communications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access activities" ON public.activities;
CREATE POLICY "Public full access activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access quotations" ON public.quotations;
CREATE POLICY "Public full access quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access bookings" ON public.bookings;
CREATE POLICY "Public full access bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access payments" ON public.payments;
CREATE POLICY "Public full access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access events" ON public.events;
CREATE POLICY "Public full access events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access notes" ON public.notes;
CREATE POLICY "Public full access notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- 4. IDEMPOTENT AUTH USER & PROFILE SEEDING
-- Handles both cases: user already exists OR user needs to be created
-- =========================================================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Check if auth user already exists in auth.users by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dlightstudios@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- User exists: update password to dlights@2002 and ensure email is confirmed
    UPDATE auth.users
    SET
      encrypted_password = crypt('dlights@2002', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"full_name":"Bruno Sangeeth","business_name":"Dlight Studios"}'::jsonb
    WHERE id = v_user_id;

    -- Update or insert identity record
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id, 'dlightstudios@gmail.com')::jsonb,
      'email',
      'dlightstudios@gmail.com',
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = NOW();

  ELSE
    -- User does not exist: create new auth user with fixed ID
    v_user_id := 'a0000000-0000-0000-0000-000000000001';

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'dlightstudios@gmail.com',
      crypt('dlights@2002', gen_salt('bf')),
      NOW(),
      NOW(),
      '',
      NOW(),
      '',
      NOW(),
      '',
      '',
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Bruno Sangeeth","business_name":"Dlight Studios"}'::jsonb,
      FALSE,
      NOW(),
      NOW()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id, 'dlightstudios@gmail.com')::jsonb,
      'email',
      'dlightstudios@gmail.com',
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = NOW();
  END IF;

  -- 2. Link or create public.profiles record
  INSERT INTO public.profiles (
    id,
    user_id,
    full_name,
    business_name,
    phone,
    whatsapp,
    email,
    default_location,
    currency,
    date_format,
    timezone
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    v_user_id,
    'Bruno Sangeeth',
    'Dlight Studios',
    '+91 94888 88717',
    '+91 94888 88717',
    'dlightstudios@gmail.com',
    'Nagercoil, Tamil Nadu, India',
    'INR',
    'dd/MM/yyyy',
    'Asia/Kolkata'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = v_user_id,
    full_name = EXCLUDED.full_name,
    business_name = EXCLUDED.business_name,
    email = EXCLUDED.email;

END $$;

-- =========================================================================
-- COMPLETE: Schema and Credentials ready for dlightstudios@gmail.com
-- =========================================================================

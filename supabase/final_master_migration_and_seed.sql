-- =========================================================================
-- DLIGHT STUDIOS CRM — FINAL MASTER SUPABASE MIGRATION & SEED DATA
-- Studio: Bruno Sangeeth / Dlight Studios
-- Email:  dlightstudios@gmail.com
-- Pass:   dlights@2002
-- Location: Nagercoil, Tamil Nadu, India
-- Run this script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- Enable required cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. AUTH USER CREATION (Idempotent: Updates if exists, creates if new)
-- =========================================================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dlightstudios@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt('dlights@2002', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"full_name":"Bruno Sangeeth","business_name":"Dlight Studios"}'::jsonb
    WHERE id = v_user_id;

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

  -- Link profile
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
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email;

END $$;

-- =========================================================================
-- 2. CORE TABLES SETUP
-- =========================================================================

-- 1. Profiles
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

-- 3. Leads (Pipeline Deals)
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

-- 5. Communications
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

-- 6. Activities (Chronological timeline)
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

-- 7. Quotations
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

-- 8. Bookings
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

-- 10. Events
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
-- 3. INDEXES & RLS
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_at ON public.follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_quotations_lead_id ON public.quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON public.bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON public.activities(lead_id);

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
-- 4. SEED DATA (15 Clients across all 7 Kanban Pipeline Stages)
-- =========================================================================

-- Insert 15 Realistic Indian Wedding Clients
INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Priya & Rahul Sharma', '+91 98201 11223', '+91 98201 11223', 'priya.sharma@example.com', 'Mumbai, Maharashtra'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Ananya & Siddharth Mehta', '+91 98302 22334', '+91 98302 22334', 'ananya.mehta@example.com', 'Udaipur, Rajasthan'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Sneha & Rohan Kapoor', '+91 98403 33445', '+91 98403 33445', 'sneha.kapoor@example.com', 'South Goa'),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Kavita & Aditya Verma', '+91 98504 44556', '+91 98504 44556', 'kavita.v@example.com', 'Jaipur, Rajasthan'),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Meera & Varun Desai', '+91 98605 55667', '+91 98605 55667', 'meera.desai@example.com', 'Ahmedabad, Gujarat'),
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Ritu & Karan Singhania', '+91 98706 66778', '+91 98706 66778', 'ritu.singh@example.com', 'New Delhi'),
  ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Dr. Pooja & Dr. Arvind Swaminathan', '+91 98807 77889', '+91 98807 77889', 'pooja.swamy@example.com', 'Bengaluru, Karnataka'),
  ('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Natasha & Dev Malhotra', '+91 98908 88990', '+91 98908 88990', 'natasha.m@example.com', 'Chandigarh'),
  ('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Tanvi & Arjun Reddy', '+91 99009 99001', '+91 99009 99001', 'tanvi.reddy@example.com', 'Hyderabad, Telangana'),
  ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Ishita & Kabir Oberoi', '+91 99110 00112', '+91 99110 00112', 'ishita.o@example.com', 'Mussoorie, Uttarakhand'),
  ('c0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Divya & Nikhil Sen', '+91 99221 11223', '+91 99221 11223', 'divya.sen@example.com', 'Kolkata, West Bengal'),
  ('c0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Lavanya & Vignesh Iyer', '+91 99332 22334', '+91 99332 22334', 'lavanya.iyer@example.com', 'Chennai, Tamil Nadu'),
  ('c0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Zoya & Farhan Akhtar', '+91 99443 33445', '+91 99443 33445', 'zoya.a@example.com', 'Lucknow, Uttar Pradesh'),
  ('c0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Shruti & Alok Mittal', '+91 99554 44556', '+91 99554 44556', 'shruti.m@example.com', 'Pune, Maharashtra'),
  ('c0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Akanksha & Yash Singhal', '+91 99665 55667', '+91 99665 55667', 'akanksha.s@example.com', 'Jim Corbett, Uttarakhand')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  whatsapp = EXCLUDED.whatsapp,
  email = EXCLUDED.email,
  location = EXCLUDED.location;

-- Insert Leads
INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, next_follow_up_at, next_action, next_action_due_at) VALUES
  ('l0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Wedding + Pre-wedding', '2026-11-20', 'The St. Regis Mumbai', 450000, 'Instagram', 'Looking for candid 3-day luxury wedding coverage with cinematic teaser video.', 'New Enquiry', 'Not Contacted', NOW() + INTERVAL '2 hours', 'Send introductory portfolio & pricing sheet', NOW() + INTERVAL '2 hours'),
  ('l0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Destination Wedding', '2026-12-14', 'Jagmandir Island Palace, Udaipur', 650000, 'Website', 'Royal destination wedding with 400 guests over 3 days.', 'Contacted', 'Contacted – Waiting for Response', NOW() + INTERVAL '1 day', 'Follow up on WhatsApp with bespoke proposal', NOW() + INTERVAL '1 day'),
  ('l0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Destination Wedding', '2026-10-05', 'W Goa, Vagator Beach', 380000, 'Referral', 'Beach sunset pheras and open-air sundowner cocktail party.', 'Follow-up Required', 'Responded', NOW() - INTERVAL '3 hours', 'Confirm deliverables count and album specifications', NOW() - INTERVAL '3 hours'),
  ('l0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Wedding (Full Day)', '2026-11-28', 'Fairmont Jaipur', 500000, 'Instagram', 'Traditional Rajput wedding with grand elephant entry and palace fireworks.', 'Quotation Sent', 'Contacted – Waiting for Response', NOW() + INTERVAL '2 days', 'Check if client reviewed Quotation Q-2026-084', NOW() + INTERVAL '2 days'),
  ('l0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'Wedding + Reception', '2026-12-02', 'Hyatt Regency Ahmedabad', 320000, 'WhatsApp', 'Gujarati wedding ceremony followed by 1000-guest reception.', 'Negotiation', 'Responded', NOW() + INTERVAL '4 hours', 'Negotiate inclusion of complimentary drone coverage', NOW() + INTERVAL '4 hours'),
  ('l0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'Wedding (Full Day)', '2026-11-15', 'ITC Maurya, New Delhi', 420000, 'Instagram', 'Big fat Punjabi wedding with high-energy Sangeet dance performances.', 'Accepted / Booked', 'Responded', NOW() + INTERVAL '7 days', 'Send production crew roster and schedule pre-event shoot', NOW() + INTERVAL '7 days'),
  ('l0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'Traditional Wedding', '2026-10-24', 'The Leela Palace Bengaluru', 350000, 'Referral', 'South Indian traditional wedding starting 5:30 AM Muhurtham.', 'Accepted / Booked', 'Responded', NOW() + INTERVAL '10 days', 'Collect remaining payment balance prior to wedding day', NOW() + INTERVAL '10 days'),
  ('l0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'Destination Wedding', '2026-10-18', 'Forest Hill Resort, Chandigarh', 480000, 'Instagram', 'Outdoor lawn wedding with daytime floral mandap.', 'Rejected / Lost', 'Responded', NULL, 'Deal closed - Client selected date-overlapping booking', NULL),
  ('l0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'Pre-wedding Shoot', '2026-09-28', 'Taj Falaknuma Palace, Hyderabad', 120000, 'Instagram', '1-day luxury pre-wedding cinematic concept video & portraits.', 'Accepted / Booked', 'Responded', NOW() + INTERVAL '3 days', 'Finalize wardrobe moodboard and location permits', NOW() + INTERVAL '3 days'),
  ('l0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'Destination Wedding', '2026-11-08', 'JW Marriott Mussoorie Walnut Grove Resort', 550000, 'Website', 'Himalayan mountain destination wedding over 2 days.', 'Quotation Sent', 'Contacted – Waiting for Response', NOW() + INTERVAL '1 day', 'Follow up on Quotation Q-2026-091', NOW() + INTERVAL '1 day'),
  ('l0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000011', 'Wedding + Reception', '2026-12-20', 'ITC Sonar, Kolkata', 340000, 'Referral', 'Traditional Bengali wedding rituals and grand reception dinner.', 'New Enquiry', 'Not Contacted', NOW() + INTERVAL '5 hours', 'Call client to understand multi-day coverage schedule', NOW() + INTERVAL '5 hours'),
  ('l0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000012', 'Engagement', '2026-09-18', 'Taj Fisherman''s Cove Resort & Spa, Chennai', 150000, 'WhatsApp', 'Seaside beach engagement ring ceremony with drone cinematography.', 'Accepted / Booked', 'Responded', NOW() + INTERVAL '2 days', 'Call client to verify camera gear checklist for beach shoot', NOW() + INTERVAL '2 days'),
  ('l0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000013', 'Reception Only', '2026-11-25', 'Taj Mahal Lucknow', 200000, 'Instagram', 'Awadhi royal reception evening with stage photography.', 'Follow-up Required', 'Contacted – Waiting for Response', NOW() - INTERVAL '1 day', 'Send revised quote with candid photographer package', NOW() - INTERVAL '1 day'),
  ('l0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000014', 'Wedding (Full Day)', '2026-12-08', 'The Ritz-Carlton, Pune', 400000, 'Referral', 'Maharashtrian wedding and Bollywood evening Sangeet.', 'Negotiation', 'Responded', NOW() + INTERVAL '6 hours', 'Review final quote discount and payment milestone terms', NOW() + INTERVAL '6 hours'),
  ('l0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000015', 'Destination Wedding', '2026-11-12', 'The Solluna Resort, Jim Corbett', 460000, 'Website', 'Wilderness jungle wedding with riverside Pheras.', 'Accepted / Booked', 'Responded', NOW() + INTERVAL '4 days', 'Confirm sound engineer and drone permissions with resort', NOW() + INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET
  event_type = EXCLUDED.event_type,
  event_date = EXCLUDED.event_date,
  location = EXCLUDED.location,
  budget = EXCLUDED.budget,
  lead_status = EXCLUDED.lead_status,
  contact_status = EXCLUDED.contact_status,
  next_action = EXCLUDED.next_action;

-- Insert Quotations
INSERT INTO public.quotations (id, owner_id, lead_id, quotation_number, amount, valid_until, status, sent_at, accepted_at, rejected_at, rejection_reason) VALUES
  ('q0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000004', 'Q-2026-084', 485000, '2026-10-15', 'Sent', NOW() - INTERVAL '3 days', NULL, NULL, NULL),
  ('q0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000005', 'Q-2026-088', 310000, '2026-10-20', 'Under Negotiation', NOW() - INTERVAL '4 days', NULL, NULL, NULL),
  ('q0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000006', 'Q-2026-079', 420000, '2026-09-30', 'Accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days', NULL, NULL),
  ('q0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000007', 'Q-2026-072', 350000, '2026-09-25', 'Accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', NULL, NULL),
  ('q0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000008', 'Q-2026-075', 480000, '2026-09-15', 'Rejected', NOW() - INTERVAL '22 days', NULL, NOW() - INTERVAL '20 days', 'Date Already Booked'),
  ('q0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000010', 'Q-2026-091', 540000, '2026-10-30', 'Sent', NOW() - INTERVAL '1 day', NULL, NULL, NULL),
  ('q0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000012', 'Q-2026-068', 150000, '2026-09-01', 'Accepted', NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days', NULL, NULL),
  ('q0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000015', 'Q-2026-081', 460000, '2026-10-10', 'Accepted', NOW() - INTERVAL '14 days', NOW() - INTERVAL '11 days', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  amount = EXCLUDED.amount;

-- Insert Confirmed Bookings
INSERT INTO public.bookings (id, owner_id, lead_id, client_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_paid_at, remaining_amount) VALUES
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Booking Confirmed', '2026-08-15', NOW() - INTERVAL '12 days', 420000, 150000, NOW() - INTERVAL '10 days', 270000),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'Booking Confirmed', '2026-08-10', NOW() - INTERVAL '18 days', 350000, 120000, NOW() - INTERVAL '17 days', 230000),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'Booking Confirmed', '2026-08-20', NOW() - INTERVAL '8 days', 120000, 50000, NOW() - INTERVAL '7 days', 70000),
  ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'Booking Confirmed', '2026-08-01', NOW() - INTERVAL '28 days', 150000, 60000, NOW() - INTERVAL '25 days', 90000),
  ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000015', 'Booking Confirmed', '2026-08-16', NOW() - INTERVAL '11 days', 460000, 160000, NOW() - INTERVAL '9 days', 300000)
ON CONFLICT (id) DO UPDATE SET
  booking_status = EXCLUDED.booking_status,
  remaining_amount = EXCLUDED.remaining_amount;

-- Insert Received Payments
INSERT INTO public.payments (id, owner_id, booking_id, amount, payment_type, payment_method, payment_date, reference, notes) VALUES
  ('p0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 150000, 'Advance', 'UPI', '2026-08-20', 'UPI-9820381920', '35% booking deposit token received via Google Pay'),
  ('p0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 120000, 'Advance', 'Bank Transfer', '2026-08-13', 'HDFC-NEFT-88391', 'Advance token for Muhurtham date lock'),
  ('p0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 50000, 'Advance', 'UPI', '2026-08-22', 'UPI-7718293910', 'Pre-wedding shoot date advance'),
  ('p0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 60000, 'Advance', 'UPI', '2026-08-05', 'UPI-5510294821', 'Engagement ceremony advance'),
  ('p0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 160000, 'Advance', 'Bank Transfer', '2026-08-21', 'ICICI-IMPS-9921', 'Jim Corbett wilderness wedding contract booking advance')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  payment_method = EXCLUDED.payment_method;

-- Insert Events
INSERT INTO public.events (id, owner_id, client_id, lead_id, booking_id, event_name, event_type, event_date, start_time, end_time, location, status) VALUES
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000012', 'l0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000004', 'Lavanya & Vignesh Seaside Engagement', 'Engagement', '2026-09-18', '16:00', '22:00', 'Taj Fisherman''s Cove Resort, Chennai', 'Upcoming'),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'l0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 'Tanvi & Arjun Royal Pre-wedding Video Shoot', 'Pre-wedding Shoot', '2026-09-28', '06:00', '18:00', 'Taj Falaknuma Palace, Hyderabad', 'Upcoming'),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'l0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'Pooja & Arvind Traditional Muhurtham & Reception', 'Traditional Wedding', '2026-10-24', '05:30', '23:00', 'The Leela Palace Bengaluru', 'Upcoming'),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000015', 'l0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000005', 'Akanksha & Yash Jim Corbett Riverside Wedding', 'Destination Wedding', '2026-11-12', '14:00', '02:00', 'The Solluna Resort, Jim Corbett', 'Upcoming'),
  ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'l0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Ritu & Karan Grand Delhi Wedding & Sangeet', 'Wedding (Full Day)', '2026-11-15', '11:00', '03:00', 'ITC Maurya, New Delhi', 'Upcoming')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  event_date = EXCLUDED.event_date;

-- =========================================================================
-- COMPLETE: Full database and 15 CRM deals synced with Supabase!
-- =========================================================================

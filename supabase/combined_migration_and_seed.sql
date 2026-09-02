-- =========================================================================
-- DLIGHTS CRM — COMPLETE SUPABASE POSTGRESQL MIGRATION & SEED DATA
-- Photography & Wedding Studio Client Relationship Management
-- Execute this script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- Enable required cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- AUTH USER CREATION (dlightstudios@gmail.com / dlights@2002)
-- Idempotent: Handles existing user or creates new user seamlessly
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
-- 1. TABLES SETUP
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

  avatar_url TEXT DEFAULT NULL,

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

-- Anonymous and Authenticated access policies for studio operations
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
-- 4. SEED DATA INSERTION
-- =========================================================================

-- Insert 15 Realistic Indian Wedding Clients
INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Priya & Rahul Sharma', '+91 98201 11223', '+91 98201 11223', 'priya.sharma@example.com', 'Mumbai, Maharashtra'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Ananya & Siddharth Mehta', '+91 98302 22334', '+91 98302 22334', 'ananya.mehta@example.com', 'Udaipur, Rajasthan'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Sneha & Rohan Kapoor', '+91 98403 33445', '+91 98403 33445', 'sneha.kapoor@example.com', 'South Goa'),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Kavita & Aditya Verma', '+91 98504 44556', '+91 98504 44556', 'kavita.v@example.com', 'Jaipur, Rajasthan'),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Meera & Varun Desai', '+91 98605 55667', '+91 98605 55667', 'meera.desai@example.com', 'Ahmedabad, Gujarat'),
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ritu & Karan Singhania', '+91 98706 66778', '+91 98706 66778', 'ritu.singh@example.com', 'New Delhi'),
  ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Dr. Pooja & Dr. Arvind Swaminathan', '+91 98807 77889', '+91 98807 77889', 'pooja.swamy@example.com', 'Bengaluru, Karnataka'),
  ('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Natasha & Dev Malhotra', '+91 98908 88990', '+91 98908 88990', 'natasha.m@example.com', 'Chandigarh'),
  ('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Tanvi & Arjun Reddy', '+91 99009 99001', '+91 99009 99001', 'tanvi.reddy@example.com', 'Hyderabad, Telangana'),
  ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Ishita & Kabir Chawla', '+91 99110 00112', '+91 99110 00112', 'ishita.c@example.com', 'Kolkata, West Bengal'),
  ('c0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Zoya & Farhan Merchant', '+91 99221 11223', '+91 99221 11223', 'zoya.merchant@example.com', 'Pune, Maharashtra'),
  ('c0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Aakash & Simran Oberoi', '+91 99332 22334', '+91 99332 22334', 'aakash.o@example.com', 'Gurugram, Haryana'),
  ('c0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Gayatri & Karthik Sundaram', '+91 99443 33445', '+91 99443 33445', 'gayatri.s@example.com', 'Indore, Madhya Pradesh'),
  ('c0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Deepika & Nikhil Nair', '+91 99554 44556', '+91 99554 44556', 'deepika.nair@example.com', 'Chennai, Tamil Nadu'),
  ('c0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Sakshi & Kunal Chopra', '+91 99665 55667', '+91 99665 55667', 'sakshi.c@example.com', 'Jim Corbett, Uttarakhand')
ON CONFLICT (id) DO NOTHING;

-- Insert 15 Pipeline Leads
INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at, created_at) VALUES
  ('l0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Wedding', '2026-11-24', 'The Taj Mahal Palace, Mumbai', 350000, 'Instagram', 'Looking for 3 days of complete candid wedding coverage, cinematic teaser, and wedding album.', 'New Enquiry', 'Not Contacted', NULL, NOW() + INTERVAL '2 hours', 0, 'Call client to introduce studio portfolio and confirm event timings', NOW() + INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('l0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Wedding', '2026-12-14', 'The Leela Palace, Udaipur', 650000, 'Referral', 'Destination royal wedding with Sangeet, Haldi, and grand Reception. Need 4 photographers + drone coverage.', 'Quotation Sent', 'Contacted – Waiting for Response', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 2, 'Follow up on Quotation Q-2026-089 sent yesterday for Udaipur palace shoot', NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days'),
  ('l0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Pre-Wedding', '2026-10-05', 'Cabo De Rama & Ashwem Beach, South Goa', 180000, 'Website', '2-day cinematic sunset pre-wedding shoot with stylized concepts and drone video.', 'Accepted / Booked', 'Responded', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 3, 'Confirm shotlist concept moodboard and wardrobe styles for Goa beach shoot', NOW() + INTERVAL '5 days', NOW() - INTERVAL '12 days'),
  ('l0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Wedding', '2026-12-28', 'Fairmont Jaipur, Kukas', 520000, 'WhatsApp', 'Marwari grand wedding with 800+ guests. Require dual-team candid and traditional photo/video.', 'Negotiation', 'Responded', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '1 day', 4, 'Finalize revised deliverable scope: include complimentary 1-minute vertical reel package', NOW() + INTERVAL '1 day', NOW() - INTERVAL '8 days'),
  ('l0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Engagement', '2026-09-20', 'Courtyard by Marriott, Ahmedabad', 120000, 'Google', 'Intimate ring ceremony and evening banquet photography.', 'Follow-up Required', 'Contacted – Waiting for Response', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 hours', 1, 'Send reminder message regarding availability for September 20th ring ceremony', NOW() + INTERVAL '3 hours', NOW() - INTERVAL '2 days'),
  ('l0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'Wedding', '2026-11-18', 'ITC Grand Bharat, Gurugram', 450000, 'Instagram', 'Luxury wedding coverage over 2 days with focus on editorial portraits.', 'Quotation Sent', 'Contacted – Waiting for Response', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 2, 'Call to answer queries regarding raw footage delivery timeline and album print sizes', NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 days'),
  ('l0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'Reception', '2026-10-12', 'JW Marriott Hotel, Bengaluru', 220000, 'Referral', 'Grand reception evening with 500 guests. Traditional & candid coverage.', 'Accepted / Booked', 'Responded', NOW() - INTERVAL '1 day', NOW() + INTERVAL '10 days', 3, 'Send crew assignment details and venue entry permit guidelines', NOW() + INTERVAL '10 days', NOW() - INTERVAL '15 days'),
  ('l0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'Sangeet', '2026-10-30', 'The Oberoi Sukhvilas, Chandigarh', 280000, 'Instagram', 'Energetic cocktail and sangeet night. High focus on slow-motion video and flash portraits.', 'Contacted', 'Responded', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '1 day', 1, 'Draft custom sangeet + cocktail quotation and email client', NOW() + INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('l0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'Wedding', '2026-12-02', 'Taj Falaknuma Palace, Hyderabad', 750000, 'Website', 'Royal Hyderabadi wedding with 3 days of festivities and celebrity performers.', 'Quotation Sent', 'Contacted – Waiting for Response', NOW() - INTERVAL '2 days', NOW() + INTERVAL '4 hours', 2, 'Follow up on proposal Q-2026-092 for Falaknuma palace wedding', NOW() + INTERVAL '4 hours', NOW() - INTERVAL '4 days'),
  ('l0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'Wedding', '2026-11-08', 'ITC Royal Bengal, Kolkata', 380000, 'Referral', 'Traditional Bengali wedding rituals and grand reception banquet.', 'Rejected / Lost', 'Responded', NOW() - INTERVAL '5 days', NULL, 3, 'Client chose another photographer offering local Kolkata studio packages', NULL, NOW() - INTERVAL '18 days'),
  ('l0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000011', 'Portrait', '2026-09-15', 'Oxford Golf Resort, Pune', 75000, 'Instagram', 'Maternity and couple outdoor sunrise portrait session.', 'New Enquiry', 'Not Contacted', NULL, NOW() + INTERVAL '1 hour', 0, 'WhatsApp client with maternity portrait lookbook and package tiers', NOW() + INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('l0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000012', 'Corporate', '2026-09-28', 'The Westin Gurgaon', 150000, 'Google', 'Annual corporate gala, keynote speeches, and executive portrait booth.', 'Negotiation', 'Responded', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 2, 'Send updated invoice with corporate GST details', NOW() + INTERVAL '1 day', NOW() - INTERVAL '7 days'),
  ('l0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000013', 'Muhurtham', '2026-10-18', 'Brindavan Palace, Indore', 310000, 'WhatsApp', 'Traditional morning Muhurtham and evening reception.', 'Accepted / Booked', 'Responded', NOW() - INTERVAL '2 days', NOW() + INTERVAL '7 days', 4, 'Collect remaining 50% advance before shoot', NOW() + INTERVAL '7 days', NOW() - INTERVAL '20 days'),
  ('l0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000014', 'Wedding', '2027-01-10', 'InterContinental Chennai Mahabalipuram', 480000, 'Website', 'Traditional South Indian wedding with beachside reception and couple portraits.', 'Contacted', 'Responded', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', 1, 'Send link to South Indian wedding portfolio album', NOW() + INTERVAL '2 days', NOW() - INTERVAL '3 days'),
  ('l0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000015', 'Wedding', '2026-10-08', 'The Riverview Retreat, Jim Corbett', 420000, 'Referral', 'Wilderness jungle luxury wedding with bonfire evening and sundowner pheras.', 'Accepted / Booked', 'Responded', NOW() - INTERVAL '2 days', NOW() + INTERVAL '14 days', 3, 'Finalize wildlife resort drone flight permits and sound equipment for outdoor pheras', NOW() + INTERVAL '14 days', NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Quotations
INSERT INTO public.quotations (id, owner_id, lead_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, rejected_at, rejection_reason, notes) VALUES
  ('q0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000002', 'Q-2026-089', 650000, '2026-10-31', 'Sent', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours', NULL, NULL, NULL, 'Includes 3-day royal package, 2 candid + 2 cinematic videographers, 4K teaser + 45-min film, 2 premium Italian velvet albums.'),
  ('q0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000003', 'Q-2026-074', 180000, '2026-09-15', 'Accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NULL, NULL, 'Goa 2-day pre-wedding package. Drone footage, 2-minute stylized teaser, 50 edited portrait masters.'),
  ('q0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000004', 'Q-2026-090', 520000, '2026-10-20', 'Negotiating', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NULL, NULL, NULL, 'Fairmont Jaipur wedding. Client requested quotation discount or addition of Instagram reels coverage.'),
  ('q0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000006', 'Q-2026-091', 450000, '2026-10-15', 'Sent', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, 'ITC Grand Bharat Gurugram. 2-day editorial wedding package.'),
  ('q0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000007', 'Q-2026-068', 220000, '2026-09-10', 'Accepted', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', NULL, NULL, 'Grand Reception coverage at JW Marriott Bengaluru with 4 photographers.'),
  ('q0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000009', 'Q-2026-092', 750000, '2026-11-01', 'Sent', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL, NULL, NULL, 'Falaknuma Palace luxury 3-day signature package.'),
  ('q0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000010', 'Q-2026-062', 380000, '2026-08-30', 'Rejected', NOW() - INTERVAL '16 days', NOW() - INTERVAL '15 days', NULL, NOW() - INTERVAL '5 days', 'Chose another photographer', 'Client preferred local Kolkata traditional photo studio due to family recommendation.'),
  ('q0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000013', 'Q-2026-055', 310000, '2026-09-01', 'Accepted', NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NULL, NULL, 'Indore Muhurtham and Reception package with live streaming setup.'),
  ('q0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000015', 'Q-2026-048', 420000, '2026-08-25', 'Accepted', NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '22 days', NULL, NULL, 'Jim Corbett wildlife destination wedding. 2 days + drone cinematography.')
ON CONFLICT (id) DO NOTHING;

-- Insert Confirmed Bookings
INSERT INTO public.bookings (id, owner_id, lead_id, client_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date) VALUES
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Booking Confirmed', '2026-08-24', NOW() - INTERVAL '9 days', 180000, 75000, '2026-08-30', NOW() - INTERVAL '9 days', 105000, '2026-10-05'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'Booking Confirmed', '2026-08-21', NOW() - INTERVAL '12 days', 220000, 100000, '2026-08-28', NOW() - INTERVAL '12 days', 120000, '2026-10-12'),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000013', 'Booking Confirmed', '2026-08-16', NOW() - INTERVAL '17 days', 310000, 100000, '2026-08-25', NOW() - INTERVAL '17 days', 210000, '2026-10-18'),
  ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000015', 'Booking Confirmed', '2026-08-11', NOW() - INTERVAL '22 days', 420000, 150000, '2026-08-20', NOW() - INTERVAL '22 days', 270000, '2026-10-08')
ON CONFLICT (id) DO NOTHING;

-- Insert Payments
INSERT INTO public.payments (id, owner_id, booking_id, amount, payment_type, payment_method, payment_date, reference, notes) VALUES
  ('p0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 75000, 'Advance', 'UPI', '2026-08-24', 'UPI-998822-HDFC', 'Advance booking token received via GPay'),
  ('p0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 100000, 'Advance', 'Bank Transfer', '2026-08-21', 'NEFT-ICICI-00192', '50% token advance for Bangalore reception shoot'),
  ('p0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 100000, 'Advance', 'UPI', '2026-08-16', 'UPI-110293-AXIS', 'Advance token received for Indore Muhurtham ceremony'),
  ('p0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 150000, 'Advance', 'Bank Transfer', '2026-08-11', 'IMPS-SBI-881290', 'Advance deposit for Jim Corbett destination wedding')
ON CONFLICT (id) DO NOTHING;

-- Insert Events
INSERT INTO public.events (id, owner_id, lead_id, booking_id, client_id, event_name, event_type, event_date, start_time, end_time, location, status, notes) VALUES
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Sneha & Rohan Pre-Wedding Sunset Shoot', 'Pre-Wedding', '2026-10-05', '16:00', '19:30', 'Cabo De Rama Cliffs, South Goa', 'Scheduled', 'Golden hour coastal portraits with drone.'),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000015', 'Sakshi & Kunal Sangeet & Bonfire Night', 'Sangeet', '2026-10-07', '19:00', '23:30', 'The Riverview Retreat, Jim Corbett', 'Scheduled', 'Night flash setup with warm tungsten ambient lamps.'),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000015', 'Sakshi & Kunal Sundowner Wedding Pheras', 'Wedding', '2026-10-08', '16:30', '21:00', 'Kosi Riverside Lawns, Jim Corbett', 'Scheduled', 'Main wedding ceremony and couple varmala moment.'),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'Dr. Pooja & Dr. Arvind Grand Reception', 'Reception', '2026-10-12', '18:30', '23:00', 'JW Marriott Hotel, Bengaluru', 'Scheduled', '4-camera crew for stage portraits and VIP guest coverage.'),
  ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000013', 'Gayatri & Karthik Morning Muhurtham', 'Muhurtham', '2026-10-18', '07:00', '12:30', 'Brindavan Palace, Indore', 'Scheduled', 'Morning auspicious rituals and family group photo session.')
ON CONFLICT (id) DO NOTHING;

-- Insert Follow-ups
INSERT INTO public.follow_ups (id, owner_id, lead_id, scheduled_at, completed_at, contact_method, notes) VALUES
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NULL, 'Call', 'Follow up on Quotation Q-2026-089 sent for 3-day royal Udaipur shoot'),
  ('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000006', NOW() - INTERVAL '1 day', NULL, 'Call', 'Follow up with ITC Grand Bharat bride regarding album specifications'),
  ('f0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000005', NOW() + INTERVAL '3 hours', NULL, 'WhatsApp', 'Remind couple about September 20th ring ceremony availability reservation'),
  ('f0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000009', NOW() + INTERVAL '4 hours', NULL, 'Call', 'Discuss luxury cinematic drone requirements for Falaknuma Palace wedding')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON public.leads(owner_id, lead_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_event_date ON public.leads(owner_id, event_date);

CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON public.clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_owner_name ON public.clients(owner_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_owner_created ON public.clients(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follow_ups_owner_lead ON public.follow_ups(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_sched ON public.follow_ups(owner_id, scheduled_at ASC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_pending ON public.follow_ups(owner_id, scheduled_at) WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_owner_lead ON public.quotations(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(owner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_owner_lead ON public.bookings(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(owner_id, client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(owner_id, booking_status);

CREATE INDEX IF NOT EXISTS idx_payments_owner_booking ON public.payments(owner_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner_lead ON public.payments(owner_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(owner_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_owner_date ON public.events(owner_id, event_date ASC);
CREATE INDEX IF NOT EXISTS idx_events_owner_client ON public.events(owner_id, client_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_activities_owner_lead ON public.activities(owner_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_owner_lead ON public.notes(owner_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_owner_lead ON public.communications(owner_id, lead_id, created_at DESC);

-- =========================================================================
-- COMPLETE: Schema, 15 Seed Records and Performance Indexes Ready!
-- =========================================================================

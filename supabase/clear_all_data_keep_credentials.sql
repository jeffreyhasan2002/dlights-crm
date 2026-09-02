-- =========================================================================
-- DLIGHT STUDIOS CRM — PRODUCTION DATA RESET SCRIPT
-- Studio: Bruno Sangeeth / Dlight Studios
-- Email:  dlightstudios@gmail.com
-- Pass:   dlights@2002
-- Location: Nagercoil, Tamil Nadu, India
--
-- This script will:
-- 1. Truncate / clear all test leads, clients, quotations, bookings,
--    payments, events, follow-ups, activities, notes & communications.
-- 2. Preserve your admin credentials (dlightstudios@gmail.com / dlights@2002).
-- 3. Ensure your studio profile is clean and ready for real client onboarding.
--
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- =========================================================================

-- Enable UUID & crypto extensions if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- STEP 1: CLEAR ALL TRANSACTIONAL CRM DATA
-- =========================================================================
TRUNCATE TABLE 
  public.activities,
  public.notes,
  public.communications,
  public.follow_ups,
  public.payments,
  public.bookings,
  public.quotations,
  public.events,
  public.leads,
  public.clients
CASCADE;

-- =========================================================================
-- STEP 2: ENSURE ADMIN AUTH USER EXISTS WITH DLIGHT STUDIOS CREDENTIALS
-- =========================================================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Look for existing user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dlightstudios@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user password and metadata
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
    -- Create fresh auth user
    v_user_id := gen_random_uuid();

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

  -- =========================================================================
  -- STEP 3: ENSURE CLEAN STUDIO PROFILE IN public.profiles
  -- =========================================================================
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    business_name,
    phone,
    whatsapp,
    default_location,
    currency,
    date_format,
    timezone,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'Bruno Sangeeth',
    'dlightstudios@gmail.com',
    'Dlight Studios',
    '+91 94888 88717',
    '+91 94888 88717',
    'Nagercoil, Tamil Nadu, India',
    'INR',
    'dd/MM/yyyy',
    'Asia/Kolkata',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Bruno Sangeeth',
    email = 'dlightstudios@gmail.com',
    business_name = 'Dlight Studios',
    phone = '+91 94888 88717',
    whatsapp = '+91 94888 88717',
    default_location = 'Nagercoil, Tamil Nadu, India',
    currency = 'INR',
    date_format = 'dd/MM/yyyy',
    timezone = 'Asia/Kolkata',
    updated_at = NOW();

END $$;

-- Verify that the CRM tables are 100% empty and the profile is active
SELECT 'public.clients' AS table_name, count(*) AS remaining_rows FROM public.clients
UNION ALL
SELECT 'public.leads', count(*) FROM public.leads
UNION ALL
SELECT 'public.quotations', count(*) FROM public.quotations
UNION ALL
SELECT 'public.bookings', count(*) FROM public.bookings
UNION ALL
SELECT 'public.payments', count(*) FROM public.payments
UNION ALL
SELECT 'public.events', count(*) FROM public.events
UNION ALL
SELECT 'public.follow_ups', count(*) FROM public.follow_ups
UNION ALL
SELECT 'public.profiles', count(*) FROM public.profiles;

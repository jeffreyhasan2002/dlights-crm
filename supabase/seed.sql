-- ====================================================================
-- PHOTOGRAPHY & WEDDING CLIENT CRM - REALISTIC SEED DATA
-- frontend/supabase/seed.sql
-- ====================================================================

DO \$\$
DECLARE
    v_user_id UUID;
    v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID; v_c5 UUID;
    v_c6 UUID; v_c7 UUID; v_c8 UUID; v_c9 UUID; v_c10 UUID;
    v_c11 UUID; v_c12 UUID; v_c13 UUID; v_c14 UUID; v_c15 UUID;

    v_l1 UUID; v_l2 UUID; v_l3 UUID; v_l4 UUID; v_l5 UUID;
    v_l6 UUID; v_l7 UUID; v_l8 UUID; v_l9 UUID; v_l10 UUID;
    v_l11 UUID; v_l12 UUID; v_l13 UUID; v_l14 UUID; v_l15 UUID;
    v_l16 UUID; v_l17 UUID; v_l18 UUID;

    v_b1 UUID; v_b2 UUID; v_b3 UUID; v_b4 UUID; v_b5 UUID; v_b6 UUID;
BEGIN
    -- Get or fallback to existing user or generate a demo UUID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;

    -- Profile setup
    INSERT INTO public.profiles (id, full_name, email, avatar_url, business_name, phone, whatsapp, default_location, currency, date_format, timezone)
    VALUES (
        v_user_id,
        'Bruno Sangeeth',
        'dlightstudios@gmail.com',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'Dlight Studios',
        '+91 94888 88717',
        '+91 94888 88717',
        'Mumbai & Goa, India',
        'INR',
        'dd/MM/yyyy',
        'Asia/Kolkata'
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        business_name = EXCLUDED.business_name;

    -- Insert 15 Realistic Clients
    v_c1 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c1, v_user_id, 'Priya & Rahul Sharma', '+91 98192 33445', '+91 98192 33445', 'priya.sharma92@gmail.com', 'Udaipur & Mumbai');

    v_c2 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c2, v_user_id, 'Ananya & Siddharth Mehta', '+91 98334 11223', '+91 98334 11223', 'ananya.mehta@outlook.com', 'South Mumbai');

    v_c3 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c3, v_user_id, 'Sneha & Rohan Kulkarni', '+91 99200 44556', '+91 99200 44556', 'rohan.kulkarni@gmail.com', 'Pune / Alibaug');

    v_c4 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c4, v_user_id, 'Meera & Aditya Roy', '+91 98450 77889', '+91 98450 77889', 'aditya.roy@gmail.com', 'Bengaluru & Goa');

    v_c5 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c5, v_user_id, 'Kavya & Arjun Nair', '+91 97401 22334', '+91 97401 22334', 'kavya.nair@icloud.com', 'Kochi & Bengaluru');

    v_c6 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c6, v_user_id, 'Tanvi & Devendra Singhania', '+91 98111 88990', '+91 98111 88990', 'tanvi.singhania@yahoo.com', 'Jaipur & Delhi');

    v_c7 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c7, v_user_id, 'Ritu & Harshwardhan Agarwal', '+91 98290 66778', '+91 98290 66778', 'harsh.agarwal@gmail.com', 'Jodhpur, Rajasthan');

    v_c8 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c8, v_user_id, 'Dr. Neha Deshmukh', '+91 98220 55667', '+91 98220 55667', 'dr.neha.deshmukh@hospital.org', 'Thane, Mumbai');

    v_c9 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c9, v_user_id, 'Nikhil & Simran Bajaj', '+91 99887 66554', '+91 99887 66554', 'simran.bajaj@gmail.com', 'Chandigarh & Mussoorie');

    v_c10 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c10, v_user_id, 'Aarav & Pooja Kapoor', '+91 98710 33221', '+91 98710 33221', 'pooja.kapoor@gmail.com', 'South Delhi');

    v_c11 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c11, v_user_id, 'Zoya & Farhan Merchant', '+91 98205 11992', '+91 98205 11992', 'zoya.merchant@gmail.com', 'Bandra, Mumbai');

    v_c12 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c12, v_user_id, 'Sunita Hegde (Apex Brands)', '+91 98440 99881', '+91 98440 99881', 'events@apexbrands.in', 'Hyderabad');

    v_c13 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c13, v_user_id, 'Gaurav & Ishita Mathur', '+91 98260 44332', '+91 98260 44332', 'ishita.mathur@gmail.com', 'Indore & Udaipur');

    v_c14 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c14, v_user_id, 'Shalini Iyer & Vignesh Balan', '+91 98400 12345', '+91 98400 12345', 'vignesh.balan@gmail.com', 'Chennai & Mahabalipuram');

    v_c15 := gen_random_uuid();
    INSERT INTO public.clients (id, owner_id, name, phone, whatsapp, email, location)
    VALUES (v_c15, v_user_id, 'Karan & Natasha Oberoi', '+91 98100 99001', '+91 98100 99001', 'natasha.oberoi@live.com', 'Gurugram & Jim Corbett');

    -- Insert Leads Across Different Pipeline Stages
    -- 1. Accepted / Booked (Priya & Rahul)
    v_l1 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l1, v_user_id, v_c1, 'Wedding', '2026-11-20', 'The Oberoi Udaivilas, Udaipur', 450000.00, 'Instagram', 'Looking for 3-day royal wedding coverage with traditional cinematic film and candid photography.', 'Accepted / Booked', 'Responded', now() - interval '2 days', now() + interval '5 days', 4, 'Send pre-event questionnaire and timeline checklist', now() + interval '5 days');

    -- 2. Quotation Sent (Ananya & Siddharth)
    v_l2 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l2, v_user_id, v_c2, 'Sangeet', '2026-10-15', 'Taj Lands End, Bandra, Mumbai', 280000.00, 'Referral', 'Grand Sangeet night with 450 guests. Need drone coverage and multi-camera setup.', 'Quotation Sent', 'Contacted – Waiting for Response', now() - interval '1 day', now() + interval '1 day', 2, 'Follow up on Quotation Q-2026-084', now() + interval '1 day');

    -- 3. Negotiation (Sneha & Rohan)
    v_l3 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l3, v_user_id, v_c3, 'Pre-Wedding', '2026-09-28', 'Alibaug Beach & Forest Resort', 180000.00, 'Website', 'Romantic beachside pre-wedding shoot with teaser reel and 2 costume changes.', 'Negotiation', 'Responded', now() - interval '1 day', now() + interval '2 days', 3, 'Send revised quote including drone video shots', now() + interval '2 days');

    -- 4. Follow-up Required / Overdue (Meera & Aditya)
    v_l4 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l4, v_user_id, v_c4, 'Wedding', '2026-12-05', 'W Goa, Vagator Beach', 520000.00, 'Instagram', 'Destination wedding at Goa. 200 guests, sundowner wedding + beach reception.', 'Follow-up Required', 'Contacted – Waiting for Response', now() - interval '6 days', now() - interval '2 days', 2, 'Call client to check if dates are locked with resort', now() - interval '2 days');

    -- 5. New Enquiry (Kavya & Arjun)
    v_l5 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l5, v_user_id, v_c5, 'Engagement', '2026-10-02', 'Grand Hyatt, Kochi', 150000.00, 'WhatsApp', 'Enquiry received via WhatsApp for ring ceremony and family portraits.', 'New Enquiry', 'Not Contacted', NULL, now() + interval '4 hours', 0, 'Send introductory portfolio and pricing brochure on WhatsApp', now() + interval '4 hours');

    -- 6. Contacted (Tanvi & Devendra)
    v_l6 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l6, v_user_id, v_c6, 'Wedding', '2026-12-18', 'Fairmont Jaipur', 650000.00, 'Google', 'Palace wedding in Jaipur. Looking for top-tier candid photo & film team.', 'Contacted', 'Responded', now() - interval '1 day', now() + interval '1 day', 1, 'Prepare customized proposal for 3-day royal package', now() + interval '1 day');

    -- 7. Accepted / Booked (Ritu & Harshwardhan)
    v_l7 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l7, v_user_id, v_c7, 'Reception', '2026-09-15', 'Umaid Bhawan Palace, Jodhpur', 350000.00, 'Referral', 'Grand reception ceremony with traditional Rajasthani setup and celebrity performances.', 'Accepted / Booked', 'Responded', now() - interval '3 days', now() + interval '3 days', 3, 'Confirm travel tickets and hotel logistics for crew', now() + interval '3 days');

    -- 8. Rejected / Lost (Dr. Neha Deshmukh)
    v_l8 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l8, v_user_id, v_c8, 'Baby Shoot', '2026-09-20', 'Home Studio, Thane', 40000.00, 'Instagram', 'Newborn photoshoot session with 3 theme setups.', 'Rejected / Lost', 'Responded', now() - interval '10 days', NULL, 2, 'Archived - Chose studio closer to home', NULL);

    -- 9. Quotation Sent (Nikhil & Simran)
    v_l9 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l9, v_user_id, v_c9, 'Wedding', '2026-11-28', 'JW Marriott Mussoorie Walnut Grove', 550000.00, 'Instagram', 'Hill station intimate luxury wedding with mountain backdrop ceremonies.', 'Quotation Sent', 'Contacted – Waiting for Response', now() - interval '2 days', now() + interval '6 hours', 2, 'Follow up regarding album specifications', now() + interval '6 hours');

    -- 10. Follow-up Required (Aarav & Pooja)
    v_l10 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l10, v_user_id, v_c10, 'Birthday', '2026-09-12', 'The Claridges, New Delhi', 95000.00, 'Existing Client', '1st birthday celebration with outdoor fairy tale theme decor.', 'Follow-up Required', 'No Response', now() - interval '4 days', now() - interval '1 day', 3, 'Send reminder WhatsApp message regarding photographer availability', now() - interval '1 day');

    -- 11. New Enquiry (Zoya & Farhan)
    v_l11 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l11, v_user_id, v_c11, 'Engagement', '2026-10-24', 'Soho House, Juhu, Mumbai', 175000.00, 'Instagram', 'Sunset rooftop engagement party. Candid photography and short cinematic reel needed.', 'New Enquiry', 'Not Contacted', NULL, now() + interval '2 hours', 0, 'Call client to understand visual style requirements', now() + interval '2 hours');

    -- 12. Negotiation (Sunita Hegde)
    v_l12 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l12, v_user_id, v_c12, 'Corporate', '2026-09-30', 'HICC Novotel, Hyderabad', 220000.00, 'Referral', 'Annual Global Tech Summit 2-day keynotes, team headshots, and gala dinner.', 'Negotiation', 'Responded', now() - interval '1 day', now() + interval '1 day', 2, 'Send updated invoice with corporate GST details', now() + interval '1 day');

    -- 13. Accepted / Booked (Gaurav & Ishita)
    v_l13 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l13, v_user_id, v_c13, 'Muhurtham', '2026-10-18', 'Brindavan Palace, Indore', 310000.00, 'WhatsApp', 'Traditional morning Muhurtham and evening reception.', 'Accepted / Booked', 'Responded', now() - interval '2 days', now() + interval '7 days', 4, 'Collect remaining 50% advance before shoot', now() + interval '7 days');

    -- 14. Contacted (Shalini & Vignesh)
    v_l14 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l14, v_user_id, v_c14, 'Wedding', '2027-01-10', 'InterContinental Chennai Mahabalipuram', 480000.00, 'Website', 'Traditional South Indian wedding with beachside reception and couple portraits.', 'Contacted', 'Responded', now() - interval '1 day', now() + interval '2 days', 1, 'Send link to South Indian wedding portfolio album', now() + interval '2 days');

    -- 15. Accepted / Booked (Karan & Natasha)
    v_l15 := gen_random_uuid();
    INSERT INTO public.leads (id, owner_id, client_id, event_type, event_date, location, budget, source, enquiry_message, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at)
    VALUES (v_l15, v_user_id, v_c15, 'Wedding', '2026-10-08', 'The Riverview Retreat, Jim Corbett', 420000.00, 'Referral', 'Wilderness jungle luxury wedding with bonfire evening and sundowner pheras.', 'Accepted / Booked', 'Responded', now() - interval '5 days', now() + interval '4 days', 3, 'Finalize shot list for couple portraits by the riverside', now() + interval '4 days');

    -- Insert Quotations
    -- Q1 for Priya & Rahul (Accepted)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, notes)
    VALUES (gen_random_uuid(), v_l1, v_user_id, 'Q-2026-001', 450000.00, '2026-10-31', 'Accepted', now() - interval '20 days', now() - interval '19 days', now() - interval '15 days', 'Package includes: 3 Cinematographers, 3 Candid Photographers, 1 Drone Pilot, 2 Premium Leather Layflat Albums, Teaser + 30-min Film.');

    -- Q2 for Ananya & Siddharth (Sent)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, notes)
    VALUES (gen_random_uuid(), v_l2, v_user_id, 'Q-2026-084', 280000.00, '2026-09-30', 'Sent', now() - interval '2 days', now() - interval '1 day', 'Includes multi-cam Sangeet capture, dance performance reels, high-res edited stills.');

    -- Q3 for Sneha & Rohan (Negotiating)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, notes)
    VALUES (gen_random_uuid(), v_l3, v_user_id, 'Q-2026-091', 180000.00, '2026-09-25', 'Negotiating', now() - interval '5 days', now() - interval '4 days', 'Client requested complimentary drone aerial photography in Alibaug.');

    -- Q4 for Dr. Neha (Rejected)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, rejected_at, rejection_reason, notes)
    VALUES (gen_random_uuid(), v_l8, v_user_id, 'Q-2026-072', 40000.00, '2026-09-10', 'Rejected', now() - interval '12 days', now() - interval '11 days', now() - interval '10 days', 'Price too high', 'Client had budget of ₹20,000.');

    -- Q5 for Nikhil & Simran (Sent)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, notes)
    VALUES (gen_random_uuid(), v_l9, v_user_id, 'Q-2026-095', 550000.00, '2026-10-15', 'Sent', now() - interval '3 days', now() - interval '2 days', 'Mussoorie mountain destination package with luxury fine art photo books.');

    -- Q6 for Ritu & Harshwardhan (Accepted)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, notes)
    VALUES (gen_random_uuid(), v_l7, v_user_id, 'Q-2026-068', 350000.00, '2026-09-01', 'Accepted', now() - interval '25 days', now() - interval '24 days', now() - interval '20 days', 'Palace reception coverage with live streaming setup.');

    -- Q7 for Gaurav & Ishita (Accepted)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, notes)
    VALUES (gen_random_uuid(), v_l13, v_user_id, 'Q-2026-079', 310000.00, '2026-09-20', 'Accepted', now() - interval '14 days', now() - interval '13 days', now() - interval '10 days', '2-day Muhurtham & Reception ceremony package.');

    -- Q8 for Karan & Natasha (Accepted)
    INSERT INTO public.quotations (id, lead_id, owner_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, notes)
    VALUES (gen_random_uuid(), v_l15, v_user_id, 'Q-2026-081', 420000.00, '2026-09-18', 'Accepted', now() - interval '18 days', now() - interval '17 days', now() - interval '12 days', 'Jim Corbett resort wilderness wedding package.');

    -- Insert Bookings
    -- Booking 1: Priya & Rahul
    v_b1 := gen_random_uuid();
    INSERT INTO public.bookings (id, lead_id, client_id, owner_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date)
    VALUES (v_b1, v_l1, v_c1, v_user_id, 'Booking Confirmed', '2026-08-15', now() - interval '15 days', 450000.00, 150000.00, '2026-08-20', now() - interval '15 days', 300000.00, '2026-11-20');

    -- Booking 2: Ritu & Harshwardhan
    v_b2 := gen_random_uuid();
    INSERT INTO public.bookings (id, lead_id, client_id, owner_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date)
    VALUES (v_b2, v_l7, v_c7, v_user_id, 'Upcoming Event', '2026-08-10', now() - interval '20 days', 350000.00, 150000.00, '2026-08-15', now() - interval '20 days', 200000.00, '2026-09-15');

    -- Booking 3: Gaurav & Ishita
    v_b3 := gen_random_uuid();
    INSERT INTO public.bookings (id, lead_id, client_id, owner_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date)
    VALUES (v_b3, v_l13, v_c13, v_user_id, 'Advance Payment', '2026-08-22', now() - interval '10 days', 310000.00, 100000.00, '2026-08-28', now() - interval '10 days', 210000.00, '2026-10-18');

    -- Booking 4: Karan & Natasha
    v_b4 := gen_random_uuid();
    INSERT INTO public.bookings (id, lead_id, client_id, owner_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date)
    VALUES (v_b4, v_l15, v_c15, v_user_id, 'Upcoming Event', '2026-08-20', now() - interval '12 days', 420000.00, 200000.00, '2026-08-25', now() - interval '12 days', 220000.00, '2026-10-08');

    -- Insert Payments
    INSERT INTO public.payments (id, booking_id, owner_id, amount, payment_type, payment_method, payment_date, reference, notes)
    VALUES (gen_random_uuid(), v_b1, v_user_id, 150000.00, 'Advance', 'Bank Transfer', '2026-08-15', 'HDFC982347102', '33% booking token advance via NEFT.');

    INSERT INTO public.payments (id, booking_id, owner_id, amount, payment_type, payment_method, payment_date, reference, notes)
    VALUES (gen_random_uuid(), v_b2, v_user_id, 150000.00, 'Advance', 'UPI', '2026-08-10', 'UPI-ICICI-998822', 'Booking advance received.');

    INSERT INTO public.payments (id, booking_id, owner_id, amount, payment_type, payment_method, payment_date, reference, notes)
    VALUES (gen_random_uuid(), v_b3, v_user_id, 100000.00, 'Advance', 'UPI', '2026-08-22', 'UPI-AXIS-441199', 'First advance received.');

    INSERT INTO public.payments (id, booking_id, owner_id, amount, payment_type, payment_method, payment_date, reference, notes)
    VALUES (gen_random_uuid(), v_b4, v_user_id, 200000.00, 'Advance', 'Bank Transfer', '2026-08-20', 'KOTAK-TRF-00192', '50% initial advance received.');

    -- Insert Events
    INSERT INTO public.events (id, lead_id, client_id, owner_id, event_name, event_type, event_date, start_time, end_time, location, notes, status)
    VALUES (gen_random_uuid(), v_l7, v_c7, v_user_id, 'Harsh & Ritu Royal Palace Reception', 'Reception', '2026-09-15', '18:00', '23:30', 'Umaid Bhawan Palace, Jodhpur', 'Crew call time: 16:30. Formal royal reception decor.', 'Upcoming');

    INSERT INTO public.events (id, lead_id, client_id, owner_id, event_name, event_type, event_date, start_time, end_time, location, notes, status)
    VALUES (gen_random_uuid(), v_l15, v_c15, v_user_id, 'Karan & Natasha Jim Corbett Wedding & Pheras', 'Wedding', '2026-10-08', '15:30', '22:00', 'The Riverview Retreat, Jim Corbett, Uttarakhand', 'Sundowner pheras by the river Kosi followed by dinner party.', 'Upcoming');

    INSERT INTO public.events (id, lead_id, client_id, owner_id, event_name, event_type, event_date, start_time, end_time, location, notes, status)
    VALUES (gen_random_uuid(), v_l13, v_c13, v_user_id, 'Gaurav & Ishita Sacred Muhurtham', 'Muhurtham', '2026-10-18', '08:30', '13:00', 'Brindavan Palace, Indore', 'Morning traditional ceremony.', 'Upcoming');

    INSERT INTO public.events (id, lead_id, client_id, owner_id, event_name, event_type, event_date, start_time, end_time, location, notes, status)
    VALUES (gen_random_uuid(), v_l1, v_c1, v_user_id, 'Rahul & Priya Royal Udaipur 3-Day Wedding', 'Wedding', '2026-11-20', '10:00', '23:59', 'The Oberoi Udaivilas, Udaipur', 'Day 1 Mehndi & Sangeet, Day 2 Haldi & Royal Pheras, Day 3 Reception.', 'Upcoming');

    -- Insert Follow-ups
    INSERT INTO public.follow_ups (id, lead_id, owner_id, scheduled_at, completed_at, contact_method, notes, client_response)
    VALUES (gen_random_uuid(), v_l2, v_user_id, now() + interval '1 day', NULL, 'WhatsApp', 'Follow up on Quotation Q-2026-084 sent for Sangeet', NULL);

    INSERT INTO public.follow_ups (id, lead_id, owner_id, scheduled_at, completed_at, contact_method, notes, client_response)
    VALUES (gen_random_uuid(), v_l4, v_user_id, now() - interval '2 days', NULL, 'Call', 'Call to confirm W Goa booking status', NULL);

    INSERT INTO public.follow_ups (id, lead_id, owner_id, scheduled_at, completed_at, contact_method, notes, client_response)
    VALUES (gen_random_uuid(), v_l10, v_user_id, now() - interval '1 day', NULL, 'WhatsApp', 'Check if birthday date is confirmed at Claridges', NULL);

    INSERT INTO public.follow_ups (id, lead_id, owner_id, scheduled_at, completed_at, contact_method, notes, client_response)
    VALUES (gen_random_uuid(), v_l9, v_user_id, now() + interval '6 hours', NULL, 'Call', 'Discuss album leather options and customized cover engraving', NULL);

    INSERT INTO public.follow_ups (id, lead_id, owner_id, scheduled_at, completed_at, contact_method, notes, client_response)
    VALUES (gen_random_uuid(), v_l1, v_user_id, now() - interval '16 days', now() - interval '15 days', 'Call', 'Discussed contract clauses and advance payment', 'Agreed and initiated 33% NEFT transfer immediately.');

    -- Insert Communications
    INSERT INTO public.communications (id, lead_id, owner_id, contact_method, direction, message, client_response)
    VALUES (gen_random_uuid(), v_l1, v_user_id, 'WhatsApp', 'Outgoing', 'Hello Priya & Rahul! Delighted to connect. Here is our official portfolio link and sample Udaipur wedding films.', 'Loved your work! Let us schedule a phone call this evening.');

    INSERT INTO public.communications (id, lead_id, owner_id, contact_method, direction, message, client_response)
    VALUES (gen_random_uuid(), v_l1, v_user_id, 'Call', 'Outgoing', 'Detailed 30-minute consultation going over wedding schedule and team deployment.', 'Client requested quotation for 3-day full royal package.');

    INSERT INTO public.communications (id, lead_id, owner_id, contact_method, direction, message, client_response)
    VALUES (gen_random_uuid(), v_l2, v_user_id, 'Email', 'Outgoing', 'Sent customized quotation Q-2026-084 along with deliverables breakdown for Taj Lands End Sangeet.', 'Received email, reviewing with family tonight.');

    INSERT INTO public.communications (id, lead_id, owner_id, contact_method, direction, message, client_response)
    VALUES (gen_random_uuid(), v_l3, v_user_id, 'WhatsApp', 'Incoming', 'Hi Bruno, we loved the moodboard! Could we also include drone footage at the Alibaug beach without extra fee?', 'We can include drone shots if booked by end of this week.');

    -- Insert Notes
    INSERT INTO public.notes (id, lead_id, owner_id, content)
    VALUES (gen_random_uuid(), v_l1, v_user_id, 'Bride prefers warm golden-hour tones and candid unposed moments over stiff family portraits.');

    INSERT INTO public.notes (id, lead_id, owner_id, content)
    VALUES (gen_random_uuid(), v_l2, v_user_id, 'Choreographer entry sequence has pyrotechnics and dry ice smoke. Need high dynamic range lens setup.');

    INSERT INTO public.notes (id, lead_id, owner_id, content)
    VALUES (gen_random_uuid(), v_l3, v_user_id, 'Couple wants sunset shots specifically around Kihim beach during low tide.');

    -- Insert Activity Timeline Entries
    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l1, v_c1, v_user_id, 'ENQUIRY_CREATED', 'New Enquiry Received', 'Priya & Rahul enquired via Instagram for 3-day Udaipur wedding.', 'Instagram');

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l1, v_c1, v_user_id, 'CONTACTED', 'Initial WhatsApp Message Sent', 'Shared wedding portfolio and brochure with couple.', 'WhatsApp');

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l1, v_c1, v_user_id, 'QUOTATION_SENT', 'Quotation Q-2026-001 Sent', 'Sent quotation of ₹4,50,000 for 3-day royal package.', 'Email');

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l1, v_c1, v_user_id, 'QUOTATION_ACCEPTED', 'Quotation Accepted', 'Priya confirmed package approval.', 'WhatsApp');

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l1, v_c1, v_user_id, 'PAYMENT_RECEIVED', 'Advance Payment of ₹1,50,000 Received', 'NEFT Reference HDFC982347102 confirmed in studio bank account.', 'Bank Transfer');

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l1, v_c1, v_user_id, 'BOOKING_CONFIRMED', 'Booking Officially Confirmed', 'Dates 20-22 Nov locked in production calendar.', NULL);

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l2, v_c2, v_user_id, 'ENQUIRY_CREATED', 'New Sangeet Enquiry', 'Ananya enquired for Taj Lands End Bandra Sangeet night.', 'Referral');

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l2, v_c2, v_user_id, 'QUOTATION_SENT', 'Quotation Q-2026-084 Sent', 'Sent formal proposal of ₹2,80,000.', 'Email');

    INSERT INTO public.activities (id, lead_id, client_id, owner_id, activity_type, title, description, contact_method)
    VALUES (gen_random_uuid(), v_l3, v_c3, v_user_id, 'NEGOTIATION_STARTED', 'Price & Deliverables Negotiation', 'Client requested complimentary drone aerials for Alibaug.', 'WhatsApp');

END \$\$;

-- ====================================================================
-- PHOTOGRAPHY & WEDDING CLIENT CRM - POST PRODUCTION & FIXES
-- Migration: 00004_post_production_and_rls_fix.sql
-- ====================================================================

-- 1. Extend LEADS table with Post-Production & Client Delivery links
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS post_production_status TEXT DEFAULT 'Raw Footage Backup',
ADD COLUMN IF NOT EXISTS raw_storage_link TEXT,
ADD COLUMN IF NOT EXISTS selection_gallery_link TEXT,
ADD COLUMN IF NOT EXISTS final_video_link TEXT,
ADD COLUMN IF NOT EXISTS gallery_password_pin TEXT;

-- 2. Ensure RLS policies on requirement_options and expense_categories allow reads and writes
ALTER TABLE public.requirement_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view requirement options" ON public.requirement_options;
DROP POLICY IF EXISTS "Allow select on requirement options" ON public.requirement_options;
DROP POLICY IF EXISTS "Allow all on requirement options" ON public.requirement_options;

CREATE POLICY "Allow select on requirement options" ON public.requirement_options
    FOR SELECT USING (true);
CREATE POLICY "Allow all on requirement options" ON public.requirement_options
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow select on expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow all on expense categories" ON public.expense_categories;

CREATE POLICY "Allow select on expense categories" ON public.expense_categories
    FOR SELECT USING (true);
CREATE POLICY "Allow all on expense categories" ON public.expense_categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Populate Default Requirement Options
INSERT INTO public.requirement_options (name, slug, category, sort_order)
VALUES
    ('Traditional Photography', 'traditional_photography', 'Photography', 1),
    ('Traditional Videography', 'traditional_videography', 'Videography', 2),
    ('Candid Photography', 'candid_photography', 'Photography', 3),
    ('Candid Videography', 'candid_videography', 'Videography', 4),
    ('Cinematic Video', 'cinematic_video', 'Videography', 5),
    ('Pre-Wedding Shoot', 'pre_wedding_shoot', 'Events', 6),
    ('Engagement', 'engagement', 'Events', 7),
    ('Thaali Ponnurukku', 'thaali_ponnurukku', 'Events', 8),
    ('Nalangu', 'nalangu', 'Events', 9),
    ('Haldi', 'haldi', 'Events', 10),
    ('Sangeet', 'sangeet', 'Events', 11),
    ('Mehndi', 'mehndi', 'Events', 12),
    ('Thala Kalyanam', 'thala_kalyanam', 'Events', 13),
    ('Wedding Day', 'wedding_day', 'Events', 14),
    ('Maruveedu', 'maruveedu', 'Events', 15),
    ('Reception', 'reception', 'Events', 16),
    ('Maternity', 'maternity', 'Shoots', 17),
    ('Baptism', 'baptism', 'Shoots', 18),
    ('LED Wall', 'led_wall', 'Production', 19),
    ('Live Videographer', 'live_videographer', 'Production', 20),
    ('Album', 'album', 'Deliverables', 21),
    ('Video Editing', 'video_editing', 'Deliverables', 22),
    ('Highlights', 'highlights', 'Deliverables', 23),
    ('Calendar & Pendrive Box', 'calendar_pendrive_box', 'Deliverables', 24),
    ('Frame', 'frame', 'Deliverables', 25),
    ('Other', 'other', 'Custom', 26)
ON CONFLICT (name) DO NOTHING;

-- 4. Populate Default Expense Categories
INSERT INTO public.expense_categories (name, slug, category, sort_order)
VALUES
    ('Pre-Wedding Shoot', 'pre_wedding_shoot', 'Events', 1),
    ('Engagement', 'engagement', 'Events', 2),
    ('Thaali Ponnurukku', 'thaali_ponnurukku', 'Events', 3),
    ('Nalangu', 'nalangu', 'Events', 4),
    ('Haldi, Sangeet, Mehndi', 'haldi_sangeet_mehndi', 'Events', 5),
    ('Thala Kalyanam', 'thala_kalyanam', 'Events', 6),
    ('Wedding Day', 'wedding_day', 'Events', 7),
    ('Maruveedu', 'maruveedu', 'Events', 8),
    ('Nagercoil Reception', 'nagercoil_reception', 'Events', 9),
    ('LED Wall', 'led_wall', 'Production', 10),
    ('Live Videographer', 'live_videographer', 'Production', 11),
    ('Album Printing', 'album_printing', 'Post-Production', 12),
    ('Album Design', 'album_design', 'Post-Production', 13),
    ('Video Editing', 'video_editing', 'Post-Production', 14),
    ('Highlights', 'highlights', 'Post-Production', 15),
    ('Calendar & Pendrive Box', 'calendar_pendrive_box', 'Deliverables', 16),
    ('Frame', 'frame', 'Deliverables', 17),
    ('Office Rent', 'office_rent', 'Overhead', 18),
    ('Assistant Payments', 'assistant_payments', 'Labor', 19),
    ('Petrol', 'petrol', 'Travel', 20),
    ('Other', 'other', 'Custom', 21)
ON CONFLICT (name) DO NOTHING;

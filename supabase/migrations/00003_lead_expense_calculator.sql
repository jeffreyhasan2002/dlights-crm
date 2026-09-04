-- ====================================================================
-- PHOTOGRAPHY & WEDDING CLIENT CRM - LEAD & EXPENSE CALCULATOR ENHANCEMENT
-- Migration: 00003_lead_expense_calculator.sql
-- ====================================================================

-- 1. Extend LEADS table safely
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS other_requirement TEXT,
ADD COLUMN IF NOT EXISTS event_start_time TIME,
ADD COLUMN IF NOT EXISTS event_end_time TIME,
ADD COLUMN IF NOT EXISTS profit_percentage NUMERIC(5, 2) DEFAULT 30.00;

-- 2. Create LEAD_DELIVERABLES Table
CREATE TABLE IF NOT EXISTS public.lead_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Deliverable',
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_lead_deliverables_updated_at
BEFORE UPDATE ON public.lead_deliverables
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Create LEAD_EXPENSES Table
CREATE TABLE IF NOT EXISTS public.lead_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_name TEXT NOT NULL,
    expense_category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_lead_expenses_updated_at
BEFORE UPDATE ON public.lead_expenses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create STANDALONE EXPENSE_CALCULATIONS Table
CREATE TABLE IF NOT EXISTS public.expense_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    client_name TEXT,
    event_type TEXT,
    profit_percentage NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_expense_calculations_updated_at
BEFORE UPDATE ON public.expense_calculations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create EXPENSE_CALCULATION_ITEMS Table
CREATE TABLE IF NOT EXISTS public.expense_calculation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID NOT NULL REFERENCES public.expense_calculations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_name TEXT NOT NULL,
    expense_category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_expense_calculation_items_updated_at
BEFORE UPDATE ON public.expense_calculation_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Create REQUIREMENT_OPTIONS Reference Table
CREATE TABLE IF NOT EXISTS public.requirement_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'General',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create EXPENSE_CATEGORIES Reference Table
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'Shoot',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_lead_deliverables_lead ON public.lead_deliverables(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_deliverables_owner ON public.lead_deliverables(owner_id);

CREATE INDEX IF NOT EXISTS idx_lead_expenses_lead ON public.lead_expenses(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_expenses_owner ON public.lead_expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_lead_expenses_category ON public.lead_expenses(expense_category);

CREATE INDEX IF NOT EXISTS idx_expense_calculations_owner ON public.expense_calculations(owner_id);
CREATE INDEX IF NOT EXISTS idx_expense_calculations_lead ON public.expense_calculations(lead_id);
CREATE INDEX IF NOT EXISTS idx_expense_calculations_created ON public.expense_calculations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expense_calc_items_calc ON public.expense_calculation_items(calculation_id);
CREATE INDEX IF NOT EXISTS idx_expense_calc_items_owner ON public.expense_calculation_items(owner_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.lead_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_calculation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Lead Deliverables Policies
CREATE POLICY "Users can view own lead deliverables" ON public.lead_deliverables
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own lead deliverables" ON public.lead_deliverables
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own lead deliverables" ON public.lead_deliverables
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own lead deliverables" ON public.lead_deliverables
    FOR DELETE USING (auth.uid() = owner_id);

-- Lead Expenses Policies
CREATE POLICY "Users can view own lead expenses" ON public.lead_expenses
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own lead expenses" ON public.lead_expenses
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own lead expenses" ON public.lead_expenses
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own lead expenses" ON public.lead_expenses
    FOR DELETE USING (auth.uid() = owner_id);

-- Standalone Expense Calculations Policies
CREATE POLICY "Users can view own expense calculations" ON public.expense_calculations
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own expense calculations" ON public.expense_calculations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own expense calculations" ON public.expense_calculations
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own expense calculations" ON public.expense_calculations
    FOR DELETE USING (auth.uid() = owner_id);

-- Standalone Expense Calculation Items Policies
CREATE POLICY "Users can view own expense calculation items" ON public.expense_calculation_items
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own expense calculation items" ON public.expense_calculation_items
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own expense calculation items" ON public.expense_calculation_items
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own expense calculation items" ON public.expense_calculation_items
    FOR DELETE USING (auth.uid() = owner_id);

-- Public Reference Catalogs (Selectable by authenticated users)
CREATE POLICY "Authenticated users can view requirement options" ON public.requirement_options
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view expense categories" ON public.expense_categories
    FOR SELECT TO authenticated USING (true);

-- ====================================================================
-- SEED DATA FOR REQUIREMENTS AND EXPENSE CATEGORIES
-- ====================================================================
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

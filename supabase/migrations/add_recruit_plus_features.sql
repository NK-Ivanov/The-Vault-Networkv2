-- Migration: Add Recruit Plus features
-- This adds bookmarking, automation briefs, login days tracking, and Recruit Plus rank support

-- Create automation_bookmarks table
CREATE TABLE IF NOT EXISTS public.automation_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, automation_id)
);

-- Create automation_briefs table (detailed information about automations)
CREATE TABLE IF NOT EXISTS public.automation_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_description TEXT,
  use_cases JSONB, -- Array of use case objects
  features_detail JSONB, -- Detailed feature descriptions
  implementation_timeline TEXT,
  technical_requirements TEXT,
  pricing_details TEXT,
  faq JSONB, -- Array of FAQ objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner_login_days table to track unique login days
CREATE TABLE IF NOT EXISTS public.partner_login_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  login_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, login_date)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_automation_bookmarks_seller ON public.automation_bookmarks(seller_id);
CREATE INDEX IF NOT EXISTS idx_automation_bookmarks_automation ON public.automation_bookmarks(automation_id);
CREATE INDEX IF NOT EXISTS idx_partner_login_days_seller ON public.partner_login_days(seller_id);
CREATE INDEX IF NOT EXISTS idx_partner_login_days_date ON public.partner_login_days(login_date);

-- Enable RLS
ALTER TABLE public.automation_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_login_days ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_bookmarks
CREATE POLICY "Sellers can view their own bookmarks"
  ON public.automation_bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = automation_bookmarks.seller_id
    )
  );

CREATE POLICY "Sellers can create their own bookmarks"
  ON public.automation_bookmarks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = automation_bookmarks.seller_id
    )
  );

CREATE POLICY "Sellers can delete their own bookmarks"
  ON public.automation_bookmarks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = automation_bookmarks.seller_id
    )
  );

-- Admins can manage all bookmarks
CREATE POLICY "Admins can manage all bookmarks"
  ON public.automation_bookmarks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for automation_briefs (public read, admin write)
CREATE POLICY "Anyone can view automation briefs"
  ON public.automation_briefs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage automation briefs"
  ON public.automation_briefs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for partner_login_days
CREATE POLICY "Sellers can view their own login days"
  ON public.partner_login_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_login_days.seller_id
    )
  );

CREATE POLICY "System can insert login days"
  ON public.partner_login_days FOR INSERT
  WITH CHECK (true); -- Will be handled by trigger/function

-- Function to track login day (call this when user logs in)
CREATE OR REPLACE FUNCTION public.track_login_day(_seller_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Insert login day if not already recorded
  INSERT INTO public.partner_login_days (seller_id, login_date)
  VALUES (_seller_id, today)
  ON CONFLICT (seller_id, login_date) DO NOTHING;
END;
$$;

-- Function to get unique login days count
CREATE OR REPLACE FUNCTION public.get_unique_login_days_count(_seller_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT login_date) INTO day_count
  FROM public.partner_login_days
  WHERE seller_id = _seller_id;
  
  RETURN COALESCE(day_count, 0);
END;
$$;

-- Update sellers table to support Recruit Plus rank
-- We'll keep current_rank as TEXT to allow 'Recruit Plus'
-- No schema change needed, just documentation

COMMENT ON TABLE public.automation_bookmarks IS 'Tracks which automations partners have bookmarked';
COMMENT ON TABLE public.automation_briefs IS 'Detailed information about automations for partners to read';
COMMENT ON TABLE public.partner_login_days IS 'Tracks unique login days for each partner';








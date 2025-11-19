-- Create outreach_planner table for planning outreach contacts
CREATE TABLE IF NOT EXISTS public.outreach_planner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  intro_message TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'contacted', 'moved_to_deal_tracker'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.outreach_planner ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outreach_planner
DROP POLICY IF EXISTS "Sellers can view their own outreach contacts" ON public.outreach_planner;
CREATE POLICY "Sellers can view their own outreach contacts"
  ON public.outreach_planner FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = outreach_planner.seller_id
    )
  );

DROP POLICY IF EXISTS "Sellers can insert their own outreach contacts" ON public.outreach_planner;
CREATE POLICY "Sellers can insert their own outreach contacts"
  ON public.outreach_planner FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = outreach_planner.seller_id
    )
  );

DROP POLICY IF EXISTS "Sellers can update their own outreach contacts" ON public.outreach_planner;
CREATE POLICY "Sellers can update their own outreach contacts"
  ON public.outreach_planner FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = outreach_planner.seller_id
    )
  );

DROP POLICY IF EXISTS "Sellers can delete their own outreach contacts" ON public.outreach_planner;
CREATE POLICY "Sellers can delete their own outreach contacts"
  ON public.outreach_planner FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = outreach_planner.seller_id
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_outreach_planner_seller ON public.outreach_planner(seller_id, status);


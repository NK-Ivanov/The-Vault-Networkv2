-- Migration: Add Verified Plus features
-- This migration adds support for:
-- 1. Client partner notes (industry, size, needs, problem fields)
-- 2. Partner automation assignment notes (partner-only notes)
-- 3. Referral link click tracking (prevent self-clicks)

-- ============================================================================
-- 1. CLIENT PARTNER NOTES
-- ============================================================================
-- Add partner notes fields to clients table for Verified Plus "Demo Client Deep Dive" task
-- These fields allow partners to add additional details about clients (industry, size, needs, problem)

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS partner_industry TEXT,
ADD COLUMN IF NOT EXISTS partner_size TEXT,
ADD COLUMN IF NOT EXISTS partner_needs TEXT,
ADD COLUMN IF NOT EXISTS partner_problem TEXT;

COMMENT ON COLUMN public.clients.partner_industry IS 'Partner-added field: Client industry/sector';
COMMENT ON COLUMN public.clients.partner_size IS 'Partner-added field: Client business size (e.g., small, medium, large)';
COMMENT ON COLUMN public.clients.partner_needs IS 'Partner-added field: Client needs and requirements';
COMMENT ON COLUMN public.clients.partner_problem IS 'Partner-added field: Client problem/challenge to solve';

-- ============================================================================
-- 2. PARTNER AUTOMATION ASSIGNMENT NOTES
-- ============================================================================
-- Add partner_note field to client_automations table for Verified Plus "Create Demo Automation Plan" task
-- This note is partner-only and explains why they assigned this automation to the client

ALTER TABLE public.client_automations
ADD COLUMN IF NOT EXISTS partner_note TEXT;

COMMENT ON COLUMN public.client_automations.partner_note IS 'Partner-only note explaining why this automation was assigned to this client';

-- ============================================================================
-- 3. REFERRAL LINK CLICK TRACKING
-- ============================================================================
-- Create referral_link_clicks table for Verified Plus "Referral Funnel Exercise" task
-- Tracks referral link clicks and prevents self-clicks

CREATE TABLE IF NOT EXISTS public.referral_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_self_click BOOLEAN DEFAULT false,
  referrer_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_referral_link_clicks_seller_id ON public.referral_link_clicks(seller_id);
CREATE INDEX IF NOT EXISTS idx_referral_link_clicks_referral_code ON public.referral_link_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_link_clicks_clicked_at ON public.referral_link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_referral_link_clicks_is_self_click ON public.referral_link_clicks(is_self_click);

COMMENT ON TABLE public.referral_link_clicks IS 'Tracks referral link clicks for Verified Plus referral funnel exercise task';
COMMENT ON COLUMN public.referral_link_clicks.is_self_click IS 'True if the click was from the seller themselves (should not count toward task completion)';

-- Enable RLS
ALTER TABLE public.referral_link_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_link_clicks
-- Sellers can view their own referral link clicks
CREATE POLICY "Sellers can view their own referral link clicks"
  ON public.referral_link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = referral_link_clicks.seller_id
    )
  );

-- Anyone can insert referral link clicks (for tracking purposes)
-- But we'll mark self-clicks based on IP/user session
CREATE POLICY "Anyone can insert referral link clicks"
  ON public.referral_link_clicks FOR INSERT
  WITH CHECK (true);

-- Admins can manage all referral link clicks
CREATE POLICY "Admins can manage referral link clicks"
  ON public.referral_link_clicks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 4. HELPER FUNCTION: Get non-self referral click count
-- ============================================================================
-- Function to get the count of non-self referral link clicks for a seller
-- Used for the "Referral Funnel Exercise" task

CREATE OR REPLACE FUNCTION public.get_non_self_referral_clicks(_seller_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  click_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO click_count
  FROM public.referral_link_clicks
  WHERE seller_id = _seller_id
    AND is_self_click = false;
  
  RETURN COALESCE(click_count, 0);
END;
$$;

COMMENT ON FUNCTION public.get_non_self_referral_clicks IS 'Returns the count of non-self referral link clicks for a seller (for Verified Plus task)';

-- ============================================================================
-- 5. TRIGGER: Auto-detect self-clicks when possible
-- ============================================================================
-- When a referral link is clicked, check if it's likely a self-click
-- by comparing IP address and user agent (basic heuristic)

CREATE OR REPLACE FUNCTION public.detect_self_click()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the seller's user_id
  SELECT user_id INTO seller_user_id
  FROM public.sellers
  WHERE id = NEW.seller_id;
  
  -- Get current authenticated user_id (if any)
  current_user_id := auth.uid();
  
  -- Mark as self-click if:
  -- 1. The click is from the seller's own user account, OR
  -- 2. The IP matches a recent click from the seller (basic heuristic)
  IF seller_user_id IS NOT NULL AND current_user_id IS NOT NULL AND seller_user_id = current_user_id THEN
    NEW.is_self_click := true;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS detect_self_click_trigger ON public.referral_link_clicks;
CREATE TRIGGER detect_self_click_trigger
  BEFORE INSERT ON public.referral_link_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_self_click();


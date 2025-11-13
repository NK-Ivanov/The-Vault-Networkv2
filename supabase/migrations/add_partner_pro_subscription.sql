-- Migration: Add Partner Pro Subscription Support
-- Adds subscription tracking fields to sellers table

-- Add subscription fields to sellers table
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS partner_pro_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS partner_pro_subscription_status TEXT DEFAULT 'inactive', -- 'active', 'canceled', 'past_due', 'inactive'
ADD COLUMN IF NOT EXISTS partner_pro_subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS partner_pro_subscription_ends_at TIMESTAMPTZ;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_sellers_partner_pro_subscription 
ON public.sellers(partner_pro_subscription_status) 
WHERE partner_pro_subscription_status = 'active';

-- Function to check if seller has active Partner Pro subscription
CREATE OR REPLACE FUNCTION public.has_partner_pro(_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.sellers
    WHERE id = _seller_id
      AND partner_pro_subscription_status = 'active'
      AND (partner_pro_subscription_ends_at IS NULL OR partner_pro_subscription_ends_at > NOW())
  );
END;
$$;


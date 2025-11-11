-- Migration: Add Stripe integration columns to automations table
-- This adds Stripe Product and Price IDs for payment processing

-- Add Stripe-related columns to automations table
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_setup_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_monthly_price_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_automations_stripe_product_id ON public.automations(stripe_product_id);

-- Add comment for documentation
COMMENT ON COLUMN public.automations.stripe_product_id IS 'Stripe Product ID - created when automation is synced with Stripe';
COMMENT ON COLUMN public.automations.stripe_setup_price_id IS 'Stripe Price ID for one-time setup fee';
COMMENT ON COLUMN public.automations.stripe_monthly_price_id IS 'Stripe Price ID for recurring monthly subscription';


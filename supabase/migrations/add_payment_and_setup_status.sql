-- Migration: Add payment and setup status tracking to client_automations
-- This allows tracking payment status and setup progress

-- Add payment_status column (tracks if client has paid)
ALTER TABLE public.client_automations 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'; -- unpaid, paid

-- Add setup_status column (tracks setup progress)
ALTER TABLE public.client_automations 
ADD COLUMN IF NOT EXISTS setup_status TEXT NOT NULL DEFAULT 'pending_setup'; -- pending_setup, setup_in_progress, active

-- Add stripe_checkout_session_id for tracking
ALTER TABLE public.client_automations 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Add stripe_subscription_id for recurring payments
ALTER TABLE public.client_automations 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add paid_at timestamp
ALTER TABLE public.client_automations 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_client_automations_payment_status ON public.client_automations(payment_status);
CREATE INDEX IF NOT EXISTS idx_client_automations_setup_status ON public.client_automations(setup_status);
CREATE INDEX IF NOT EXISTS idx_client_automations_stripe_session ON public.client_automations(stripe_checkout_session_id);

-- Add comments for documentation
COMMENT ON COLUMN public.client_automations.payment_status IS 'Payment status: unpaid or paid';
COMMENT ON COLUMN public.client_automations.setup_status IS 'Setup status: pending_setup, setup_in_progress, or active';
COMMENT ON COLUMN public.client_automations.stripe_checkout_session_id IS 'Stripe checkout session ID for tracking payments';
COMMENT ON COLUMN public.client_automations.stripe_subscription_id IS 'Stripe subscription ID for recurring monthly payments';


-- Migration: Add commission rates and referral code management
-- This adds:
-- 1. Default commission rate per automation
-- 2. Commission rate override per seller-automation
-- 3. Allow sellers to set their own referral codes
-- 4. Prevent seller_id updates for existing clients (lock referral)

-- Add default commission rate to automations table
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS default_commission_rate DECIMAL(5,2) DEFAULT 20.00;

-- Add commission rate override to seller_automations table
ALTER TABLE public.seller_automations 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);

-- Create function to prevent seller_id updates for existing clients
CREATE OR REPLACE FUNCTION public.prevent_seller_id_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If seller_id is being changed and it was previously set, prevent the update
  IF OLD.seller_id IS NOT NULL AND NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'Cannot change seller_id for existing client. Referral is locked.';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce seller_id lock
DROP TRIGGER IF EXISTS lock_seller_id ON public.clients;
CREATE TRIGGER lock_seller_id
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_seller_id_update();

-- Create function to check referral code uniqueness
CREATE OR REPLACE FUNCTION public.check_referral_code_unique()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.sellers 
      WHERE referral_code = NEW.referral_code 
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Referral code already exists';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce referral code uniqueness
DROP TRIGGER IF EXISTS enforce_referral_code_unique ON public.sellers;
CREATE TRIGGER enforce_referral_code_unique
  BEFORE INSERT OR UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_code_unique();

-- Update seller_automations to use commission_rate from automation if not set
CREATE OR REPLACE FUNCTION public.set_seller_automation_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.commission_rate IS NULL THEN
    SELECT default_commission_rate INTO NEW.commission_rate
    FROM public.automations
    WHERE id = NEW.automation_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to set default commission rate
DROP TRIGGER IF EXISTS set_default_commission ON public.seller_automations;
CREATE TRIGGER set_default_commission
  BEFORE INSERT ON public.seller_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_seller_automation_commission();


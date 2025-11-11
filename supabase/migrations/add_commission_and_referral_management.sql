-- Migration: Add commission rates and referral code management
-- This adds:
-- 1. Default commission rate per automation
-- 2. Commission rate override per seller-automation
-- 3. Allow sellers to set their own referral codes
-- 4. Prevent seller_id updates for existing clients (lock referral)
-- 5. Add invited_by_code column to clients table to track referral codes used
--
-- NOTE: This migration assumes the base tables exist. Run the base migration first if you get errors.

-- Add default commission rate to automations table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automations') THEN
    ALTER TABLE public.automations 
    ADD COLUMN IF NOT EXISTS default_commission_rate DECIMAL(5,2) DEFAULT 20.00;
  END IF;
END $$;

-- Add commission rate override to seller_automations table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seller_automations') THEN
    ALTER TABLE public.seller_automations 
    ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);
  END IF;
END $$;

-- Add invited_by_code column to clients table to track referral codes (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE public.clients 
    ADD COLUMN IF NOT EXISTS invited_by_code TEXT;
  END IF;
END $$;

-- Create function to prevent seller_id updates for existing clients
-- Only create if clients table exists
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

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    -- Create trigger to enforce seller_id lock
    DROP TRIGGER IF EXISTS lock_seller_id ON public.clients;
    CREATE TRIGGER lock_seller_id
      BEFORE UPDATE ON public.clients
      FOR EACH ROW
      EXECUTE FUNCTION public.prevent_seller_id_update();
  END IF;
END $$;

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

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sellers') THEN
    -- Create trigger to enforce referral code uniqueness
    DROP TRIGGER IF EXISTS enforce_referral_code_unique ON public.sellers;
    CREATE TRIGGER enforce_referral_code_unique
      BEFORE INSERT OR UPDATE ON public.sellers
      FOR EACH ROW
      EXECUTE FUNCTION public.check_referral_code_unique();
  END IF;
END $$;

-- Update seller_automations to use commission_rate from automation if not set
-- Only create function if automations table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automations') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.set_seller_automation_commission()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $func$
    BEGIN
      IF NEW.commission_rate IS NULL THEN
        SELECT default_commission_rate INTO NEW.commission_rate
        FROM public.automations
        WHERE id = NEW.automation_id;
      END IF;
      RETURN NEW;
    END;
    $func$;';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seller_automations')
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automations') THEN
    -- Create trigger to set default commission rate
    DROP TRIGGER IF EXISTS set_default_commission ON public.seller_automations;
    CREATE TRIGGER set_default_commission
      BEFORE INSERT ON public.seller_automations
      FOR EACH ROW
      EXECUTE FUNCTION public.set_seller_automation_commission();
  END IF;
END $$;


-- Migration: Enhanced Commission System
-- This implements the full commission system with:
-- 1. Default commission per automation
-- 2. Custom commission per seller (overrides all automation defaults)
-- 3. Commission calculation function
-- 4. Transaction fields for commission tracking

-- Add fields to transactions table for commission tracking
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    -- Add commission_rate_used to track which rate was applied
    ALTER TABLE public.transactions 
    ADD COLUMN IF NOT EXISTS commission_rate_used DECIMAL(5,2);
    
    -- Add vault_share to track Vault's portion
    ALTER TABLE public.transactions 
    ADD COLUMN IF NOT EXISTS vault_share DECIMAL(10,2) DEFAULT 0.00;
    
    -- Add seller_earnings to track seller's portion (same as commission, but clearer naming)
    ALTER TABLE public.transactions 
    ADD COLUMN IF NOT EXISTS seller_earnings DECIMAL(10,2) DEFAULT 0.00;
  END IF;
END $$;

-- Create function to calculate commission for a sale
CREATE OR REPLACE FUNCTION public.calculate_commission(
  p_seller_id UUID,
  p_automation_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE (
  commission_rate DECIMAL(5,2),
  seller_earnings DECIMAL(10,2),
  vault_share DECIMAL(10,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_rate DECIMAL(5,2);
  v_automation_rate DECIMAL(5,2);
  v_final_rate DECIMAL(5,2);
  v_seller_earnings DECIMAL(10,2);
  v_vault_share DECIMAL(10,2);
BEGIN
  -- If no seller (Vault Network direct sale), no commission
  IF p_seller_id IS NULL THEN
    RETURN QUERY SELECT 
      0.00::DECIMAL(5,2) as commission_rate,
      0.00::DECIMAL(10,2) as seller_earnings,
      p_amount::DECIMAL(10,2) as vault_share;
    RETURN;
  END IF;

  -- Check if seller has a custom commission rate (overrides all automation defaults)
  SELECT s.commission_rate INTO v_seller_rate
  FROM public.sellers s
  WHERE s.id = p_seller_id;

  -- If seller has custom rate, use it (NULL means use automation default)
  IF v_seller_rate IS NOT NULL THEN
    v_final_rate := v_seller_rate;
  ELSE
    -- Get automation's default commission rate
    SELECT COALESCE(a.default_commission_rate, 20.00) INTO v_automation_rate
    FROM public.automations a
    WHERE a.id = p_automation_id;
    
    v_final_rate := v_automation_rate;
  END IF;

  -- Calculate earnings
  v_seller_earnings := (p_amount * v_final_rate / 100.00);
  v_vault_share := p_amount - v_seller_earnings;

  RETURN QUERY SELECT 
    v_final_rate as commission_rate,
    v_seller_earnings as seller_earnings,
    v_vault_share as vault_share;
END;
$$;

-- Create function to update seller totals when transaction is created
CREATE OR REPLACE FUNCTION public.update_seller_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_earnings DECIMAL(10,2);
BEGIN
  -- Only update if transaction is completed and has seller_id
  IF NEW.status = 'completed' AND NEW.seller_id IS NOT NULL THEN
    -- Determine seller earnings (prefer seller_earnings, fallback to commission)
    v_seller_earnings := COALESCE(NEW.seller_earnings, NEW.commission, 0);
    
    -- Update seller's total_sales and total_commission
    UPDATE public.sellers
    SET 
      total_sales = COALESCE(total_sales, 0) + COALESCE(NEW.amount, 0),
      total_commission = COALESCE(total_commission, 0) + v_seller_earnings,
      updated_at = NOW()
    WHERE id = NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update seller totals
DROP TRIGGER IF EXISTS update_seller_totals_trigger ON public.transactions;
CREATE TRIGGER update_seller_totals_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.seller_id IS NOT NULL)
  EXECUTE FUNCTION public.update_seller_totals();

-- Verify the function works
-- Example: SELECT * FROM public.calculate_commission('seller_id', 'automation_id', 100.00);


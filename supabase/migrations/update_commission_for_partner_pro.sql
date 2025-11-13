-- Migration: Update Commission System for Partner Pro
-- Partner Pro subscribers get 45% commission regardless of rank

-- Update calculate_commission function to check for Partner Pro subscription
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
  v_has_partner_pro BOOLEAN;
BEGIN
  -- If no seller (Vault Network direct sale), no commission
  IF p_seller_id IS NULL THEN
    RETURN QUERY SELECT 
      0.00::DECIMAL(5,2) as commission_rate,
      0.00::DECIMAL(10,2) as seller_earnings,
      p_amount::DECIMAL(10,2) as vault_share;
    RETURN;
  END IF;

  -- Check if seller has Partner Pro subscription (active)
  SELECT (partner_pro_subscription_status = 'active') INTO v_has_partner_pro
  FROM public.sellers
  WHERE id = p_seller_id;

  -- If Partner Pro is active, use 45% commission
  IF v_has_partner_pro THEN
    v_final_rate := 45.00;
  ELSE
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


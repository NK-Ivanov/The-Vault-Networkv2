-- Trigger: Automatically assign new automations to The Vault Network seller
-- This ensures that whenever a new automation is created, it's automatically
-- available to The Vault Network seller for assignment to clients

CREATE OR REPLACE FUNCTION public.auto_assign_automation_to_vault_network()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vault_seller_id UUID;
BEGIN
  -- Find The Vault Network seller
  SELECT id INTO vault_seller_id
  FROM public.sellers
  WHERE referral_code = 'VAULT-NETWORK'
  LIMIT 1;

  -- If Vault Network seller exists and automation is active, assign it
  IF vault_seller_id IS NOT NULL AND NEW.is_active = true THEN
    INSERT INTO public.seller_automations (seller_id, automation_id)
    VALUES (vault_seller_id, NEW.id)
    ON CONFLICT (seller_id, automation_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on automations table
DROP TRIGGER IF EXISTS auto_assign_to_vault_network ON public.automations;
CREATE TRIGGER auto_assign_to_vault_network
  AFTER INSERT ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_automation_to_vault_network();

-- Also trigger when automation is updated to active
CREATE OR REPLACE FUNCTION public.auto_assign_active_automation_to_vault_network()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vault_seller_id UUID;
BEGIN
  -- Find The Vault Network seller
  SELECT id INTO vault_seller_id
  FROM public.sellers
  WHERE referral_code = 'VAULT-NETWORK'
  LIMIT 1;

  -- If Vault Network seller exists and automation was just activated, assign it
  IF vault_seller_id IS NOT NULL AND NEW.is_active = true AND (OLD.is_active = false OR OLD IS NULL) THEN
    INSERT INTO public.seller_automations (seller_id, automation_id)
    VALUES (vault_seller_id, NEW.id)
    ON CONFLICT (seller_id, automation_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for updates
DROP TRIGGER IF EXISTS auto_assign_active_to_vault_network ON public.automations;
CREATE TRIGGER auto_assign_active_to_vault_network
  AFTER UPDATE ON public.automations
  FOR EACH ROW
  WHEN (NEW.is_active = true AND (OLD.is_active = false OR OLD IS NULL))
  EXECUTE FUNCTION public.auto_assign_active_automation_to_vault_network();

-- Verify triggers were created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%vault_network%'
ORDER BY trigger_name;


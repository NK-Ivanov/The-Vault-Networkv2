-- Remove Weekly XP Cap Logic
-- This migration removes weekly XP cap checks from the add_seller_xp function
-- Weekly XP tracking columns remain in the database but are no longer enforced

-- Drop and recreate the function to remove weekly XP cap checks
-- Note: weekly_xp column remains in sellers table but will not be enforced
DROP FUNCTION IF EXISTS public.add_seller_xp(UUID, INTEGER, TEXT, TEXT, JSONB);

CREATE FUNCTION public.add_seller_xp(
  _seller_id UUID,
  _xp_amount INTEGER,
  _event_type TEXT,
  _description TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp INTEGER;
  current_rank_val TEXT;
  final_xp_amount INTEGER;
  xp_multiplier DECIMAL(3,2);
  global_multiplier DECIMAL(3,2);
  lesson_id_val TEXT;
  locked_lesson_id UUID;
BEGIN
  -- Extract lesson_id from metadata for tracking
  lesson_id_val := COALESCE(_metadata->>'lesson_id', NULL);
  
  -- Get global XP multiplier from vault_settings
  SELECT COALESCE((setting_value->>'multiplier')::DECIMAL(3,2), 1.0) INTO global_multiplier
  FROM public.vault_settings
  WHERE setting_key = 'xp_multiplier'
  LIMIT 1;
  
  -- Get XP multiplier based on lesson/event type
  xp_multiplier := public.get_xp_multiplier(_seller_id, _event_type, 7, _metadata);
  
  -- Calculate final XP amount
  final_xp_amount := ROUND(_xp_amount * xp_multiplier * global_multiplier)::INTEGER;
  
  -- Admin grants bypass multipliers and always give full XP
  IF _event_type = 'admin_grant' THEN
    final_xp_amount := _xp_amount;
  END IF;
  
  -- Get current rank and locked status BEFORE updating XP
  SELECT current_rank, locked_until_lesson_id INTO current_rank_val, locked_lesson_id
  FROM public.sellers
  WHERE id = _seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller not found';
  END IF;

  -- Check if seller is locked
  IF locked_lesson_id IS NOT NULL THEN
    -- If this is not the locked lesson, prevent XP earning
    IF lesson_id_val IS NULL OR lesson_id_val::UUID != locked_lesson_id THEN
      RAISE EXCEPTION 'Seller is locked until lesson % is completed', locked_lesson_id;
    END IF;
    
    -- If this is the locked lesson, unlock the seller
    UPDATE public.sellers
    SET locked_until_lesson_id = NULL
    WHERE id = _seller_id;
  END IF;

  -- Update seller XP (weekly_xp is tracked but not enforced - no cap check)
  IF _event_type = 'admin_grant' THEN
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp INTO new_xp;
  ELSE
    -- Update XP without weekly cap check (weekly_xp still tracked for reference)
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount,
        weekly_xp = COALESCE(weekly_xp, 0) + final_xp_amount,
        season_xp = COALESCE(season_xp, 0) + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp INTO new_xp;
  END IF;

  -- DISABLED: Auto-ranking is still disabled (from previous migration)
  -- Ranking up must be done manually through the manual_rank_up function

  -- Log the activity (always log, even for admin grants)
  INSERT INTO public.partner_activity_log (
    seller_id,
    event_type,
    xp_value,
    description,
    metadata
  ) VALUES (
    _seller_id,
    _event_type,
    final_xp_amount,
    _description,
    _metadata
  );

  RETURN new_xp;
END;
$$;

-- Drop the check_weekly_xp_cap function as it's no longer needed
DROP FUNCTION IF EXISTS public.check_weekly_xp_cap(UUID, INTEGER);

-- Drop the reset_weekly_xp function as it's no longer needed
DROP FUNCTION IF EXISTS public.reset_weekly_xp();


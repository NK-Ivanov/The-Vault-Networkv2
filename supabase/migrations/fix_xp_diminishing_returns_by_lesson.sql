-- Migration: Fix XP diminishing returns to be per-lesson instead of per-event-type
-- This ensures that completing different lessons doesn't trigger diminishing returns
-- Diminishing returns should only apply when repeating the SAME lesson

-- Updated function to calculate diminishing returns multiplier based on lesson_id
CREATE OR REPLACE FUNCTION public.get_xp_multiplier(
  _seller_id UUID,
  _event_type TEXT,
  _days_lookback INTEGER DEFAULT 7,
  _metadata JSONB DEFAULT NULL
)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  repetition_count INTEGER;
  lesson_id_val TEXT;
BEGIN
  -- Extract lesson_id from metadata if available (as TEXT to support both UUID and string IDs)
  lesson_id_val := _metadata->>'lesson_id';
  
  -- If we have a lesson_id, check repetitions for that specific lesson
  -- Otherwise, fall back to event_type checking (for non-lesson activities)
  IF lesson_id_val IS NOT NULL AND lesson_id_val != '' THEN
    -- Count how many times THIS SPECIFIC LESSON was completed in the last N days
    SELECT COUNT(*) INTO repetition_count
    FROM public.partner_activity_log
    WHERE seller_id = _seller_id
      AND metadata->>'lesson_id' = lesson_id_val
      AND created_at >= NOW() - (_days_lookback || ' days')::INTERVAL;
  ELSE
    -- For non-lesson activities (like login streaks, referrals, etc.), use event_type
    SELECT COUNT(*) INTO repetition_count
    FROM public.partner_activity_log
    WHERE seller_id = _seller_id
      AND event_type = _event_type
      AND created_at >= NOW() - (_days_lookback || ' days')::INTERVAL;
  END IF;

  -- Apply diminishing returns
  CASE
    WHEN repetition_count = 0 THEN RETURN 1.00; -- 100% (first time)
    WHEN repetition_count <= 2 THEN RETURN 0.75; -- 75% (2nd-3rd time)
    WHEN repetition_count <= 4 THEN RETURN 0.50; -- 50% (4th-5th time)
    ELSE RETURN 0.25; -- 25% (6+ times)
  END CASE;
END;
$$;

-- Update add_seller_xp function to pass metadata to get_xp_multiplier
CREATE OR REPLACE FUNCTION public.add_seller_xp(
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
  new_rank_val TEXT;
  final_xp_amount INTEGER;
  xp_multiplier DECIMAL(3,2);
  global_multiplier DECIMAL(3,2);
  locked_lesson_id UUID;
BEGIN
  -- Check if seller is locked until completing a lesson
  SELECT locked_until_lesson_id INTO locked_lesson_id
  FROM public.sellers
  WHERE id = _seller_id;

  IF locked_lesson_id IS NOT NULL THEN
    -- Check if lesson is completed
    IF NOT EXISTS (
      SELECT 1 FROM public.partner_quiz_results
      WHERE seller_id = _seller_id
        AND lesson_id = locked_lesson_id
    ) THEN
      RAISE NOTICE 'XP locked until lesson % is completed', locked_lesson_id;
      RETURN (SELECT current_xp FROM public.sellers WHERE id = _seller_id);
    END IF;
  END IF;

  -- Weekly XP cap removed - users can earn unlimited XP

  -- Get global XP multiplier from vault_settings
  SELECT COALESCE((setting_value->>'multiplier')::DECIMAL(3,2), 1.0) INTO global_multiplier
  FROM public.vault_settings
  WHERE setting_key = 'xp_multiplier'
  LIMIT 1;

  -- Get diminishing returns multiplier (bypass for admin grants)
  IF _event_type = 'admin_grant' THEN
    xp_multiplier := 1.00; -- Admin grants always give 100% XP
  ELSE
    xp_multiplier := public.get_xp_multiplier(_seller_id, _event_type, 7, _metadata);
  END IF;

  -- Calculate final XP amount
  final_xp_amount := ROUND(_xp_amount * xp_multiplier * global_multiplier);

  -- Update seller XP (admin grants don't count towards weekly XP)
  IF _event_type = 'admin_grant' THEN
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount,
        season_xp = season_xp + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp, current_rank INTO new_xp, current_rank_val;
  ELSE
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount,
        weekly_xp = weekly_xp + final_xp_amount,
        season_xp = season_xp + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp, current_rank INTO new_xp, current_rank_val;
  END IF;

  -- Log the activity
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

  -- Check for rank up
  new_rank_val := public.calculate_seller_rank(new_xp);
  
  IF new_rank_val != current_rank_val THEN
    -- Rank up!
    UPDATE public.sellers
    SET current_rank = new_rank_val,
        commission_rate = public.get_rank_commission_rate(new_rank_val),
        highest_rank = CASE 
          WHEN new_rank_val > highest_rank THEN new_rank_val 
          ELSE highest_rank 
        END
    WHERE id = _seller_id;

    -- Log rank up
    INSERT INTO public.partner_activity_log (
      seller_id,
      event_type,
      xp_value,
      description,
      metadata
    ) VALUES (
      _seller_id,
      'rank_up',
      0,
      'Ranked up to ' || new_rank_val,
      jsonb_build_object('old_rank', current_rank_val, 'new_rank', new_rank_val)
    );

    -- Post to community feed
    INSERT INTO public.community_feed (
      event_type,
      seller_id,
      title,
      description,
      metadata
    ) VALUES (
      'rank_up',
      _seller_id,
      (SELECT business_name FROM public.sellers WHERE id = _seller_id) || ' reached ' || new_rank_val,
      'Congratulations on ranking up!',
      jsonb_build_object('old_rank', current_rank_val, 'new_rank', new_rank_val)
    );
  END IF;

  RETURN new_xp;
END;
$$;

-- Helper function to reset weekly XP for a specific seller (useful for testing/admin)
CREATE OR REPLACE FUNCTION public.reset_seller_weekly_xp(_seller_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sellers
  SET weekly_xp = 0,
      last_weekly_reset = NOW()
  WHERE id = _seller_id;
END;
$$;


-- Migration: Add New XP System with Tiers, Daily Caps, and Overflow Queue
-- This implements the complete new XP system with daily caps, overflow queue, and tier tracking

-- Add new fields to sellers table for tier tracking and overflow queue
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS tier_entered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS overflow_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_xp_applied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_xp_date DATE;

-- Set tier_entered_at for existing users based on their current rank
UPDATE public.sellers
SET 
  tier = CASE 
    WHEN current_rank IN ('Recruit', 'Recruit Plus') THEN 1
    WHEN current_rank IN ('Apprentice', 'Apprentice Plus') THEN 2
    WHEN current_rank IN ('Agent', 'Agent Plus') THEN 3
    WHEN current_rank IN ('Verified', 'Verified Plus') THEN 4
    WHEN current_rank IN ('Partner', 'Partner Plus') THEN 5
    ELSE 1
  END,
  tier_entered_at = COALESCE(tier_entered_at, NOW())
WHERE tier_entered_at IS NULL;

-- Helper function to get tier from rank
CREATE OR REPLACE FUNCTION public.get_tier_from_rank(_rank TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN _rank IN ('Recruit', 'Recruit Plus') THEN 1
    WHEN _rank IN ('Apprentice', 'Apprentice Plus') THEN 2
    WHEN _rank IN ('Agent', 'Agent Plus') THEN 3
    WHEN _rank IN ('Verified', 'Verified Plus') THEN 4
    WHEN _rank IN ('Partner', 'Partner Plus') THEN 5
    ELSE 1
  END;
END;
$$;

-- Helper function to get daily XP cap for a tier
-- Helper function to get daily XP cap for a tier
CREATE OR REPLACE FUNCTION public.get_daily_xp_cap(_tier INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Tier 1 and 2 have no caps (return NULL)
  -- XP caps start at Agent (Tier 3)
  RETURN CASE 
    WHEN _tier = 1 THEN NULL  -- Recruit, Recruit Plus - No cap
    WHEN _tier = 2 THEN NULL  -- Apprentice, Apprentice Plus - No cap
    WHEN _tier = 3 THEN 200   -- Agent, Agent Plus - 200 XP/day
    WHEN _tier = 4 THEN 300   -- Verified, Verified Plus - 300 XP/day
    WHEN _tier = 5 THEN 400   -- Partner, Partner Plus - 400 XP/day
    ELSE NULL
  END;
END;
$$;

-- Helper function to get minimum days in tier
CREATE OR REPLACE FUNCTION public.get_min_days_in_tier(_tier INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN _tier = 1 THEN 1
    WHEN _tier = 2 THEN 3
    WHEN _tier = 3 THEN 5
    WHEN _tier = 4 THEN 10
    WHEN _tier = 5 THEN 14
    ELSE 1
  END;
END;
$$;

-- Helper function to check if new day has started (for XP reset)
CREATE OR REPLACE FUNCTION public.is_new_xp_day(_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  last_date DATE;
  today_date DATE := CURRENT_DATE;
BEGIN
  SELECT last_xp_date INTO last_date
  FROM public.sellers
  WHERE id = _seller_id;
  
  -- If no last_xp_date or it's a different day, it's a new day
  RETURN last_date IS NULL OR last_date < today_date;
END;
$$;

-- Function to drain overflow XP at start of new day
-- This function applies overflow XP up to the daily cap, only once per day
CREATE OR REPLACE FUNCTION public.drain_overflow_xp(_seller_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  overflow_amount INTEGER;
  daily_cap INTEGER;
  current_tier INTEGER;
  xp_to_apply INTEGER;
  remaining_overflow INTEGER;
  last_xp_date_val DATE;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get overflow, tier, and last_xp_date
  SELECT overflow_xp, tier, last_xp_date INTO overflow_amount, current_tier, last_xp_date_val
  FROM public.sellers
  WHERE id = _seller_id;
  
  -- Check if overflow exists and if it's a new day
  IF overflow_amount IS NULL OR overflow_amount <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Only apply overflow if it's a new day (or last_xp_date is NULL)
  -- If last_xp_date is today, overflow was already applied today
  IF last_xp_date_val IS NOT NULL AND last_xp_date_val = today_date THEN
    -- Overflow already applied today, don't apply again
    RETURN 0;
  END IF;
  
  -- Get daily cap for current tier
  daily_cap := public.get_daily_xp_cap(current_tier);
  
  -- If no cap (Tier 1 or 2), don't apply overflow (overflow shouldn't exist for these tiers)
  IF daily_cap IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate how much overflow we can apply today (up to daily cap)
  xp_to_apply := LEAST(overflow_amount, daily_cap);
  remaining_overflow := overflow_amount - xp_to_apply;
  
  -- Update seller with applied XP and remaining overflow
  -- Set daily_xp_applied to xp_to_apply (overflow XP counts toward daily cap)
  -- Set last_xp_date to today to prevent re-applying overflow
  UPDATE public.sellers
  SET 
    current_xp = current_xp + xp_to_apply,
    overflow_xp = remaining_overflow,
    daily_xp_applied = xp_to_apply,
    last_xp_date = today_date
  WHERE id = _seller_id;
  
  RETURN xp_to_apply;
END;
$$;

-- Update add_seller_xp function with daily caps and overflow queue
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
  current_tier_val INTEGER;
  final_xp_amount INTEGER;
  xp_multiplier DECIMAL(3,2);
  global_multiplier DECIMAL(3,2);
  lesson_id_val TEXT;
  locked_lesson_id UUID;
  daily_cap_val INTEGER;
  current_daily_applied INTEGER;
  xp_to_apply_today INTEGER;
  xp_to_overflow INTEGER;
  today_date DATE := CURRENT_DATE;
  last_xp_day DATE;
  is_new_day BOOLEAN;
BEGIN
  -- Extract lesson_id from metadata for tracking
  lesson_id_val := COALESCE(_metadata->>'lesson_id', NULL);
  
  -- Get global XP multiplier from vault_settings
  SELECT COALESCE((setting_value->>'multiplier')::DECIMAL(3,2), 1.0) INTO global_multiplier
  FROM public.vault_settings
  WHERE setting_key = 'xp_multiplier'
  LIMIT 1;
  
  -- Get XP multiplier based on lesson/event type (diminishing returns)
  xp_multiplier := public.get_xp_multiplier(_seller_id, _event_type, 7, _metadata);
  
  -- Calculate final XP amount (after diminishing returns)
  final_xp_amount := ROUND(_xp_amount * xp_multiplier * global_multiplier)::INTEGER;
  
  -- Admin grants bypass multipliers, caps, and overflow
  IF _event_type = 'admin_grant' THEN
    final_xp_amount := _xp_amount;
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp INTO new_xp;
    
    -- Log activity
    INSERT INTO public.partner_activity_log (
      seller_id, event_type, xp_value, description, metadata
    ) VALUES (
      _seller_id, _event_type, final_xp_amount, _description, _metadata
    );
    
    RETURN new_xp;
  END IF;
  
  -- Get seller data: rank, tier, locked status, daily tracking
  SELECT 
    current_rank, tier, locked_until_lesson_id, 
    daily_xp_applied, last_xp_date
  INTO 
    current_rank_val, current_tier_val, locked_lesson_id,
    current_daily_applied, last_xp_day
  FROM public.sellers
  WHERE id = _seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller not found';
  END IF;

  -- Check if it's a new day
  is_new_day := last_xp_day IS NULL OR last_xp_day < today_date;

  -- If new day, drain overflow first and reset daily counter
  IF is_new_day THEN
    PERFORM public.drain_overflow_xp(_seller_id);
    current_daily_applied := 0;
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

  -- Get daily cap for current tier
  daily_cap_val := public.get_daily_xp_cap(current_tier_val);
  
  -- If no cap (Tier 1 or 2), apply all XP instantly (no overflow)
  IF daily_cap_val IS NULL THEN
    xp_to_apply_today := final_xp_amount;
    xp_to_overflow := 0;
  ELSE
    -- Calculate how much XP can be applied today (respecting daily cap)
    xp_to_apply_today := LEAST(final_xp_amount, daily_cap_val - current_daily_applied);
    xp_to_overflow := final_xp_amount - xp_to_apply_today;
    
    -- Ensure we don't apply negative XP
    IF xp_to_apply_today < 0 THEN
      xp_to_apply_today := 0;
    END IF;
  END IF;

  -- Update seller XP: apply what we can today, add rest to overflow (only if cap exists)
  UPDATE public.sellers
  SET 
    current_xp = current_xp + xp_to_apply_today,
    overflow_xp = CASE WHEN daily_cap_val IS NULL THEN 0 ELSE overflow_xp + xp_to_overflow END,
    daily_xp_applied = CASE WHEN daily_cap_val IS NULL THEN 0 ELSE current_daily_applied + xp_to_apply_today END,
    last_xp_date = today_date,
    -- Track weekly_xp for reference (not enforced)
    weekly_xp = COALESCE(weekly_xp, 0) + xp_to_apply_today,
    season_xp = COALESCE(season_xp, 0) + xp_to_apply_today
  WHERE id = _seller_id
  RETURNING current_xp INTO new_xp;

  -- Log activity (log actual XP applied today, not overflow)
  INSERT INTO public.partner_activity_log (
    seller_id, event_type, xp_value, description, metadata
  ) VALUES (
    _seller_id, _event_type, xp_to_apply_today, 
    COALESCE(_description, 'XP awarded') || 
      CASE WHEN xp_to_overflow > 0 THEN format(' (+%s XP in overflow)', xp_to_overflow) ELSE '' END,
    _metadata || jsonb_build_object('overflow_xp', xp_to_overflow)
  );

  -- DISABLED: Auto-ranking is still disabled (from previous migration)
  -- Ranking up must be done manually through the manual_rank_up function

  RETURN new_xp;
END;
$$;

-- Update login streak function with new XP values (50 XP base, 50/100 bonuses)
CREATE OR REPLACE FUNCTION public.update_login_streak(_seller_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_login DATE;
  current_streak INTEGER;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT last_login_date, login_streak INTO last_login, current_streak
  FROM public.sellers
  WHERE id = _seller_id;

  -- If first login or login was yesterday, increment streak
  IF last_login IS NULL OR last_login = today - INTERVAL '1 day' THEN
    UPDATE public.sellers
    SET login_streak = COALESCE(login_streak, 0) + 1,
        last_login_date = today
    WHERE id = _seller_id;

    -- Award 50 XP for each login day (updated from 200 XP)
    PERFORM public.add_seller_xp(_seller_id, 50, 'login_day', 'Daily login bonus', jsonb_build_object('login_date', today::TEXT));

    -- Award streak milestone bonuses (updated: 50 XP at 3 days, 100 XP at 7 days)
    SELECT login_streak INTO current_streak FROM public.sellers WHERE id = _seller_id;
    
    IF current_streak = 3 THEN
      PERFORM public.add_seller_xp(_seller_id, 50, 'login_streak_3', '3-day login streak milestone');
    ELSIF current_streak = 7 THEN
      PERFORM public.add_seller_xp(_seller_id, 100, 'login_streak_7', '7-day login streak milestone');
    END IF;
  ELSIF last_login < today - INTERVAL '1 day' THEN
    -- Streak broken, reset to 1 and award login XP
    UPDATE public.sellers
    SET login_streak = 1,
        last_login_date = today
    WHERE id = _seller_id;
    
    -- Award 50 XP for login day (even on streak reset)
    PERFORM public.add_seller_xp(_seller_id, 50, 'login_day', 'Daily login bonus', jsonb_build_object('login_date', today::TEXT));
  ELSE
    -- Already logged in today, just update date (no XP awarded)
    UPDATE public.sellers
    SET last_login_date = today
    WHERE id = _seller_id;
  END IF;
END;
$$;

-- Helper function to get XP threshold for a rank
CREATE OR REPLACE FUNCTION public.get_xp_threshold_for_rank(_rank TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN _rank = 'Recruit' THEN 0
    WHEN _rank = 'Recruit Plus' THEN 200
    WHEN _rank = 'Apprentice' THEN 1000
    WHEN _rank = 'Apprentice Plus' THEN 1500
    WHEN _rank = 'Agent' THEN 3000
    WHEN _rank = 'Agent Plus' THEN 4000
    WHEN _rank = 'Verified' THEN 6000
    WHEN _rank = 'Verified Plus' THEN 8000
    WHEN _rank = 'Partner' THEN 10000
    WHEN _rank = 'Partner Plus' THEN 13000
    WHEN _rank = 'Partner Pro' THEN 999999 -- No XP threshold (paid only)
    ELSE 0
  END;
END;
$$;

-- Helper function to check if user can rank up (3-part check: XP threshold, minimum days, required tasks)
CREATE OR REPLACE FUNCTION public.can_rank_up(
  _seller_id UUID,
  _target_rank TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_rank_val TEXT;
  total_xp_val INTEGER;
  current_tier_val INTEGER;
  target_tier_val INTEGER;
  tier_entered_at_val TIMESTAMPTZ;
  days_in_tier_val INTEGER;
  min_days_val INTEGER;
  xp_threshold_val INTEGER;
BEGIN
  -- Get seller data
  SELECT 
    current_rank, current_xp, tier, tier_entered_at
  INTO 
    current_rank_val, total_xp_val, current_tier_val, tier_entered_at_val
  FROM public.sellers
  WHERE id = _seller_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_rank_up', false, 'reason', 'Seller not found');
  END IF;

  -- Get target tier
  target_tier_val := public.get_tier_from_rank(_target_rank);
  
  -- Get XP threshold for target rank
  xp_threshold_val := public.get_xp_threshold_for_rank(_target_rank);

  -- Check 1: XP Threshold
  IF total_xp_val < xp_threshold_val THEN
    RETURN jsonb_build_object(
      'can_rank_up', false,
      'reason', 'XP threshold not met',
      'current_xp', total_xp_val,
      'required_xp', xp_threshold_val,
      'missing_xp', xp_threshold_val - total_xp_val
    );
  END IF;

  -- Check 2: Minimum Days in Tier (only for tier changes to base ranks, not Plus ranks within same tier)
  -- Check if we're moving to a new tier (base rank to base rank)
  IF target_tier_val > current_tier_val AND tier_entered_at_val IS NOT NULL THEN
    min_days_val := public.get_min_days_in_tier(current_tier_val);
    days_in_tier_val := EXTRACT(EPOCH FROM (NOW() - tier_entered_at_val))::INTEGER / 86400; -- Convert to days
    
    IF days_in_tier_val < min_days_val THEN
      RETURN jsonb_build_object(
        'can_rank_up', false,
        'reason', 'Minimum days in tier not met',
        'days_in_tier', days_in_tier_val,
        'required_days', min_days_val,
        'missing_days', min_days_val - days_in_tier_val
      );
    END IF;
  END IF;

  -- Check 3: Required Tasks - This is handled externally in TypeScript via getTasksForRank()
  -- The manual_rank_up function will check tasks before allowing rank-up
  
  -- If all checks pass (tasks checked separately)
  RETURN jsonb_build_object(
    'can_rank_up', true,
    'current_rank', current_rank_val,
    'target_rank', _target_rank,
    'current_xp', total_xp_val,
    'required_xp', xp_threshold_val,
    'days_in_tier', COALESCE(days_in_tier_val, 0),
    'required_days', COALESCE(min_days_val, 0)
  );
END;
$$;


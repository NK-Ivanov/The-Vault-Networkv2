-- Migration: Update Manual Rank Up with New XP System
-- Updates manual_rank_up to check XP threshold, minimum days in tier, and required tasks

-- Update get_rank_xp_threshold to use new XP thresholds
CREATE OR REPLACE FUNCTION public.get_rank_xp_threshold(_rank TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN _rank = 'Recruit' THEN 0
    WHEN _rank = 'Recruit Plus' THEN 0
    WHEN _rank = 'Apprentice' THEN 800
    WHEN _rank = 'Apprentice Plus' THEN 1600
    WHEN _rank = 'Agent' THEN 3000
    WHEN _rank = 'Agent Plus' THEN 4500
    WHEN _rank = 'Verified' THEN 7000
    WHEN _rank = 'Verified Plus' THEN 9500
    WHEN _rank = 'Partner' THEN 13000
    WHEN _rank = 'Partner Plus' THEN 17000
    WHEN _rank = 'Partner Pro' THEN 999999 -- No XP threshold (paid only)
    ELSE 0
  END;
END;
$$;

-- Update manual_rank_up to include 3-part check: XP threshold, minimum days, required tasks
CREATE OR REPLACE FUNCTION public.manual_rank_up(_seller_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_rank_val TEXT;
  new_rank_val TEXT;
  current_xp INTEGER;
  current_tier_val INTEGER;
  target_tier_val INTEGER;
  tier_entered_at_val TIMESTAMPTZ;
  days_in_tier INTEGER;
  min_days_val INTEGER;
  can_advance BOOLEAN;
  required_tasks TEXT[];
  task_id TEXT;
  is_completed BOOLEAN;
  missing_tasks TEXT[];
  completed_tasks TEXT[];
  next_rank_xp_threshold INTEGER;
  expected_progression TEXT[];
  current_index INTEGER;
  next_index INTEGER;
  _countable_total INTEGER := 0;
  _countable_completed INTEGER := 0;
BEGIN
  -- Get current rank, XP, tier, and tier_entered_at
  SELECT 
    s.current_rank, s.current_xp, s.tier, s.tier_entered_at
  INTO 
    current_rank_val, current_xp, current_tier_val, tier_entered_at_val
  FROM public.sellers s
  WHERE s.id = _seller_id;
  
  IF current_rank_val IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller not found');
  END IF;
  
  -- Partner Pro cannot be unlocked via XP (paid/manual only)
  IF current_rank_val = 'Partner Plus' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'partner_pro_paid_only',
      'message', 'Partner Pro is unlocked only through payment/manual upgrade, not via XP progression'
    );
  END IF;
  
  -- Get next rank - ensure it's only one step ahead
  new_rank_val := public.get_next_rank(current_rank_val);
  
  IF new_rank_val IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already at max rank');
  END IF;
  
  -- Safety check: Verify that the next rank is actually the immediate next rank
  expected_progression := ARRAY['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
  
  current_index := array_position(expected_progression, current_rank_val);
  next_index := array_position(expected_progression, new_rank_val);
  
  IF next_index IS NULL OR current_index IS NULL OR next_index != current_index + 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid rank progression',
      'message', 'Rank progression error detected. Please contact support.',
      'current_rank', current_rank_val,
      'next_rank', new_rank_val
    );
  END IF;
  
  -- Check 1: XP Threshold
  next_rank_xp_threshold := public.get_rank_xp_threshold(new_rank_val);
  
  IF current_xp < next_rank_xp_threshold THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_enough_xp',
      'message', 'You need more XP to advance to the next rank',
      'current_xp', current_xp,
      'current_rank', current_rank_val,
      'next_rank', new_rank_val,
      'required_xp', next_rank_xp_threshold,
      'xp_needed', next_rank_xp_threshold - current_xp
    );
  END IF;
  
  -- Check 2: Minimum Days in Tier (only for tier changes, not Plus ranks within same tier)
  target_tier_val := public.get_tier_from_rank(new_rank_val);
  
  -- Only check minimum days if moving to a new tier (base rank to base rank)
  -- Plus ranks within same tier don't require minimum days check
  IF target_tier_val > current_tier_val THEN
    IF tier_entered_at_val IS NULL THEN
      -- If tier_entered_at is not set, set it now and allow rank up (first time entering tier)
      UPDATE public.sellers
      SET tier_entered_at = NOW()
      WHERE id = _seller_id;
      
      tier_entered_at_val := NOW();
    END IF;
    
    min_days_val := public.get_min_days_in_tier(current_tier_val);
    days_in_tier := EXTRACT(EPOCH FROM (NOW() - tier_entered_at_val))::INTEGER / 86400; -- Convert to days
    
    IF days_in_tier < min_days_val THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'minimum_days_not_met',
        'message', format('You need to spend at least %s days in %s tier before advancing to the next tier', min_days_val, current_tier_val),
        'current_tier', current_tier_val,
        'target_tier', target_tier_val,
        'days_in_tier', days_in_tier,
        'required_days', min_days_val,
        'days_needed', min_days_val - days_in_tier
      );
    END IF;
  END IF;
  
  -- Check 3: Required Tasks
  -- Get required tasks for CURRENT rank (user must complete all tasks for current rank to advance)
  required_tasks := public.get_tasks_for_rank(current_rank_val);
  
  -- Only check tasks if the current rank has tasks required
  IF array_length(required_tasks, 1) > 0 THEN
    -- Check if all COUNTABLE tasks are completed
    missing_tasks := ARRAY[]::TEXT[];
    completed_tasks := ARRAY[]::TEXT[];
    _countable_total := 0;
    _countable_completed := 0;
    
    FOREACH task_id IN ARRAY required_tasks
    LOOP
      -- Only check countable tasks (tasks, quizzes, courses with quizzes)
      IF public.is_countable_task(task_id) THEN
        _countable_total := _countable_total + 1;
        is_completed := public.is_lesson_completed(_seller_id, task_id);
        IF is_completed THEN
          _countable_completed := _countable_completed + 1;
          completed_tasks := array_append(completed_tasks, task_id);
        ELSE
          missing_tasks := array_append(missing_tasks, task_id);
        END IF;
      END IF;
    END LOOP;
    
    -- Can advance if all countable tasks are completed
    can_advance := (_countable_total = 0) OR (_countable_total = _countable_completed);
    
    IF NOT can_advance THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'tasks_not_completed',
        'message', 'Complete all tasks for ' || current_rank_val || ' rank to advance',
        'current_rank', current_rank_val,
        'next_rank', new_rank_val,
        'completed_tasks', _countable_completed,
        'total_tasks', _countable_total,
        'completed_task_ids', completed_tasks,
        'missing_tasks', missing_tasks
      );
    END IF;
  END IF;
  
  -- All checks passed - advance rank
  -- Update tier if moving to a new tier
  IF target_tier_val > current_tier_val THEN
    UPDATE public.sellers s
    SET 
      current_rank = new_rank_val,
      commission_rate = public.get_rank_commission_rate(new_rank_val),
      tier = target_tier_val,
      tier_entered_at = NOW(), -- Reset tier_entered_at for new tier
      highest_rank = CASE 
        WHEN s.highest_rank IS NULL OR new_rank_val > s.highest_rank THEN new_rank_val 
        ELSE s.highest_rank 
      END
    WHERE s.id = _seller_id;
  ELSE
    -- Same tier (Plus rank), don't reset tier_entered_at
    UPDATE public.sellers s
    SET 
      current_rank = new_rank_val,
      commission_rate = public.get_rank_commission_rate(new_rank_val),
      highest_rank = CASE 
        WHEN s.highest_rank IS NULL OR new_rank_val > s.highest_rank THEN new_rank_val 
        ELSE s.highest_rank 
      END
    WHERE s.id = _seller_id;
  END IF;

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
    jsonb_build_object(
      'old_rank', current_rank_val, 
      'new_rank', new_rank_val,
      'old_tier', current_tier_val,
      'new_tier', target_tier_val
    )
  );

  -- Post to community feed (if table exists)
  BEGIN
    INSERT INTO public.community_feed (
      event_type,
      seller_id,
      title,
      description,
      metadata
    ) VALUES (
      'rank_up',
      _seller_id,
      (SELECT s2.business_name FROM public.sellers s2 WHERE s2.id = _seller_id) || ' reached ' || new_rank_val,
      'Congratulations on ranking up!',
      jsonb_build_object('old_rank', current_rank_val, 'new_rank', new_rank_val)
    );
  EXCEPTION WHEN undefined_table THEN
    -- Community feed table may not exist, ignore
    NULL;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully ranked up to ' || new_rank_val,
    'old_rank', current_rank_val,
    'new_rank', new_rank_val,
    'old_tier', current_tier_val,
    'new_tier', target_tier_val
  );
END;
$$;


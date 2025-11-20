-- Migration: Update Minimum Days Per Rank (Final Version)
-- Updates minimum days required per rank to match new requirements

-- Function to get minimum days required in a rank before advancing
CREATE OR REPLACE FUNCTION public.get_min_days_in_rank(_rank TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN _rank = 'Recruit' THEN 0
    WHEN _rank = 'Recruit Plus' THEN 0
    WHEN _rank = 'Apprentice' THEN 0
    WHEN _rank = 'Apprentice Plus' THEN 0
    WHEN _rank = 'Agent' THEN 1
    WHEN _rank = 'Agent Plus' THEN 4
    WHEN _rank = 'Verified' THEN 2
    WHEN _rank = 'Verified Plus' THEN 7
    WHEN _rank = 'Partner' THEN 5
    WHEN _rank = 'Partner Plus' THEN 0  -- No minimum days for Partner Plus (can't advance via XP anyway)
    ELSE 0
  END;
END;
$$;

-- Update manual_rank_up function to properly check minimum days (skip check if min_days = 0)
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
  rank_entered_at_val TIMESTAMPTZ;
  days_in_rank INTEGER;
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
  -- Get current rank, XP, tier, and rank_entered_at
  SELECT 
    s.current_rank, s.current_xp, s.tier, s.rank_entered_at
  INTO 
    current_rank_val, current_xp, current_tier_val, rank_entered_at_val
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
      'message', format('You need %s more XP to reach %s rank', next_rank_xp_threshold - current_xp, new_rank_val),
      'current_xp', current_xp,
      'current_rank', current_rank_val,
      'next_rank', new_rank_val,
      'required_xp', next_rank_xp_threshold,
      'xp_needed', next_rank_xp_threshold - current_xp
    );
  END IF;
  
  -- Check 2: Minimum Days in Rank
  -- Set rank_entered_at if not set (first time entering rank)
  IF rank_entered_at_val IS NULL THEN
    UPDATE public.sellers
    SET rank_entered_at = NOW()
    WHERE id = _seller_id;
    
    rank_entered_at_val := NOW();
  END IF;
  
  min_days_val := public.get_min_days_in_rank(current_rank_val);
  
  -- Only check minimum days if min_days_val > 0
  -- If min_days_val is 0, skip the check entirely
  IF min_days_val > 0 THEN
    days_in_rank := EXTRACT(EPOCH FROM (NOW() - rank_entered_at_val))::INTEGER / 86400; -- Convert to days
    
    IF days_in_rank < min_days_val THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'minimum_days_not_met',
        'message', format('You need to spend at least %s day%s in %s rank before advancing to %s', 
          min_days_val, 
          CASE WHEN min_days_val = 1 THEN '' ELSE 's' END,
          current_rank_val,
          new_rank_val),
        'current_rank', current_rank_val,
        'next_rank', new_rank_val,
        'days_in_rank', days_in_rank,
        'required_days', min_days_val,
        'days_needed', min_days_val - days_in_rank
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
      -- Only check countable tasks (tasks/quizzes, not courses without quizzes)
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
    
    -- Check if can advance (all countable tasks must be completed)
    IF _countable_completed < _countable_total THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'tasks_not_completed',
        'message', format('You need to complete all tasks for %s rank before advancing. Completed: %s/%s', 
          current_rank_val, _countable_completed, _countable_total),
        'current_rank', current_rank_val,
        'next_rank', new_rank_val,
        'total_tasks', _countable_total,
        'completed_tasks', _countable_completed,
        'missing_tasks', missing_tasks
      );
    END IF;
  END IF;
  
  -- All checks passed! Advance rank
  target_tier_val := public.get_tier_from_rank(new_rank_val);
  
  -- Update seller rank and tier
  -- If moving to a new tier, update tier_entered_at
  -- Always update rank_entered_at when rank changes
  UPDATE public.sellers
  SET 
    current_rank = new_rank_val,
    tier = target_tier_val,
    rank_entered_at = NOW(),
    tier_entered_at = CASE 
      WHEN target_tier_val > current_tier_val THEN NOW()
      ELSE tier_entered_at
    END
  WHERE id = _seller_id;
  
  -- Log rank up activity
  INSERT INTO public.partner_activity_log (
    event_type, seller_id, description, metadata
  ) VALUES (
    'rank_up',
    _seller_id,
    format('Ranked up from %s to %s', current_rank_val, new_rank_val),
    jsonb_build_object('old_rank', current_rank_val, 'new_rank', new_rank_val)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Successfully ranked up to %s!', new_rank_val),
    'old_rank', current_rank_val,
    'new_rank', new_rank_val
  );
END;
$$;


-- Migration: Add Manual Rank Up System
-- Removes automatic rank up and adds manual rank up function

-- Function to manually advance rank (requires both XP and task completion)
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
  can_advance BOOLEAN;
  required_tasks TEXT[];
  task_id TEXT;
  is_completed BOOLEAN;
  missing_tasks TEXT[];
  next_rank_xp_threshold INTEGER;
BEGIN
  -- Get current rank and XP
  SELECT s.current_rank, s.current_xp INTO current_rank_val, current_xp
  FROM public.sellers s
  WHERE s.id = _seller_id;
  
  IF current_rank_val IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller not found');
  END IF;
  
  -- Get next rank
  new_rank_val := public.get_next_rank(current_rank_val);
  
  IF new_rank_val IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already at max rank');
  END IF;
  
  -- Get XP threshold for next rank
  next_rank_xp_threshold := public.get_rank_xp_threshold(new_rank_val);
  
  -- Check if XP threshold is met
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
  
  -- Get required tasks for current rank
  required_tasks := public.get_tasks_for_rank(current_rank_val);
  
  -- Check if all tasks are completed
  missing_tasks := ARRAY[]::TEXT[];
  FOREACH task_id IN ARRAY required_tasks
  LOOP
    is_completed := public.is_lesson_completed(_seller_id, task_id);
    IF NOT is_completed THEN
      missing_tasks := array_append(missing_tasks, task_id);
    END IF;
  END LOOP;
  
  -- Check if can advance
  can_advance := array_length(missing_tasks, 1) IS NULL;
  
  IF NOT can_advance THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'tasks_not_completed',
      'message', 'Complete all tasks for your current rank to advance',
      'current_rank', current_rank_val,
      'next_rank', new_rank_val,
      'completed_tasks', array_length(required_tasks, 1) - array_length(missing_tasks, 1),
      'total_tasks', array_length(required_tasks, 1),
      'missing_tasks', missing_tasks
    );
  END IF;
  
  -- All checks passed - advance rank
  UPDATE public.sellers s
  SET current_rank = new_rank_val,
      commission_rate = public.get_rank_commission_rate(new_rank_val),
      highest_rank = CASE 
        WHEN s.highest_rank IS NULL OR new_rank_val > s.highest_rank THEN new_rank_val 
        ELSE s.highest_rank 
      END
  WHERE s.id = _seller_id;

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
    (SELECT s2.business_name FROM public.sellers s2 WHERE s2.id = _seller_id) || ' reached ' || new_rank_val,
    'Congratulations on ranking up!',
    jsonb_build_object('old_rank', current_rank_val, 'new_rank', new_rank_val)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully ranked up to ' || new_rank_val,
    'old_rank', current_rank_val,
    'new_rank', new_rank_val
  );
END;
$$;

-- Helper function to check if a lesson/task is completed
CREATE OR REPLACE FUNCTION public.is_lesson_completed(
  _seller_id UUID,
  _lesson_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check if lesson is completed by looking at activity log
  RETURN EXISTS (
    SELECT 1 FROM public.partner_activity_log
    WHERE seller_id = _seller_id
      AND (event_type = 'quiz_completed' OR event_type = 'task_completed')
      AND metadata->>'lesson_id' = _lesson_id
  );
END;
$$;

-- Function to get all task lesson IDs for a specific rank
CREATE OR REPLACE FUNCTION public.get_tasks_for_rank(_rank TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  _tasks TEXT[];
BEGIN
  -- Hardcoded task IDs for each rank (matching partner-lessons.ts)
  CASE _rank
    WHEN 'Recruit' THEN
      _tasks := ARRAY['stage-1-recruit-3']; -- Complete Getting Started
    WHEN 'Apprentice' THEN
      _tasks := ARRAY['stage-1-recruit-3', 'stage-2-apprentice-6']; -- Complete Getting Started + Suggest New Automation
    WHEN 'Agent' THEN
      _tasks := ARRAY['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10']; -- All previous + Create Sales Script + Log First Outreach
    WHEN 'Partner' THEN
      _tasks := ARRAY['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15']; -- All previous + Add Demo Client + Assign Demo Automation + Pitch Reflection + Invite Friend
    WHEN 'Verified' THEN
      _tasks := ARRAY['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20']; -- All previous + Verified tasks (16 is a course, not a task)
    WHEN 'Partner Pro' THEN
      _tasks := ARRAY['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20']; -- All tasks (16 is a course, not a task)
    ELSE
      _tasks := ARRAY[]::TEXT[];
  END CASE;
  
  RETURN _tasks;
END;
$$;

-- Helper function to get next rank
CREATE OR REPLACE FUNCTION public.get_next_rank(_current_rank TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE _current_rank
    WHEN 'Recruit' THEN RETURN 'Apprentice';
    WHEN 'Apprentice' THEN RETURN 'Agent';
    WHEN 'Agent' THEN RETURN 'Partner';
    WHEN 'Partner' THEN RETURN 'Verified';
    WHEN 'Verified' THEN RETURN 'Partner Pro';
    ELSE RETURN NULL;
  END CASE;
END;
$$;

-- Helper function to get rank XP threshold
CREATE OR REPLACE FUNCTION public.get_rank_xp_threshold(_rank TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE _rank
    WHEN 'Recruit' THEN RETURN 0;
    WHEN 'Apprentice' THEN RETURN 1000;
    WHEN 'Agent' THEN RETURN 2500;
    WHEN 'Partner' THEN RETURN 4500;
    WHEN 'Verified' THEN RETURN 7000;
    WHEN 'Partner Pro' THEN RETURN 10000;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- Update add_seller_xp to NOT automatically rank up (remove rank up logic)
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
  final_xp_amount INTEGER;
  xp_multiplier DECIMAL(3,2);
  global_multiplier DECIMAL(3,2);
  lesson_id_val TEXT;
BEGIN
  -- Extract lesson_id from metadata for tracking
  lesson_id_val := COALESCE(_metadata->>'lesson_id', NULL);
  
  -- Get global XP multiplier from vault_settings (default to 1.0 if not found or table doesn't exist)
  BEGIN
    SELECT COALESCE((setting_value->>'multiplier')::DECIMAL(3,2), 1.0) INTO global_multiplier
    FROM public.vault_settings
    WHERE setting_key = 'xp_multiplier'
    LIMIT 1;
    
    -- If no setting found or query returned NULL, default to 1.0
    IF global_multiplier IS NULL THEN
      global_multiplier := 1.0;
    END IF;
  EXCEPTION WHEN undefined_table OR OTHERS THEN
    -- If vault_settings table doesn't exist, default to 1.0
    global_multiplier := 1.0;
  END;
  
  -- Get XP multiplier based on lesson/event type
  -- Function signature: get_xp_multiplier(_seller_id, _event_type, _days_lookback, _metadata)
  -- Admin grants bypass multipliers
  IF _event_type = 'admin_grant' THEN
    xp_multiplier := 1.00; -- Admin grants always give 100% XP
  ELSE
    xp_multiplier := public.get_xp_multiplier(_seller_id, _event_type, 7, _metadata);
  END IF;
  
  -- Calculate final XP amount
  final_xp_amount := ROUND(_xp_amount * xp_multiplier * global_multiplier)::INTEGER;
  
  -- Admin grants bypass multipliers and always give full XP
  IF _event_type = 'admin_grant' THEN
    final_xp_amount := _xp_amount;
  END IF;
  
  -- Update seller XP
  IF _event_type = 'admin_grant' THEN
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp, current_rank INTO new_xp, current_rank_val;
  ELSE
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount,
        weekly_xp = COALESCE(weekly_xp, 0) + final_xp_amount,
        season_xp = COALESCE(season_xp, 0) + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp, current_rank INTO new_xp, current_rank_val;
  END IF;

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

  -- NO AUTOMATIC RANK UP - User must manually advance via button
  -- Rank advancement is now handled by manual_rank_up() function

  RETURN new_xp;
END;
$$;


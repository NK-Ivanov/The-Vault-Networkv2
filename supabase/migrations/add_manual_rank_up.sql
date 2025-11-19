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
  completed_tasks TEXT[];
  next_rank_xp_threshold INTEGER;
  expected_progression TEXT[];
  current_index INTEGER;
  next_index INTEGER;
  _countable_total INTEGER := 0;
  _countable_completed INTEGER := 0;
BEGIN
  -- Get current rank and XP
  SELECT s.current_rank, s.current_xp INTO current_rank_val, current_xp
  FROM public.sellers s
  WHERE s.id = _seller_id;
  
  IF current_rank_val IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller not found');
  END IF;
  
  -- Get next rank - ensure it's only one step ahead
  new_rank_val := public.get_next_rank(current_rank_val);
  
  IF new_rank_val IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already at max rank');
  END IF;
  
  -- Safety check: Verify that the next rank is actually the immediate next rank
  -- This prevents any rank skipping bugs
  expected_progression := ARRAY['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
  
  -- Find current rank index
  current_index := array_position(expected_progression, current_rank_val);
  next_index := array_position(expected_progression, new_rank_val);
  
  -- Verify next rank is exactly one step ahead
  IF next_index IS NULL OR current_index IS NULL OR next_index != current_index + 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid rank progression',
      'message', 'Rank progression error detected. Please contact support.',
      'current_rank', current_rank_val,
      'next_rank', new_rank_val
    );
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
  
  -- Get required tasks for CURRENT rank (user must complete all tasks for current rank to advance)
  -- Note: Some ranks like Partner have no tasks, so they only need XP to advance
  required_tasks := public.get_tasks_for_rank(current_rank_val);
  
  -- Only check tasks if the current rank has tasks required
  -- If current rank has no tasks (empty array), skip task checking and only require XP
  IF array_length(required_tasks, 1) > 0 THEN
    -- Check if all COUNTABLE tasks are completed (same logic as are_all_tasks_completed)
    missing_tasks := ARRAY[]::TEXT[];
    completed_tasks := ARRAY[]::TEXT[];
    _countable_total := 0;
    _countable_completed := 0;
    
    FOREACH task_id IN ARRAY required_tasks
    LOOP
      -- Only check countable tasks (tasks, quizzes, courses with quizzes - not courses without quizzes)
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
  -- Plus ranks require tasks up to and including Stage B of that rank
  CASE _rank
    WHEN 'Recruit' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3']; -- Recruit Stage A: Open Overview, Copy Referral Link, View 3 Automations
    WHEN 'Recruit Plus' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6']; -- Recruit Stage A + B (Plus rank unlocks after Stage B)
    WHEN 'Apprentice' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7']; -- All Recruit Plus + Apprentice Stage A tasks (course is not a task, only tasks counted)
    WHEN 'Apprentice Plus' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10']; -- All Apprentice Stage A + B (Plus rank unlocks after Stage B)
    WHEN 'Agent' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9']; -- All Apprentice Plus + Agent Stage A tasks (course is not a task)
    WHEN 'Agent Plus' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13']; -- All Agent Stage A + B + Sales Foundations Course (quiz) + The Outreach Process Course (quiz) + Log In 3 Consecutive Days
    WHEN 'Verified' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b']; -- All Agent Plus tasks/courses/quizzes + Verified Stage A tasks + Edit Referral Code
    WHEN 'Verified Plus' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15']; -- All Agent Plus + Verified Stage A + B tasks + Edit Referral Code + Invite a Friend (Plus rank unlocks after Stage B)
    WHEN 'Partner' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15']; -- All Verified Plus tasks (no Partner tasks required, only course visible)
    WHEN 'Partner Plus' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20']; -- All Verified Plus + Partner Plus Stage 5 tasks (17, 18, 19, 20)
    WHEN 'Partner Pro' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20']; -- All tasks including courses with quizzes (courses without quizzes are not tasks)
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
    -- Rank progression with Plus sub-ranks
    WHEN 'Recruit' THEN RETURN 'Recruit Plus';
    WHEN 'Recruit Plus' THEN RETURN 'Apprentice';
    WHEN 'Apprentice' THEN RETURN 'Apprentice Plus';
    WHEN 'Apprentice Plus' THEN RETURN 'Agent';
    WHEN 'Agent' THEN RETURN 'Agent Plus';
    WHEN 'Agent Plus' THEN RETURN 'Verified';
    WHEN 'Verified' THEN RETURN 'Verified Plus';
    WHEN 'Verified Plus' THEN RETURN 'Partner';
    WHEN 'Partner' THEN RETURN 'Partner Plus';
    WHEN 'Partner Plus' THEN RETURN 'Partner Pro';
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
    -- Base ranks and their Plus variants share the same XP threshold
    WHEN 'Recruit' THEN RETURN 0;
    WHEN 'Recruit Plus' THEN RETURN 0;
    WHEN 'Apprentice' THEN RETURN 1000;
    WHEN 'Apprentice Plus' THEN RETURN 1000;
    WHEN 'Agent' THEN RETURN 2500;
    WHEN 'Agent Plus' THEN RETURN 2500;
    WHEN 'Verified' THEN RETURN 4500;
    WHEN 'Verified Plus' THEN RETURN 4500;
    WHEN 'Partner' THEN RETURN 7000;
    WHEN 'Partner Plus' THEN RETURN 7000;
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


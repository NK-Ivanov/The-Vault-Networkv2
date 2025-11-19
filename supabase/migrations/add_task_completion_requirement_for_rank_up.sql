-- Migration: Require all tasks to be completed before rank advancement
-- This ensures partners complete all tasks for their current rank before advancing

-- Function to get all task lesson IDs for a specific rank
CREATE OR REPLACE FUNCTION public.get_tasks_for_rank(_rank TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  _tasks TEXT[];
BEGIN
  -- Hardcoded task IDs for each rank (matching partner-progression.ts getTasksForRank function exactly)
  -- Plus ranks require tasks up to and including Stage B of that rank
  CASE _rank
    WHEN 'Recruit' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3']; -- Recruit Stage A: Open Overview, Copy Referral Link, View 3 Automations
    WHEN 'Recruit Plus' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7']; -- Recruit Stage A + B + C (Plus rank unlocks after Stage B, includes quiz from Stage C)
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
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-4-verified-plus-20']; -- All Agent Plus + Verified Stage A + B tasks + Verified Plus tasks (Demo Client Deep Dive, Create Demo Automation Plan, Referral Funnel Exercise, Handling Objections 101, Log In on 5 Consecutive Days)
    WHEN 'Partner' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-4-verified-plus-20', 'stage-5-partner-12', 'stage-5-partner-13', 'stage-5-partner-14', 'stage-5-partner-15', 'stage-5-partner-16', 'stage-5-partner-17', 'stage-5-partner-18', 'stage-5-partner-19']; -- All Verified Plus tasks + Partner rank tasks (Review Setup vs Monthly Pricing, Create Sales Script, Record Value Explanation, Earnings Projection, Map Client Journey, Review Bookmarked Automations, Write Setup Process Explanation, Log In on 7 Consecutive Days)
    WHEN 'Partner Plus' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-4-verified-plus-20', 'stage-5-verified-16', 'stage-5-partner-12', 'stage-5-partner-13', 'stage-5-partner-14', 'stage-5-partner-15', 'stage-5-partner-16', 'stage-5-partner-17', 'stage-5-partner-18', 'stage-5-partner-19', 'stage-5-partner-plus-19', 'stage-5-partner-plus-20', 'stage-5-verified-21', 'stage-5-verified-22']; -- All Partner tasks + Partner Plus tasks (Invite First Real Client, Assign First Automation, Mark First Sale, Submit Case Summary)
    WHEN 'Seller Pro' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20']; -- All tasks including Edit Referral Code
    WHEN 'Partner Pro' THEN
      _tasks := ARRAY['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-5-partner-12', 'stage-5-partner-13', 'stage-5-partner-14', 'stage-5-partner-15', 'stage-5-partner-16', 'stage-5-partner-17', 'stage-5-partner-18', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20']; -- All tasks (courses are not tasks)
    ELSE
      _tasks := ARRAY[]::TEXT[];
  END CASE;
  
  RETURN _tasks;
END;
$$;

-- Helper function to check if a lesson ID is a countable task (task, quiz, or course with quiz)
-- This matches the frontend isCountableTask logic
-- Courses without quizzes are NOT counted as tasks for rank advancement
-- Since lessons may be hardcoded in frontend, we check the partner_lessons table if available,
-- otherwise we assume all lesson IDs in get_tasks_for_rank are countable (they should be)
CREATE OR REPLACE FUNCTION public.is_countable_task(_lesson_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  _lesson_type TEXT;
  _has_quiz BOOLEAN;
BEGIN
  -- Try to get lesson type from partner_lessons table
  SELECT lesson_type, (quiz_questions IS NOT NULL AND jsonb_array_length(quiz_questions) > 0) INTO _lesson_type, _has_quiz
  FROM public.partner_lessons
  WHERE id::TEXT = _lesson_id
  LIMIT 1;
  
  -- If found in database, check if it's countable
  IF _lesson_type IS NOT NULL THEN
    RETURN (_lesson_type = 'task' OR _lesson_type = 'quiz' OR (_lesson_type = 'course' AND _has_quiz));
  END IF;
  
  -- If not in database, assume it's countable (get_tasks_for_rank should only return countable tasks)
  -- All lesson IDs returned by get_tasks_for_rank should be tasks/quizzes/courses with quizzes
  RETURN true;
END;
$$;

-- Function to check if all tasks for a rank are completed
CREATE OR REPLACE FUNCTION public.are_all_tasks_completed(_seller_id UUID, _rank TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  _required_tasks TEXT[];
  _task_id TEXT;
  _is_completed BOOLEAN;
  _countable_count INTEGER := 0;
  _completed_count INTEGER := 0;
BEGIN
  -- Get all required tasks for the rank
  _required_tasks := public.get_tasks_for_rank(_rank);
  
  -- If no tasks required for this rank, return true
  IF array_length(_required_tasks, 1) IS NULL THEN
    RAISE NOTICE '[ARE_ALL_TASKS_COMPLETED] Rank % has no required tasks, returning true', _rank;
    RETURN true;
  END IF;
  
  RAISE NOTICE '[ARE_ALL_TASKS_COMPLETED] Checking rank %, Total tasks: %', _rank, array_length(_required_tasks, 1);
  
  -- Check each required task (only count tasks/quizzes, not courses without quizzes)
  FOREACH _task_id IN ARRAY _required_tasks
  LOOP
    -- Only check if this is a countable task
    IF public.is_countable_task(_task_id) THEN
      _countable_count := _countable_count + 1;
      _is_completed := public.is_lesson_completed(_seller_id, _task_id);
      IF _is_completed THEN
        _completed_count := _completed_count + 1;
        RAISE NOTICE '[ARE_ALL_TASKS_COMPLETED] Task % is completed (%/% countable tasks)', _task_id, _completed_count, _countable_count;
      ELSE
        RAISE NOTICE '[ARE_ALL_TASKS_COMPLETED] Task % is NOT completed (%/% countable tasks)', _task_id, _completed_count, _countable_count;
        RETURN false;
      END IF;
    ELSE
      RAISE NOTICE '[ARE_ALL_TASKS_COMPLETED] Task % is not countable, skipping', _task_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE '[ARE_ALL_TASKS_COMPLETED] All tasks completed for rank % (%/% countable tasks)', _rank, _completed_count, _countable_count;
  RETURN true;
END;
$$;

-- Update add_seller_xp to check task completion before rank up
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
  lesson_id_val TEXT;
  can_advance BOOLEAN;
  required_tasks TEXT[];
  task_id TEXT;
  all_other_tasks_completed BOOLEAN;
  next_rank_xp_threshold INTEGER;
  has_enough_xp BOOLEAN;
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
  
  -- Get current rank BEFORE updating XP (so we check tasks for the rank before the XP update)
  SELECT current_rank INTO current_rank_val
  FROM public.sellers
  WHERE id = _seller_id;

  -- Update seller XP
  IF _event_type = 'admin_grant' THEN
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp INTO new_xp;
  ELSE
    UPDATE public.sellers
    SET current_xp = current_xp + final_xp_amount,
        weekly_xp = COALESCE(weekly_xp, 0) + final_xp_amount,
        season_xp = COALESCE(season_xp, 0) + final_xp_amount
    WHERE id = _seller_id
    RETURNING current_xp INTO new_xp;
  END IF;

  -- Check for rank up BEFORE logging the activity (so the current task completion doesn't affect the check)
  -- IMPORTANT: Only advance ONE rank at a time, don't use calculate_seller_rank which can skip ranks
  -- Get the next rank in sequence
  new_rank_val := public.get_next_rank(current_rank_val);
  
  -- Only check for rank up if there's a next rank AND user has enough XP for it
  -- Check BEFORE inserting the activity log entry for the current task
  IF new_rank_val IS NOT NULL THEN
    -- Check if user has enough XP for the next rank
    -- Get XP threshold for next rank (from RANK_INFO equivalent logic)
    CASE new_rank_val
      WHEN 'Recruit' THEN next_rank_xp_threshold := 0;
        WHEN 'Recruit Plus' THEN next_rank_xp_threshold := 200;
        WHEN 'Apprentice' THEN next_rank_xp_threshold := 1000;
        WHEN 'Apprentice Plus' THEN next_rank_xp_threshold := 1500;
        WHEN 'Agent' THEN next_rank_xp_threshold := 3000;
        WHEN 'Agent Plus' THEN next_rank_xp_threshold := 4000;
        WHEN 'Verified' THEN next_rank_xp_threshold := 6000;
        WHEN 'Verified Plus' THEN next_rank_xp_threshold := 8000;
        WHEN 'Partner' THEN next_rank_xp_threshold := 10000;
        WHEN 'Partner Plus' THEN next_rank_xp_threshold := 13000;
        WHEN 'Partner Pro' THEN next_rank_xp_threshold := 999999; -- Paid only
      ELSE next_rank_xp_threshold := 999999; -- Never advance if rank is unknown
    END CASE;
    
    has_enough_xp := (new_xp >= next_rank_xp_threshold);
    RAISE NOTICE '[RANK-UP CHECK] Current rank: %, Next rank: %, Current XP: %, Required XP: %, Has enough XP: %', 
      current_rank_val, new_rank_val, new_xp, next_rank_xp_threshold, has_enough_xp;
    
    -- Only proceed if user has enough XP for the next rank
    IF has_enough_xp THEN
      -- Initialize can_advance to false (must explicitly pass all checks)
      can_advance := false;
      
      -- Get required tasks for current rank
      required_tasks := public.get_tasks_for_rank(current_rank_val);
      
      -- Log debug info (will appear in database logs)
      RAISE NOTICE '[RANK-UP CHECK] Lesson ID: %, Required tasks: %', lesson_id_val, required_tasks;
      
      -- CRITICAL: Only check for rank-up if the current task being completed is one of the required tasks
      -- If the task is NOT in the required list, do NOT allow rank-up (user must complete required tasks first)
      IF lesson_id_val IS NOT NULL AND public.is_countable_task(lesson_id_val) THEN
        -- Check if current task is in the required tasks list
        IF lesson_id_val = ANY(required_tasks) THEN
          -- Current task IS required, so check if all OTHER required tasks are completed
          RAISE NOTICE '[RANK-UP CHECK] Current task % IS in required tasks list for rank %', lesson_id_val, current_rank_val;
          all_other_tasks_completed := true;
          FOREACH task_id IN ARRAY required_tasks
          LOOP
            -- Skip the current task being completed, and only check countable tasks
            IF task_id != lesson_id_val AND public.is_countable_task(task_id) THEN
              IF NOT public.is_lesson_completed(_seller_id, task_id) THEN
                all_other_tasks_completed := false;
                RAISE NOTICE '[RANK-UP CHECK] Task % is NOT completed (blocking rank-up)', task_id;
                EXIT;
              ELSE
                RAISE NOTICE '[RANK-UP CHECK] Task % is completed', task_id;
              END IF;
            END IF;
          END LOOP;
          
          -- Can advance if all other countable tasks are completed (current task will complete the set)
          can_advance := all_other_tasks_completed;
          RAISE NOTICE '[RANK-UP CHECK] All other tasks completed: %, Can advance: %', all_other_tasks_completed, can_advance;
        ELSE
          -- Current task is NOT in required list - DO NOT allow rank-up
          -- User must complete tasks that are actually required for this rank
          RAISE NOTICE '[RANK-UP CHECK] Current task % is NOT in required tasks list for rank %. Blocking rank-up.', lesson_id_val, current_rank_val;
          RAISE NOTICE '[RANK-UP CHECK] Required tasks for rank %: %', current_rank_val, required_tasks;
          can_advance := false;
        END IF;
      ELSE
        -- No lesson ID or not countable - DO NOT allow rank-up without a specific task completion
        RAISE NOTICE '[RANK-UP CHECK] No lesson ID or not countable task. Blocking rank-up.';
        can_advance := false;
      END IF;
      
        IF can_advance THEN
          -- Rank up!
          RAISE NOTICE '[RANK-UP] RANKING UP from % to %', current_rank_val, new_rank_val;
          UPDATE public.sellers
          SET current_rank = new_rank_val,
              commission_rate = public.get_rank_commission_rate(new_rank_val),
              highest_rank = CASE 
                WHEN highest_rank IS NULL OR new_rank_val > highest_rank THEN new_rank_val 
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
        ELSE
          RAISE NOTICE '[RANK-UP] NOT RANKING UP - tasks not completed. Current: %, Would be: %', current_rank_val, new_rank_val;
        END IF;
      ELSE
        RAISE NOTICE '[RANK-UP] NOT RANKING UP - not enough XP. Current: %, Next: %, Current XP: %, Required XP: %', 
          current_rank_val, new_rank_val, new_xp, next_rank_xp_threshold;
      END IF;
    ELSE
      RAISE NOTICE '[RANK-UP] No next rank available for current rank: %', current_rank_val;
    END IF;

  -- Log the activity (always log, even if rank up didn't happen)
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


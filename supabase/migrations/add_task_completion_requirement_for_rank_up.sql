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
    WHEN 'Seller Pro' THEN
      _tasks := ARRAY['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20']; -- All tasks (16 is a course, not a task)
    ELSE
      _tasks := ARRAY[]::TEXT[];
  END CASE;
  
  RETURN _tasks;
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
BEGIN
  -- Get all required tasks for the rank
  _required_tasks := public.get_tasks_for_rank(_rank);
  
  -- If no tasks required for this rank, return true
  IF array_length(_required_tasks, 1) IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check each required task
  FOREACH _task_id IN ARRAY _required_tasks
  LOOP
    _is_completed := public.is_lesson_completed(_seller_id, _task_id);
    IF NOT _is_completed THEN
      RETURN false;
    END IF;
  END LOOP;
  
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
BEGIN
  -- Extract lesson_id from metadata for tracking
  lesson_id_val := COALESCE(_metadata->>'lesson_id', NULL);
  
  -- Get global XP multiplier from vault_settings
  SELECT COALESCE((settings->>'global_xp_multiplier')::DECIMAL, 1.0) INTO global_multiplier
  FROM public.vault_settings LIMIT 1;
  
  -- Get XP multiplier based on lesson/event type
  xp_multiplier := public.get_xp_multiplier(_seller_id, _event_type, _metadata);
  
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

  -- Check for rank up
  new_rank_val := public.calculate_seller_rank(new_xp);
  
  -- Only rank up if XP threshold is met AND all tasks for current rank are completed
  IF new_rank_val != current_rank_val THEN
    -- Check if all tasks for current rank are completed
    can_advance := public.are_all_tasks_completed(_seller_id, current_rank_val);
    
    IF can_advance THEN
      -- Rank up!
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
      -- XP is high enough but tasks not completed - keep current rank
      -- Don't update rank, but XP is still recorded
    END IF;
  END IF;

  RETURN new_xp;
END;
$$;


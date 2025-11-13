-- Migration: Fix lesson_id UUID casting issue
-- The hardcoded lessons use string IDs like "stage-3-agent-9" instead of UUIDs
-- This migration updates the function to handle both UUID and string lesson_ids

-- Updated function to handle string lesson_ids (for hardcoded lessons)
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


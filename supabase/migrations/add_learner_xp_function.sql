-- Add XP function for learners (simpler than sellers, no diminishing returns for quizzes)
CREATE OR REPLACE FUNCTION public.add_learner_xp(
  _learner_id UUID,
  _xp_amount INTEGER,
  _event_type TEXT DEFAULT 'quiz_completed',
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
BEGIN
  -- Update learner XP
  UPDATE public.learners
  SET current_xp = COALESCE(current_xp, 0) + _xp_amount
  WHERE id = _learner_id
  RETURNING current_xp INTO new_xp;

  RETURN new_xp;
END;
$$;


-- Add Learner Rank System and XP Rewards
-- This adds rank calculation, XP rewards for module actions, and leaderboard support

-- Add rank field to learners table
ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS current_rank TEXT DEFAULT 'Beginner';

-- Function to calculate learner rank based on XP
CREATE OR REPLACE FUNCTION public.calculate_learner_rank(_xp INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE
    WHEN _xp >= 300000 THEN RETURN 'The Vault Master';
    WHEN _xp >= 270000 THEN RETURN 'Vault Champion';
    WHEN _xp >= 235000 THEN RETURN 'Legend of Workflows';
    WHEN _xp >= 205000 THEN RETURN 'Grand Operator';
    WHEN _xp >= 180000 THEN RETURN 'Elite Engineer';
    WHEN _xp >= 160000 THEN RETURN 'High-Tier Automator';
    WHEN _xp >= 143000 THEN RETURN 'Automation Analyst';
    WHEN _xp >= 126000 THEN RETURN 'Integration Pro';
    WHEN _xp >= 110000 THEN RETURN 'Systems Strategist';
    WHEN _xp >= 95000 THEN RETURN 'Master Builder';
    WHEN _xp >= 82000 THEN RETURN 'Vault Specialist';
    WHEN _xp >= 70000 THEN RETURN 'Senior Engineer';
    WHEN _xp >= 60000 THEN RETURN 'Engineer';
    WHEN _xp >= 51000 THEN RETURN 'Technician';
    WHEN _xp >= 43000 THEN RETURN 'Architect';
    WHEN _xp >= 36000 THEN RETURN 'Journeyman';
    WHEN _xp >= 30000 THEN RETURN 'Workflow Adept';
    WHEN _xp >= 25000 THEN RETURN 'Debugger';
    WHEN _xp >= 20000 THEN RETURN 'Mechanic';
    WHEN _xp >= 16000 THEN RETURN 'Specialist';
    WHEN _xp >= 13000 THEN RETURN 'Automation Rookie';
    WHEN _xp >= 10500 THEN RETURN 'Flow Starter';
    WHEN _xp >= 8000 THEN RETURN 'System Builder';
    WHEN _xp >= 6000 THEN RETURN 'Operator';
    WHEN _xp >= 4500 THEN RETURN 'Apprentice';
    WHEN _xp >= 3000 THEN RETURN 'Novice';
    WHEN _xp >= 2000 THEN RETURN 'Trainee';
    WHEN _xp >= 1200 THEN RETURN 'Explorer';
    WHEN _xp >= 500 THEN RETURN 'Initiate';
    ELSE RETURN 'Beginner';
  END CASE;
END;
$$;

-- Function to get next rank info
CREATE OR REPLACE FUNCTION public.get_next_learner_rank(_xp INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_rank TEXT;
  next_rank TEXT;
  xp_for_next INTEGER;
BEGIN
  current_rank := public.calculate_learner_rank(_xp);
  
  CASE current_rank
    WHEN 'Beginner' THEN next_rank := 'Initiate'; xp_for_next := 500;
    WHEN 'Initiate' THEN next_rank := 'Explorer'; xp_for_next := 1200;
    WHEN 'Explorer' THEN next_rank := 'Trainee'; xp_for_next := 2000;
    WHEN 'Trainee' THEN next_rank := 'Novice'; xp_for_next := 3000;
    WHEN 'Novice' THEN next_rank := 'Apprentice'; xp_for_next := 4500;
    WHEN 'Apprentice' THEN next_rank := 'Operator'; xp_for_next := 6000;
    WHEN 'Operator' THEN next_rank := 'System Builder'; xp_for_next := 8000;
    WHEN 'System Builder' THEN next_rank := 'Flow Starter'; xp_for_next := 10500;
    WHEN 'Flow Starter' THEN next_rank := 'Automation Rookie'; xp_for_next := 13000;
    WHEN 'Automation Rookie' THEN next_rank := 'Specialist'; xp_for_next := 16000;
    WHEN 'Specialist' THEN next_rank := 'Mechanic'; xp_for_next := 20000;
    WHEN 'Mechanic' THEN next_rank := 'Debugger'; xp_for_next := 25000;
    WHEN 'Debugger' THEN next_rank := 'Workflow Adept'; xp_for_next := 30000;
    WHEN 'Workflow Adept' THEN next_rank := 'Journeyman'; xp_for_next := 36000;
    WHEN 'Journeyman' THEN next_rank := 'Architect'; xp_for_next := 43000;
    WHEN 'Architect' THEN next_rank := 'Technician'; xp_for_next := 51000;
    WHEN 'Technician' THEN next_rank := 'Engineer'; xp_for_next := 60000;
    WHEN 'Engineer' THEN next_rank := 'Senior Engineer'; xp_for_next := 70000;
    WHEN 'Senior Engineer' THEN next_rank := 'Vault Specialist'; xp_for_next := 82000;
    WHEN 'Vault Specialist' THEN next_rank := 'Master Builder'; xp_for_next := 95000;
    WHEN 'Master Builder' THEN next_rank := 'Systems Strategist'; xp_for_next := 110000;
    WHEN 'Systems Strategist' THEN next_rank := 'Integration Pro'; xp_for_next := 126000;
    WHEN 'Integration Pro' THEN next_rank := 'Automation Analyst'; xp_for_next := 143000;
    WHEN 'Automation Analyst' THEN next_rank := 'High-Tier Automator'; xp_for_next := 160000;
    WHEN 'High-Tier Automator' THEN next_rank := 'Elite Engineer'; xp_for_next := 180000;
    WHEN 'Elite Engineer' THEN next_rank := 'Grand Operator'; xp_for_next := 205000;
    WHEN 'Grand Operator' THEN next_rank := 'Legend of Workflows'; xp_for_next := 235000;
    WHEN 'Legend of Workflows' THEN next_rank := 'Vault Champion'; xp_for_next := 270000;
    WHEN 'Vault Champion' THEN next_rank := 'The Vault Master'; xp_for_next := 300000;
    ELSE next_rank := NULL; xp_for_next := NULL;
  END CASE;
  
  RETURN jsonb_build_object(
    'current_rank', current_rank,
    'next_rank', next_rank,
    'xp_for_next', xp_for_next,
    'xp_needed', GREATEST(0, xp_for_next - _xp)
  );
END;
$$;

-- Update add_learner_xp to also update rank
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
  new_rank TEXT;
BEGIN
  -- Update learner XP
  UPDATE public.learners
  SET current_xp = COALESCE(current_xp, 0) + _xp_amount
  WHERE id = _learner_id
  RETURNING current_xp INTO new_xp;

  -- Calculate and update rank
  new_rank := public.calculate_learner_rank(new_xp);
  UPDATE public.learners
  SET current_rank = new_rank
  WHERE id = _learner_id;

  RETURN new_xp;
END;
$$;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION public.get_learner_leaderboard(_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  learner_id UUID,
  full_name TEXT,
  current_xp INTEGER,
  current_rank TEXT,
  modules_completed INTEGER,
  total_modules INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id AS learner_id,
    l.full_name,
    COALESCE(l.current_xp, 0) AS current_xp,
    COALESCE(l.current_rank, 'Beginner') AS current_rank,
    COUNT(CASE WHEN lm.completed = true THEN 1 END)::INTEGER AS modules_completed,
    COUNT(lm.id)::INTEGER AS total_modules
  FROM public.learners l
  LEFT JOIN public.learner_modules lm ON lm.learner_id = l.id
  GROUP BY l.id, l.full_name, l.current_xp, l.current_rank
  ORDER BY COALESCE(l.current_xp, 0) DESC, modules_completed DESC
  LIMIT _limit;
END;
$$;


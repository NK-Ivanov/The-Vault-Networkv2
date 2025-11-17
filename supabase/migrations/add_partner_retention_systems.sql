-- Migration: Add Partner Retention & Re-Ranking Systems
-- This adds seasonal XP, challenges, quests, badges, streaks, and more

-- Add seasonal XP and weekly tracking to sellers
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS season_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_weekly_reset TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS highest_rank TEXT DEFAULT 'Recruit',
ADD COLUMN IF NOT EXISTS theme_preference TEXT,
ADD COLUMN IF NOT EXISTS manual_approval_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_until_lesson_id UUID REFERENCES public.partner_lessons(id);

-- Create partner_season_stats table
CREATE TABLE IF NOT EXISTS public.partner_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  season_number INTEGER NOT NULL,
  season_start_date DATE NOT NULL,
  season_end_date DATE NOT NULL,
  starting_xp INTEGER DEFAULT 0,
  ending_xp INTEGER DEFAULT 0,
  clients_added INTEGER DEFAULT 0,
  automations_assigned INTEGER DEFAULT 0,
  deals_logged INTEGER DEFAULT 0,
  rank_held TEXT,
  final_rank TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner_challenges table
CREATE TABLE IF NOT EXISTS public.partner_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL, -- 'engagement', 'growth', 'education', 'contribution', 'outreach'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  active_start_date DATE NOT NULL,
  active_end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requirements JSONB, -- Flexible requirements structure
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner_challenge_progress table
CREATE TABLE IF NOT EXISTS public.partner_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.partner_challenges(id) ON DELETE CASCADE NOT NULL,
  progress_data JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, challenge_id)
);

-- Create partner_quests table
CREATE TABLE IF NOT EXISTS public.partner_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_name TEXT NOT NULL,
  quest_description TEXT NOT NULL,
  quest_steps JSONB NOT NULL, -- Array of steps with tasks and XP
  completion_reward_xp INTEGER DEFAULT 0,
  completion_badge TEXT,
  completion_xp_boost DECIMAL(3,2) DEFAULT 1.0, -- Multiplier like 1.05 for 5% boost
  boost_duration_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner_quest_progress table
CREATE TABLE IF NOT EXISTS public.partner_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES public.partner_quests(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 0,
  step_progress JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, quest_id)
);

-- Create partner_badges table
CREATE TABLE IF NOT EXISTS public.partner_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name TEXT NOT NULL UNIQUE,
  badge_description TEXT NOT NULL,
  badge_icon TEXT, -- Icon identifier
  requirement_type TEXT NOT NULL, -- 'xp_milestone', 'achievement', 'streak', 'quest'
  requirement_value JSONB NOT NULL, -- Flexible requirement structure
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner_badge_earnings table
CREATE TABLE IF NOT EXISTS public.partner_badge_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.partner_badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, badge_id)
);

-- Create community_feed table
CREATE TABLE IF NOT EXISTS public.community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'rank_up', 'badge_earned', 'milestone', 'announcement'
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vault_settings table
CREATE TABLE IF NOT EXISTS public.vault_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add streak tracking to deal_tracking
ALTER TABLE public.deal_tracking 
ADD COLUMN IF NOT EXISTS week_start_date DATE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_partner_challenge_progress_seller ON public.partner_challenge_progress(seller_id, completed);
CREATE INDEX IF NOT EXISTS idx_partner_quest_progress_seller ON public.partner_quest_progress(seller_id, completed);
CREATE INDEX IF NOT EXISTS idx_partner_badge_earnings_seller ON public.partner_badge_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_created ON public.community_feed(created_at DESC);

-- Enable RLS
ALTER TABLE public.partner_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_badge_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop policies if they exist to make migration idempotent
DROP POLICY IF EXISTS "Sellers can view their own season stats" ON public.partner_season_stats;
DROP POLICY IF EXISTS "Sellers can view active challenges" ON public.partner_challenges;
DROP POLICY IF EXISTS "Sellers can view their own challenge progress" ON public.partner_challenge_progress;
DROP POLICY IF EXISTS "Sellers can view active quests" ON public.partner_quests;
DROP POLICY IF EXISTS "Sellers can view their own quest progress" ON public.partner_quest_progress;
DROP POLICY IF EXISTS "Sellers can view all badges" ON public.partner_badges;
DROP POLICY IF EXISTS "Sellers can view their own badge earnings" ON public.partner_badge_earnings;
DROP POLICY IF EXISTS "Sellers can view community feed" ON public.community_feed;
DROP POLICY IF EXISTS "Sellers can view vault settings" ON public.vault_settings;
DROP POLICY IF EXISTS "Admins can manage all retention systems" ON public.partner_season_stats;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.partner_challenges;
DROP POLICY IF EXISTS "Admins can manage quests" ON public.partner_quests;
DROP POLICY IF EXISTS "Admins can manage badges" ON public.partner_badges;
DROP POLICY IF EXISTS "Admins can manage community feed" ON public.community_feed;
DROP POLICY IF EXISTS "Admins can manage vault settings" ON public.vault_settings;

CREATE POLICY "Sellers can view their own season stats"
  ON public.partner_season_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_season_stats.seller_id
    )
  );

CREATE POLICY "Sellers can view active challenges"
  ON public.partner_challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can view their own challenge progress"
  ON public.partner_challenge_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_challenge_progress.seller_id
    )
  );

CREATE POLICY "Sellers can view active quests"
  ON public.partner_quests FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can view their own quest progress"
  ON public.partner_quest_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_quest_progress.seller_id
    )
  );

CREATE POLICY "Sellers can view all badges"
  ON public.partner_badges FOR SELECT
  USING (true);

CREATE POLICY "Sellers can view their own badge earnings"
  ON public.partner_badge_earnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_badge_earnings.seller_id
    )
  );

CREATE POLICY "Sellers can view community feed"
  ON public.community_feed FOR SELECT
  USING (true);

CREATE POLICY "Sellers can view vault settings"
  ON public.vault_settings FOR SELECT
  USING (true);

-- Admins can manage everything
CREATE POLICY "Admins can manage all retention systems"
  ON public.partner_season_stats FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage challenges"
  ON public.partner_challenges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage quests"
  ON public.partner_quests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage badges"
  ON public.partner_badges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage community feed"
  ON public.community_feed FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage vault settings"
  ON public.vault_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to check weekly XP cap
CREATE OR REPLACE FUNCTION public.check_weekly_xp_cap(
  _seller_id UUID,
  _xp_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_weekly_xp INTEGER;
  xp_cap INTEGER;
  seller_rank TEXT;
BEGIN
  -- Get current weekly XP and rank
  SELECT weekly_xp, current_rank INTO current_weekly_xp, seller_rank
  FROM public.sellers
  WHERE id = _seller_id;

  -- Set cap based on rank
  IF seller_rank = 'Seller Pro' THEN
    xp_cap := 3000;
  ELSE
    xp_cap := 2000;
  END IF;

  -- Check if adding XP would exceed cap
  RETURN (current_weekly_xp + _xp_amount) <= xp_cap;
END;
$$;

-- Function to calculate diminishing returns multiplier
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

-- Function to check cooldown
CREATE OR REPLACE FUNCTION public.check_cooldown(
  _seller_id UUID,
  _event_type TEXT,
  _cooldown_days INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  last_event_date TIMESTAMPTZ;
BEGIN
  SELECT MAX(created_at) INTO last_event_date
  FROM public.partner_activity_log
  WHERE seller_id = _seller_id
    AND event_type = _event_type;

  -- If no previous event, cooldown passed
  IF last_event_date IS NULL THEN
    RETURN true;
  END IF;

  -- Check if cooldown period has passed
  RETURN (NOW() - last_event_date) >= (_cooldown_days || ' days')::INTERVAL;
END;
$$;

-- Updated add_seller_xp function with balancing
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
  final_xp_amount INTEGER;
  xp_multiplier DECIMAL(3,2);
  global_multiplier DECIMAL(3,2);
  weekly_xp_val INTEGER;
  can_earn_xp BOOLEAN;
  locked_lesson_id UUID;
BEGIN
  -- Check if seller is locked until completing a lesson
  SELECT locked_until_lesson_id INTO locked_lesson_id
  FROM public.sellers
  WHERE id = _seller_id;

  IF locked_lesson_id IS NOT NULL THEN
    -- Check if lesson is completed
    IF NOT EXISTS (
      SELECT 1 FROM public.partner_quiz_results
      WHERE seller_id = _seller_id
        AND lesson_id = locked_lesson_id
    ) THEN
      RAISE NOTICE 'XP locked until lesson % is completed', locked_lesson_id;
      RETURN (SELECT current_xp FROM public.sellers WHERE id = _seller_id);
    END IF;
  END IF;

  -- Check weekly XP cap
  can_earn_xp := public.check_weekly_xp_cap(_seller_id, _xp_amount);
  IF NOT can_earn_xp THEN
    RAISE NOTICE 'Weekly XP cap reached for seller %', _seller_id;
    RETURN (SELECT current_xp FROM public.sellers WHERE id = _seller_id);
  END IF;

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

  -- Update seller XP and weekly XP
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

  -- Log the activity
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

  -- NO AUTOMATIC RANK UP - User must manually advance via manual_rank_up() function
  -- Rank advancement is now handled by manual_rank_up() function which requires both XP and task completion

  RETURN new_xp;
END;
$$;

-- Function to reset weekly XP (should be called by cron)
CREATE OR REPLACE FUNCTION public.reset_weekly_xp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sellers
  SET weekly_xp = 0,
      last_weekly_reset = NOW()
  WHERE last_weekly_reset < NOW() - INTERVAL '7 days';
END;
$$;

-- Function to check and update login streak
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

    -- Award streak bonuses
    SELECT login_streak + 1 INTO current_streak FROM public.sellers WHERE id = _seller_id;
    
    IF current_streak = 3 THEN
      PERFORM public.add_seller_xp(_seller_id, 50, 'login_streak_3', '3-day login streak');
    ELSIF current_streak = 7 THEN
      PERFORM public.add_seller_xp(_seller_id, 150, 'login_streak_7', '7-day login streak');
    END IF;
  ELSIF last_login < today - INTERVAL '1 day' THEN
    -- Streak broken, reset to 1
    UPDATE public.sellers
    SET login_streak = 1,
        last_login_date = today
    WHERE id = _seller_id;
  ELSE
    -- Already logged in today, just update date
    UPDATE public.sellers
    SET last_login_date = today
    WHERE id = _seller_id;
  END IF;
END;
$$;

-- Initialize vault settings
INSERT INTO public.vault_settings (setting_key, setting_value)
VALUES ('xp_multiplier', '{"multiplier": 1.0}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.vault_settings (setting_key, setting_value)
VALUES ('current_season', '{"season_number": 1, "start_date": "2025-01-01", "end_date": "2025-03-31"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;






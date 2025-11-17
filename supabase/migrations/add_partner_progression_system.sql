-- Migration: Add Partner Progression System
-- This adds XP, ranks, lessons, quizzes, and unlocks to the partner system

-- Add XP and rank fields to sellers table
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_rank TEXT DEFAULT 'Recruit';

-- Create rank enum (if not exists)
-- Note: PostgreSQL doesn't support CREATE TYPE IF NOT EXISTS, so we use DO block
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_rank') THEN
    CREATE TYPE public.partner_rank AS ENUM ('Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro');
  END IF;
END $$;

-- Update sellers table to use rank enum (if needed, we'll keep TEXT for flexibility)
-- We'll keep TEXT for now to allow easier updates

-- Create partner_lessons table
CREATE TABLE IF NOT EXISTS public.partner_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage INTEGER NOT NULL,
  rank_required TEXT NOT NULL DEFAULT 'Recruit',
  lesson_type TEXT NOT NULL, -- 'course', 'task', 'quiz'
  title TEXT NOT NULL,
  content TEXT, -- For courses: lesson content, for tasks: instructions
  quiz_questions JSONB, -- Array of quiz questions
  quiz_answers JSONB, -- Array of correct answers
  xp_reward INTEGER DEFAULT 0,
  unlock_action TEXT, -- What this unlocks (e.g., 'stage_2', 'tab_automations', etc.)
  order_index INTEGER NOT NULL DEFAULT 0, -- Order within stage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner_quiz_results table
CREATE TABLE IF NOT EXISTS public.partner_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.partner_lessons(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL, -- Percentage score
  answers JSONB, -- User's answers
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, lesson_id)
);

-- Create partner_activity_log table
CREATE TABLE IF NOT EXISTS public.partner_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'xp_earned', 'rank_up', 'lesson_completed', 'task_completed'
  xp_value INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB, -- Additional event data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create automation_suggestions table
CREATE TABLE IF NOT EXISTS public.automation_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  problem_solves TEXT NOT NULL,
  estimated_client_type TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner_case_studies table
CREATE TABLE IF NOT EXISTS public.partner_case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT,
  automation_sold TEXT NOT NULL,
  result_summary TEXT NOT NULL,
  lessons_learned TEXT,
  approved BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add demo flag to clients table for Stage 4
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Add custom_sales_script to sellers table for Stage 3
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS custom_sales_script TEXT;

-- Create deal_tracking table for Stage 3
CREATE TABLE IF NOT EXISTS public.deal_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'dm', 'call', etc.
  client_name TEXT,
  status TEXT NOT NULL, -- 'no_response', 'follow_up', 'success', 'closed'
  reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.partner_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_lessons (public read for sellers)
DROP POLICY IF EXISTS "Sellers can view all lessons" ON public.partner_lessons;
CREATE POLICY "Sellers can view all lessons"
  ON public.partner_lessons FOR SELECT
  USING (true);

-- RLS Policies for partner_quiz_results
DROP POLICY IF EXISTS "Sellers can view their own quiz results" ON public.partner_quiz_results;
CREATE POLICY "Sellers can view their own quiz results"
  ON public.partner_quiz_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_quiz_results.seller_id
    )
  );

DROP POLICY IF EXISTS "Sellers can insert their own quiz results" ON public.partner_quiz_results;
CREATE POLICY "Sellers can insert their own quiz results"
  ON public.partner_quiz_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_quiz_results.seller_id
    )
  );

-- RLS Policies for partner_activity_log
DROP POLICY IF EXISTS "Sellers can view their own activity log" ON public.partner_activity_log;
CREATE POLICY "Sellers can view their own activity log"
  ON public.partner_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_activity_log.seller_id
    )
  );

DROP POLICY IF EXISTS "Sellers can insert their own activity log" ON public.partner_activity_log;
CREATE POLICY "Sellers can insert their own activity log"
  ON public.partner_activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_activity_log.seller_id
    )
  );

-- RLS Policies for automation_suggestions
DROP POLICY IF EXISTS "Sellers can view their own suggestions" ON public.automation_suggestions;
CREATE POLICY "Sellers can view their own suggestions"
  ON public.automation_suggestions FOR SELECT
  USING (
    seller_id IS NULL OR EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = automation_suggestions.seller_id
    )
  );

DROP POLICY IF EXISTS "Sellers can insert their own suggestions" ON public.automation_suggestions;
CREATE POLICY "Sellers can insert their own suggestions"
  ON public.automation_suggestions FOR INSERT
  WITH CHECK (
    seller_id IS NULL OR EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = automation_suggestions.seller_id
    )
  );

-- RLS Policies for partner_case_studies
DROP POLICY IF EXISTS "Sellers can manage their own case studies" ON public.partner_case_studies;
CREATE POLICY "Sellers can manage their own case studies"
  ON public.partner_case_studies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_case_studies.seller_id
    )
  );

-- RLS Policies for deal_tracking
DROP POLICY IF EXISTS "Sellers can manage their own deal tracking" ON public.deal_tracking;
CREATE POLICY "Sellers can manage their own deal tracking"
  ON public.deal_tracking FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = deal_tracking.seller_id
    )
  );

-- Admins can manage everything
DROP POLICY IF EXISTS "Admins can manage partner_quiz_results" ON public.partner_quiz_results;
CREATE POLICY "Admins can manage partner_quiz_results"
  ON public.partner_quiz_results FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage partner_activity_log" ON public.partner_activity_log;
CREATE POLICY "Admins can manage partner_activity_log"
  ON public.partner_activity_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage automation_suggestions" ON public.automation_suggestions;
CREATE POLICY "Admins can manage automation_suggestions"
  ON public.automation_suggestions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage partner_case_studies" ON public.partner_case_studies;
CREATE POLICY "Admins can manage partner_case_studies"
  ON public.partner_case_studies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage deal_tracking" ON public.deal_tracking;
CREATE POLICY "Admins can manage deal_tracking"
  ON public.deal_tracking FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to add XP to a seller
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
BEGIN
  -- Update seller XP
  UPDATE public.sellers
  SET current_xp = current_xp + _xp_amount
  WHERE id = _seller_id
  RETURNING current_xp, current_rank INTO new_xp, current_rank_val;

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
    _xp_amount,
    _description,
    _metadata
  );

  -- Check for rank up
  new_rank_val := public.calculate_seller_rank(new_xp);
  
  IF new_rank_val != current_rank_val THEN
    -- Rank up!
    UPDATE public.sellers
    SET current_rank = new_rank_val,
        commission_rate = public.get_rank_commission_rate(new_rank_val)
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
  END IF;

  RETURN new_xp;
END;
$$;

-- Function to calculate seller rank based on XP
CREATE OR REPLACE FUNCTION public.calculate_seller_rank(_xp INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF _xp >= 10000 THEN
    RETURN 'Seller Pro';
  ELSIF _xp >= 7000 THEN
    RETURN 'Verified';
  ELSIF _xp >= 4500 THEN
    RETURN 'Partner';
  ELSIF _xp >= 2500 THEN
    RETURN 'Agent';
  ELSIF _xp >= 1000 THEN
    RETURN 'Apprentice';
  ELSE
    RETURN 'Recruit';
  END IF;
END;
$$;

-- Function to get commission rate for rank
CREATE OR REPLACE FUNCTION public.get_rank_commission_rate(_rank TEXT)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE _rank
    WHEN 'Recruit' THEN RETURN 25.00;
    WHEN 'Recruit Plus' THEN RETURN 25.00;
    WHEN 'Apprentice' THEN RETURN 30.00;
    WHEN 'Apprentice Plus' THEN RETURN 30.00;
    WHEN 'Agent' THEN RETURN 33.00;
    WHEN 'Agent Plus' THEN RETURN 33.00;
    WHEN 'Verified' THEN RETURN 36.00;
    WHEN 'Verified Plus' THEN RETURN 36.00;
    WHEN 'Partner' THEN RETURN 40.00;
    WHEN 'Partner Plus' THEN RETURN 40.00;
    WHEN 'Partner Pro' THEN RETURN 45.00;
    WHEN 'Seller Pro' THEN RETURN 45.00;
    ELSE RETURN 25.00;
  END CASE;
END;
$$;

-- Trigger: When transaction is created, award XP if it's seller's first sale
CREATE OR REPLACE FUNCTION public.handle_first_sale_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale_count INTEGER;
BEGIN
  -- Check if this is seller's first sale
  SELECT COUNT(*) INTO sale_count
  FROM public.transactions
  WHERE seller_id = NEW.seller_id
    AND transaction_type = 'setup';

  -- If this is the first setup transaction, award XP
  IF sale_count = 1 AND NEW.transaction_type = 'setup' THEN
    PERFORM public.add_seller_xp(
      NEW.seller_id,
      2000,
      'first_sale',
      'Completed first automation sale',
      jsonb_build_object('transaction_id', NEW.id, 'client_id', NEW.client_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS first_sale_xp_trigger ON public.transactions;
CREATE TRIGGER first_sale_xp_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.seller_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_first_sale_xp();

-- Trigger: When client is added via referral, award XP
CREATE OR REPLACE FUNCTION public.handle_referral_client_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award XP for new client (if not demo)
  IF NEW.seller_id IS NOT NULL AND (NEW.is_demo IS NULL OR NEW.is_demo = false) THEN
    -- Check if this is first real client
    SELECT COUNT(*) INTO NEW.seller_id
    FROM public.clients
    WHERE seller_id = NEW.seller_id
      AND (is_demo IS NULL OR is_demo = false);

    -- Award XP for first real client (Task 11)
    IF (SELECT COUNT(*) FROM public.clients WHERE seller_id = NEW.seller_id AND (is_demo IS NULL OR is_demo = false)) = 1 THEN
      PERFORM public.add_seller_xp(
        NEW.seller_id,
        1500,
        'first_real_client',
        'Invited first real client',
        jsonb_build_object('client_id', NEW.id)
      );
    ELSE
      -- Award regular XP for new client
      PERFORM public.add_seller_xp(
        NEW.seller_id,
        250,
        'new_client',
        'New client added',
        jsonb_build_object('client_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_client_xp_trigger ON public.clients;
CREATE TRIGGER referral_client_xp_trigger
  AFTER INSERT ON public.clients
  FOR EACH ROW
  WHEN (NEW.seller_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_referral_client_xp();

-- Trigger: When automation is assigned to real client, award XP
CREATE OR REPLACE FUNCTION public.handle_automation_assignment_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_demo_client BOOLEAN;
  is_first_assignment BOOLEAN;
BEGIN
  -- Check if client is demo
  SELECT is_demo INTO is_demo_client
  FROM public.clients
  WHERE id = NEW.client_id;

  -- Check if this is first real automation assignment
  IF NEW.seller_id IS NOT NULL AND (is_demo_client IS NULL OR is_demo_client = false) THEN
    SELECT COUNT(*) = 0 INTO is_first_assignment
    FROM public.client_automations
    WHERE seller_id = NEW.seller_id
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_automations.client_id
          AND (c.is_demo IS NULL OR c.is_demo = false)
      );

    IF is_first_assignment THEN
      -- Task 12: First real automation assignment
      PERFORM public.add_seller_xp(
        NEW.seller_id,
        1000,
        'first_real_automation',
        'Assigned first automation to real client',
        jsonb_build_object('client_automation_id', NEW.id, 'automation_id', NEW.automation_id)
      );
    END IF;
  ELSIF NEW.seller_id IS NOT NULL AND is_demo_client = true THEN
    -- Task 8: Demo automation assignment
    PERFORM public.add_seller_xp(
      NEW.seller_id,
      800,
      'demo_automation_assigned',
      'Assigned demo automation',
      jsonb_build_object('client_automation_id', NEW.id, 'automation_id', NEW.automation_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS automation_assignment_xp_trigger ON public.client_automations;
CREATE TRIGGER automation_assignment_xp_trigger
  AFTER INSERT ON public.client_automations
  FOR EACH ROW
  WHEN (NEW.seller_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_automation_assignment_xp();

-- Initialize existing sellers with Recruit rank and 0 XP
UPDATE public.sellers
SET current_xp = 0,
    current_rank = 'Recruit',
    commission_rate = 25.00
WHERE current_xp IS NULL OR current_rank IS NULL;


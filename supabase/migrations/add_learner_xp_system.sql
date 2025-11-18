-- Add XP system for learners
-- This adds XP tracking and quiz best score tracking

-- Add XP field to learners table
ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0;

-- Add quiz_id to module_access_tokens to link quizzes to modules
ALTER TABLE public.module_access_tokens
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- Add quiz_id to learner_modules to track which quiz is linked
ALTER TABLE public.learner_modules
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- Create table to track best quiz scores per learner per quiz
CREATE TABLE IF NOT EXISTS public.learner_quiz_best_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0, -- Best score percentage (0-100)
  best_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  total_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(learner_id, quiz_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_learner_quiz_best_scores_learner_quiz 
ON public.learner_quiz_best_scores(learner_id, quiz_id);

-- Function to update best score when a quiz attempt is made
CREATE OR REPLACE FUNCTION public.update_learner_quiz_best_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_best INTEGER;
  new_xp INTEGER;
  previous_xp INTEGER;
  xp_difference INTEGER;
BEGIN
  -- Get or create best score record
  INSERT INTO public.learner_quiz_best_scores (learner_id, quiz_id, best_score, best_attempt_id, total_attempts)
  VALUES (NEW.learner_id, NEW.quiz_id, NEW.score, NEW.id, 1)
  ON CONFLICT (learner_id, quiz_id) 
  DO UPDATE SET
    total_attempts = learner_quiz_best_scores.total_attempts + 1,
    updated_at = NOW();

  -- Get current best score
  SELECT best_score INTO current_best
  FROM public.learner_quiz_best_scores
  WHERE learner_id = NEW.learner_id AND quiz_id = NEW.quiz_id;

  -- Only update if new score is higher
  IF NEW.score > current_best THEN
    -- Calculate XP: score% of 1000 XP
    new_xp := (NEW.score * 1000) / 100;
    previous_xp := (current_best * 1000) / 100;
    xp_difference := new_xp - previous_xp;

    -- Update best score
    UPDATE public.learner_quiz_best_scores
    SET 
      best_score = NEW.score,
      best_attempt_id = NEW.id,
      updated_at = NOW()
    WHERE learner_id = NEW.learner_id AND quiz_id = NEW.quiz_id;

    -- Award XP difference (only if positive)
    IF xp_difference > 0 THEN
      UPDATE public.learners
      SET current_xp = current_xp + xp_difference
      WHERE id = NEW.learner_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically update best scores and award XP
DROP TRIGGER IF EXISTS trigger_update_learner_quiz_best_score ON public.quiz_attempts;
CREATE TRIGGER trigger_update_learner_quiz_best_score
AFTER INSERT ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_learner_quiz_best_score();

-- Enable RLS on new table
ALTER TABLE public.learner_quiz_best_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learner_quiz_best_scores
CREATE POLICY "Learners can view their own best scores"
  ON public.learner_quiz_best_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE id = learner_quiz_best_scores.learner_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all best scores"
  ON public.learner_quiz_best_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


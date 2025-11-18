-- Fix RLS policies for learner_quiz_best_scores to allow trigger function to insert
-- The trigger function update_learner_quiz_best_score() needs to insert/update this table
-- This fixes the 403 error: "new row violates row-level security policy for table 'learner_quiz_best_scores'"

-- Option 1: Make the trigger function SECURITY DEFINER (recommended)
-- This allows the function to bypass RLS when called by the trigger
ALTER FUNCTION public.update_learner_quiz_best_score() SECURITY DEFINER;

-- Option 2: Add INSERT and UPDATE policies (backup, but function should handle it)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Learners can view their own best scores" ON public.learner_quiz_best_scores;
DROP POLICY IF EXISTS "Admins can view all best scores" ON public.learner_quiz_best_scores;

-- Recreate SELECT policies
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

-- Add INSERT policy for the trigger function
-- The trigger function runs as SECURITY DEFINER, but having this policy helps
CREATE POLICY "System can insert best scores via trigger"
  ON public.learner_quiz_best_scores FOR INSERT
  WITH CHECK (true); -- Allow trigger function to insert

-- Add UPDATE policy for the trigger function
CREATE POLICY "System can update best scores via trigger"
  ON public.learner_quiz_best_scores FOR UPDATE
  USING (true) -- Allow trigger function to update
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.learner_quiz_best_scores TO authenticated;
GRANT SELECT ON public.learners TO authenticated;


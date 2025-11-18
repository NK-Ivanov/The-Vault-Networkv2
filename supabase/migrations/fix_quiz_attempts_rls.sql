-- Fix RLS policies for quiz_attempts to allow learners to insert their attempts
-- This fixes the 403 error when submitting quizzes

-- Drop existing policies if they exist (using the exact names from create_quiz_system.sql)
DROP POLICY IF EXISTS "Learners can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Learners can create their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Recreate RLS Policies for quiz_attempts with proper permissions
CREATE POLICY "Learners can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE id = quiz_attempts.learner_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Learners can create their own attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE id = quiz_attempts.learner_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all attempts"
  ON public.quiz_attempts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


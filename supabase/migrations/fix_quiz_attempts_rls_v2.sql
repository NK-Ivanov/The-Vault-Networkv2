-- Fix RLS policies for quiz_attempts to allow learners to insert their attempts
-- This fixes the 403 error when submitting quizzes
-- Version 2: More robust policy that ensures RLS is enabled and policies are correct

-- Ensure RLS is enabled
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on quiz_attempts to start fresh
DROP POLICY IF EXISTS "Learners can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Learners can create their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can manage all attempts" ON public.quiz_attempts;

-- Recreate RLS Policies for quiz_attempts with proper permissions
-- SELECT: Learners can view their own attempts
CREATE POLICY "Learners can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE id = quiz_attempts.learner_id 
        AND user_id = auth.uid()
    )
  );

-- INSERT: Learners can create their own attempts
-- This is the critical policy that was causing 403 errors
CREATE POLICY "Learners can create their own attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE id = quiz_attempts.learner_id 
        AND user_id = auth.uid()
    )
  );

-- SELECT: Admins can view all attempts
CREATE POLICY "Admins can view all attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  );

-- ALL: Admins can manage all attempts (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all attempts"
  ON public.quiz_attempts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  );

-- Grant necessary permissions to authenticated users
-- This ensures the policies can be evaluated
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT SELECT ON public.learners TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;


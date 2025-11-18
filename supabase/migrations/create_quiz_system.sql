-- Create Quiz System for Learner Modules
-- This allows admins to create quizzes and assign them to modules

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  module_id TEXT, -- Optional: link to a specific module
  passing_score INTEGER DEFAULT 70, -- Percentage required to pass
  time_limit_minutes INTEGER, -- Optional time limit
  max_attempts INTEGER DEFAULT 3, -- Maximum number of attempts
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT, -- Optional explanation for the answer
  points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quiz_id, question_number)
);

-- Create quiz_attempts table (tracks learner quiz attempts)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL, -- Percentage score
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL, -- Store user's answers: {"1": "A", "2": "B", ...}
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quiz_access_tokens table (for unique quiz links)
CREATE TABLE IF NOT EXISTS public.quiz_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE, -- Unique token for the quiz link
  link_title TEXT, -- Custom title for the link
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Admins can manage all quizzes"
  ON public.quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active quizzes"
  ON public.quizzes FOR SELECT
  USING (is_active = true);

-- RLS Policies for quiz_questions
CREATE POLICY "Admins can manage all quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view questions for active quizzes"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_questions.quiz_id AND is_active = true
    )
  );

-- RLS Policies for quiz_attempts
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

-- RLS Policies for quiz_access_tokens
CREATE POLICY "Admins can manage quiz access tokens"
  ON public.quiz_access_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active quiz tokens"
  ON public.quiz_access_tokens FOR SELECT
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_learner_id ON public.quiz_attempts(learner_id);
CREATE INDEX IF NOT EXISTS idx_quiz_access_tokens_token ON public.quiz_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_quiz_access_tokens_quiz_id ON public.quiz_access_tokens(quiz_id);

-- Function to get quiz link
CREATE OR REPLACE FUNCTION public.get_quiz_link(_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  _quiz_id UUID;
BEGIN
  SELECT quiz_id INTO _quiz_id
  FROM public.quiz_access_tokens
  WHERE token = _token AND is_active = true;
  
  IF _quiz_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return the quiz link (will be constructed in the frontend)
  RETURN _token;
END;
$$;


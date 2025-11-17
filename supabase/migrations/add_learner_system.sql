-- Migration: Add Learner System
-- Creates learner role, learners table, modules system, and access tokens for Discord links

-- Add 'learner' to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'client', 'learner');
  ELSE
    -- Add 'learner' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'learner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
      ALTER TYPE public.app_role ADD VALUE 'learner';
    END IF;
  END IF;
END $$;

-- Create learners table
CREATE TABLE IF NOT EXISTS public.learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add discord_tag column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'learners' 
    AND column_name = 'discord_tag'
  ) THEN
    ALTER TABLE public.learners ADD COLUMN discord_tag TEXT;
    COMMENT ON COLUMN public.learners.discord_tag IS 'Discord username/tag (e.g., "username#1234" or "username")';
  END IF;
END $$;

-- Create learner_modules table (modules that learners have access to)
CREATE TABLE IF NOT EXISTS public.learner_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT NOT NULL, -- Identifier for the module (e.g., 'automation-basics-101')
  module_title TEXT NOT NULL,
  module_description TEXT,
  module_content JSONB, -- Flexible content storage (can contain slides, lessons, etc.)
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}'::jsonb, -- Track progress through the module
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(learner_id, module_id)
);

-- Create module_access_tokens table (for Discord link tokens)
CREATE TABLE IF NOT EXISTS public.module_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE, -- The token used in Discord links
  module_id TEXT NOT NULL,
  module_title TEXT NOT NULL,
  module_description TEXT,
  module_content JSONB,
  expires_at TIMESTAMPTZ, -- Optional expiration
  max_uses INTEGER, -- Optional max number of uses
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id), -- Admin who created the token
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_access_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Learners can view their own data" ON public.learners;
DROP POLICY IF EXISTS "Learners can update their own data" ON public.learners;
DROP POLICY IF EXISTS "Anyone can enroll as a learner" ON public.learners;
DROP POLICY IF EXISTS "Admins can view all learners" ON public.learners;
DROP POLICY IF EXISTS "Admins can manage all learners" ON public.learners;

DROP POLICY IF EXISTS "Learners can view their own modules" ON public.learner_modules;
DROP POLICY IF EXISTS "Learners can update their own modules" ON public.learner_modules;
DROP POLICY IF EXISTS "Admins can view all learner modules" ON public.learner_modules;
DROP POLICY IF EXISTS "Admins can manage all learner modules" ON public.learner_modules;

DROP POLICY IF EXISTS "Anyone can view active tokens" ON public.module_access_tokens;
DROP POLICY IF EXISTS "Admins can manage tokens" ON public.module_access_tokens;

-- RLS Policies for learners
CREATE POLICY "Learners can view their own data"
  ON public.learners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Learners can update their own data"
  ON public.learners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can enroll as a learner"
  ON public.learners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all learners"
  ON public.learners FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all learners"
  ON public.learners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for learner_modules
CREATE POLICY "Learners can view their own modules"
  ON public.learner_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learners l
      WHERE l.id = learner_modules.learner_id
        AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Learners can update their own modules"
  ON public.learner_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.learners l
      WHERE l.id = learner_modules.learner_id
        AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all learner modules"
  ON public.learner_modules FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all learner modules"
  ON public.learner_modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for module_access_tokens (anyone can view active tokens to validate them)
CREATE POLICY "Anyone can view active tokens"
  ON public.module_access_tokens FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage tokens"
  ON public.module_access_tokens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to enroll a user as a learner
CREATE OR REPLACE FUNCTION public.enroll_as_learner(
  _full_name TEXT,
  _email TEXT,
  _discord_tag TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _learner_id UUID;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if user is already a learner
  SELECT id INTO _learner_id
  FROM public.learners
  WHERE user_id = _user_id;
  
  IF _learner_id IS NOT NULL THEN
    -- Update existing learner with new discord tag if provided
    IF _discord_tag IS NOT NULL THEN
      UPDATE public.learners
      SET discord_tag = _discord_tag,
          updated_at = NOW()
      WHERE id = _learner_id;
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Already enrolled as a learner');
  END IF;
  
  -- Create learner record
  INSERT INTO public.learners (user_id, full_name, email, discord_tag)
  VALUES (_user_id, _full_name, _email, _discord_tag)
  RETURNING id INTO _learner_id;
  
  -- Assign learner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'learner')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'learner_id', _learner_id,
    'message', 'Successfully enrolled as a learner'
  );
END;
$$;

-- Function to get module token info without redeeming it (for preview)
CREATE OR REPLACE FUNCTION public.get_module_token_info(
  _token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token_record RECORD;
BEGIN
  -- Find the token
  SELECT * INTO _token_record
  FROM public.module_access_tokens
  WHERE token = _token
    AND is_active = TRUE;
  
  IF _token_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive token');
  END IF;
  
  -- Check expiration
  IF _token_record.expires_at IS NOT NULL AND _token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token has expired');
  END IF;
  
  -- Check max uses
  IF _token_record.max_uses IS NOT NULL AND _token_record.current_uses >= _token_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token has reached maximum uses');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'module_id', _token_record.module_id,
    'module_title', _token_record.module_title,
    'module_description', _token_record.module_description,
    'module_content', _token_record.module_content,
    'expires_at', _token_record.expires_at,
    'max_uses', _token_record.max_uses,
    'current_uses', _token_record.current_uses
  );
END;
$$;

-- Function to redeem a module access token (adds module to learner's dashboard)
CREATE OR REPLACE FUNCTION public.redeem_module_token(
  _token TEXT,
  _learner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token_record RECORD;
  _existing_module_id UUID;
BEGIN
  -- Verify learner exists and belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM public.learners l
    WHERE l.id = _learner_id AND l.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid learner ID');
  END IF;
  
  -- Find the token
  SELECT * INTO _token_record
  FROM public.module_access_tokens
  WHERE token = _token
    AND is_active = TRUE;
  
  IF _token_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;
  
  -- Check expiration
  IF _token_record.expires_at IS NOT NULL AND _token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token has expired');
  END IF;
  
  -- Check max uses
  IF _token_record.max_uses IS NOT NULL AND _token_record.current_uses >= _token_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token has reached maximum uses');
  END IF;
  
  -- Check if learner already has this module
  SELECT id INTO _existing_module_id
  FROM public.learner_modules
  WHERE learner_id = _learner_id
    AND module_id = _token_record.module_id;
  
  IF _existing_module_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have access to this module');
  END IF;
  
  -- Add module to learner's dashboard
  INSERT INTO public.learner_modules (
    learner_id,
    module_id,
    module_title,
    module_description,
    module_content
  )
  VALUES (
    _learner_id,
    _token_record.module_id,
    _token_record.module_title,
    _token_record.module_description,
    _token_record.module_content
  );
  
  -- Increment token usage
  UPDATE public.module_access_tokens
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = _token_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Module added to your dashboard',
    'module_title', _token_record.module_title
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learners_user_id ON public.learners(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_modules_learner_id ON public.learner_modules(learner_id);
CREATE INDEX IF NOT EXISTS idx_learner_modules_module_id ON public.learner_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_module_access_tokens_token ON public.module_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_module_access_tokens_active ON public.module_access_tokens(is_active);


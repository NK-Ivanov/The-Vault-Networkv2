-- Migration: Add Vault Library System for Partners
-- This allows partners to add learning resources/modules to their library through shared links

-- Create vault_library table (resources/modules that partners have access to)
CREATE TABLE IF NOT EXISTS public.vault_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  resource_id TEXT NOT NULL, -- Identifier for the resource (e.g., 'sales-advanced-101')
  resource_title TEXT NOT NULL,
  resource_description TEXT,
  resource_content JSONB, -- Flexible content storage (can contain slides, lessons, articles, etc.)
  resource_type TEXT DEFAULT 'module', -- 'module', 'course', 'article', 'video', 'guide', etc.
  resource_url TEXT, -- External URL if the resource is hosted elsewhere
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}'::jsonb, -- Track progress through the resource
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, resource_id)
);

-- Create vault_library_tokens table (for shared links to add resources)
CREATE TABLE IF NOT EXISTS public.vault_library_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE, -- The token used in shared links
  resource_id TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  resource_description TEXT,
  resource_content JSONB,
  resource_type TEXT DEFAULT 'module',
  resource_url TEXT,
  expires_at TIMESTAMPTZ, -- Optional expiration
  max_uses INTEGER, -- Optional max number of uses
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id), -- Admin who created the token
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vault_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_library_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Partners can view their own library resources" ON public.vault_library;
DROP POLICY IF EXISTS "Partners can update their own library resources" ON public.vault_library;
DROP POLICY IF EXISTS "Partners can insert their own library resources" ON public.vault_library;
DROP POLICY IF EXISTS "Admins can view all vault library resources" ON public.vault_library;
DROP POLICY IF EXISTS "Admins can manage all vault library resources" ON public.vault_library;

DROP POLICY IF EXISTS "Anyone can view active vault library tokens" ON public.vault_library_tokens;
DROP POLICY IF EXISTS "Admins can manage vault library tokens" ON public.vault_library_tokens;

-- RLS Policies for vault_library
CREATE POLICY "Partners can view their own library resources"
  ON public.vault_library FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = vault_library.seller_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update their own library resources"
  ON public.vault_library FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = vault_library.seller_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can insert their own library resources"
  ON public.vault_library FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = vault_library.seller_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all vault library resources"
  ON public.vault_library FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all vault library resources"
  ON public.vault_library FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vault_library_tokens
CREATE POLICY "Anyone can view active vault library tokens"
  ON public.vault_library_tokens FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can manage vault library tokens"
  ON public.vault_library_tokens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to get vault library token info (similar to get_module_token_info)
CREATE OR REPLACE FUNCTION public.get_vault_library_token_info(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Get token info
  SELECT * INTO token_record
  FROM public.vault_library_tokens
  WHERE token = _token
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired token'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'resource_id', token_record.resource_id,
    'resource_title', token_record.resource_title,
    'resource_description', token_record.resource_description,
    'resource_content', token_record.resource_content,
    'resource_type', token_record.resource_type,
    'resource_url', token_record.resource_url
  );
END;
$$;

-- Function to redeem vault library token (similar to redeem_module_token)
CREATE OR REPLACE FUNCTION public.redeem_vault_library_token(
  _token TEXT,
  _seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
  existing_resource RECORD;
BEGIN
  -- Get token info
  SELECT * INTO token_record
  FROM public.vault_library_tokens
  WHERE token = _token
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
  FOR UPDATE; -- Lock the row to prevent race conditions
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired token'
    );
  END IF;
  
  -- Check if seller already has this resource
  SELECT * INTO existing_resource
  FROM public.vault_library
  WHERE seller_id = _seller_id
    AND resource_id = token_record.resource_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You already have this resource in your library'
    );
  END IF;
  
  -- Add resource to seller's library
  INSERT INTO public.vault_library (
    seller_id,
    resource_id,
    resource_title,
    resource_description,
    resource_content,
    resource_type,
    resource_url
  ) VALUES (
    _seller_id,
    token_record.resource_id,
    token_record.resource_title,
    token_record.resource_description,
    token_record.resource_content,
    token_record.resource_type,
    token_record.resource_url
  );
  
  -- Update token usage count
  UPDATE public.vault_library_tokens
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE token = _token;
  
  RETURN jsonb_build_object(
    'success', true,
    'resource_id', token_record.resource_id,
    'resource_title', token_record.resource_title
  );
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vault_library_seller_id ON public.vault_library(seller_id);
CREATE INDEX IF NOT EXISTS idx_vault_library_resource_id ON public.vault_library(resource_id);
CREATE INDEX IF NOT EXISTS idx_vault_library_tokens_token ON public.vault_library_tokens(token);
CREATE INDEX IF NOT EXISTS idx_vault_library_tokens_active ON public.vault_library_tokens(is_active, expires_at);


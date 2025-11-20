-- Migration: Add Vault Library Modules System
-- This allows admins to create modules with JSON content, quizzes, rank requirements, and XP rewards

-- Create vault_library_modules table (published modules available to partners)
CREATE TABLE IF NOT EXISTS public.vault_library_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  min_rank TEXT NOT NULL DEFAULT 'Recruit', -- Minimum rank required to access
  module_data JSONB NOT NULL, -- Contains sections and quiz
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vault_library_module_progress table (tracks partner progress through modules)
CREATE TABLE IF NOT EXISTS public.vault_library_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.vault_library_modules(id) ON DELETE CASCADE NOT NULL,
  current_section INTEGER DEFAULT 0, -- Which section they're on
  completed_sections JSONB DEFAULT '[]'::jsonb, -- Array of completed section indices
  quiz_answers JSONB DEFAULT '{}'::jsonb, -- User's quiz answers
  quiz_score INTEGER, -- Percentage score
  quiz_completed BOOLEAN DEFAULT FALSE,
  module_completed BOOLEAN DEFAULT FALSE,
  xp_awarded BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, module_id)
);

-- Enable RLS
ALTER TABLE public.vault_library_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_library_module_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage vault library modules" ON public.vault_library_modules;
DROP POLICY IF EXISTS "Partners can view published vault library modules" ON public.vault_library_modules;
DROP POLICY IF EXISTS "Partners can view their own module progress" ON public.vault_library_module_progress;
DROP POLICY IF EXISTS "Partners can update their own module progress" ON public.vault_library_module_progress;
DROP POLICY IF EXISTS "Admins can view all module progress" ON public.vault_library_module_progress;

-- RLS Policies for vault_library_modules
CREATE POLICY "Admins can manage vault library modules"
  ON public.vault_library_modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view published vault library modules"
  ON public.vault_library_modules FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
    )
  );

-- RLS Policies for vault_library_module_progress
CREATE POLICY "Partners can view their own module progress"
  ON public.vault_library_module_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = vault_library_module_progress.seller_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update their own module progress"
  ON public.vault_library_module_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = vault_library_module_progress.seller_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all module progress"
  ON public.vault_library_module_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vault_library_modules_published ON public.vault_library_modules(is_published, min_rank);
CREATE INDEX IF NOT EXISTS idx_vault_library_modules_category ON public.vault_library_modules(category);
CREATE INDEX IF NOT EXISTS idx_vault_library_module_progress_seller ON public.vault_library_module_progress(seller_id);
CREATE INDEX IF NOT EXISTS idx_vault_library_module_progress_module ON public.vault_library_module_progress(module_id);

-- Function to check if seller can access a module (rank requirement)
CREATE OR REPLACE FUNCTION public.can_access_vault_module(
  _seller_id UUID,
  _module_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_rank TEXT;
  module_min_rank TEXT;
  rank_order INTEGER[] := ARRAY[
    0, -- Recruit
    1, -- Recruit Plus
    2, -- Apprentice
    3, -- Apprentice Plus
    4, -- Agent
    5, -- Agent Plus
    6, -- Verified
    7, -- Verified Plus
    8, -- Partner
    9, -- Partner Plus
    10 -- Partner Pro
  ];
  seller_rank_index INTEGER;
  module_rank_index INTEGER;
BEGIN
  -- Get seller's current rank
  SELECT current_rank INTO seller_rank
  FROM public.sellers
  WHERE id = _seller_id;
  
  IF seller_rank IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get module's minimum rank requirement
  SELECT min_rank INTO module_min_rank
  FROM public.vault_library_modules
  WHERE id = _module_id
    AND is_published = TRUE;
  
  IF module_min_rank IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get rank indices
  SELECT array_position(ARRAY['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'], seller_rank) - 1
  INTO seller_rank_index;
  
  SELECT array_position(ARRAY['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'], module_min_rank) - 1
  INTO module_rank_index;
  
  -- Seller can access if their rank index >= module's minimum rank index
  RETURN seller_rank_index >= module_rank_index;
END;
$$;


-- Fix accessed_at default value
-- Remove DEFAULT NOW() from accessed_at so it starts as NULL
-- This ensures "Start Module" shows for newly added modules

ALTER TABLE public.learner_modules
ALTER COLUMN accessed_at DROP DEFAULT;

-- Update any existing modules that were incorrectly marked as accessed
-- Set accessed_at to NULL if it was set on the same day as created_at
-- (indicating it was auto-set by the default)
UPDATE public.learner_modules
SET accessed_at = NULL
WHERE accessed_at IS NOT NULL
  AND DATE(accessed_at) = DATE(created_at)
  AND accessed_at = created_at;


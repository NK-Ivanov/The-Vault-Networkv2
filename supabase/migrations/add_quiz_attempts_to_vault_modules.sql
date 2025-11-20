-- Migration: Add Quiz Attempt Tracking to Vault Library Modules
-- Allows partners to retake quizzes up to 3 times, tracking attempts and best score

-- Add quiz attempt tracking fields to vault_library_module_progress
ALTER TABLE public.vault_library_module_progress
ADD COLUMN IF NOT EXISTS quiz_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_quiz_score INTEGER;

-- Update existing records to set quiz_attempts = 1 if quiz_completed = true
UPDATE public.vault_library_module_progress
SET quiz_attempts = 1,
    best_quiz_score = quiz_score
WHERE quiz_completed = TRUE
  AND quiz_attempts = 0;


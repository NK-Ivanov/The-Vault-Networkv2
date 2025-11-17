-- Quick fix: Add discord_tag column to existing learners table
-- Run this in your Supabase SQL Editor if the column doesn't exist

-- Add discord_tag column if it doesn't exist
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
    RAISE NOTICE 'discord_tag column added successfully';
  ELSE
    RAISE NOTICE 'discord_tag column already exists';
  END IF;
END $$;


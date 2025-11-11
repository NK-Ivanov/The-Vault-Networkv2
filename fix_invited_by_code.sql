-- Quick fix: Add invited_by_code column to clients table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS invited_by_code TEXT;

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients' 
  AND column_name = 'invited_by_code';


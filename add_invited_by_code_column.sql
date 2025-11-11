-- Add invited_by_code column to clients table
-- Run this in your Supabase SQL Editor if the column doesn't exist

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS invited_by_code TEXT;

-- Verify the column was added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'clients' AND column_name = 'invited_by_code';


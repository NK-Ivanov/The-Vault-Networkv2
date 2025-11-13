-- Migration: Make user_id nullable for demo clients
-- Demo clients don't have user accounts, so user_id should be nullable

-- First, drop the NOT NULL constraint on user_id
ALTER TABLE public.clients 
ALTER COLUMN user_id DROP NOT NULL;

-- Update the unique constraint to allow multiple NULL values
-- PostgreSQL allows multiple NULLs in a unique constraint by default, but let's be explicit
-- If there's a unique constraint on user_id, we may need to drop and recreate it
DO $$
BEGIN
  -- Check if there's a unique constraint on user_id
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_user_id_key' 
    AND conrelid = 'public.clients'::regclass
  ) THEN
    -- Drop the unique constraint
    ALTER TABLE public.clients DROP CONSTRAINT clients_user_id_key;
    
    -- Recreate it as a partial unique constraint (allows multiple NULLs)
    CREATE UNIQUE INDEX clients_user_id_key ON public.clients(user_id) 
    WHERE user_id IS NOT NULL;
  END IF;
END $$;

-- Add a check constraint to ensure non-demo clients have user_id
ALTER TABLE public.clients 
DROP CONSTRAINT IF EXISTS clients_non_demo_must_have_user_id;

ALTER TABLE public.clients 
ADD CONSTRAINT clients_non_demo_must_have_user_id 
CHECK (is_demo = true OR user_id IS NOT NULL);


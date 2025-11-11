-- Fix RLS policies and add missing column for referral code functionality
-- Run this in your Supabase SQL Editor

-- 1. Add invited_by_code column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS invited_by_code TEXT;

-- 2. Allow users to insert their own roles (needed for client/seller signup)
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Allow anyone to view approved sellers for referral code lookups
-- This is needed so clients can look up sellers by referral code during signup
DROP POLICY IF EXISTS "Anyone can view approved sellers for referral lookup" ON public.sellers;
CREATE POLICY "Anyone can view approved sellers for referral lookup"
  ON public.sellers FOR SELECT
  USING (status = 'approved' AND referral_code IS NOT NULL);

-- Verify the changes
SELECT 'invited_by_code column exists' as check_result
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'invited_by_code'
);

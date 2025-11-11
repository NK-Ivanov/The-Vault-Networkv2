-- Fix existing clients: Update seller_id for clients with invited_by_code but no seller_id
-- Run this in your Supabase SQL Editor

-- First, let's see which clients need to be updated
SELECT 
  c.id,
  c.business_name,
  c.invited_by_code,
  c.seller_id,
  s.id as correct_seller_id,
  s.business_name as seller_business_name
FROM public.clients c
LEFT JOIN public.sellers s ON s.referral_code = c.invited_by_code AND s.status = 'approved'
WHERE c.invited_by_code IS NOT NULL 
  AND c.seller_id IS NULL
  AND s.id IS NOT NULL;

-- Update clients to link them to the correct seller
UPDATE public.clients c
SET seller_id = s.id
FROM public.sellers s
WHERE c.invited_by_code = s.referral_code
  AND s.status = 'approved'
  AND c.seller_id IS NULL
  AND c.invited_by_code IS NOT NULL;

-- Verify the updates
SELECT 
  c.id,
  c.business_name,
  c.invited_by_code,
  c.seller_id,
  s.business_name as seller_name
FROM public.clients c
LEFT JOIN public.sellers s ON s.id = c.seller_id
WHERE c.invited_by_code IS NOT NULL;


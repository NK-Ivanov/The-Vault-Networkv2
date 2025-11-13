-- Migration: Add RLS policy to allow sellers to insert demo clients
-- Demo clients don't have user_id, so we need a separate policy

-- Drop existing policy if it exists and recreate with better name
DROP POLICY IF EXISTS "Sellers can insert demo clients" ON public.clients;

-- Allow sellers to insert demo clients (where is_demo = true)
CREATE POLICY "Sellers can insert demo clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    is_demo = true
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = clients.seller_id
    )
  );

-- Also allow sellers to update their demo clients
DROP POLICY IF EXISTS "Sellers can update their demo clients" ON public.clients;
CREATE POLICY "Sellers can update their demo clients"
  ON public.clients FOR UPDATE
  USING (
    is_demo = true
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = clients.seller_id
    )
  );

-- Allow sellers to delete their demo clients
DROP POLICY IF EXISTS "Sellers can delete their demo clients" ON public.clients;
CREATE POLICY "Sellers can delete their demo clients"
  ON public.clients FOR DELETE
  USING (
    is_demo = true
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = clients.seller_id
    )
  );


-- Migration: Add INSERT policy for partner_activity_log
-- This allows sellers to insert their own activity logs (e.g., automation_view events)

-- Drop the policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Sellers can insert their own activity log" ON public.partner_activity_log;

-- Create INSERT policy for sellers
CREATE POLICY "Sellers can insert their own activity log"
  ON public.partner_activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_activity_log.seller_id
    )
  );











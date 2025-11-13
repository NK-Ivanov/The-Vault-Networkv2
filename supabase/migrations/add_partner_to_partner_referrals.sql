-- Migration: Add Partner-to-Partner Referral System
-- This adds support for partners to refer other partners (not clients)

-- Add referred_by_seller_id column to sellers table
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS referred_by_seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sellers_referred_by ON public.sellers(referred_by_seller_id);

-- Function to award referral XP when partner is approved
-- Awards 300 XP normally, or 1200 XP if completing "Invite a Friend" task
CREATE OR REPLACE FUNCTION public.award_partner_referral_xp(_referrer_seller_id UUID, _new_seller_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _xp_reward INTEGER;
  _lesson_id TEXT := 'stage-4-partner-15'; -- ID for "Invite a Friend" task
  _is_task_completed BOOLEAN;
BEGIN
  -- Check if the referrer has already completed the "Invite a Friend" task
  _is_task_completed := public.is_lesson_completed(_referrer_seller_id, _lesson_id);
  
  -- Award 1200 XP if completing the task, otherwise 300 XP
  IF _is_task_completed THEN
    _xp_reward := 300; -- Already completed task, just give referral bonus
  ELSE
    _xp_reward := 1200; -- First referral completes the task
  END IF;
  
  -- Award XP to the referrer
  PERFORM public.add_seller_xp(
    _referrer_seller_id,
    _xp_reward,
    CASE WHEN _is_task_completed THEN 'partner_referral' ELSE 'task_completed' END,
    CASE WHEN _is_task_completed THEN 'Partner referral bonus' ELSE 'Completed: Invite a Friend' END,
    jsonb_build_object(
      'lesson_id', CASE WHEN NOT _is_task_completed THEN _lesson_id ELSE NULL END,
      'referred_seller_id', _new_seller_id,
      'referral_type', 'partner'
    )
  );
END;
$$;

-- Trigger function to award XP when a partner's status changes to 'approved'
CREATE OR REPLACE FUNCTION public.handle_partner_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only award XP if status changed from something else to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Check if this partner was referred by someone
    IF NEW.referred_by_seller_id IS NOT NULL THEN
      -- Award XP to the referrer
      PERFORM public.award_partner_referral_xp(NEW.referred_by_seller_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on sellers table
DROP TRIGGER IF EXISTS trigger_partner_approval ON public.sellers;
CREATE TRIGGER trigger_partner_approval
  AFTER UPDATE OF status ON public.sellers
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.handle_partner_approval();


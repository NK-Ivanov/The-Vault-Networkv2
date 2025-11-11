-- Migration: Backfill Transaction Commissions
-- This script recalculates commissions for existing transactions that have $0 earnings
-- Run this after ensuring all automations have default_commission_rate set

-- First, ensure all automations have a default commission rate
UPDATE public.automations
SET default_commission_rate = COALESCE(default_commission_rate, 20.00)
WHERE default_commission_rate IS NULL;

-- Backfill transactions with missing or zero commission data
DO $$
DECLARE
  txn RECORD;
  comm_result RECORD;
BEGIN
  -- Loop through all completed transactions with seller_id but zero or null earnings
  FOR txn IN 
    SELECT id, seller_id, automation_id, amount, seller_earnings, commission_rate_used
    FROM public.transactions
    WHERE status = 'completed' 
      AND seller_id IS NOT NULL
      AND (seller_earnings IS NULL OR seller_earnings = 0)
      AND automation_id IS NOT NULL
  LOOP
    -- Calculate commission using the function
    SELECT * INTO comm_result
    FROM public.calculate_commission(
      txn.seller_id,
      txn.automation_id,
      txn.amount
    );
    
    -- Update the transaction with calculated commission
    UPDATE public.transactions
    SET 
      commission_rate_used = comm_result.commission_rate,
      seller_earnings = comm_result.seller_earnings,
      vault_share = comm_result.vault_share,
      commission = comm_result.seller_earnings
    WHERE id = txn.id;
    
    RAISE NOTICE 'Updated transaction %: rate=%, earnings=%, vault_share=%', 
      txn.id, comm_result.commission_rate, comm_result.seller_earnings, comm_result.vault_share;
  END LOOP;
END $$;

-- Recalculate seller totals from scratch
UPDATE public.sellers
SET 
  total_sales = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.transactions
    WHERE seller_id = sellers.id
      AND status = 'completed'
  ),
  total_commission = (
    SELECT COALESCE(SUM(COALESCE(seller_earnings, commission, 0)), 0)
    FROM public.transactions
    WHERE seller_id = sellers.id
      AND status = 'completed'
  ),
  updated_at = NOW();


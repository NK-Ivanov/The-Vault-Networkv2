-- Migration: Add 'setup_complete' status option to client_automations
-- This adds a new status between 'setup_in_progress' and 'active' to allow clients to pay for first month after setup is complete

-- Update the comment to reflect the new status option
COMMENT ON COLUMN public.client_automations.setup_status IS 'Setup status: pending_setup, setup_in_progress, setup_complete, or active';

-- Note: The actual constraint is enforced at the application level, not at the database level
-- This migration is for documentation purposes and to ensure consistency


-- Add Rank Up Notifications to Discord
-- This sends a Discord webhook notification when a learner ranks up

-- Function to send Discord rank up notification
CREATE OR REPLACE FUNCTION public.send_discord_rank_up_notification(
  _learner_id UUID,
  _old_rank TEXT,
  _new_rank TEXT,
  _current_xp INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _learner_data RECORD;
  _webhook_url TEXT;
  _discord_mention TEXT;
  _embed JSONB;
  _response JSONB;
BEGIN
  -- Get learner data including Discord tag
  SELECT 
    full_name,
    discord_tag,
    current_xp
  INTO _learner_data
  FROM public.learners
  WHERE id = _learner_id;

  -- If no learner found or no Discord tag, skip notification
  IF _learner_data IS NULL OR _learner_data.discord_tag IS NULL OR _learner_data.discord_tag = '' THEN
    RETURN FALSE;
  END IF;

  -- Webhook URL for rank ups
  _webhook_url := 'https://discord.com/api/webhooks/1440081131759472670/t8rAz113FcmJeYOOWqoGURrHQfB7wAuuMIFnfJQUwhUcZp9miLZ9aYWMMqZrV1Kv5aCH';

  -- Format Discord mention (handle both formats: username#1234 or username)
  IF _learner_data.discord_tag LIKE '%#%' THEN
    -- Format: username#1234 -> <@username#1234> (but Discord uses user IDs, so we'll use the tag format)
    _discord_mention := _learner_data.discord_tag;
  ELSE
    -- Format: username -> username
    _discord_mention := _learner_data.discord_tag;
  END IF;

  -- Create Discord embed
  _embed := jsonb_build_object(
    'title', '🎉 Rank Up!',
    'description', format('%s has ranked up to **%s**!', _learner_data.full_name, _new_rank),
    'color', 16119244, -- Gold color #f5c84c
    'fields', jsonb_build_array(
      jsonb_build_object(
        'name', 'Previous Rank',
        'value', _old_rank,
        'inline', true
      ),
      jsonb_build_object(
        'name', 'New Rank',
        'value', _new_rank,
        'inline', true
      ),
      jsonb_build_object(
        'name', 'Total XP',
        'value', _current_xp::TEXT || ' XP',
        'inline', true
      )
    ),
    'footer', jsonb_build_object(
      'text', 'The Vault Network Academy'
    ),
    'timestamp', NOW()::TEXT
  );

  -- Send webhook using pg_net extension if available, otherwise use http extension
  -- Note: This requires the http extension or pg_net extension to be enabled
  -- For now, we'll create a trigger that the frontend can poll, or use a different approach
  
  -- Since we can't directly call HTTP from PostgreSQL without extensions,
  -- we'll create a table to queue notifications that the frontend can process
  INSERT INTO public.learner_rank_up_queue (
    learner_id,
    old_rank,
    new_rank,
    current_xp,
    discord_tag,
    full_name,
    processed
  ) VALUES (
    _learner_id,
    _old_rank,
    _new_rank,
    _current_xp,
    _learner_data.discord_tag,
    _learner_data.full_name,
    FALSE
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the XP update
    RAISE WARNING 'Failed to queue rank up notification: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Create queue table for rank up notifications
CREATE TABLE IF NOT EXISTS public.learner_rank_up_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  old_rank TEXT NOT NULL,
  new_rank TEXT NOT NULL,
  current_xp INTEGER NOT NULL,
  discord_tag TEXT,
  full_name TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for processing queue
CREATE INDEX IF NOT EXISTS idx_learner_rank_up_queue_processed 
ON public.learner_rank_up_queue(processed, created_at);

-- Enable RLS
ALTER TABLE public.learner_rank_up_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rank up queue
CREATE POLICY "Admins can view all rank up notifications"
  ON public.learner_rank_up_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert rank up notifications"
  ON public.learner_rank_up_queue FOR INSERT
  WITH CHECK (true);

-- Update add_learner_xp to detect rank changes and queue notifications
-- This replaces the existing add_learner_xp function
CREATE OR REPLACE FUNCTION public.add_learner_xp(
  _learner_id UUID,
  _xp_amount INTEGER,
  _event_type TEXT DEFAULT 'quiz_completed',
  _description TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp INTEGER;
  old_rank TEXT;
  new_rank TEXT;
  old_xp INTEGER;
BEGIN
  -- Get current XP and rank
  SELECT COALESCE(current_xp, 0), COALESCE(current_rank, 'Beginner')
  INTO old_xp, old_rank
  FROM public.learners
  WHERE id = _learner_id;

  -- Update learner XP
  UPDATE public.learners
  SET current_xp = COALESCE(current_xp, 0) + _xp_amount
  WHERE id = _learner_id
  RETURNING current_xp INTO new_xp;

  -- Calculate and update rank
  new_rank := public.calculate_learner_rank(new_xp);
  UPDATE public.learners
  SET current_rank = new_rank
  WHERE id = _learner_id;

  -- If rank changed, queue notification
  IF old_rank IS DISTINCT FROM new_rank THEN
    PERFORM public.send_discord_rank_up_notification(
      _learner_id,
      old_rank,
      new_rank,
      new_xp
    );
  END IF;

  RETURN new_xp;
END;
$$;


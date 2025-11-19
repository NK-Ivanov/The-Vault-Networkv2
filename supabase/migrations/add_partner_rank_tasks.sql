-- Migration: Add Partner Rank Tasks
-- This migration adds 8 tasks for the Partner rank (not Partner Plus)
-- Tasks include: Pricing Calculator, Sales Scripts Editor, Automation Notes, etc.

-- ============================================================================
-- 1. CREATE TABLES FOR PARTNER RANK TASKS
-- ============================================================================

-- Partner Sales Scripts table (for task 2: Create Your Personal Sales Script Variation)
CREATE TABLE IF NOT EXISTS public.partner_sales_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  script_name TEXT NOT NULL,
  script_content TEXT NOT NULL,
  automation_tag UUID REFERENCES public.automations(id) ON DELETE SET NULL,
  template_used TEXT, -- 'conversational', 'email', 'pitch', 'soft_outreach', 'follow_up', 'short_value', or custom
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sales_scripts_seller_id ON public.partner_sales_scripts(seller_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_scripts_automation_tag ON public.partner_sales_scripts(automation_tag);

COMMENT ON TABLE public.partner_sales_scripts IS 'Stores partner-created sales scripts with automation tags';
COMMENT ON COLUMN public.partner_sales_scripts.automation_tag IS 'Which automation this script is relevant to (can be NULL for general scripts)';

-- Partner Automation Notes table (for task 3: Record a 30-Second Value Explanation)
CREATE TABLE IF NOT EXISTS public.partner_automation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  note_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, automation_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_automation_notes_seller_id ON public.partner_automation_notes(seller_id);
CREATE INDEX IF NOT EXISTS idx_partner_automation_notes_automation_id ON public.partner_automation_notes(automation_id);

COMMENT ON TABLE public.partner_automation_notes IS 'Stores partner personal notes about automations for value explanation task';

-- Partner Client Journey Mapping table (for task 6: Map a Client Journey From Click to Activation)
CREATE TABLE IF NOT EXISTS public.partner_client_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  journey_name TEXT NOT NULL,
  journey_data JSONB NOT NULL, -- Stores the mapped journey steps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_client_journey_seller_id ON public.partner_client_journey(seller_id);

COMMENT ON TABLE public.partner_client_journey IS 'Stores partner-mapped client journeys from click to activation';
COMMENT ON COLUMN public.partner_client_journey.journey_data IS 'JSON object with journey steps: {clicks_referral_link, creates_account, chooses_automation, pays_setup_fee, goes_through_onboarding}';

-- Partner Setup Process Explanation table (for task 8: Write Your Own Setup Process Explanation)
CREATE TABLE IF NOT EXISTS public.partner_setup_explanation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  explanation_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_setup_explanation_seller_id ON public.partner_setup_explanation(seller_id);

COMMENT ON TABLE public.partner_setup_explanation IS 'Stores partner-written setup process explanation';

-- Partner Earnings Calculator Usage tracking (for tasks 1 and 4)
-- This will track calculator usage to verify task completion
-- Completion tracked via partner_activity_log with metadata

-- Partner Bookmarked Automation Views tracking (for task 7: Review All Bookmarked Automations)
-- Tracks when partner views a bookmarked automation detail page
CREATE TABLE IF NOT EXISTS public.partner_bookmarked_automation_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_duration_seconds INTEGER DEFAULT 0,
  UNIQUE(seller_id, automation_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_bookmarked_automation_views_seller_id ON public.partner_bookmarked_automation_views(seller_id);
CREATE INDEX IF NOT EXISTS idx_partner_bookmarked_automation_views_automation_id ON public.partner_bookmarked_automation_views(automation_id);

COMMENT ON TABLE public.partner_bookmarked_automation_views IS 'Tracks when partner views bookmarked automation detail pages for task completion';

-- ============================================================================
-- 2. ENABLE RLS ON ALL NEW TABLES
-- ============================================================================

ALTER TABLE public.partner_sales_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_automation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_client_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_setup_explanation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_bookmarked_automation_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE RLS POLICIES
-- ============================================================================

-- Partner Sales Scripts Policies
CREATE POLICY "Sellers can view their own sales scripts"
  ON public.partner_sales_scripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_sales_scripts.seller_id
    )
  );

CREATE POLICY "Sellers can insert their own sales scripts"
  ON public.partner_sales_scripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_sales_scripts.seller_id
    )
  );

CREATE POLICY "Sellers can update their own sales scripts"
  ON public.partner_sales_scripts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_sales_scripts.seller_id
    )
  );

CREATE POLICY "Sellers can delete their own sales scripts"
  ON public.partner_sales_scripts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_sales_scripts.seller_id
    )
  );

-- Partner Automation Notes Policies
CREATE POLICY "Sellers can view their own automation notes"
  ON public.partner_automation_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_automation_notes.seller_id
    )
  );

CREATE POLICY "Sellers can insert their own automation notes"
  ON public.partner_automation_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_automation_notes.seller_id
    )
  );

CREATE POLICY "Sellers can update their own automation notes"
  ON public.partner_automation_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_automation_notes.seller_id
    )
  );

CREATE POLICY "Sellers can delete their own automation notes"
  ON public.partner_automation_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_automation_notes.seller_id
    )
  );

-- Partner Client Journey Policies
CREATE POLICY "Sellers can view their own client journeys"
  ON public.partner_client_journey FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_client_journey.seller_id
    )
  );

CREATE POLICY "Sellers can insert their own client journeys"
  ON public.partner_client_journey FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_client_journey.seller_id
    )
  );

CREATE POLICY "Sellers can update their own client journeys"
  ON public.partner_client_journey FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_client_journey.seller_id
    )
  );

CREATE POLICY "Sellers can delete their own client journeys"
  ON public.partner_client_journey FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_client_journey.seller_id
    )
  );

-- Partner Setup Explanation Policies
CREATE POLICY "Sellers can view their own setup explanation"
  ON public.partner_setup_explanation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_setup_explanation.seller_id
    )
  );

CREATE POLICY "Sellers can insert their own setup explanation"
  ON public.partner_setup_explanation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_setup_explanation.seller_id
    )
  );

CREATE POLICY "Sellers can update their own setup explanation"
  ON public.partner_setup_explanation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_setup_explanation.seller_id
    )
  );

CREATE POLICY "Sellers can delete their own setup explanation"
  ON public.partner_setup_explanation FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_setup_explanation.seller_id
    )
  );

-- Partner Bookmarked Automation Views Policies
CREATE POLICY "Sellers can view their own bookmarked automation views"
  ON public.partner_bookmarked_automation_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_bookmarked_automation_views.seller_id
    )
  );

CREATE POLICY "Sellers can insert their own bookmarked automation views"
  ON public.partner_bookmarked_automation_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_bookmarked_automation_views.seller_id
    )
  );

CREATE POLICY "Sellers can update their own bookmarked automation views"
  ON public.partner_bookmarked_automation_views FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = partner_bookmarked_automation_views.seller_id
    )
  );

-- Admins can manage all tables
CREATE POLICY "Admins can manage partner sales scripts"
  ON public.partner_sales_scripts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage partner automation notes"
  ON public.partner_automation_notes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage partner client journey"
  ON public.partner_client_journey FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage partner setup explanation"
  ON public.partner_setup_explanation FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage partner bookmarked automation views"
  ON public.partner_bookmarked_automation_views FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 4. ADD PARTNER RANK TASKS TO PARTNER_LESSONS
-- ============================================================================

-- Task 1: Review Setup vs Monthly Pricing for 3 Automations (600 XP)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Partner', 'task', 'Review Setup vs Monthly Pricing for 3 Automations',
'Compare setup fee and monthly retainer for 3 automations and summarise which industries each fits.

**Why:** Teaches pricing structure before selling.

**How to complete:** 
- Click the "Earnings Calculator" button on the Earnings tab
- Select 3 different automations
- Compare their setup fees and monthly prices
- Summarize which industries each automation fits

This task will help you understand pricing structure and prepare you for selling automations to clients.',
600, NULL, 12);

-- Task 2: Create Your Personal Sales Script Variation (750 XP)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Partner', 'task', 'Create Your Personal Sales Script Variation',
'Using the Scripts tab, customize one script specifically for a business type you want to target.

**Why:** Prepares Partner Plus outreach without making them actually do outreach.

**How to complete:**
- Go to the Sales Scripts tab
- Select a script template
- Customize it for a specific automation or business type
- Add a tag for which automation this is relevant to
- Save your script

You can select from 6 templates:
1. Conversational DM Script
2. Professional Email Template
3. Consultative Pitch Outline
4. Soft Outreach Message
5. Follow-Up Message
6. Short Value Pitch

Edit and save your custom script to complete this task.',
750, NULL, 13);

-- Task 3: Record a 30-Second Value Explanation (Text Only) (600 XP)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Partner', 'task', 'Record a 30-Second Value Explanation (Text Only)',
'Write a explanation of how 3 automations save time and money.

**Why:** Builds clarity in speaking to real clients later.

**How to complete:**
- Go to the Automations tab
- Click on at least 3 different automations
- Add personal notes explaining how each automation saves time and money
- Save your notes for each automation

These notes are private and help you prepare for speaking with clients.',
600, NULL, 14);

-- Task 4: Earnings Projection Exercise (500 XP)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Partner', 'task', 'Earnings Projection Exercise',
'Using any automation''s setup + monthly fees, calculate how much monthly commission you would earn with 3 clients.

**Why:** Helps partners understand earning potential before closing.

**How to complete:**
- Click the "Earnings Calculator" button on the Earnings tab
- Select an automation
- Set clients per automation to 3
- Review your projected monthly commission earnings

This exercise helps you understand your earning potential and motivates you to close deals.',
500, NULL, 15);

-- Task 6: Map a Client Journey From Click to Activation (700 XP)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Partner', 'task', 'Map a Client Journey From Click to Activation',
'Write the journey:

- Client clicks referral link
- Creates account
- Chooses automation
- Pays setup fee
- Goes through onboarding

**Why:** Teaches process flow without adding prospects manually.

**How to complete:**
- Go to the Clients tab
- Click "Map Client Journey" button
- Fill out each step of the journey
- Save your journey mapping

This helps you understand the complete client journey and prepares you for real client interactions.',
700, NULL, 16);

-- Task 7: Review All Bookmarked Automations (550 XP)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Partner', 'task', 'Review All Bookmarked Automations',
'Must open and read all bookmarked automations when you press view page for that automation.

**Why:** Makes the partner knowledgeable and confident about their niche.

**How to complete:**
- Go to the Automations tab
- Find all your bookmarked automations
- Click "View" on each bookmarked automation
- Read through the automation details completely

You need to view and read all your bookmarked automations to complete this task.',
550, NULL, 17);

-- Task 8: Write Your Own Setup Process Explanation (650 XP)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Partner', 'task', 'Write Your Own Setup Process Explanation',
'Explain in your own words:

• how setup works
• what the client can expect
• how long it takes

**Why:** Prepares partners for answering real client questions later.

**How to complete:**
- Go to the Clients tab
- Click "Setup Process Explanation" button
- Write your explanation covering:
  - How setup works
  - What clients can expect
  - How long it takes
- Save your explanation

This helps you prepare answers for real client questions about the setup process.',
650, NULL, 18);

-- ============================================================================
-- 5. UPDATE get_tasks_for_rank FUNCTION TO INCLUDE PARTNER TASKS
-- ============================================================================

-- Note: This function is in add_task_completion_requirement_for_rank_up.sql
-- We need to update it to include the new Partner rank tasks
-- The function already includes Partner tasks in the array, but we should verify
-- it includes all 8 new tasks

-- Verify that Partner rank task IDs are in the function
-- Task IDs would be generated from stage, rank, and order_index:
-- Based on the insert above:
-- - stage-5-partner-12 (Review Setup vs Monthly Pricing)
-- - stage-5-partner-13 (Create Your Personal Sales Script Variation)
-- - stage-5-partner-14 (Record a 30-Second Value Explanation)
-- - stage-5-partner-15 (Earnings Projection Exercise)
-- - stage-5-partner-16 (Map a Client Journey)
-- - stage-5-partner-17 (Review All Bookmarked Automations)
-- - stage-5-partner-18 (Write Your Own Setup Process Explanation)

-- These will need to be added to the get_tasks_for_rank function in partner-progression.ts
-- and in the database function get_tasks_for_rank in add_task_completion_requirement_for_rank_up.sql


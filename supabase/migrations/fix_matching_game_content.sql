-- Migration: Fix Automation Matching Game content to remove duplicate instruction
-- This updates only the task content to remove the duplicate instruction text

UPDATE public.partner_lessons
SET content = 'Match each automation to the industry it best serves. Click on the matching industry card for each automation.'
WHERE title = 'Automation Matching Game' 
  AND rank_required = 'Apprentice'
  AND lesson_type = 'task';






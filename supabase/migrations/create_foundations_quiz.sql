-- Create Foundations of Business Automation Quiz
-- This quiz has 25 questions as provided

-- First, create the quiz
INSERT INTO public.quizzes (title, description, module_id, passing_score, max_attempts, is_active)
VALUES (
  'Foundations of Business Automation',
  'Test your knowledge of business automation fundamentals, n8n workflows, and automation concepts.',
  'module-1-foundations',
  70,
  3,
  true
)
RETURNING id;

-- Note: You'll need to get the quiz ID from the above insert, then use it below
-- For now, this is a template. Run the INSERT above first, then use the returned ID.

-- Example: If the quiz ID is 'quiz-uuid-here', replace it in the questions below
-- Or run this in two steps:
-- Step 1: INSERT INTO quizzes... (get the ID)
-- Step 2: INSERT INTO quiz_questions with that ID

-- Questions for Foundations of Business Automation Quiz
-- Replace 'QUIZ_ID_HERE' with the actual quiz ID from the INSERT above

INSERT INTO public.quiz_questions (quiz_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer, points)
VALUES
  -- Question 1
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 1, 'What is automation?', 'Software completing tasks automatically', 'Hiring virtual assistants', 'A way to automate emails manually', 'Printing reports', 'A', 1),
  -- Question 2
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 2, 'Which of these is a benefit of automation?', 'Makes tasks slower', 'Reduces human error', 'Increases manual work', 'Removes data permanently', 'B', 1),
  -- Question 3
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 3, 'In a workflow, what does the trigger do?', 'Logs users out', 'Starts the automation', 'Ends the automation', 'Edits data', 'B', 1),
  -- Question 4
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 4, 'What does CRM stand for?', 'Customer Relationship Management', 'Client Reporting Mechanism', 'Client Record Monitor', 'Central Resource Manager', 'A', 1),
  -- Question 5
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 5, 'Which of the following is an action step?', 'Waiting for approval', 'Displaying a chart', 'Sending a message after form submission', 'Receiving a new lead', 'C', 1),
  -- Question 6
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 6, 'What is a workflow?', 'A chat system', 'A calendar reminder', 'A series of automated steps', 'A process of repeated clicks', 'C', 1),
  -- Question 7
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 7, 'Which reason is NOT why businesses use automation?', 'Reduce errors', 'Improve customer experience', 'Save time', 'Increase paperwork', 'D', 1),
  -- Question 8
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 8, 'Why does The Vault Network use n8n?', 'It''s visual, flexible, and affordable', 'It only works with Zapier', 'It is used for marketing', 'It''s expensive but fast', 'A', 1),
  -- Question 9
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 9, 'What is a "node" in n8n?', 'A web domain', 'A block that performs one task', 'A Discord channel', 'A spreadsheet cell', 'B', 1),
  -- Question 10
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 10, 'What kind of automation captures leads and sends alerts?', 'Accounting automation', 'SEO workflow', 'Lead Capture → Sheet & Discord', 'Manual tracking', 'C', 1),
  -- Question 11
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 11, 'What does a webhook do?', 'Sends marketing emails', 'Logs user activity', 'Waits for incoming data and triggers an automation', 'Backs up workflow files', 'C', 1),
  -- Question 12
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 12, 'What is JSON used for?', 'Encrypting passwords', 'Designing user interfaces', 'Tracking sales', 'Formatting data between systems', 'D', 1),
  -- Question 13
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 13, 'What is a Cron trigger?', 'A database backup system', 'A new customer form', 'A time-based scheduler', 'A client communication tool', 'C', 1),
  -- Question 14
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 14, 'Purpose of the Discord Test Notifier?', 'To delete workflows', 'To analyze analytics', 'To confirm n8n and Discord connect properly', 'To manage spreadsheets', 'C', 1),
  -- Question 15
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 15, 'Which tool in n8n sends information to Discord?', 'HTTP Request node', 'Cron node', 'Google Sheets node', 'Webhook node', 'A', 1),
  -- Question 16
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 16, 'Which category fits onboarding new staff?', 'Customer Support', 'Internal Operations', 'Lead Generation', 'Marketing', 'B', 1),
  -- Question 17
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 17, 'Which step should come first in any workflow?', 'Action', 'Logic', 'Trigger', 'Output', 'C', 1),
  -- Question 18
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 18, 'What format looks like { "key": "value" }?', 'XML', 'JSON', 'PDF', 'CSV', 'B', 1),
  -- Question 19
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 19, 'Why use automation instead of manual entry?', 'It costs more but looks advanced', 'It slows team performance', 'It saves time and avoids repetitive work', 'It increases typing accuracy', 'C', 1),
  -- Question 20
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 20, 'What should you do before building automations?', 'Contact support', 'Create an n8n account and workspace', 'Install paid extensions', 'Build random flows', 'B', 1),
  -- Question 21
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 21, 'What automation reminds users daily at 9 AM?', 'Invoice Reminder', 'CRM Sync Bot', 'Review Booster', 'Daily Accountability Ping', 'D', 1),
  -- Question 22
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 22, 'What happens when clicking "Execute Workflow"?', 'It pauses automations', 'It edits triggers', 'It deletes the workflow', 'It runs the workflow manually', 'D', 1),
  -- Question 23
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 23, 'Why is data organisation Important?', 'It hides results', 'It slows workflows', 'It increases randomness', 'It prevents confusion & improves tracking', 'D', 1),
  -- Question 24
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 24, 'Which automation sends leads to Sheets & Discord?', 'Email Campaign Automator', 'Social Media Scheduler', 'CRM Sync Bot', 'Lead Capture → Sheet & Discord', 'D', 1),
  -- Question 25
  ((SELECT id FROM public.quizzes WHERE title = 'Foundations of Business Automation' LIMIT 1), 25, 'After finishing the module?', 'Create a new company account', 'Delete automations', 'Skip to advanced coding', 'Take the quiz & post your builds in Discord', 'D', 1)
ON CONFLICT (quiz_id, question_number) DO NOTHING;


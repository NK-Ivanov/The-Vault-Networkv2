-- Migration: Insert Partner Progression Lessons, Quizzes, and Tasks
-- This populates all 6 stages of the partner progression system

-- ============================================================================
-- IMPORTANT: This migration should be run after add_partner_progression_system.sql
-- ============================================================================
-- This migration is idempotent - it can be run multiple times without creating duplicates
-- It deletes existing lessons before inserting to ensure clean state

-- Clean up: Remove Profile Setup task if it exists (no longer needed)
-- Business name is set during registration, referral code is set later at Partner rank
-- Also clean up any quiz results or activity logs related to this removed task
DELETE FROM public.partner_quiz_results 
WHERE lesson_id IN (SELECT id FROM public.partner_lessons WHERE title = 'Profile Setup' AND rank_required = 'Recruit');

DELETE FROM public.partner_lessons 
WHERE title = 'Profile Setup' AND rank_required = 'Recruit';

-- Delete all existing lessons to prevent duplicates when re-running this migration
-- This ensures a clean state before inserting
DELETE FROM public.partner_quiz_results;
DELETE FROM public.partner_lessons;

-- STAGE 1 — WELCOME & SETUP (Rank: Recruit)
-- XP Range: 0 → 1,000

-- Course 1: Welcome to The Vault Network
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(1, 'Recruit', 'course', 'Welcome to The Vault Network', 
'# What is Vault Network?

Vault Network is a platform that connects businesses with proven AI automation solutions. We help businesses automate repetitive tasks, reduce costs, and scale their operations.

# How It Works

**Automations → Sellers → Businesses**

- **Automations**: Pre-built AI solutions that solve specific business problems
- **Sellers (Partners)**: You! People who connect businesses with automations
- **Businesses**: Companies that need automation solutions

# How You Earn Commissions

As a partner, you earn commission on every automation sale:
- **Setup Fee Commission**: One-time payment when client purchases automation
- **Monthly Commission**: Recurring payment every month the client uses the automation

Your starting commission rate is **25%**.

# Progression & XP System

- Complete courses and tasks to earn XP (Experience Points)
- Reach XP thresholds to unlock new ranks
- Higher ranks = Higher commission rates
- Unlock new features and tabs as you progress

# Your Journey Starts Here

Complete the courses and tasks in this stage to unlock Stage 2 and start earning!',
'[
  {
    "question": "What does Vault Network help businesses with?",
    "type": "multiple_choice",
    "options": [
      "Selling products online",
      "Automating repetitive tasks and reducing costs",
      "Managing employee schedules",
      "Creating marketing campaigns"
    ],
    "correct": 1
  },
  {
    "question": "How do partners earn commission?",
    "type": "multiple_choice",
    "options": [
      "Only from setup fees",
      "Only from monthly payments",
      "From both setup fees and monthly payments",
      "Partners don''t earn commission"
    ],
    "correct": 2
  },
  {
    "question": "What is your starting commission rate?",
    "type": "multiple_choice",
    "options": [
      "20%",
      "25%",
      "30%",
      "35%"
    ],
    "correct": 1
  }
]'::jsonb,
'[1, 2, 1]'::jsonb,
200, NULL, 1);

-- Course 2: Partner Rules & Guidelines
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(1, 'Recruit', 'course', 'Partner Rules & Guidelines',
'# Ethical Selling Guidelines

## No Spam or Misrepresentation
- Never send unsolicited messages or spam potential clients
- Always be honest about what automations can and cannot do
- Never make false claims about automation capabilities

## Client Data Handling
- Respect client privacy and confidentiality
- Never share client information with third parties
- Only use client data for legitimate business purposes

## Refund & Support Process
- Clients can request refunds through The Vault Network support
- All support requests go through our ticketing system
- Partners should direct clients to Vault Network for technical support

## Using The Vault Name and Assets
- You may use "Vault Network Partner" in your marketing
- Do not create fake Vault Network accounts or impersonate staff
- Follow brand guidelines when using Vault Network logos or assets

## Best Practices
- Build genuine relationships with clients
- Provide value through education and consultation
- Focus on solving client problems, not just making sales',
'[
  {
    "question": "A potential client asks if an automation can do something it cannot. What should you do?",
    "type": "multiple_choice",
    "options": [
      "Tell them it can do it anyway to make the sale",
      "Be honest about limitations and suggest alternatives",
      "Ignore the question",
      "Make up features"
    ],
    "correct": 1
  },
  {
    "question": "A client has a technical issue with their automation. What should you do?",
    "type": "multiple_choice",
    "options": [
      "Try to fix it yourself",
      "Direct them to Vault Network support tickets",
      "Tell them to figure it out",
      "Ignore the request"
    ],
    "correct": 1
  },
  {
    "question": "Can you share client contact information with other partners?",
    "type": "multiple_choice",
    "options": [
      "Yes, if they ask nicely",
      "No, client data is confidential",
      "Only if you get paid",
      "Only on weekends"
    ],
    "correct": 1
  }
]'::jsonb,
'[1, 1, 1]'::jsonb,
200, NULL, 2);

-- Task 1: Automation Preview
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(1, 'Recruit', 'task', 'Automation Preview',
'Explore the Available Automations section and view at least 3 automation cards.

Navigate to the Automations tab and click on at least 3 different automation cards to view their details. Clicking on automation cards will track your progress and help you understand what solutions you''ll be selling to clients.

**Note:** You''ll only see the "Available Automations" section at this level. Client Automations tracking unlocks at a higher rank.',
300, 'stage_2', 3);

-- STAGE 2 — PRODUCT KNOWLEDGE (Rank: Apprentice)
-- XP Range: 1,000 → 2,500

-- Course 3: Understanding Automations
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(2, 'Apprentice', 'course', 'Understanding Automations',
'# The 6 Default Automations

## 1. Google Review Booster
**Problem**: Businesses struggle to collect and manage Google reviews
**Solution**: Automatically requests reviews from satisfied customers and monitors responses
**Best For**: Local services, restaurants, retail stores

## 2. Invoice Reminder System
**Problem**: Late payments hurt cash flow
**Solution**: Sends automated payment reminders and tracks invoice status
**Best For**: Freelancers, agencies, service businesses

## 3. CRM Sync Bot
**Problem**: Data scattered across multiple platforms
**Solution**: Keeps CRM data synchronized across all platforms in real-time
**Best For**: Agencies, sales teams, growing businesses

## 4. Lead Qualification System
**Problem**: Too many unqualified leads waste time
**Solution**: Automatically scores and routes leads based on custom criteria
**Best For**: Sales teams, agencies, B2B companies

## 5. Social Media Scheduler
**Problem**: Posting consistently across platforms is time-consuming
**Solution**: Schedules and posts content across all major social platforms
**Best For**: Marketing agencies, content creators, small businesses

## 6. Email Campaign Automator
**Problem**: Email marketing is manual and inconsistent
**Solution**: Creates and manages sophisticated email marketing campaigns
**Best For**: E-commerce, SaaS companies, marketing agencies

# Pricing Structure

Each automation has:
- **Setup Fee**: One-time payment for initial setup (you earn commission)
- **Monthly Retainer**: Recurring monthly payment (you earn recurring commission)

# How Automations Are Delivered

Vault Network handles all technical setup and delivery. Your role is to:
1. Connect businesses with the right automation
2. Explain the value and benefits
3. Vault Network handles the rest!',
'[
  {
    "question": "Which automation helps collect Google Reviews?",
    "type": "multiple_choice",
    "options": [
      "Invoice Reminder System",
      "Google Review Booster",
      "CRM Sync Bot",
      "Social Media Scheduler"
    ],
    "correct": 1
  },
  {
    "question": "Which automation improves CRM data accuracy?",
    "type": "multiple_choice",
    "options": [
      "Lead Qualification System",
      "CRM Sync Bot",
      "Email Campaign Automator",
      "Google Review Booster"
    ],
    "correct": 1
  },
  {
    "question": "Which automation sends payment reminders?",
    "type": "multiple_choice",
    "options": [
      "Invoice Reminder System",
      "CRM Sync Bot",
      "Social Media Scheduler",
      "Lead Qualification System"
    ],
    "correct": 0
  }
]'::jsonb,
'[1, 1, 0]'::jsonb,
400, NULL, 5);

-- Task 3: Automation Matching Game
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(2, 'Apprentice', 'task', 'Automation Matching Game',
'Match each automation to the industry it best serves. Drag or select the correct match for each automation.',
'[
  {
    "question": "Google Review Booster → ?",
    "type": "multiple_choice",
    "options": [
      "Local Services",
      "Finance / Freelancers",
      "Agencies",
      "Marketing"
    ],
    "correct": 0
  },
  {
    "question": "Invoice Reminder System → ?",
    "type": "multiple_choice",
    "options": [
      "Local Services",
      "Finance / Freelancers",
      "Agencies",
      "Marketing"
    ],
    "correct": 1
  },
  {
    "question": "CRM Sync Bot → ?",
    "type": "multiple_choice",
    "options": [
      "Local Services",
      "Finance / Freelancers",
      "Agencies",
      "Marketing"
    ],
    "correct": 2
  },
  {
    "question": "Social Media Scheduler → ?",
    "type": "multiple_choice",
    "options": [
      "Local Services",
      "Finance / Freelancers",
      "Agencies",
      "Marketing"
    ],
    "correct": 3
  }
]'::jsonb,
'[0, 1, 2, 3]'::jsonb,
400, NULL, 6);

-- Task 4: Suggest New Automation
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(2, 'Apprentice', 'task', 'Suggest New Automation',
'Have an idea for a new automation? Submit your suggestion!

Fill out the form with:
- **Title**: Name of the automation
- **Problem It Solves**: What business problem does this address?
- **Estimated Client Type**: Who would benefit from this?

Your suggestions help shape the future of Vault Network!',
700, 'stage_3', 7);

-- STAGE 3 — SALES TOOLKIT (Rank: Agent)
-- XP Range: 2,500 → 4,500

-- Course 4: Sales Basics for Automation Partners
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(3, 'Agent', 'course', 'Sales Basics for Automation Partners',
'# Understanding Client Objections

Common objections and how to handle them:

**"It''s too expensive"**
- Focus on ROI: Show how automation saves time and money
- Break down cost vs. manual labor costs
- Emphasize recurring value

**"We don''t need automation"**
- Identify pain points they''re experiencing
- Show how automation solves specific problems
- Share success stories

**"We''ll do it ourselves"**
- Explain the technical complexity
- Show time investment required
- Highlight Vault Network''s expertise

# Positioning Automations as ROI Tools

Always frame automations as investments, not costs:
- Calculate time saved per month
- Show cost savings vs. hiring
- Demonstrate scalability benefits

# Tone & Style of Outreach

**Be Consultative, Not Salesy**
- Ask questions about their business
- Listen to their pain points
- Offer solutions, not pitches

**Be Professional but Friendly**
- Use their name
- Reference specific business details
- Keep messages concise and valuable

# Setting Follow-Up Reminders

Use the Deal Tracking system to:
- Log all outreach attempts
- Set reminders for follow-ups
- Track conversation status
- Learn from what works',
'[
  {
    "question": "A client says automation is too expensive. What should you focus on?",
    "type": "multiple_choice",
    "options": [
      "Lowering the price",
      "ROI and cost savings",
      "Telling them they''re wrong",
      "Giving up"
    ],
    "correct": 1
  },
  {
    "question": "What tone should you use in outreach messages?",
    "type": "multiple_choice",
    "options": [
      "Aggressive and pushy",
      "Consultative and helpful",
      "Casual and unprofessional",
      "Demanding"
    ],
    "correct": 1
  },
  {
    "question": "How should you position automations?",
    "type": "multiple_choice",
    "options": [
      "As expensive tools",
      "As investments with ROI",
      "As optional luxuries",
      "As complicated systems"
    ],
    "correct": 1
  },
  {
    "question": "What should you do after an outreach attempt?",
    "type": "text_input",
    "hint": "Log it in the Deal Tracking system"
  }
]'::jsonb,
'[1, 1, 1, null]'::jsonb,
600, NULL, 8);

-- Task 5: Create Your Sales Script
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(3, 'Agent', 'task', 'Create Your Sales Script',
'Choose from 3 templates and customize your sales script:

1. **Conversational DM Script**: For social media outreach
2. **Professional Email Template**: For email campaigns
3. **Consultative Pitch Outline**: For calls and meetings

Edit and save your custom script. You can update it anytime as you learn what works best!',
600, NULL, 9);

-- Task 6: Log First Outreach in Deal Diary
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(3, 'Agent', 'task', 'Log First Outreach in Deal Diary',
'Log your first outreach attempt in the Deal Tracking system:

- **Date**: When did you reach out?
- **Channel**: Email, DM, Call, etc.
- **Client Name**: (Optional)
- **Status**: No response / Follow-up / Success
- **Reflection**: What did you learn? What worked?

Tracking your outreach helps you improve over time!',
500, 'stage_4', 10);

-- STAGE 4 — PRACTICE & DEMO EXECUTION (Rank: Partner)
-- XP Range: 4,500 → 7,000

-- Course 5: How to Manage Clients
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(4, 'Partner', 'course', 'How to Manage Clients',
'# Adding a Client

**Demo vs Real Clients**
- Demo clients are for practice (marked with demo flag)
- Real clients are actual businesses you''re working with
- Always start with demo clients to learn the system

# Assigning Automations

1. Select a client from your client list
2. Choose an automation from your available automations
3. Click "Assign Automation"
4. Track the setup process

# Understanding Setup Stages

**pending_setup**: Automation assigned, awaiting setup
**setup_in_progress**: Vault Network is configuring the automation
**setup_complete**: Setup finished, finalizing activation
**active**: Automation is live and working

# How Vault Handles Delivery

Once you assign an automation:
1. Vault Network receives the assignment
2. Our team contacts the client for setup details
3. We configure and deploy the automation
4. Client receives access and training
5. You earn commission when payment processes',
'[
  {
    "question": "What status shows an automation is ready to use?",
    "type": "multiple_choice",
    "options": [
      "pending_setup",
      "setup_in_progress",
      "active",
      "setup_complete"
    ],
    "correct": 2
  },
  {
    "question": "How do you assign an automation to a client?",
    "type": "multiple_choice",
    "options": [
      "Call Vault Network support",
      "Use the Assign Automation feature in Clients tab",
      "Email the client directly",
      "Post on social media"
    ],
    "correct": 1
  },
  {
    "question": "What does \"pending setup\" mean?",
    "type": "multiple_choice",
    "options": [
      "Automation is broken",
      "Automation is assigned and awaiting setup",
      "Client hasn''t paid",
      "Automation is cancelled"
    ],
    "correct": 1
  }
]'::jsonb,
'[2, 1, 1]'::jsonb,
500, NULL, 11);

-- Task 7: Add Demo Client
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(4, 'Partner', 'task', 'Add Demo Client',
'Practice adding a client by creating a demo client:

- Business Name
- Contact Name
- Contact Email
- Industry (optional)

This is practice data, so use fake information. Learn how the client management system works!',
500, NULL, 12);

-- Task 8: Assign Demo Automation
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(4, 'Partner', 'task', 'Assign Demo Automation',
'Practice assigning an automation to your demo client:

1. Go to Clients tab
2. Select your demo client
3. Choose an automation
4. Click "Assign Automation"

See how the assignment process works before working with real clients!',
800, NULL, 13);

-- Task 9: Pitch Reflection
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(4, 'Partner', 'task', 'Pitch Reflection',
'Reflect on your practice pitch:

What did you say to your test client?
What worked well?
What would you do differently?

Learning from practice helps you succeed with real clients!',
500, NULL, 14);

-- Task 10: Invite a Friend
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(4, 'Partner', 'task', 'Invite a Friend',
'Share your referral link with a friend who might be interested in becoming a partner.

When they sign up using your referral link, you''ll earn XP and help grow the Vault Network community!',
1200, 'stage_5', 15);

-- STAGE 5 — VERIFIED PARTNER (Rank: Verified)
-- XP Range: 7,000 → 9,999

-- Course 6: How to Close Deals
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(5, 'Verified', 'course', 'How to Close Deals',
'# Setup + Monthly Pricing

Every automation requires two payments:
1. **Setup Fee**: One-time payment for initial configuration
2. **Monthly Retainer**: Recurring payment for ongoing service

Both payments generate commission for you!

# Payment Processing

All payments process through Vault Network:
- Clients pay Vault Network directly
- You don''t handle payments
- Commission is automatically calculated
- Payments appear in your Earnings tab

# Managing Client Expectations

**Be Clear About:**
- What the automation does (and doesn''t do)
- Timeline for setup and activation
- Ongoing support process
- How to request changes or updates

**Set Realistic Expectations:**
- Setup takes time (usually 1-2 weeks)
- Some customization may be needed
- Vault Network handles technical support

# Support Ticket Etiquette

When clients need help:
1. Direct them to create a support ticket
2. You can view and respond to tickets in Support tab
3. Escalate to Vault Network if needed
4. Stay professional and helpful',
'[
  {
    "question": "What two payments does every automation require?",
    "type": "multiple_choice",
    "options": [
      "Setup fee and monthly retainer",
      "Deposit and final payment",
      "Annual fee and setup fee",
      "One-time payment only"
    ],
    "correct": 0
  },
  {
    "question": "How do clients contact Vault support?",
    "type": "multiple_choice",
    "options": [
      "Call you directly",
      "Create a support ticket",
      "Email Vault Network",
      "Post on social media"
    ],
    "correct": 1
  },
  {
    "question": "How is your commission calculated?",
    "type": "multiple_choice",
    "options": [
      "You calculate it manually",
      "Automatically by Vault Network",
      "Client pays you directly",
      "You invoice Vault Network"
    ],
    "correct": 1
  },
  {
    "question": "What should you do if a client has a technical issue?",
    "type": "text_input",
    "hint": "Direct them to create a support ticket"
  }
]'::jsonb,
'[0, 1, 1, null]'::jsonb,
700, NULL, 16);

-- Task 11: Invite First Real Client (handled by trigger, but lesson exists)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Verified', 'task', 'Invite First Real Client',
'Share your referral link with a real business that needs automation.

When they sign up and create a business account, they''ll be assigned to you and you''ll earn 1,500 XP!',
1500, NULL, 17);

-- Task 12: Assign First Automation to Real Client (handled by trigger)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Verified', 'task', 'Assign First Automation to Real Client',
'Assign your first automation to a real client:

1. Select your real client
2. Choose the right automation for their needs
3. Assign it through the dashboard
4. Track the setup process

You''ll earn 1,000 XP when you complete this!',
1000, NULL, 18);

-- Task 13: Mark First Sale (handled by trigger)
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Verified', 'task', 'Mark First Sale',
'Complete your first automation sale! When a client pays the setup fee, you''ll automatically earn 2,000 XP.

This is a major milestone - celebrate your success!',
2000, NULL, 19);

-- Task 14: Submit Case Summary
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, xp_reward, unlock_action, order_index) VALUES
(5, 'Verified', 'task', 'Submit Case Summary',
'Share your success story! Submit a case study:

- **Client Name**: (Optional)
- **Automation Sold**: Which automation did they purchase?
- **Result Summary**: What outcomes did they achieve?
- **Lessons Learned**: What did you learn from this sale?

Your case study helps other partners learn and may be featured!',
500, 'stage_6', 20);

-- STAGE 6 — SELLER PRO (Rank: Seller Pro)
-- XP Range: 10,000+

-- Course 7: Vault Pro Onboarding
INSERT INTO public.partner_lessons (stage, rank_required, lesson_type, title, content, quiz_questions, quiz_answers, xp_reward, unlock_action, order_index) VALUES
(6, 'Seller Pro', 'course', 'Vault Pro Onboarding',
'# Welcome to Seller Pro!

You''ve reached the highest rank. Congratulations!

# Pro-Only Automations

As a Seller Pro, you get access to:
- Premium automation solutions
- Early access to new automations
- Exclusive automation categories
- Higher-value automation options

# High-Ticket Outreach Strategy

**Target Larger Businesses:**
- Focus on companies with 50+ employees
- Position automations as enterprise solutions
- Emphasize scalability and ROI
- Build relationships with decision-makers

# Managing Multiple Clients

**Organization Tips:**
- Use Deal Tracking for all outreach
- Set reminders for follow-ups
- Track client automation status
- Monitor earnings regularly

# Commission Payout System

- Commissions are calculated automatically
- View all earnings in Earnings tab
- Track setup fees and monthly retainers
- Commission rates increase with rank

# Keep Growing!

Continue earning XP through:
- Monthly activity (+500 XP)
- New clients (+250 XP each)
- New seller referrals (+300 XP)
- Automation suggestions (+1,000 XP if approved)
- Featured case studies (+1,500 XP)',
'[
  {
    "question": "What do Pro Partners get access to?",
    "type": "multiple_choice",
    "options": [
      "Nothing special",
      "Premium automations and early access",
      "Free automations",
      "Lower commission rates"
    ],
    "correct": 1
  },
  {
    "question": "How much XP do you earn for monthly activity?",
    "type": "multiple_choice",
    "options": [
      "100 XP",
      "300 XP",
      "500 XP",
      "1000 XP"
    ],
    "correct": 2
  },
  {
    "question": "What commission rate do Seller Pros earn?",
    "type": "multiple_choice",
    "options": [
      "40%",
      "42%",
      "45%",
      "50%"
    ],
    "correct": 2
  },
  {
    "question": "What should you focus on as a Seller Pro?",
    "type": "text_input",
    "hint": "High-ticket clients and scaling your business"
  }
]'::jsonb,
'[1, 2, 2, null]'::jsonb,
500, NULL, 21);


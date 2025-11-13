// Partner Lessons Configuration
// All lessons, courses, quizzes, and tasks are hardcoded here instead of relying on SQL

import { type PartnerRank } from './partner-progression';

export interface PartnerLesson {
  id: string;
  stage: number;
  rank_required: PartnerRank;
  lesson_type: 'course' | 'quiz' | 'task';
  title: string;
  content: string;
  quiz_questions?: any[];
  quiz_answers?: number[];
  xp_reward: number;
  unlock_action?: string;
  order_index: number;
}

// Helper function to generate unique IDs
const generateId = (stage: number, rank: string, order: number): string => {
  return `stage-${stage}-${rank.toLowerCase().replace(' ', '-')}-${order}`;
};

// STAGE 1 — WELCOME & SETUP (Rank: Recruit)
// XP Range: 0 → 1,000
const stage1Lessons: PartnerLesson[] = [
  {
    id: generateId(1, 'Recruit', 1),
    stage: 1,
    rank_required: 'Recruit',
    lesson_type: 'course',
    title: 'Welcome to The Vault Network',
    content: `# What is Vault Network?

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

Complete the courses and tasks in this stage to unlock Stage 2 and start earning!`,
    quiz_questions: [
      {
        question: "What does Vault Network help businesses with?",
        type: "multiple_choice",
        options: [
          "Selling products online",
          "Automating repetitive tasks and reducing costs",
          "Managing employee schedules",
          "Creating marketing campaigns"
        ],
        correct: 1
      },
      {
        question: "How do partners earn commission?",
        type: "multiple_choice",
        options: [
          "Only from setup fees",
          "Only from monthly payments",
          "From both setup fees and monthly payments",
          "Partners don't earn commission"
        ],
        correct: 2
      },
      {
        question: "What is your starting commission rate?",
        type: "multiple_choice",
        options: ["20%", "25%", "30%", "35%"],
        correct: 1
      }
    ],
    quiz_answers: [1, 2, 1],
    xp_reward: 300, // Increased from 200 to ensure Stage 1 totals 1000 XP
    order_index: 1
  },
  {
    id: generateId(1, 'Recruit', 2),
    stage: 1,
    rank_required: 'Recruit',
    lesson_type: 'course',
    title: 'Partner Rules & Guidelines',
    content: `# Ethical Selling Guidelines

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
- Focus on solving client problems, not just making sales`,
    quiz_questions: [
      {
        question: "A potential client asks if an automation can do something it cannot. What should you do?",
        type: "multiple_choice",
        options: [
          "Tell them it can do it anyway to make the sale",
          "Be honest about limitations and suggest alternatives",
          "Ignore the question",
          "Make up features"
        ],
        correct: 1
      },
      {
        question: "A client has a technical issue with their automation. What should you do?",
        type: "multiple_choice",
        options: [
          "Try to fix it yourself",
          "Direct them to Vault Network support tickets",
          "Tell them to figure it out",
          "Ignore the request"
        ],
        correct: 1
      },
      {
        question: "Can you share client contact information with other partners?",
        type: "multiple_choice",
        options: [
          "Yes, if they ask nicely",
          "No, client data is confidential",
          "Only if you get paid",
          "Only on weekends"
        ],
        correct: 1
      }
    ],
    quiz_answers: [1, 1, 1],
    xp_reward: 300, // Increased from 200 to ensure Stage 1 totals 1000 XP
    order_index: 2
  },
  {
    id: generateId(1, 'Recruit', 3),
    stage: 1,
    rank_required: 'Recruit',
    lesson_type: 'task',
    title: 'Automation Preview',
    content: `Explore the Available Automations section and view at least 3 automation cards.

Navigate to the Automations tab and click on at least 3 different automation cards to view their details. Clicking on automation cards will track your progress and help you understand what solutions you'll be selling to clients.

**Note:** You'll only see the "Available Automations" section at this level. Client Automations tracking unlocks at a higher rank.`,
    xp_reward: 400, // Increased from 300 to ensure Stage 1 totals 1000 XP (300+300+400=1000)
    unlock_action: 'stage_2',
    order_index: 3
  }
];

// STAGE 2 — PRODUCT KNOWLEDGE (Rank: Apprentice)
// XP Range: 1,000 → 2,500
const stage2Lessons: PartnerLesson[] = [
  {
    id: generateId(2, 'Apprentice', 5),
    stage: 2,
    rank_required: 'Apprentice',
    lesson_type: 'course',
    title: 'Understanding Automations',
    content: `# The 6 Default Automations

## Slide 1: Google Review Booster
**Problem**: Businesses struggle to collect and manage Google reviews
**Solution**: Automatically requests reviews from satisfied customers and monitors responses
**Best For**: Local services, restaurants, retail stores

## Slide 2: Invoice Reminder System
**Problem**: Late payments hurt cash flow
**Solution**: Sends automated payment reminders and tracks invoice status
**Best For**: Freelancers, agencies, service businesses

## Slide 3: CRM Sync Bot
**Problem**: Data scattered across multiple platforms
**Solution**: Keeps CRM data synchronized across all platforms in real-time
**Best For**: Agencies, sales teams, growing businesses

## Slide 4: Lead Qualification System
**Problem**: Too many unqualified leads waste time
**Solution**: Automatically scores and routes leads based on custom criteria
**Best For**: Sales teams, agencies, B2B companies

## Slide 5: Social Media Scheduler
**Problem**: Posting consistently across platforms is time-consuming
**Solution**: Schedules and posts content across all major social platforms
**Best For**: Marketing agencies, content creators, small businesses

## Slide 6: Email Campaign Automator
**Problem**: Email marketing is manual and inconsistent
**Solution**: Creates and manages sophisticated email marketing campaigns
**Best For**: E-commerce, SaaS companies, marketing agencies

## Slide 7: Pricing Structure
Each automation has:
- **Setup Fee**: One-time payment for initial setup (you earn commission)
- **Monthly Retainer**: Recurring monthly payment (you earn recurring commission)

## Slide 8: How Automations Are Delivered
Vault Network handles all technical setup and delivery. Your role is to:
1. Connect businesses with the right automation
2. Explain the value and benefits
3. Vault Network handles the rest!`,
    quiz_questions: [
      {
        question: "Which automation helps collect Google Reviews?",
        type: "multiple_choice",
        options: [
          "Invoice Reminder System",
          "Google Review Booster",
          "CRM Sync Bot",
          "Social Media Scheduler"
        ],
        correct: 1
      },
      {
        question: "Which automation improves CRM data accuracy?",
        type: "multiple_choice",
        options: [
          "Lead Qualification System",
          "CRM Sync Bot",
          "Email Campaign Automator",
          "Google Review Booster"
        ],
        correct: 1
      },
      {
        question: "Which automation sends payment reminders?",
        type: "multiple_choice",
        options: [
          "Invoice Reminder System",
          "CRM Sync Bot",
          "Social Media Scheduler",
          "Lead Qualification System"
        ],
        correct: 0
      }
    ],
    quiz_answers: [1, 1, 0],
    xp_reward: 400,
    order_index: 5
  },
  {
    id: generateId(2, 'Apprentice', 6),
    stage: 2,
    rank_required: 'Apprentice',
    lesson_type: 'task',
    title: 'Automation Matching Game',
    content: `Match each automation to the industry it best serves. Click on the matching industry card for each automation.`,
    quiz_questions: [
      {
        question: "Google Review Booster → ?",
        type: "multiple_choice",
        options: [
          "Local Services",
          "Finance / Freelancers",
          "Agencies",
          "Marketing"
        ],
        correct: 0
      },
      {
        question: "Invoice Reminder System → ?",
        type: "multiple_choice",
        options: [
          "Local Services",
          "Finance / Freelancers",
          "Agencies",
          "Marketing"
        ],
        correct: 1
      },
      {
        question: "CRM Sync Bot → ?",
        type: "multiple_choice",
        options: [
          "Local Services",
          "Finance / Freelancers",
          "Agencies",
          "Marketing"
        ],
        correct: 2
      },
      {
        question: "Social Media Scheduler → ?",
        type: "multiple_choice",
        options: [
          "Local Services",
          "Finance / Freelancers",
          "Agencies",
          "Marketing"
        ],
        correct: 3
      }
    ],
    quiz_answers: [0, 1, 2, 3],
    xp_reward: 400,
    order_index: 6
  },
  {
    id: generateId(2, 'Apprentice', 7),
    stage: 2,
    rank_required: 'Apprentice',
    lesson_type: 'task',
    title: 'Suggest New Automation',
    content: `Have an idea for a new automation? Submit your suggestion!

Fill out the form with:
- **Title**: Name of the automation
- **Problem It Solves**: What business problem does this address?
- **Estimated Client Type**: Who would benefit from this?

Your suggestions help shape the future of Vault Network!`,
    xp_reward: 700,
    unlock_action: 'stage_3',
    order_index: 7
  }
];

// STAGE 3 — SALES TOOLKIT (Rank: Agent)
// XP Range: 2,500 → 4,500
const stage3Lessons: PartnerLesson[] = [
  {
    id: generateId(3, 'Agent', 8),
    stage: 3,
    rank_required: 'Agent',
    lesson_type: 'course',
    title: 'Sales Basics for Automation Partners',
    content: `## Slide 1: Welcome to Sales Mastery

Welcome to your sales toolkit! This course will teach you how to effectively communicate the value of automations and handle common client concerns.

Master these skills and you'll be closing deals like a pro! 🎯

## Slide 2: Understanding Client Objections - "It's too expensive"

**The Strategy:**
- **Focus on ROI**: Show how automation saves time and money long-term
- **Break down costs**: Compare automation cost vs. manual labor costs
- **Emphasize recurring value**: Monthly automation fee vs. full-time employee salary

**Example Response:**
"I understand cost is a concern. Let's break this down: This automation saves your team 10 hours per week. At $25/hour, that's $1,000/month in saved labor costs. The automation costs $300/month - you're saving $700/month while scaling your operations."

## Slide 3: Understanding Client Objections - "We don't need automation"

**The Strategy:**
- **Identify pain points**: Ask about their current challenges
- **Show specific solutions**: Connect automation features to their problems
- **Share success stories**: Use real examples from similar businesses

**Example Response:**
"I hear you. Many businesses think they're fine until they see what they're missing. Can I ask - how many hours does your team spend on [specific task]? I worked with a similar business that saved 15 hours/week with this automation."

## Slide 4: Understanding Client Objections - "We'll do it ourselves"

**The Strategy:**
- **Explain technical complexity**: Show what's involved behind the scenes
- **Highlight time investment**: Development, maintenance, updates
- **Emphasize expertise**: Vault Network handles everything

**Example Response:**
"That's totally understandable! Building this internally typically takes 3-6 months of development time, plus ongoing maintenance. Vault Network has already built and tested this - you get a proven solution immediately, and we handle all updates and support."

## Slide 5: Positioning Automations as ROI Tools

**Always frame automations as investments, not costs.**

**The ROI Calculator Approach:**

1. **Calculate Time Saved**
   - How many hours per week/month does this task take?
   - Multiply by hourly rate
   - Show monthly savings

2. **Compare to Hiring**
   - Full-time employee: $3,000-5,000/month + benefits
   - Automation: $200-500/month
   - Show 10x cost savings

3. **Demonstrate Scalability**
   - Manual process: Limited by team size
   - Automation: Scales infinitely
   - Show growth potential

**Example ROI Calculation:**
"Your team spends 20 hours/week on invoice follow-ups. At $30/hour, that's $2,400/month. The Invoice Reminder System costs $250/month. You're saving $2,150/month while ensuring nothing falls through the cracks."

## Slide 6: Tone & Style of Outreach - Be Consultative

**Be Consultative, Not Salesy**

**Do:**
- Ask questions about their business
- Listen to their pain points first
- Offer solutions based on their needs
- Position yourself as a consultant

**Don't:**
- Push products immediately
- Use aggressive sales language
- Ignore their concerns
- Make it all about commission

**Be Professional but Friendly**
- Use their name: Personalization matters
- Reference specifics: Mention their business details
- Keep it concise: Respect their time
- Add value: Every message should help them

## Slide 7: Example Outreach Templates

**Example Outreach:**
"Hi [Name], I noticed [specific detail about their business]. Many [industry] businesses struggle with [pain point]. I have a solution that's helped similar companies save [X hours/$X] per month. Worth a quick chat?"

**Key Elements:**
- Personalization
- Specific pain point
- Social proof
- Clear value proposition
- Low-pressure ask

## Slide 8: Setting Follow-Up Reminders

**Use the Deal Tracking system effectively:**

1. **Log all outreach attempts**
   - Track every touchpoint
   - Note their responses
   - Record next steps

2. **Set strategic reminders**
   - Follow up within 48 hours
   - Re-engage after 1 week if no response
   - Check in quarterly for future needs

3. **Track conversation status**
   - Interested → Schedule demo
   - Not now → Follow up in 3 months
   - Not interested → Respect their decision

4. **Learn from what works**
   - Review successful conversations
   - Identify patterns
   - Refine your approach

## Slide 9: Key Takeaways

- **Objections are opportunities** to show value
- **ROI is your best friend** - always calculate it
- **Be consultative** - help, don't sell
- **Follow up strategically** - persistence pays off
- **Track everything** - data drives improvement

Ready to put this into practice? Complete the quiz to test your knowledge!`,
    quiz_questions: [
      {
        question: "A client says automation is too expensive. What should you focus on?",
        type: "multiple_choice",
        options: [
          "Lowering the price",
          "ROI and cost savings",
          "Telling them they're wrong",
          "Giving up"
        ],
        correct: 1
      },
      {
        question: "What tone should you use in outreach messages?",
        type: "multiple_choice",
        options: [
          "Aggressive and pushy",
          "Consultative and helpful",
          "Casual and unprofessional",
          "Demanding"
        ],
        correct: 1
      },
      {
        question: "How should you position automations?",
        type: "multiple_choice",
        options: [
          "As expensive tools",
          "As investments with ROI",
          "As optional luxuries",
          "As complicated systems"
        ],
        correct: 1
      },
      {
        question: "What should you do after an outreach attempt?",
        type: "text_input",
        hint: "Log it in the Deal Tracking system"
      }
    ],
    quiz_answers: [1, 1, 1, null],
    xp_reward: 600,
    order_index: 8
  },
  {
    id: generateId(3, 'Agent', 9),
    stage: 3,
    rank_required: 'Agent',
    lesson_type: 'task',
    title: 'Create Your Sales Script',
    content: `Choose from 3 templates and customize your sales script:

1. **Conversational DM Script**: For social media outreach
2. **Professional Email Template**: For email campaigns
3. **Consultative Pitch Outline**: For calls and meetings

Edit and save your custom script. You can update it anytime as you learn what works best!`,
    xp_reward: 600,
    order_index: 9
  },
  {
    id: generateId(3, 'Agent', 10),
    stage: 3,
    rank_required: 'Agent',
    lesson_type: 'task',
    title: 'Log First Outreach in Deal Diary',
    content: `Log your first outreach attempt in the Deal Tracking system:

- **Date**: When did you reach out?
- **Channel**: Email, DM, Call, etc.
- **Client Name**: (Optional)
- **Status**: No response / Follow-up / Success
- **Reflection**: What did you learn? What worked?

Tracking your outreach helps you improve over time!`,
    xp_reward: 500,
    unlock_action: 'stage_4',
    order_index: 10
  }
];

// STAGE 4 — PRACTICE & DEMO EXECUTION (Rank: Partner)
// XP Range: 4,500 → 7,000
const stage4Lessons: PartnerLesson[] = [
  {
    id: generateId(4, 'Partner', 11),
    stage: 4,
    rank_required: 'Partner',
    lesson_type: 'course',
    title: 'How to Manage Clients',
    content: `## Slide 1: Welcome to Client Management

Master the client management system and learn how to assign automations effectively.

Practice makes perfect! 🎯

## Slide 2: Demo vs Real Clients

**Demo Clients:**
- Practice with fake data
- Learn the system safely
- No real consequences
- Marked with demo flag

**Real Clients:**
- Actual businesses
- Real transactions
- Earn real commissions
- Start here after practice

**Always start with demo clients to learn the system!**

## Slide 3: Adding a Client

**Steps to Add a Client:**

1. Go to **Clients** tab
2. Click **"Add Demo Client"** (for practice)
3. Fill in:
   - Business Name
   - Contact Name
   - Contact Email
   - Industry (optional)
4. Click **"Add Client"**

**Use fake information for demo clients - this is practice!**

## Slide 4: Assigning Automations

**How to Assign:**

1. Select a client from your client list
2. Choose an automation from available automations
3. Click **"Assign Automation"**
4. Track the setup process

**The automation will appear in the client's dashboard once assigned.**

## Slide 5: Understanding Setup Stages

**pending_setup**
Automation assigned, awaiting setup by Vault Network

**setup_in_progress**
Vault Network is configuring the automation

**setup_complete**
Setup finished, finalizing activation

**active**
Automation is live and working

## Slide 6: How Vault Handles Delivery

**Once you assign an automation:**

1. Vault Network receives the assignment
2. Our team contacts the client for setup details
3. We configure and deploy the automation
4. Client receives access and training
5. You earn commission when payment processes

**You don't need to do any technical work - we handle everything!**

## Slide 7: Key Takeaways

- **Start with demo clients** to practice
- **Assign automations** through the Clients tab
- **Track status** to see progress
- **Vault handles** all technical setup
- **You earn** commission automatically

Ready to practice? Complete the quiz to test your knowledge!`,
    quiz_questions: [
      {
        question: "What status shows an automation is ready to use?",
        type: "multiple_choice",
        options: [
          "pending_setup",
          "setup_in_progress",
          "active",
          "setup_complete"
        ],
        correct: 2
      },
      {
        question: "How do you assign an automation to a client?",
        type: "multiple_choice",
        options: [
          "Call Vault Network support",
          "Use the Assign Automation feature in Clients tab",
          "Email the client directly",
          "Post on social media"
        ],
        correct: 1
      },
      {
        question: "What does \"pending setup\" mean?",
        type: "multiple_choice",
        options: [
          "Automation is broken",
          "Automation is assigned and awaiting setup",
          "Client hasn't paid",
          "Automation is cancelled"
        ],
        correct: 1
      }
    ],
    quiz_answers: [2, 1, 1],
    xp_reward: 500,
    order_index: 11
  },
  {
    id: generateId(4, 'Partner', 12),
    stage: 4,
    rank_required: 'Partner',
    lesson_type: 'task',
    title: 'Add Demo Client',
    content: `Practice adding a client by creating a demo client.

Fill in the form with fake information and learn how the client management system works!`,
    xp_reward: 500,
    order_index: 12
  },
  {
    id: generateId(4, 'Partner', 13),
    stage: 4,
    rank_required: 'Partner',
    lesson_type: 'task',
    title: 'Assign Demo Automation',
    content: `Practice assigning an automation to your demo client.

Go to the Clients tab, select your demo client, choose an automation, and click "Assign Automation".`,
    xp_reward: 800,
    order_index: 13
  },
  {
    id: generateId(4, 'Partner', 14),
    stage: 4,
    rank_required: 'Partner',
    lesson_type: 'task',
    title: 'Pitch Reflection',
    content: `Reflect on your practice pitch.

What worked well? What would you do differently? Learning from practice helps you succeed!`,
    xp_reward: 500,
    order_index: 14
  },
  {
    id: generateId(4, 'Partner', 15),
    stage: 4,
    rank_required: 'Partner',
    lesson_type: 'task',
    title: 'Invite a Friend',
    content: `Share your referral link with a friend.

When they sign up using your referral link, you'll earn XP and help grow the Vault Network community!`,
    xp_reward: 1200,
    unlock_action: 'stage_5',
    order_index: 15
  }
];

// STAGE 5 — VERIFIED PARTNER (Rank: Verified)
// XP Range: 7,000 → 9,999
const stage5Lessons: PartnerLesson[] = [
  {
    id: generateId(5, 'Verified', 16),
    stage: 5,
    rank_required: 'Verified',
    lesson_type: 'course',
    title: 'How to Close Deals',
    content: `# Setup + Monthly Pricing

Every automation requires two payments:
1. **Setup Fee**: One-time payment for initial configuration
2. **Monthly Retainer**: Recurring payment for ongoing service

Both payments generate commission for you!

# Payment Processing

All payments process through Vault Network:
- Clients pay Vault Network directly
- You don't handle payments
- Commission is automatically calculated
- Payments appear in your Earnings tab

# Managing Client Expectations

**Be Clear About:**
- What the automation does (and doesn't do)
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
4. Stay professional and helpful`,
    quiz_questions: [
      {
        question: "What two payments does every automation require?",
        type: "multiple_choice",
        options: [
          "Setup fee and monthly retainer",
          "Deposit and final payment",
          "Annual fee and setup fee",
          "One-time payment only"
        ],
        correct: 0
      },
      {
        question: "How do clients contact Vault support?",
        type: "multiple_choice",
        options: [
          "Call you directly",
          "Create a support ticket",
          "Email Vault Network",
          "Post on social media"
        ],
        correct: 1
      },
      {
        question: "How is your commission calculated?",
        type: "multiple_choice",
        options: [
          "You calculate it manually",
          "Automatically by Vault Network",
          "Client pays you directly",
          "You invoice Vault Network"
        ],
        correct: 1
      },
      {
        question: "What should you do if a client has a technical issue?",
        type: "text_input",
        hint: "Direct them to create a support ticket"
      }
    ],
    quiz_answers: [0, 1, 1, null],
    xp_reward: 700,
    order_index: 16
  },
  {
    id: generateId(5, 'Verified', 17),
    stage: 5,
    rank_required: 'Verified',
    lesson_type: 'task',
    title: 'Invite First Real Client',
    content: `Share your referral link with a real business that needs automation.

When they sign up and create a business account, they'll be assigned to you and you'll earn 1,500 XP!`,
    xp_reward: 1500,
    order_index: 17
  },
  {
    id: generateId(5, 'Verified', 18),
    stage: 5,
    rank_required: 'Verified',
    lesson_type: 'task',
    title: 'Assign First Automation to Real Client',
    content: `Assign your first automation to a real client:

1. Select your real client
2. Choose the right automation for their needs
3. Assign it through the dashboard
4. Track the setup process

You'll earn 1,000 XP when you complete this!`,
    xp_reward: 1000,
    order_index: 18
  },
  {
    id: generateId(5, 'Verified', 19),
    stage: 5,
    rank_required: 'Verified',
    lesson_type: 'task',
    title: 'Mark First Sale',
    content: `Complete your first automation sale! When a client pays the setup fee, you'll automatically earn 2,000 XP.

This is a major milestone - celebrate your success!`,
    xp_reward: 2000,
    order_index: 19
  },
  {
    id: generateId(5, 'Verified', 20),
    stage: 5,
    rank_required: 'Verified',
    lesson_type: 'task',
    title: 'Submit Case Summary',
    content: `Share your success story! Submit a case study:

- **Client Name**: (Optional)
- **Automation Sold**: Which automation did they purchase?
- **Result Summary**: What outcomes did they achieve?
- **Lessons Learned**: What did you learn from this sale?

Your case study helps other partners learn and may be featured!`,
    xp_reward: 500,
    unlock_action: 'stage_6',
    order_index: 20
  }
];

// STAGE 6 — SELLER PRO (Rank: Seller Pro)
// XP Range: 10,000+
const stage6Lessons: PartnerLesson[] = [
  {
    id: generateId(6, 'Seller Pro', 21),
    stage: 6,
    rank_required: 'Seller Pro',
    lesson_type: 'course',
    title: 'Vault Pro Onboarding',
    content: `# Welcome to Seller Pro!

You've reached the highest rank. Congratulations!

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
- Featured case studies (+1,500 XP)`,
    quiz_questions: [
      {
        question: "What do Pro Partners get access to?",
        type: "multiple_choice",
        options: [
          "Nothing special",
          "Premium automations and early access",
          "Free automations",
          "Lower commission rates"
        ],
        correct: 1
      },
      {
        question: "How much XP do you earn for monthly activity?",
        type: "multiple_choice",
        options: ["100 XP", "300 XP", "500 XP", "1000 XP"],
        correct: 2
      },
      {
        question: "What commission rate do Seller Pros earn?",
        type: "multiple_choice",
        options: ["40%", "42%", "45%", "50%"],
        correct: 2
      },
      {
        question: "What should you focus on as a Seller Pro?",
        type: "text_input",
        hint: "High-ticket clients and scaling your business"
      }
    ],
    quiz_answers: [1, 2, 2, null],
    xp_reward: 500,
    order_index: 21
  }
];

// Combine all lessons
export const ALL_LESSONS: PartnerLesson[] = [
  ...stage1Lessons,
  ...stage2Lessons,
  ...stage3Lessons,
  ...stage4Lessons,
  ...stage5Lessons,
  ...stage6Lessons
];

// Get lessons for a specific rank
export const getLessonsForRank = (rank: PartnerRank): PartnerLesson[] => {
  const ranks: PartnerRank[] = ['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Seller Pro'];
  const rankIndex = ranks.indexOf(rank);
  
  return ALL_LESSONS.filter(lesson => {
    const lessonRankIndex = ranks.indexOf(lesson.rank_required);
    return lessonRankIndex <= rankIndex;
  });
};

// Get lesson by ID
export const getLessonById = (id: string): PartnerLesson | undefined => {
  return ALL_LESSONS.find(lesson => lesson.id === id);
};


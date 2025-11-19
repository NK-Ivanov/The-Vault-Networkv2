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

// STAGE 1 — RECRUIT & RECRUIT PLUS (Rank: Recruit → Recruit Plus)
// XP Range: 0 → 1,000
// Recruit Stage A (Tasks 1-3): Open Overview, Copy Referral Link, View 3 Automations
// Recruit Plus Stage B (Tasks 4-6): Bookmark Automation, Send Message to Vault Network, Read Automation Brief
// Recruit Plus Stage C (Tasks 7-8): Pass Vault Basics Quiz (≥80%), Log in 3 Different Days

const stage1Lessons: PartnerLesson[] = [
  {
    id: 'stage-1-recruit-1',
    stage: 1,
    rank_required: 'Recruit',
    lesson_type: 'task',
    title: 'Open Overview Tab',
    content: `Navigate to the Overview tab after signup to familiarize yourself with your dashboard.

**Task:** Simply open the Overview tab in your Partner Dashboard. This is your home base where you'll see your key metrics, referral link, and quick stats.

**Why:** Understanding your dashboard layout helps you navigate efficiently as you progress through your partner journey.`,
    xp_reward: 100,
    order_index: 1
  },
  {
    id: 'stage-1-recruit-2',
    stage: 1,
    rank_required: 'Recruit',
    lesson_type: 'task',
    title: 'Copy Your Referral Link',
    content: `Copy your personalized referral link from the Overview tab.

**Task:** 
1. Go to the Overview tab
2. Find your referral link (format: /for-businesses?ref=YOUR-CODE)
3. Click the copy button to copy it to your clipboard

**Why:** Your referral link is how you'll invite clients and earn commissions. Get familiar with it early!`,
    xp_reward: 100,
    order_index: 2
  },
  {
    id: 'stage-1-recruit-3',
    stage: 1,
    rank_required: 'Recruit',
    lesson_type: 'task',
    title: 'View 3 Automation Cards',
    content: `Explore the Available Automations section and view at least 3 automation cards.

Navigate to the Automations tab and click on at least 3 different automation cards to view their details. Clicking on automation cards will track your progress and help you understand what solutions you'll be selling to clients.

**Note:** You'll only see the "Available Automations" section at this level. Client Automations tracking unlocks at a higher rank.`,
    xp_reward: 200,
    unlock_action: 'recruit_plus',
    order_index: 3
  },
  {
    id: 'stage-1-recruit-plus-4',
    stage: 1,
    rank_required: 'Recruit Plus',
    lesson_type: 'task',
    title: 'Bookmark 1 Automation',
    content: `Bookmark an automation that interests you for easy access later.

**Task:**
1. Go to the Automations tab
2. Find an automation you want to bookmark
3. Click the bookmark icon to save it

**Why:** Bookmarking helps you quickly access automations you're interested in selling to clients.`,
    xp_reward: 150,
    order_index: 4
  },
  {
    id: 'stage-1-recruit-plus-5',
    stage: 1,
    rank_required: 'Recruit Plus',
    lesson_type: 'task',
    title: 'Send Message to Vault Network',
    content: `Visit the Support tab and send a message to The Vault Network team.

**Task:**
1. Navigate to the Support tab
2. Find the "Message The Vault Network" section
3. Create a new message with a subject and message body
4. Send your message

**Why:** This helps you get familiar with the support system and opens a communication channel with The Vault Network team.`,
    xp_reward: 150,
    order_index: 5
  },
  {
    id: 'stage-1-recruit-plus-6',
    stage: 1,
    rank_required: 'Recruit Plus',
    lesson_type: 'task',
    title: 'Read One Full Automation Brief',
    content: `Read a complete automation brief to understand detailed information about an automation.

**Task:**
1. Go to the Automations tab
2. Click on an automation card to open its brief
3. Read through the full brief including:
   - Full description
   - Use cases
   - Features detail
   - Implementation timeline
   - Technical requirements
   - Pricing details
   - FAQ

**Why:** Understanding automation details helps you sell them effectively to clients.`,
    xp_reward: 150,
    order_index: 6
  },
  {
    id: 'stage-1-recruit-plus-7',
    stage: 1,
    rank_required: 'Recruit Plus',
    lesson_type: 'quiz',
    title: 'Vault Basics Quiz',
    content: `Pass the Vault Basics Quiz with a score of 80% or higher.

**Task:** Complete the quiz covering:
- What Vault Network does
- How partners earn commissions
- Partner rules and guidelines
- Basic automation knowledge

**Requirement:** Score ≥ 80% (8 / 10 correct) to pass
**Why:** This ensures you understand the fundamentals before advancing to the next rank.`,
    quiz_questions: [
      {
        question: "What is the main goal of The Vault Network?",
        type: "multiple_choice",
        options: [
          "Help people buy physical products online",
          "Help businesses automate daily tasks and grow through systems",
          "Build social-media pages for small companies",
          "Manage financial accounting for startups"
        ],
        correct: 1
      },
      {
        question: "Which best describes an “automation”?",
        type: "multiple_choice",
        options: [
          "A downloadable PDF tutorial",
          "A system that performs a business process automatically",
          "A type of website template",
          "A support ticket category"
        ],
        correct: 1
      },
      {
        question: "Where do you find your personalized referral link?",
        type: "multiple_choice",
        options: [
          "In the Automations tab",
          "In the Overview tab",
          "Inside the Support inbox",
          "In the Earnings ledger"
        ],
        correct: 1
      },
      {
        question: "What happens when a client signs up using your referral link?",
        type: "multiple_choice",
        options: [
          "They are assigned to a random seller",
          "They automatically become your client in the system",
          "They pay you directly outside Vault",
          "Nothing until you email Vault manually"
        ],
        correct: 1
      },
      {
        question: "Which section shows your total sales and commissions?",
        type: "multiple_choice",
        options: [
          "Support tab",
          "Overview tab",
          "Earnings tab",
          "Automations tab"
        ],
        correct: 2
      },
      {
        question: "What is your starting commission rate as a new partner?",
        type: "multiple_choice",
        options: ["10%", "25%", "40%", "45%"],
        correct: 1
      },
      {
        question: "What happens when you assign an automation to a client?",
        type: "multiple_choice",
        options: [
          "The automation is installed and tracked for that client",
          "It posts publicly to the community feed",
          "It deletes their previous automations",
          "It sends a new support ticket to Vault automatically"
        ],
        correct: 0
      },
      {
        question: "Where can you send questions or request help from Vault Network?",
        type: "multiple_choice",
        options: [
          "In the Clients tab",
          "Through the Support tab → “Message The Vault Network”",
          "In the Earnings ledger",
          "By replying to leaderboard messages"
        ],
        correct: 1
      },
      {
        question: "How do you level up through the Vault Partner Program?",
        type: "multiple_choice",
        options: [
          "By buying more automations",
          "By completing tasks and earning XP",
          "By waiting 30 days",
          "By reaching a fixed number of sales only"
        ],
        correct: 1
      },
      {
        question: "What does the Partner Leaderboard display?",
        type: "multiple_choice",
        options: [
          "Every client’s private data",
          "A ranked list of partners by sales and commissions",
          "Only your own XP history",
          "System error reports"
        ],
        correct: 1
      }
    ],
    quiz_answers: [1, 1, 1, 1, 2, 1, 0, 1, 1, 1],
    xp_reward: 200,
    order_index: 7
  }
];

// STAGE 2 — PRODUCT KNOWLEDGE (Rank: Apprentice)
// XP Range: 1,000 → 2,500
// Apprentice Stage A (Tasks 1-3): Understanding Automations Course, Automation Matching Game, Suggest New Automation
// Apprentice Plus Stage B (Tasks 4-6): Explore Five Automations, Bookmark Two Automations, Read One Automation in Full
// Apprentice Plus Stage C (Tasks 7-9): Write One-Sentence Pitch, Check Partner Leaderboard, Log In on 2 Different Days
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

**Task:** Fill out the form with:
- **Title**: Name of the automation
- **Problem It Solves**: What business problem does this address?
- **Estimated Client Type**: Who would benefit from this?

**Why:** Your suggestions help shape the future of Vault Network!`,
    xp_reward: 700,
    unlock_action: 'stage_3',
    order_index: 7
  },
  {
    id: generateId(2, 'Apprentice', 8),
    stage: 2,
    rank_required: 'Apprentice Plus',
    lesson_type: 'task',
    title: 'Explore Five Automations',
    content: `Explore the existing Vault library and connect the dots.

**Task:** Open five different automation cards in the Automations tab and scroll to their pricing sections.

**Why:** Familiarizing yourself with the full automation library helps you recommend the right solutions to clients.`,
    xp_reward: 300,
    order_index: 8
  },
  {
    id: generateId(2, 'Apprentice', 9),
    stage: 2,
    rank_required: 'Apprentice Plus',
    lesson_type: 'task',
    title: 'Bookmark or Favourite Two Automations',
    content: `Pick two automations you'd be excited to sell later — mark them as favourites.

**Task:**
1. Go to the Automations tab
2. Find two automations you're interested in selling
3. Click the bookmark/favourite icon to save them

**Why:** Bookmarking helps you quickly access automations you're interested in selling to clients.`,
    xp_reward: 250,
    order_index: 9
  },
  {
    id: generateId(2, 'Apprentice', 10),
    stage: 2,
    rank_required: 'Apprentice Plus',
    lesson_type: 'task',
    title: 'Read One Automation in Full (Details + Features)',
    content: `Read any automation's full description to the end (ensures product familiarity).

**Task:**
1. Go to the Automations tab
2. Click on an automation card to open its full details
3. Read through the complete description including:
   - Full description
   - Features detail
   - Implementation timeline
   - Technical requirements
   - Pricing details
   - FAQ

**Why:** Understanding automation details helps you sell them effectively to clients.`,
    xp_reward: 200,
    order_index: 10
  },
  {
    id: generateId(2, 'Apprentice', 11),
    stage: 2,
    rank_required: 'Apprentice Plus',
    lesson_type: 'task',
    title: 'Write a One-Sentence Pitch',
    content: `Start forming opinions and communicating value.

**Task:** Describe in one sentence how one chosen automation helps a business. Use the text box below to write your pitch.

**Why:** Crafting clear, concise pitches helps you communicate value quickly to potential clients.`,
    xp_reward: 400,
    order_index: 11
  },
  {
    id: generateId(2, 'Apprentice', 12),
    stage: 2,
    rank_required: 'Apprentice Plus',
    lesson_type: 'task',
    title: 'Check the Partner Leaderboard',
    content: `Visit the leaderboard under Overview to see how partners rank and where you are.

**Task:**
1. Navigate to the Overview tab
2. Find the Partner Leaderboard section
3. View the rankings and see where you stand

**Why:** The leaderboard helps you see your progress and motivates you to keep growing!`,
    xp_reward: 150,
    order_index: 12
  },
  {
    id: generateId(2, 'Apprentice', 13),
    stage: 2,
    rank_required: 'Apprentice Plus',
    lesson_type: 'task',
    title: 'Log In on 2 Different Days',
    content: `Build daily platform habit and demonstrate consistency.

**Task:** Simply log in to your Partner Dashboard on 2 different days. Your login will be tracked automatically.

**Why:** Consistent engagement helps you stay on top of opportunities and build productive habits.`,
    xp_reward: 300,
    order_index: 13
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
  },
  {
    id: generateId(3, 'Agent Plus', 11),
    stage: 3,
    rank_required: 'Agent Plus',
    lesson_type: 'course',
    title: 'Sales Foundations',
    content: `## Slide 1: What Makes a Great Seller

**The Core Truth**

Great sellers listen before they talk. This might sound simple, but it's the foundation of everything that follows.

Most sales conversations fail because the seller talks too much and listens too little. When you listen first, you understand what your buyer actually needs, not what you think they need.

**Understanding the Buyer's Real Motivation**

They understand that most buyers aren't looking for software. They're looking for relief from chaos.

Think about it: When a business owner contacts you about automation, they're not excited about the technology. They're stressed about:
- Losing track of customer information
- Missing important follow-ups
- Spending too much time on repetitive tasks
- Falling behind competitors who are more organized

**Your Real Job**

Your job is not to impress them with tools.

You don't need to explain every technical detail or feature. You don't need to show off how smart you are or how complex the system is. In fact, complexity is often a barrier to sales.

It's to show them peace of mind.

When you understand what they're really struggling with, you can position your automation as the solution that brings calm to their chaos. That's what sells: not the features, but the feeling of relief and control they'll experience.

## Slide 2: What Buyers Really Want

**The Three Universal Desires**

Every business owner, regardless of industry or size, wants three fundamental things:

**1. Less Stress**

Business owners are constantly worried. They worry about:
- Missing important deadlines
- Forgetting to follow up with leads
- Data getting lost or disorganized
- Letting customers down

Your automation reduces their worry by handling things automatically. When you sell, emphasize the peace of mind they'll experience.

**2. More Time**

Time is the most valuable resource any business owner has. They're stretched thin, working long hours, and struggling to keep up.

Your automation gives them time back by:
- Eliminating repetitive manual tasks
- Automating follow-ups and reminders
- Organizing data automatically
- Reducing the need for constant attention

**3. Clear Results They Can Feel**

Abstract benefits don't sell. Business owners want to feel the difference:
- "I can actually see all my invoices in one place"
- "I notice I'm not stressed about follow-ups anymore"
- "I have 10 extra hours every week"

**The Golden Rule**

Every word in your pitch should point to one of those three goals.

Before you write any sales message, ask yourself: "Does this reduce stress, save time, or create a tangible result they can feel?" If the answer is no, rewrite it.

## Slide 3: Selling Outcomes, Not Features

**The Feature Trap**

Most sellers fall into the feature trap. They list technical details, platform names, and system capabilities because that's what they understand. But here's the problem: Your buyer doesn't care about your tools. They care about their problems.

**The Wrong Way (Features-First)**

Don't say, "This automation uses n8n and webhooks."

Why this fails:
- Your buyer has no idea what n8n is
- Webhooks sound technical and complicated
- You're talking about YOUR solution, not THEIR benefit
- You sound like you're showing off, not helping

**The Right Way (Outcome-First)**

Say, "This keeps your client database perfectly updated. No more manual edits."

Why this works:
- You're describing what they'll experience
- You're addressing their pain (manual work)
- You're speaking their language
- You're focusing on the benefit, not the technology

**More Examples**

**Bad (Feature-Focused):**
- "We use Airtable integration with Zapier triggers"
- "It syncs via API endpoints with real-time webhooks"
- "The system has multi-factor authentication and encrypted storage"

**Good (Outcome-Focused):**
- "Your customer information stays perfectly organized. Everything updates automatically"
- "You never have to manually enter data again. It happens instantly"
- "Your data is always secure and backed up. You never have to worry about losing information"

**The Golden Rule**

That's the difference between explaining and selling.

When you explain features, you're teaching. When you sell outcomes, you're helping. Always sell the outcome first, and only mention features if they ask for technical details.

## Slide 4: The Pain Principle

People rarely buy for pleasure. They buy to solve pain.

Identify one clear pain for each automation (missed leads, slow payments, disorganized data) and lead with it.

## Slide 5: Understanding Business Mindset

A local business owner doesn't think in "automations."

They think in "I can't keep up with my customers."

Meet them in their language.

Mirror their world, not your toolset.

## Slide 6: The Emotion Behind Every Sale

Even in B2B, emotions drive decisions.

Time savings = relief.

Organization = control.

Growth = pride.

Speak to those emotions.

## Slide 7: Simplify the Conversation

If you confuse, you lose.

Your language must be simple enough for anyone to repeat after hearing it once.

If they can't re-explain it, you haven't sold it.

## Slide 8: Listening as a Selling Tool

Ask open-ended questions like:

"What's slowing you down most right now?"

"What would an easier version of your week look like?"

Listen twice as much as you talk.

## Slide 9: Understanding Buyer Confidence

Buyers don't buy when they understand everything. They buy when they trust you understand it.

You don't have to explain every step.

Just show them you've done this before.

## Slide 10: Recap - Module 1

Know who you're speaking to

Lead with pain, not features

Use emotion-driven results

Listen more than you speak

Keep explanations simple

## Slide 11: What Is Framing?

Framing is how you make someone see the value in your offer.

It's the difference between "software" and "time freedom."

Your frame defines how they'll judge your price later.

## Slide 12: The ROI Frame (Core Concept)

Every great pitch has three parts:

1. The Pain
2. The Solution
3. The Outcome

If you hit all three clearly, you've sold without needing pressure.

## Slide 13: Example of ROI Frame

"You're manually following up with clients every week.

This automation does it for you, so you get that time back."

Keep it believable.

If it sounds magical, it feels fake.

## Slide 14: The Power of Specificity

Don't say "saves a lot of time."

Say "saves 3 hours every week."

Specific numbers build instant trust.

## Slide 15: Making It Visual

Paint the after-scenario:

"Imagine opening your laptop and seeing all your invoices marked 'paid' with no chasing needed."

The mind buys what it can visualize.

## Slide 16: The Story Arc

Turn your pitch into a mini-story:

The problem

The struggle

The transformation

Stories beat statistics every time.

## Slide 17: Emotional Anchoring

After sharing results, anchor it emotionally:

"You'll finally have breathing space again."

That line sells more than any technical detail.

## Slide 18: Pricing Confidence

Never justify your price. Instead, explain your value.

"This saves you $500 worth of time every month for $79."

Confidence builds respect.

## Slide 19: Creating Your Frame

Fill this out for any automation:

Pain: ___

Solution: ___

Outcome: ___

You'll start talking naturally like a professional seller.

## Slide 20: Recap - Module 2

Frame using Pain → Solution → Outcome

Use realistic, specific benefits

Paint visual outcomes

Tell mini-stories

Anchor emotion, not logic

## Slide 21: The Curse of Knowledge

You know too much, and that's the problem.

When you use technical terms, you sound smart but lose connection.

## Slide 22: What "Tech Talk" Sounds Like

"We'll set up webhook-based data sync using Airtable and Supabase."

Most clients hear: "Blah blah complicated."

## Slide 23: Translating Tech into Human

Say this instead:

"We'll make sure your data updates itself automatically."

Same idea, clearer language.

## Slide 24: The 5-Second Rule

If you can't explain it in five seconds, it's too complicated.

Simplify until even your grandmother would understand it.

## Slide 25: Using Analogies

Analogy = understanding shortcut.

"Think of this as an assistant who never forgets."

Instantly humanizes automation.

## Slide 26: Confidence through Clarity

When you sound simple, you sound confident.

The buyer assumes: "If it's that easy to explain, they must have it handled."

## Slide 27: Avoiding Overload

Don't explain setup, tools, or data flow unless asked.

Focus on results and ease.

Keep them emotionally engaged, not technically overwhelmed.

## Slide 28: Handling Technical Questions

If someone asks, "How does it work?"

Say: "You'll just see it running smoothly in the background. We handle the setup."

Simple + confident beats detailed + confusing.

## Slide 29: Reinforce Simplicity

Your client's biggest fear: "This will be complicated."

Your mission: show that it's not.

## Slide 30: Recap - Module 3

Use analogies

Stay outcome-focused

Simplify every line

Avoid unnecessary setup details

Confidence = clarity

## Slide 31: The Trust Factor

People don't buy from strangers. They buy from people who show up.

Trust is built one consistent message at a time.

## Slide 32: Proof Beats Promises

You don't have to convince them. You just have to show them.

Share one small win story or example per call.

## Slide 33: The 48-Hour Rule

Always follow up within 48 hours of first contact.

If you wait longer, momentum dies and trust drops.

## Slide 34: The "Helpful Follow-Up" Template

"Hey [Name], just wanted to share this quick example. Thought it might help you decide."

Never chase. Always help.

## Slide 35: Building Authority

Use the Support tab and Deal Tracker consistently.

When you're organized, they assume you're capable.

That perception = trust.

## Slide 36: Tone of a Trusted Advisor

Avoid pushy words like "buy now."

Use phrases like "Let's look at what fits your goals."

Guidance beats pressure.

## Slide 37: Consistency Creates Reputation

Logging in daily, replying fast, and tracking clients properly all contribute to your image.

Reputation grows from reliability.

## Slide 38: How to Handle Rejection

If someone says no, thank them. Ask why, and leave the door open.

A polite exit today can be a sale next month.

## Slide 39: Reflection Exercise

In your Notes:

Write one time you earned someone's trust. What did you do right?

You already know how; selling is no different.

## Slide 40: Recap - Module 4

Follow up fast

Share proof, not promises

Use Support/Tracker tools consistently

Be a helper, not a seller

Consistency > charisma

Ready to test your knowledge? Complete the quiz to earn your XP!`,
    quiz_questions: [
      {
        question: "What do business owners truly care about?",
        type: "multiple_choice",
        options: [
          "Tools used",
          "Time and money saved",
          "Design style",
          "App logos"
        ],
        correct: 1
      },
      {
        question: "What's the first step in the ROI Frame?",
        type: "multiple_choice",
        options: [
          "Pain",
          "Solution",
          "Outcome",
          "Price"
        ],
        correct: 0
      },
      {
        question: "What builds trust fastest?",
        type: "multiple_choice",
        options: [
          "Fancy words",
          "Consistent actions",
          "Aggressive tone",
          "Detailed tech talk"
        ],
        correct: 1
      },
      {
        question: "When should you follow up with a lead?",
        type: "multiple_choice",
        options: [
          "48 hours",
          "2 weeks",
          "Instantly",
          "Once a month"
        ],
        correct: 0
      },
      {
        question: "Which statement uses clear framing?",
        type: "multiple_choice",
        options: [
          "This automation uses 4 triggers.",
          "This saves you 3 hours a week automatically.",
          "Our API is strong.",
          "It's complex but powerful."
        ],
        correct: 1
      },
      {
        question: "Why use analogies in sales?",
        type: "multiple_choice",
        options: [
          "They sound technical",
          "They simplify understanding",
          "They fill time",
          "They impress people"
        ],
        correct: 1
      },
      {
        question: "What's the goal of a follow-up?",
        type: "multiple_choice",
        options: [
          "To pressure them",
          "To remind value gently",
          "To ask for money",
          "To apologize"
        ],
        correct: 1
      },
      {
        question: "What tone should a partner use?",
        type: "multiple_choice",
        options: [
          "Pushy",
          "Confident & calm",
          "Defensive",
          "Robotic"
        ],
        correct: 1
      },
      {
        question: "What's the danger of \"tech talk\"?",
        type: "multiple_choice",
        options: [
          "It sounds boring",
          "It confuses clients",
          "It shortens meetings",
          "It saves time"
        ],
        correct: 1
      },
      {
        question: "What's the \"advisor mindset\"?",
        type: "multiple_choice",
        options: [
          "Sell aggressively",
          "Solve before selling",
          "Lead with discounts",
          "Over-explain tools"
        ],
        correct: 1
      }
    ],
    quiz_answers: [1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
    xp_reward: 600,
    order_index: 11
  },
  {
    id: generateId(3, 'Agent Plus', 12),
    stage: 3,
    rank_required: 'Agent Plus',
    lesson_type: 'course',
    title: 'The Outreach Process',
    content: `## Slide 1: The Meaning of Outreach

Outreach is about building genuine connections with the right people. It is not sending random messages hoping for a reply. Every message should have intent and relevance. Think of outreach as opening a conversation, not closing a deal. When you contact a potential client, you are showing them that you understand their challenges and have a real solution that fits.

## Slide 2: Why Preparation Matters

A good outreach message begins long before you send it. When you know who you are talking to and what they care about, your chances of success increase dramatically. Preparation is what separates professionals from spammers. When you prepare properly, you avoid wasting your time and theirs.

## Slide 3: Identifying the Right Prospects

Your ideal prospects are small to medium-sized business owners, freelancers, or managers. They often spend time on repetitive admin tasks that automation can eliminate. Cleaning companies, marketing agencies, photographers, or accountants are great starting points. Look for businesses that value efficiency but do not have a dedicated tech team.

## Slide 4: Research Before Reaching Out

Before contacting anyone, take a few minutes to learn about them. Visit their website, read reviews, and look at their social media. What do they post about? What tools do they already use? This research helps you personalize your message and show that you care about their business, not just your commission.

## Slide 5: Spotting Common Signs of Need

Businesses that reply late, struggle with booking systems, or have inconsistent customer reviews are strong candidates for automation. If they use Google Sheets or manual forms, that is another sign they can benefit from your help. Every sign of inefficiency is a potential door to open.

## Slide 6: Finding the Right Person to Contact

Always speak to the person who can make a decision. For small businesses, that is usually the owner or manager. Avoid messaging generic email addresses or junior staff who cannot approve purchases. The more direct your contact, the faster your conversation moves forward.

## Slide 7: Creating a Prospect List

Organize your leads in a simple spreadsheet or CRM. Record the business name, contact person, email or phone number, and potential automation that would help them. Keeping everything organized makes follow-ups easier and shows you are serious about your work.

## Slide 8: Preparing Your Offer

Decide which automation fits best before you send your first message. If a company struggles with reviews, mention the Google Review Booster. If they chase invoices, talk about the Invoice Reminder System. You only need one clear offer at a time.

## Slide 9: Setting Goals for Each Message

The first goal of outreach is not to sell but to start a conversation. Your job is to spark curiosity and show genuine understanding. If they reply, you have already succeeded. The sale will come later.

## Slide 10: Module 1 Summary

Outreach is relationship building, not cold selling.

Preparation saves time and earns respect.

Research makes your message relevant.

Contact the decision maker directly.

One clear offer is better than many vague ones.

## Slide 11: How to Structure a Message

A good outreach message feels natural and friendly. It should read like a message to a real person, not a template. Keep it short and clear. Show understanding, offer value, and invite conversation rather than pushing for a sale.

## Slide 12: The Three-Part Formula

Every message should follow a simple pattern:

Observation – Mention something specific about their business.

Value – Explain how your automation helps.

Next Step – Suggest an easy follow-up action, like a demo or example.

This approach feels personal and helpful.

## Slide 13: Writing a Strong Opening Line

Your first sentence decides if they keep reading. Start with something that shows you have done your homework. For example:

"Hi Sarah, I saw your cleaning business has great Google reviews. That is impressive."

A personal touch makes you stand out.

## Slide 14: Showing Value Clearly

The value part should focus on results. Example:

"I help business owners automate their client follow-ups so they never forget to message customers again."

Keep it specific and relatable. Avoid technical details here.

## Slide 15: Creating a Natural Call to Action

Your message should always end with an easy, low-pressure question such as:

"Would you like me to show you a quick example?"

or

"Would it help if I explained how this could save you a few hours each week?"

Simple questions feel more inviting.

## Slide 16: Adjusting Your Tone

Your tone should be friendly, respectful, and calm. Avoid sounding desperate or robotic. Use your natural speaking voice when writing. It helps the reader trust that you are genuine.

## Slide 17: Mistakes That Kill Replies

Avoid long paragraphs or messages full of jargon. Do not list prices in the first message. Never use generic templates without personalization. Each message should sound like it was written for that one person.

## Slide 18: Timing Your Messages

Send your first outreach early in the week, between Monday and Wednesday. Contacting people during working hours improves your response rate. If they do not reply, follow up two days later with a short reminder.

## Slide 19: Using Templates Properly

Templates are there to guide you, not replace you. Always personalize the first line and the business name. Mention something unique about their company so your message cannot be mistaken for spam.

## Slide 20: Module 2 Summary

Focus on helping, not selling.

Start with an observation, give value, and end with a question.

Keep messages short and personal.

Follow up politely within a few days.

Sound like a real person who cares.

## Slide 21: Why Follow-Ups Matter

Most potential clients do not respond right away. They are busy and distracted. Following up is a reminder, not pressure. It shows reliability and professionalism. Many deals are closed after the second or third message.

## Slide 22: The Ideal Follow-Up Timeline

Your first follow-up should come within 48 hours of your initial message. If there is still no response, wait three to five days for a second attempt. Stop after three polite follow-ups if they remain silent.

## Slide 23: Writing a Follow-Up Message

Keep your follow-up message short. Example:

"Hi Alex, just checking if you had a chance to look at this. I really think it could save your team time each week."

Friendly reminders keep your name in their inbox without sounding pushy.

## Slide 24: Tracking Conversations

Use the Deal Tracker in your Vault dashboard to record all your outreach. Log the date, contact, and message type (initial, follow-up, or closing). Tracking helps you stay organized and makes reporting easier later.

## Slide 25: Staying Consistent

Consistency builds reputation. Set a time each day to check your outreach list and send follow-ups. Five well-written messages daily are better than fifty rushed ones.

## Slide 26: Turning No into Opportunity

When someone says no, reply politely and thank them for their time. You can ask, "Would you like me to check in again in a few months?" Keeping the door open can lead to future sales.

## Slide 27: Avoiding Burnout

Outreach takes patience. Do not expect every message to succeed. Focus on improving each week instead of chasing instant results. Progress comes through practice and consistency.

## Slide 28: Keeping Notes

After each conversation, write a few quick notes: what they liked, what objections they had, and any personal details. These notes help you reconnect later in a meaningful way.

## Slide 29: Recognizing Real Interest

If someone asks questions about pricing, timing, or process, that is a buying signal. Focus on responding quickly and confidently. That is when trust builds fastest.

## Slide 30: Module 3 Summary

Follow-ups create second chances.

Track every message with your Deal Tracker.

Stay polite and persistent.

Keep personal notes to improve conversations.

Learn from every interaction.

## Slide 31: The Natural Close

Closing is not forcing a decision. It is guiding the client to the next step when they are ready. If they express interest or ask for pricing, it means they already trust you. Move forward confidently.

## Slide 32: Clear Closing Language

Use simple, calm statements:

"I can help you get started this week."

or

"Would you like me to send you the setup link?"

Avoid over-explaining. Confidence makes clients feel safe.

## Slide 33: Explaining the Setup Process

When a client agrees, walk them through the next steps.

Example:

"We will handle everything for you. You will only need to confirm a few details so we can get started."

Clarity removes hesitation.

## Slide 34: Talking About Price

When asked about cost, link it to value first:

"The setup is $299, and that includes everything from installation to ongoing support. It usually pays for itself within the first few weeks."

You are not just quoting a price — you are explaining value.

## Slide 35: Confirming the Agreement

Always confirm agreements in writing. It can be as simple as:

"Perfect, I will send the setup link and confirmation now."

This prevents confusion and ensures both sides are clear.

## Slide 36: After-Sale Follow-Up

Once the setup is complete, message them after a few days:

"Just checking in to see how everything is working so far."

This shows care and professionalism.

## Slide 37: Asking for Referrals

Happy clients are your best marketing. After a positive message, ask politely:

"If you know anyone else who might benefit from this, I would love to help them too."

Referrals often close faster than new cold leads.

## Slide 38: Keeping Clients Engaged

Stay in touch every few weeks. Share updates or new automation ideas. When clients feel supported, they are more likely to buy again or refer others.

## Slide 39: Turning Clients Into Partners

Encourage clients to join the Vault community. They can learn, share feedback, and even become advocates. Clients who feel included become your strongest supporters.

## Slide 40: Module 4 Summary

Close with confidence and clarity.

Always connect price to value.

Follow up after setup to ensure satisfaction.

Ask for referrals naturally.

Long-term relationships lead to long-term income.

Ready to test your knowledge? Complete the quiz to earn your XP!`,
    quiz_questions: [
      {
        question: "What is the goal of outreach?",
        type: "multiple_choice",
        options: [
          "Close a sale",
          "Start a conversation",
          "Collect emails",
          "Send templates"
        ],
        correct: 1
      },
      {
        question: "How soon should you follow up?",
        type: "multiple_choice",
        options: [
          "Same day",
          "48 hours",
          "One week",
          "After a month"
        ],
        correct: 1
      },
      {
        question: "What makes a message personal?",
        type: "multiple_choice",
        options: [
          "Using their name and a real observation",
          "Copying a template",
          "Adding emojis",
          "Writing long paragraphs"
        ],
        correct: 0
      },
      {
        question: "What should be tracked in your Deal Tracker?",
        type: "multiple_choice",
        options: [
          "Client birthdays",
          "Every outreach and response",
          "Random notes",
          "Social media links"
        ],
        correct: 1
      },
      {
        question: "What builds trust most?",
        type: "multiple_choice",
        options: [
          "Persistence with respect",
          "Constant reminders",
          "Price cuts",
          "Long technical talk"
        ],
        correct: 0
      },
      {
        question: "How should you discuss pricing?",
        type: "multiple_choice",
        options: [
          "Start with value",
          "Start with discounts",
          "Avoid mentioning it",
          "Let them guess"
        ],
        correct: 0
      },
      {
        question: "When should you stop following up?",
        type: "multiple_choice",
        options: [
          "After 3 polite attempts",
          "After first message",
          "After 10 messages",
          "Never"
        ],
        correct: 0
      },
      {
        question: "What turns clients into repeat customers?",
        type: "multiple_choice",
        options: [
          "Staying in touch",
          "Asking for more money",
          "Ignoring them",
          "Sending generic messages"
        ],
        correct: 0
      },
      {
        question: "What should your tone sound like?",
        type: "multiple_choice",
        options: [
          "Helpful and confident",
          "Formal and robotic",
          "Sales-focused",
          "Demanding"
        ],
        correct: 0
      },
      {
        question: "What should you always confirm in writing?",
        type: "multiple_choice",
        options: [
          "Agreements and setup details",
          "Personal facts",
          "Client emotions",
          "Prices of others"
        ],
        correct: 0
      }
    ],
    quiz_answers: [1, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    xp_reward: 500,
    order_index: 12
  },
  {
    id: generateId(3, 'Agent Plus', 13),
    stage: 3,
    rank_required: 'Agent Plus',
    lesson_type: 'task',
    title: 'Log In on 3 Consecutive Days',
    content: `Build consistency and demonstrate commitment.

**Task:** Log in to your Partner Dashboard on 3 consecutive days. Your login streak is already being tracked from previous ranks.

**How It Works:**
- Your current login streak is tracked automatically
- The task completes when you reach 3 consecutive days
- If you miss a day, your streak resets and you'll need to start over
- The streak continues from your current consecutive days count

**Why:** Consistent engagement shows commitment and helps you stay on top of opportunities.`,
    xp_reward: 400,
    order_index: 13
  }
];

// STAGE 4 — PRACTICE & DEMO EXECUTION (Rank: Verified)
// XP Range: 4,500 → 7,000
const stage4Lessons: PartnerLesson[] = [
  {
    id: generateId(4, 'Partner', 11),
    stage: 4,
    rank_required: 'Verified',
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
    rank_required: 'Verified',
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
    rank_required: 'Verified',
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
    rank_required: 'Verified',
    lesson_type: 'task',
    title: 'Pitch Reflection',
    content: `Reflect on your practice pitch.

What worked well? What would you do differently? Learning from practice helps you succeed!`,
    xp_reward: 500,
    order_index: 14
  },
  {
    id: 'stage-4-verified-14b',
    stage: 4,
    rank_required: 'Verified',
    lesson_type: 'task',
    title: 'Edit Referral Code',
    content: `Customize your referral code to make it more memorable and personal.

**Task:**
1. Go to the Overview tab
2. Find your referral link section
3. Click "Edit" next to your referral code
4. Enter a new code (alphanumeric, dashes, and underscores only)
5. Save your changes

**Why:** A personalized referral code makes it easier to share and remember, helping you grow your network more effectively!`,
    xp_reward: 300,
    order_index: 14.5
  },
  {
    id: generateId(4, 'Partner', 15),
    stage: 4,
    rank_required: 'Verified',
    lesson_type: 'task',
    title: 'Invite a Friend',
    content: `Share your referral link with a friend.

When they sign up using your referral link, you'll earn XP and help grow the Vault Network community!`,
    xp_reward: 1200,
    unlock_action: 'stage_5',
    order_index: 15
  },
  {
    id: 'stage-4-verified-plus-16',
    stage: 4,
    rank_required: 'Verified Plus',
    lesson_type: 'task',
    title: 'Demo Client Deep Dive',
    content: `Open your demo client and update all fields (industry, size, needs, problem).

**Task:**
1. Go to the Clients tab
2. Click on your demo client to open the client detail page
3. Update all fields:
   - Industry
   - Size
   - Needs
   - Problem

**Why:** Helps you simulate real client prep and prepare for working with actual businesses.`,
    xp_reward: 600,
    order_index: 16
  },
  {
    id: 'stage-4-verified-plus-17',
    stage: 4,
    rank_required: 'Verified Plus',
    lesson_type: 'task',
    title: 'Create a Demo Automation Plan',
    content: `Assign two automations to your demo client and write a short note explaining why they fit.

**Task:**
1. Go to the Clients tab
2. Select your demo client
3. Assign two different automations
4. For each automation, write a note explaining why it fits this client's needs

**Why:** Builds pre-sales consulting skills and helps you think strategically about automation recommendations.`,
    xp_reward: 700,
    order_index: 17
  },
  {
    id: 'stage-4-verified-plus-18',
    stage: 4,
    rank_required: 'Verified Plus',
    lesson_type: 'task',
    title: 'Referral Funnel Exercise',
    content: `Edit your referral code and get at least 5 people to click your link.

**Task:**
1. Edit your referral code in the Overview tab
2. Share your referral link with at least 5 people
3. The system will track clicks (self-clicks don't count)

**Why:** Teaches you how viral loops work and helps you understand the power of referral marketing.`,
    xp_reward: 400,
    order_index: 18
  },
  {
    id: 'stage-4-verified-plus-19',
    stage: 4,
    rank_required: 'Verified Plus',
    lesson_type: 'course',
    title: 'Handling Objections 101',
    content: `## Slide 1: Welcome to Handling Objections

Master the art of turning objections into opportunities! This course will teach you how to handle common client concerns effectively and build confidence in your sales approach.

## Slide 2: Understanding Objections

**What are Objections?**
- Questions or concerns from prospects
- Signs they're considering your offer
- Opportunities to provide value and build trust
- Not rejections - they're engagement signals!

**Why Prospects Object:**
- Need more information
- Concerns about cost or value
- Uncertainty about fit or timing
- Past negative experiences
- Fear of making the wrong decision

## Slide 3: The Objection Mindset

**Best Mindset:**
Treat objections as signs the prospect is considering your offer - they're engaged and thinking seriously!

**Avoid:**
- Assuming they're attacking you
- Thinking they're not interested
- Ending the conversation quickly
- Becoming defensive or frustrated

## Slide 4: Common Objection #1 - "It's Too Expensive"

**Best Response:**
Acknowledge the concern and explain the value it returns.

**Example:**
"I understand cost is important. Let's look at the value: This automation saves your team 10 hours per week. At $30/hour, that's $1,200/month in saved labor costs. The automation costs $300/month - you're saving $900/month while scaling your operations."

**Key Points:**
- Don't immediately discount
- Show ROI clearly
- Compare to alternatives
- Focus on value, not price

## Slide 5: Common Objection #2 - "I Need More Time to Think"

**Best Response:**
Ask what part they want to review in more detail.

**Example:**
"I totally understand wanting to think it through. What specific part would you like to review? Is it the setup process, the pricing, or how it fits with your current systems? I can provide more detail on whatever you need."

**Key Points:**
- Don't pressure for immediate decision
- Don't repeat the entire pitch
- Identify specific concerns
- Offer helpful information

## Slide 6: Common Objection #3 - "We Already Have Someone Handling This"

**Best Response:**
Explain how your solution can work alongside what they already use.

**Example:**
"That's great that you have someone handling this! Our automation actually works alongside your existing team member. It handles the repetitive tasks, freeing them up for higher-value work. Think of it as giving them a powerful assistant that never gets tired or makes mistakes."

**Key Points:**
- Don't suggest replacing their current person
- Position as enhancement, not replacement
- Show how it complements existing setup
- Emphasize efficiency gains

## Slide 7: Common Objection #4 - "We're Not Sure if It's the Right Fit"

**Best Response:**
They are still deciding if the solution is the right fit - this is a natural part of the process.

**Example:**
"That's a great question! Let me help you understand the fit. Based on what you've told me about [their situation], this automation specifically addresses [their pain point]. I've worked with similar businesses and seen [specific outcome]. What specific concerns do you have about the fit?"

**Key Points:**
- Address their specific situation
- Provide relevant examples
- Ask clarifying questions
- Don't oversell or overpromise

## Slide 8: The Power of Follow-Up Messages

**Main Purpose:**
To guide the conversation and give useful reminders - not to apply pressure.

**What Makes Follow-Up Effective:**
- Adding new insight that helps the prospect decide
- Sharing relevant case studies or examples
- Addressing specific concerns they raised
- Providing helpful resources

**Avoid:**
- Repeating the same message
- Talking only about your goals
- Sending discounts every time
- Applying pressure or urgency

## Slide 9: What to Avoid When Responding to Objections

**Avoid:**
- Showing frustration or becoming defensive
- Assuming the worst about their intentions
- Ignoring their concerns
- Being pushy or aggressive

**Instead:**
- Stay calm and listen carefully
- Ask questions to understand the concern
- Reflect what they meant in your own words
- Provide helpful information

## Slide 10: Key Takeaways

- **Objections are opportunities** - they show engagement
- **Listen first** - understand before responding
- **Focus on value** - always connect back to benefits
- **Stay consultative** - help, don't sell
- **Follow up thoughtfully** - provide value, not pressure
- **Stay positive** - objections mean they're considering!

Ready to test your knowledge? Complete the quiz to earn your XP!`,
    quiz_questions: [
      {
        question: "Why do most prospects hesitate when offered an automation?",
        type: "multiple_choice",
        options: [
          "They are still deciding if the solution is the right fit",
          "They usually think automations require advanced knowledge",
          "They believe the system will replace their whole staff",
          "They feel unsure how long the setup will take"
        ],
        correct: 0
      },
      {
        question: "What is the best response to someone saying the price is too high?",
        type: "multiple_choice",
        options: [
          "Agree that maybe the timing is not ideal",
          "Acknowledge the concern and explain the value it returns",
          "Offer a large discount to close the deal quickly",
          "Change the subject to avoid talking about the cost"
        ],
        correct: 1
      },
      {
        question: "What should you do when a prospect says they need more time to think?",
        type: "multiple_choice",
        options: [
          "Ask what part they want to review in more detail",
          "Repeat the full pitch from the beginning",
          "Suggest they make a decision immediately",
          "Tell them they might lose the offer soon"
        ],
        correct: 0
      },
      {
        question: "What is the best reply when someone says they already have a person handling this?",
        type: "multiple_choice",
        options: [
          "Suggest replacing their current person with your system",
          "Say they might not need any upgrade at all",
          "Mention that their current setup is probably outdated",
          "Explain how your solution can work alongside what they already use"
        ],
        correct: 3
      },
      {
        question: "What is the main purpose of follow-up messages?",
        type: "multiple_choice",
        options: [
          "To guide the conversation and give useful reminders",
          "To apply pressure until the prospect responds",
          "To show that the seller is waiting for a decision",
          "To send repeated messages until they reply"
        ],
        correct: 0
      },
      {
        question: "What makes a follow-up message effective?",
        type: "multiple_choice",
        options: [
          "Adding a new insight that helps the prospect decide",
          "Repeating the same message from last time",
          "Talking only about your own goals and targets",
          "Sending a discount every time you follow up"
        ],
        correct: 0
      },
      {
        question: "What should you avoid when responding to objections?",
        type: "multiple_choice",
        options: [
          "Staying calm and listening carefully",
          "Asking questions to understand the concern",
          "Reflecting what the prospect meant in your own words",
          "Showing frustration or becoming defensive"
        ],
        correct: 3
      },
      {
        question: "What is the best mindset to have when you hear an objection?",
        type: "multiple_choice",
        options: [
          "Assume the prospect is attacking you personally",
          "Think they are not interested at all",
          "End the conversation as quickly as possible",
          "Treat it as a sign the prospect is considering the offer"
        ],
        correct: 3
      }
    ],
    quiz_answers: [0, 1, 0, 3, 0, 0, 3, 3],
    xp_reward: 600,
    order_index: 19
  }
];

// STAGE 5 — PARTNER (Rank: Partner)
// XP Range: 7,000 → 9,999
const stage5Lessons: PartnerLesson[] = [
  {
    id: generateId(5, 'Verified', 16),
    stage: 5,
    rank_required: 'Partner',
    lesson_type: 'course',
    title: 'How to Close Deals',
    content: `# Slide 1 — Introduction

Closing deals is one of the most important skills as a Vault Network Partner.

This course teaches you how to guide a client from first interest to final payment with clarity and confidence.

# Slide 2 — Understanding the Offer

Every automation consists of two parts:

• A setup package

• A monthly retainer

Your role is to present the value clearly and help the client choose the best option for their business.

# Slide 3 — Setup Fee Explained

The setup fee covers:

• Full system configuration

• Customization to the client's business

• Integration with their tools

• Testing and quality checks

This is a one-time payment that generates commission for you.

# Slide 4 — Monthly Pricing Explained

The monthly retainer covers:

• Ongoing maintenance

• System monitoring

• Technical support

• Updates and improvements

• Automation reliability

This is recurring revenue that builds long-term commissions.

# Slide 5 — How Payments Work

• Clients pay Vault Network directly

• You never collect or handle money

• Commissions are tracked automatically

• All payments appear inside the Earnings tab

This keeps everything simple, secure and transparent.

# Slide 6 — Preparing for the Close

Before presenting pricing, make sure you:

• Understand the client's problem

• Select the right automation

• Explain the transformation, not the features

• Show the ROI clearly

Closing becomes easy when the client already sees the value.

# Slide 7 — Presenting the Offer

Present the cost confidently:

• Start with the setup fee

• Then explain the monthly support

• Connect every price point to the value it delivers

Keep it simple. Keep it clear. Avoid over-explaining.

# Slide 8 — Handling Price Concerns

Clients may hesitate because:

• They fear risk

• They don't understand ROI

• They need clarity

Respond calmly by explaining:

• Time saved

• Errors reduced

• Revenue gained

Price becomes a non-issue once value is clear.

# Slide 9 — Timeline and Expectations

Be clear about project flow:

• Setup usually takes 1–2 weeks

• Some custom adjustments may be required

• Clients receive updates during the process

Clear timelines prevent misunderstandings and build trust.

# Slide 10 — What Automations Do (and Don't Do)

Explain honestly:

Automations DO:

• Save time

• Reduce manual work

• Improve consistency

Automations DON'T:

• Replace entire teams instantly

• Solve unrelated business issues

• Work without the client's input

Setting boundaries creates loyal clients.

# Slide 11 — Support System Overview

When clients need help:

• They open a support ticket

• You can view and respond inside the Support tab

• Vault Network handles all heavy technical issues

This ensures clients always have reliable assistance.

# Slide 12 — Your Role in Support

Your responsibility is to:

• Keep communication polite and professional

• Ask clarifying questions

• Follow up when needed

• Escalate when the issue is outside your control

Partners who manage communication well close more deals.

# Slide 13 — Following Up After the Pitch

Not all clients buy immediately. Successful follow-ups include:

• A quick reminder of the value

• A helpful insight

• A short check-in message

Follow-up is where most deals are actually closed.

# Slide 14 — Signs the Client is Ready to Buy

Look for signals:

• Asking about timeline

• Asking about setup steps

• Asking about price or payment

• Asking what you need from them

When you see these, move confidently to the close.

# Slide 15 — Closing the Deal

To close the deal smoothly:

• Send them your referral link

• Help them choose the right automation

• Guide them through the purchase steps

• Celebrate the win and thank them

Once they pay, your commission activates and the setup begins.`,
    quiz_questions: [
      {
        question: "What does the setup fee mainly cover?",
        type: "multiple_choice",
        options: [
          "Configuration and customization of the automation",
          "The client's monthly support and updates",
          "Advertising tools for the client",
          "Additional training for partners"
        ],
        correct: 0
      },
      {
        question: "What is the role of the monthly retainer?",
        type: "multiple_choice",
        options: [
          "Funding upgrades for the client's website",
          "Providing ongoing maintenance and support",
          "Paying commissions to other partners",
          "Covering one-time system installation"
        ],
        correct: 1
      },
      {
        question: "How do clients make payments?",
        type: "multiple_choice",
        options: [
          "Directly to the partner",
          "Through automatic bank transfers to the partner",
          "Through Vault Network, where commissions are calculated",
          "Through an external payment processor chosen by the client"
        ],
        correct: 2
      },
      {
        question: "What should you confirm before presenting pricing?",
        type: "multiple_choice",
        options: [
          "The exact discount the client wants",
          "The specific problem the automation solves",
          "The client's preferred payment schedule",
          "Whether the client has used automations before"
        ],
        correct: 1
      },
      {
        question: "What helps clients see the value in an automation?",
        type: "multiple_choice",
        options: [
          "A long list of technical features",
          "A comparison to unrelated tools",
          "A clear explanation of the transformation and outcome",
          "A detailed explanation of every node used"
        ],
        correct: 2
      },
      {
        question: "Why do clients often raise price concerns?",
        type: "multiple_choice",
        options: [
          "They want to negotiate for sport",
          "They are unsure about the return on investment",
          "They think partners handle technical work manually",
          "They expect the system to include unlimited free upgrades"
        ],
        correct: 1
      },
      {
        question: "Why is setting expectations important?",
        type: "multiple_choice",
        options: [
          "It ensures clients understand the process clearly",
          "It allows you to shorten the setup timeline",
          "It guarantees the client will choose the most expensive plan",
          "It removes the need for support tickets"
        ],
        correct: 0
      },
      {
        question: "How should a partner handle support issues?",
        type: "multiple_choice",
        options: [
          "Solve all technical problems alone",
          "Ask the client to find outside help",
          "Direct the client to open a support ticket",
          "Recommend the client waits until the next update"
        ],
        correct: 2
      },
      {
        question: "What makes a follow-up message effective?",
        type: "multiple_choice",
        options: [
          "Adding a useful insight that helps the client decide",
          "Sending the same message repeatedly",
          "Asking why they have not replied",
          "Focusing only on the partner's goals"
        ],
        correct: 0
      },
      {
        question: "What is the purpose of follow-up messages?",
        type: "multiple_choice",
        options: [
          "To repeat the pitch in every message",
          "To ask the client for a decision immediately",
          "To make the offer sound urgent",
          "To keep communication active and helpful"
        ],
        correct: 3
      },
      {
        question: "Which behaviour should you avoid when closing deals?",
        type: "multiple_choice",
        options: [
          "Giving clear explanations",
          "Asking helpful questions",
          "Listening carefully to the client",
          "Responding with frustration or defensiveness"
        ],
        correct: 3
      },
      {
        question: "What is a strong sign that a client is ready to close?",
        type: "multiple_choice",
        options: [
          "They stop replying for several days",
          "They ask only about discounts",
          "They ask unrelated questions",
          "They ask about setup steps or timeline"
        ],
        correct: 3
      }
    ],
    quiz_answers: [0, 1, 2, 1, 2, 1, 0, 2, 0, 3, 3, 3],
    xp_reward: 700,
    order_index: 16
  },
  {
    id: generateId(5, 'Verified', 17),
    stage: 5,
    rank_required: 'Partner Plus',
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
    rank_required: 'Partner Plus',
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
    rank_required: 'Partner Plus',
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
    rank_required: 'Partner Plus',
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
  const ranks: PartnerRank[] = ['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
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

// Helper function to check if a lesson should be counted as a task for rank advancement
// Counts: tasks, quizzes, and courses with quizzes
export const isCountableTask = (lesson: PartnerLesson): boolean => {
  return lesson.lesson_type === 'task' || 
         lesson.lesson_type === 'quiz' || 
         (lesson.lesson_type === 'course' && lesson.quiz_questions && lesson.quiz_questions.length > 0);
};


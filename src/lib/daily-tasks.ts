// Daily Tasks Configuration
// Each rank has 5 daily tasks that rotate daily

import { type PartnerRank } from './partner-progression';

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  action?: string; // Optional action to perform (e.g., 'open_automations', 'view_referral_link')
  xpReward: number;
}

export const DAILY_TASKS_BY_RANK: Record<PartnerRank, DailyTask[]> = {
  'Recruit': [
    {
      id: 'recruit-1',
      title: 'Open Automations Tab Today',
      description: 'Navigate to the Automations tab and explore available automations.',
      action: 'open_automations',
      xpReward: 50
    },
    {
      id: 'recruit-2',
      title: 'View Any 1 Automation Card',
      description: 'Click on any automation card to view its details.',
      action: 'view_automation',
      xpReward: 50
    },
    {
      id: 'recruit-3',
      title: 'Open the Support Tab',
      description: 'Visit the Support tab to see how to get help.',
      action: 'open_support',
      xpReward: 50
    },
    {
      id: 'recruit-4',
      title: 'Open Your Referral Link Page',
      description: 'View your referral link page (view page, not copy link).',
      action: 'view_referral_link',
      xpReward: 50
    },
    {
      id: 'recruit-5',
      title: 'Open Overview and Check Today\'s XP',
      description: 'Check your XP progress for today in the Overview tab.',
      action: 'check_xp',
      xpReward: 50
    }
  ],
  'Recruit Plus': [
    {
      id: 'recruit-plus-1',
      title: 'Open a Bookmark or Add/Remove One',
      description: 'Bookmark an automation or manage your bookmarks.',
      action: 'manage_bookmark',
      xpReward: 75
    },
    {
      id: 'recruit-plus-2',
      title: 'Read Any Automation Brief Section Today',
      description: 'Read through a complete automation brief section.',
      action: 'read_brief',
      xpReward: 75
    },
    {
      id: 'recruit-plus-3',
      title: 'Open Support and Read a Message Thread',
      description: 'Open the Support tab and read through a message thread.',
      action: 'read_support_message',
      xpReward: 75
    },
    {
      id: 'recruit-plus-4',
      title: 'Open Overview → Check Your Weekly XP Trend',
      description: 'Check your weekly XP trend in the Overview tab.',
      action: 'check_weekly_xp',
      xpReward: 75
    },
    {
      id: 'recruit-plus-5',
      title: 'Open Automations and Filter/Search Once',
      description: 'Use the filter or search feature in the Automations tab.',
      action: 'filter_automations',
      xpReward: 75
    }
  ],
  'Apprentice': [
    {
      id: 'apprentice-1',
      title: 'Open Automation Suggestions',
      description: 'Visit the Automation Suggestions section.',
      action: 'open_suggestions',
      xpReward: 100
    },
    {
      id: 'apprentice-2',
      title: 'Read 1 Suggested Automation Idea',
      description: 'Read through a suggested automation idea.',
      action: 'read_suggestion',
      xpReward: 100
    },
    {
      id: 'apprentice-3',
      title: 'Open Automations and Apply a Filter/Search',
      description: 'Apply a filter or search in the Automations tab.',
      action: 'filter_automations',
      xpReward: 100
    },
    {
      id: 'apprentice-4',
      title: 'View Any Pricing Section',
      description: 'View the pricing section of any automation.',
      action: 'view_pricing',
      xpReward: 100
    },
    {
      id: 'apprentice-5',
      title: 'Open Overview and Check XP Progress',
      description: 'Check your overall XP progress in the Overview tab.',
      action: 'check_xp',
      xpReward: 100
    }
  ],
  'Apprentice Plus': [
    {
      id: 'apprentice-plus-1',
      title: 'Review One of Your Favourite Automations',
      description: 'Review one of your bookmarked/favourite automations.',
      action: 'review_bookmark',
      xpReward: 125
    },
    {
      id: 'apprentice-plus-2',
      title: 'Read Any Automation\'s FAQ Section',
      description: 'Read through the FAQ section of any automation.',
      action: 'read_faq',
      xpReward: 125
    },
    {
      id: 'apprentice-plus-3',
      title: 'Open Automation Suggestions and Upvote/Review Ideas',
      description: 'Upvote or review automation suggestions.',
      action: 'review_suggestion',
      xpReward: 125
    },
    {
      id: 'apprentice-plus-4',
      title: 'Check Leaderboard Daily Standing',
      description: 'Check your daily standing on the leaderboard.',
      action: 'check_leaderboard',
      xpReward: 125
    },
    {
      id: 'apprentice-plus-5',
      title: 'Open Overview → Weekly Goal Check',
      description: 'Check your weekly goals in the Overview tab.',
      action: 'check_weekly_goals',
      xpReward: 125
    }
  ],
  'Agent': [
    {
      id: 'agent-1',
      title: 'Open Scripts and Edit One Sentence',
      description: 'Open the Sales Scripts tab and edit one sentence in any script.',
      action: 'edit_script',
      xpReward: 150
    },
    {
      id: 'agent-2',
      title: 'Open Deal Diary and Review Statuses',
      description: 'Review deal statuses in the Deal Diary (no logging required).',
      action: 'review_deals',
      xpReward: 150
    },
    {
      id: 'agent-3',
      title: 'Preview Any Automation You Could Pitch',
      description: 'Preview an automation that you could pitch to clients.',
      action: 'preview_automation',
      xpReward: 150
    },
    {
      id: 'agent-4',
      title: 'Check XP Progress in Overview',
      description: 'Check your XP progress in the Overview tab.',
      action: 'check_xp',
      xpReward: 150
    },
    {
      id: 'agent-5',
      title: 'Open Support Tab to Review Ticket Flow',
      description: 'Review the ticket flow in the Support tab.',
      action: 'review_tickets',
      xpReward: 150
    }
  ],
  'Agent Plus': [
    {
      id: 'agent-plus-1',
      title: 'Review Your Script and Rewrite One Line',
      description: 'Review one of your sales scripts and rewrite one line.',
      action: 'rewrite_script',
      xpReward: 175
    },
    {
      id: 'agent-plus-2',
      title: 'Open Deal Diary and Re-read Any Entry',
      description: 'Re-read any entry in your Deal Diary.',
      action: 'reread_deal',
      xpReward: 175
    },
    {
      id: 'agent-plus-3',
      title: 'Open Automations → Compare Two Pricing Plans',
      description: 'Compare pricing plans of two different automations.',
      action: 'compare_pricing',
      xpReward: 175
    },
    {
      id: 'agent-plus-4',
      title: 'Check Leaderboard → Compare Your Rank',
      description: 'Check your rank on the leaderboard and compare with others.',
      action: 'compare_rank',
      xpReward: 175
    },
    {
      id: 'agent-plus-5',
      title: 'Open Overview → Review Yesterday\'s XP',
      description: 'Review your XP gains from yesterday.',
      action: 'review_yesterday_xp',
      xpReward: 175
    }
  ],
  'Verified': [
    {
      id: 'verified-1',
      title: 'Open Demo Client and Review Details',
      description: 'Open a demo client and review their details.',
      action: 'review_demo_client',
      xpReward: 200
    },
    {
      id: 'verified-2',
      title: 'Review Any Automation Assigned to Demo Client',
      description: 'Review automations assigned to your demo client.',
      action: 'review_demo_automation',
      xpReward: 200
    },
    {
      id: 'verified-3',
      title: 'Open Referral Code Page',
      description: 'Open and review your referral code page.',
      action: 'open_referral_code',
      xpReward: 200
    },
    {
      id: 'verified-4',
      title: 'Open Automations → Review Requirements Section',
      description: 'Review the requirements section of any automation.',
      action: 'review_requirements',
      xpReward: 200
    },
    {
      id: 'verified-5',
      title: 'Open Overview → Check Weekly Trend',
      description: 'Check your weekly XP trend in the Overview tab.',
      action: 'check_weekly_trend',
      xpReward: 200
    }
  ],
  'Verified Plus': [
    {
      id: 'verified-plus-1',
      title: 'Review Demo Client\'s Setup Stage Today',
      description: 'Check the setup stage of your demo client.',
      action: 'review_setup_stage',
      xpReward: 225
    },
    {
      id: 'verified-plus-2',
      title: 'Open Demo Automation Brief',
      description: 'Open and read the brief for your demo automation.',
      action: 'read_demo_brief',
      xpReward: 225
    },
    {
      id: 'verified-plus-3',
      title: 'Open Referral Code Section and Preview Options',
      description: 'Preview options in the referral code section.',
      action: 'preview_referral_options',
      xpReward: 225
    },
    {
      id: 'verified-plus-4',
      title: 'Open Automations → Compare 2 Options for Your Demo Client',
      description: 'Compare two automation options for your demo client.',
      action: 'compare_for_demo',
      xpReward: 225
    },
    {
      id: 'verified-plus-5',
      title: 'Check Leaderboard Position',
      description: 'Check your current position on the leaderboard.',
      action: 'check_leaderboard',
      xpReward: 225
    }
  ],
  'Partner': [
    {
      id: 'partner-1',
      title: 'Open Earnings Tab and Review Your Month',
      description: 'Review your monthly earnings in the Earnings tab.',
      action: 'review_earnings',
      xpReward: 250
    },
    {
      id: 'partner-2',
      title: 'Compare 2 Automations You Might Sell This Week',
      description: 'Compare two automations you might pitch this week.',
      action: 'compare_selling_options',
      xpReward: 250
    },
    {
      id: 'partner-3',
      title: 'Open Script Variation and Improve One Line',
      description: 'Improve one line in one of your sales script variations.',
      action: 'improve_script',
      xpReward: 250
    },
    {
      id: 'partner-4',
      title: 'Open Leaderboard → Check Your Rank Movement',
      description: 'Check how your rank has moved on the leaderboard.',
      action: 'check_rank_movement',
      xpReward: 250
    },
    {
      id: 'partner-5',
      title: 'Open Overview → Note Today\'s XP Growth',
      description: 'Note your XP growth for today in the Overview tab.',
      action: 'note_xp_growth',
      xpReward: 250
    }
  ],
  'Partner Plus': [
    {
      id: 'partner-plus-1',
      title: 'Open Earnings Tab → Review Monthly Potential',
      description: 'Review your potential monthly earnings.',
      action: 'review_monthly_potential',
      xpReward: 275
    },
    {
      id: 'partner-plus-2',
      title: 'Open Automations → Choose One to Pitch This Week',
      description: 'Select an automation to pitch this week.',
      action: 'choose_pitch_automation',
      xpReward: 275
    },
    {
      id: 'partner-plus-3',
      title: 'Open Leaderboard → Review Top 3 Partners',
      description: 'Review the top 3 partners on the leaderboard.',
      action: 'review_top_partners',
      xpReward: 275
    },
    {
      id: 'partner-plus-4',
      title: 'Open Scripts → Review Outreach Template',
      description: 'Review one of your outreach templates.',
      action: 'review_template',
      xpReward: 275
    },
    {
      id: 'partner-plus-5',
      title: 'Open Overview → Set a Daily Goal',
      description: 'Set a daily goal in the Overview tab.',
      action: 'set_daily_goal',
      xpReward: 275
    }
  ],
  'Partner Pro': [
    {
      id: 'partner-pro-1',
      title: 'Open Premium Automations → Review One Daily',
      description: 'Review one premium automation daily.',
      action: 'review_premium_automation',
      xpReward: 300
    },
    {
      id: 'partner-pro-2',
      title: 'Open Advanced Analytics → Review One Metric',
      description: 'Review one advanced analytics metric.',
      action: 'review_analytics',
      xpReward: 300
    },
    {
      id: 'partner-pro-3',
      title: 'Open Leaderboard → Study a Top Seller\'s Pattern',
      description: 'Study the pattern of a top seller on the leaderboard.',
      action: 'study_top_seller',
      xpReward: 300
    },
    {
      id: 'partner-pro-4',
      title: 'Open Earnings Tab → Forecast Next Month',
      description: 'Forecast your earnings for next month.',
      action: 'forecast_earnings',
      xpReward: 300
    },
    {
      id: 'partner-pro-5',
      title: 'Open Scripts → Practice High-Ticket Pitch',
      description: 'Practice a high-ticket sales pitch in the Scripts tab.',
      action: 'practice_pitch',
      xpReward: 300
    }
  ]
};

// Get today's daily tasks for a rank (rotates daily based on date)
export function getTodaysDailyTasks(rank: PartnerRank): DailyTask[] {
  const tasks = DAILY_TASKS_BY_RANK[rank] || [];
  if (tasks.length === 0) return [];
  
  // Use day of year to rotate tasks (0-364)
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Select 2 tasks based on day of year
  const taskIndex1 = dayOfYear % tasks.length;
  const taskIndex2 = (dayOfYear + 1) % tasks.length;
  
  return [tasks[taskIndex1], tasks[taskIndex2]];
}

// Check if a task is completed today
export function isTaskCompletedToday(taskId: string, completedTasks: Set<string>): boolean {
  return completedTasks.has(taskId);
}


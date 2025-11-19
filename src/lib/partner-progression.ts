// Partner Progression System Utilities

export type PartnerRank = 'Recruit' | 'Recruit Plus' | 'Apprentice' | 'Apprentice Plus' | 'Agent' | 'Agent Plus' | 'Verified' | 'Verified Plus' | 'Partner' | 'Partner Plus' | 'Partner Pro';

export interface RankInfo {
  rank: PartnerRank;
  commissionRate: number;
  xpThreshold: number;
  tier: number;
  unlocks: string[];
}

// Tier definitions with minimum days per tier
export const TIER_MIN_DAYS: Record<number, number> = {
  1: 1,   // Tier 1: Recruit, Recruit Plus
  2: 3,   // Tier 2: Apprentice, Apprentice Plus
  3: 5,   // Tier 3: Agent, Agent Plus
  4: 10,  // Tier 4: Verified, Verified Plus
  5: 14,  // Tier 5: Partner, Partner Plus
};

// Daily XP caps per tier
// Note: Tier 1 and Tier 2 have no caps (null = no cap)
export const TIER_DAILY_XP_CAP: Record<number, number | null> = {
  1: null,  // Tier 1: Recruit, Recruit Plus - No cap
  2: null,  // Tier 2: Apprentice, Apprentice Plus - No cap
  3: 200,   // Tier 3: Agent, Agent Plus - 200 XP/day
  4: 300,   // Tier 4: Verified, Verified Plus - 300 XP/day
  5: 400,   // Tier 5: Partner, Partner Plus - 400 XP/day
};

export const RANK_INFO: Record<PartnerRank, RankInfo> = {
  'Recruit': {
    rank: 'Recruit',
    commissionRate: 25,
    xpThreshold: 0,
    tier: 1,
    // Basic tabs and referral link are available from Recruit so new tasks (like copying your referral link) are doable
    unlocks: ['getting_started', 'support', 'automations_view', 'referral_link']
  },
  'Recruit Plus': {
    rank: 'Recruit Plus',
    commissionRate: 25,
    xpThreshold: 0, // Task-gated only
    tier: 1,
    unlocks: ['bookmarking', 'automation_briefs', 'support_messaging']
  },
  'Apprentice': {
    rank: 'Apprentice',
    commissionRate: 30,
    xpThreshold: 800, // Updated to 800 XP
    tier: 2,
    unlocks: ['automation_suggestions', 'leaderboard'] // Unlocks "Suggest New Automation" task and leaderboard
  },
  'Apprentice Plus': {
    rank: 'Apprentice Plus',
    commissionRate: 30,
    xpThreshold: 1600, // Updated to 1,600 XP
    tier: 2,
    unlocks: ['explore_automations', 'bookmark_multiple'] // Unlocks "Explore Five Automations" and "Bookmark Two Automations" tasks
  },
  'Agent': {
    rank: 'Agent',
    commissionRate: 33,
    xpThreshold: 3000, // Unchanged
    tier: 3,
    unlocks: ['sales_scripts', 'deal_tracking'] // Unlocks "Create Sales Script" and "Log First Outreach" tasks
  },
  'Agent Plus': {
    rank: 'Agent Plus',
    commissionRate: 33,
    xpThreshold: 4500, // Updated to 4,500 XP
    tier: 3,
    unlocks: ['sales_foundations', 'outreach_process'] // Unlocks "Sales Foundations" and "The Outreach Process" courses
  },
  'Verified': {
    rank: 'Verified',
    commissionRate: 36,
    xpThreshold: 7000, // Updated to 7,000 XP
    tier: 4,
    unlocks: ['clients_demo', 'edit_referral_code'] // Unlocks "Add Demo Client", "Assign Demo Automation", "Edit Referral Code" tasks
  },
  'Verified Plus': {
    rank: 'Verified Plus',
    commissionRate: 36,
    xpThreshold: 9500, // Updated to 9,500 XP
    tier: 4,
    unlocks: ['demo_client_notes', 'demo_automation_plan', 'referral_funnel', 'objections_handling'] // Unlocks demo client deep dive, automation planning, referral funnel, and objections course
  },
  'Partner': {
    rank: 'Partner',
    commissionRate: 40,
    xpThreshold: 13000, // Updated to 13,000 XP
    tier: 5,
    unlocks: ['earnings', 'clients_real', 'earnings_calculator', 'sales_script_variations', 'automation_notes', 'client_journey_mapper', 'setup_explanation'] // Unlocks earnings tab, real clients, and all Partner rank tasks (calculator, script variations, notes, journey mapper, setup explanation)
  },
  'Partner Plus': {
    rank: 'Partner Plus',
    commissionRate: 40,
    xpThreshold: 17000, // Updated to 17,000 XP
    tier: 5,
    unlocks: ['real_client_management', 'case_studies'] // Unlocks "Invite First Real Client", "Assign First Automation", "Mark First Sale", "Submit Case Summary" tasks
  },
  'Partner Pro': {
    rank: 'Partner Pro',
    commissionRate: 45,
    xpThreshold: 999999, // No XP threshold - paid/manual only
    tier: 0, // No tier - outside the XP system
    unlocks: ['premium_automations', 'advanced_analytics']
  }
};

export function getNextRank(currentRank: PartnerRank): PartnerRank | null {
  const ranks: PartnerRank[] = ['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
  const currentIndex = ranks.indexOf(currentRank);
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
}

export function getPreviousRank(currentRank: PartnerRank): PartnerRank | null {
  const ranks: PartnerRank[] = ['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
  const currentIndex = ranks.indexOf(currentRank);
  return currentIndex > 0 ? ranks[currentIndex - 1] : null;
}

export function getRankInfo(rank: PartnerRank): RankInfo {
  return RANK_INFO[rank];
}

export function calculateProgressToNextRank(currentXP: number, currentRank: PartnerRank): { current: number; next: number; percentage: number } {
  const nextRank = getNextRank(currentRank);
  if (!nextRank) {
    // Max rank
    return { current: currentXP, next: currentXP, percentage: 100 };
  }
  
  // Safety check: ensure both ranks exist in RANK_INFO
  const currentRankInfo = RANK_INFO[currentRank];
  const nextRankInfo = RANK_INFO[nextRank];
  
  if (!currentRankInfo || !nextRankInfo) {
    // Fallback if rank info is missing
    console.warn(`Missing rank info for ${currentRank} or ${nextRank}`);
    return { current: currentXP, next: currentXP, percentage: 100 };
  }
  
  const currentThreshold = currentRankInfo.xpThreshold;
  const nextThreshold = nextRankInfo.xpThreshold;
  const progress = currentXP - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  const percentage = needed > 0 ? Math.min(100, Math.max(0, (progress / needed) * 100)) : 100;
  
  return { current: currentXP, next: nextThreshold, percentage };
}

export function isTabUnlocked(tabName: string, currentRank: PartnerRank): boolean {
  const rankInfo = getRankInfo(currentRank);
  
  // Support is always unlocked
  if (tabName === 'support') return true;
  
  // Check if tab is in unlocks for current rank or any previous rank
  const ranks: PartnerRank[] = ['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
  const currentIndex = ranks.indexOf(currentRank);
  
  for (let i = 0; i <= currentIndex; i++) {
    const rank = ranks[i];
    if (RANK_INFO[rank].unlocks.includes(tabName)) {
      return true;
    }
  }
  
  return false;
}

export function getTabUnlockRequirement(tabName: string): { rank: PartnerRank; xp: number } | null {
  for (const [rank, info] of Object.entries(RANK_INFO)) {
    if (info.unlocks.includes(tabName)) {
      return { rank: rank as PartnerRank, xp: info.xpThreshold };
    }
  }
  return null;
}

// Get tier for a rank
export function getTierForRank(rank: PartnerRank): number {
  return RANK_INFO[rank]?.tier || 1;
}

// Get minimum days in tier
export function getMinDaysInTier(tier: number): number {
  return TIER_MIN_DAYS[tier] || 1;
}

// Get daily XP cap for tier
// Returns null if no cap, or the cap amount
export function getDailyXpCapForTier(tier: number): number | null {
  return TIER_DAILY_XP_CAP[tier] ?? null;
}

// Get daily XP cap for rank
// Returns null if no cap (for Recruit, Recruit Plus, Apprentice, Apprentice Plus)
// Returns the cap amount for Agent and above
export function getDailyXpCapForRank(rank: PartnerRank): number | null {
  const tier = getTierForRank(rank);
  return getDailyXpCapForTier(tier);
}

// Check if rank has XP cap
export function hasXpCap(rank: PartnerRank): boolean {
  return getDailyXpCapForRank(rank) !== null;
}

// Check if rank is base rank (not Plus)
export function isBaseRank(rank: PartnerRank): boolean {
  return !rank.includes('Plus') && rank !== 'Partner Pro';
}

// Check if rank is Plus rank
export function isPlusRank(rank: PartnerRank): boolean {
  return rank.includes('Plus');
}

// Get base rank from a Plus rank
export function getBaseRankFromPlus(rank: PartnerRank): PartnerRank | null {
  if (!isPlusRank(rank)) return null;
  const baseRankName = rank.replace(' Plus', '');
  return baseRankName as PartnerRank;
}

// Get all task lesson IDs for a specific rank
// Plus ranks require tasks up to and including Stage B of that rank
export function getTasksForRank(rank: PartnerRank): string[] {
  const tasks: Record<PartnerRank, string[]> = {
    'Recruit': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3'], // Recruit Stage A: Open Overview, Copy Referral Link, View 3 Automations
    'Recruit Plus': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7'], // Recruit Stage A + B + C (Plus rank unlocks after Stage B, includes quiz from Stage C)
    'Apprentice': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7'], // All Recruit Plus + Apprentice Stage A tasks (course is not a task, only tasks counted)
    'Apprentice Plus': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10'], // All Apprentice Stage A + B (Plus rank unlocks after Stage B)
    'Agent': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9'], // All Apprentice Plus + Agent Stage A tasks (course is not a task)
    'Agent Plus': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13'], // All Agent Stage A + B + Sales Foundations Course (quiz) + The Outreach Process Course (quiz) + Log In 3 Consecutive Days
    'Verified': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b'], // All Agent Plus tasks/courses/quizzes + Verified Stage A tasks + Edit Referral Code
    'Verified Plus': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-4-verified-plus-20'], // All Verified tasks + Verified Plus tasks (Demo Client Deep Dive, Create Demo Automation Plan, Referral Funnel Exercise, Handling Objections 101, Log In on 5 Consecutive Days)
    'Partner': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-4-verified-plus-20', 'stage-5-partner-12', 'stage-5-partner-13', 'stage-5-partner-14', 'stage-5-partner-15', 'stage-5-partner-16', 'stage-5-partner-17', 'stage-5-partner-18', 'stage-5-partner-19'], // All Verified Plus tasks + Partner rank tasks (Review Setup vs Monthly Pricing, Create Sales Script, Record Value Explanation, Earnings Projection, Map Client Journey, Review Bookmarked Automations, Write Setup Process Explanation, Log In on 7 Consecutive Days)
    'Partner Plus': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-4-verified-plus-20', 'stage-5-partner-12', 'stage-5-partner-13', 'stage-5-partner-14', 'stage-5-partner-15', 'stage-5-partner-16', 'stage-5-partner-17', 'stage-5-partner-18', 'stage-5-partner-19', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20'], // All Partner tasks + Partner Plus Stage 5 tasks (Invite First Real Client, Assign First Automation, Mark First Sale, Submit Case Summary)
    'Partner Pro': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-4-verified-plus-20', 'stage-5-partner-12', 'stage-5-partner-13', 'stage-5-partner-14', 'stage-5-partner-15', 'stage-5-partner-16', 'stage-5-partner-17', 'stage-5-partner-18', 'stage-5-partner-19', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20'] // All tasks (courses are not tasks)
  };
  
  return tasks[rank] || [];
}


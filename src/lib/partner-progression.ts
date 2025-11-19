// Partner Progression System Utilities

export type PartnerRank = 'Recruit' | 'Recruit Plus' | 'Apprentice' | 'Apprentice Plus' | 'Agent' | 'Agent Plus' | 'Verified' | 'Verified Plus' | 'Partner' | 'Partner Plus' | 'Partner Pro';

export interface RankInfo {
  rank: PartnerRank;
  commissionRate: number;
  xpThreshold: number;
  unlocks: string[];
}

export const RANK_INFO: Record<PartnerRank, RankInfo> = {
  'Recruit': {
    rank: 'Recruit',
    commissionRate: 25,
    xpThreshold: 0,
    // Basic tabs and referral link are available from Recruit so new tasks (like copying your referral link) are doable
    unlocks: ['getting_started', 'support', 'automations_view', 'referral_link']
  },
  'Recruit Plus': {
    rank: 'Recruit Plus',
    commissionRate: 25,
    xpThreshold: 0, // Same threshold as Recruit, it's a sub-stage
    unlocks: ['bookmarking', 'automation_briefs', 'support_messaging']
  },
  'Apprentice': {
    rank: 'Apprentice',
    commissionRate: 30,
    xpThreshold: 1000,
    unlocks: ['automation_suggestions'] // Unlocks "Suggest New Automation" task
  },
  'Apprentice Plus': {
    rank: 'Apprentice Plus',
    commissionRate: 30,
    xpThreshold: 1000, // Same threshold as Apprentice, it's a sub-stage
    unlocks: []
  },
  'Agent': {
    rank: 'Agent',
    commissionRate: 33,
    xpThreshold: 2500,
    unlocks: ['sales_scripts', 'deal_tracking'] // Unlocks "Create Sales Script" and "Log First Outreach" tasks
  },
  'Agent Plus': {
    rank: 'Agent Plus',
    commissionRate: 33,
    xpThreshold: 2500, // Same threshold as Agent, it's a sub-stage
    unlocks: []
  },
  'Verified': {
    rank: 'Verified',
    commissionRate: 36,
    xpThreshold: 4500,
    unlocks: ['clients_demo', 'referral_link'] // Unlocks "Add Demo Client", "Assign Demo Automation", "Pitch Reflection", "Invite Friend" tasks
  },
  'Verified Plus': {
    rank: 'Verified Plus',
    commissionRate: 36,
    xpThreshold: 4500, // Same threshold as Verified, it's a sub-stage
    unlocks: []
  },
  'Partner': {
    rank: 'Partner',
    commissionRate: 40,
    xpThreshold: 7000,
    unlocks: ['earnings', 'leaderboard', 'clients_real'] // Unlocks "Invite First Real Client", "Assign First Automation", "Mark First Sale", "Submit Case Summary" tasks
  },
  'Partner Plus': {
    rank: 'Partner Plus',
    commissionRate: 40,
    xpThreshold: 7000, // Same threshold as Partner, it's a sub-stage
    unlocks: []
  },
  'Partner Pro': {
    rank: 'Partner Pro',
    commissionRate: 45,
    xpThreshold: 10000,
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
    'Verified Plus': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19'], // All Verified tasks + Verified Plus tasks (Demo Client Deep Dive, Create Demo Automation Plan, Referral Funnel Exercise, Handling Objections 101)
    'Partner': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-3-agent-plus-11', 'stage-3-agent-plus-12', 'stage-3-agent-plus-13', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19'], // All Verified Plus tasks (no Partner tasks required, only course visible)
    'Partner Plus': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20'], // All Verified Plus + Partner Plus Stage 5 tasks (17, 18, 19, 20)
    'Partner Pro': ['stage-1-recruit-1', 'stage-1-recruit-2', 'stage-1-recruit-3', 'stage-1-recruit-plus-4', 'stage-1-recruit-plus-5', 'stage-1-recruit-plus-6', 'stage-1-recruit-plus-7', 'stage-2-apprentice-6', 'stage-2-apprentice-7', 'stage-2-apprentice-8', 'stage-2-apprentice-9', 'stage-2-apprentice-10', 'stage-2-apprentice-11', 'stage-2-apprentice-12', 'stage-2-apprentice-13', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-verified-14b', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-4-verified-plus-16', 'stage-4-verified-plus-17', 'stage-4-verified-plus-18', 'stage-4-verified-plus-19', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20'] // All tasks (courses are not tasks)
  };
  
  return tasks[rank] || [];
}


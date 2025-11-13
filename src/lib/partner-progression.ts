// Partner Progression System Utilities

export type PartnerRank = 'Recruit' | 'Apprentice' | 'Agent' | 'Partner' | 'Verified' | 'Partner Pro';

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
    unlocks: ['getting_started', 'support', 'automations_view']
  },
  'Apprentice': {
    rank: 'Apprentice',
    commissionRate: 30,
    xpThreshold: 1000,
    unlocks: ['automation_suggestions'] // Unlocks "Suggest New Automation" task
  },
  'Agent': {
    rank: 'Agent',
    commissionRate: 33,
    xpThreshold: 2500,
    unlocks: ['sales_scripts', 'deal_tracking'] // Unlocks "Create Sales Script" and "Log First Outreach" tasks
  },
  'Partner': {
    rank: 'Partner',
    commissionRate: 36,
    xpThreshold: 4500,
    unlocks: ['clients_demo', 'referral_link'] // Unlocks "Add Demo Client", "Assign Demo Automation", "Pitch Reflection", "Invite Friend" tasks
  },
  'Verified': {
    rank: 'Verified',
    commissionRate: 40,
    xpThreshold: 7000,
    unlocks: ['earnings', 'leaderboard', 'clients_real'] // Unlocks "Invite First Real Client", "Assign First Automation", "Mark First Sale", "Submit Case Summary" tasks
  },
  'Partner Pro': {
    rank: 'Partner Pro',
    commissionRate: 45,
    xpThreshold: 10000,
    unlocks: ['premium_automations', 'advanced_analytics']
  }
};

export function getNextRank(currentRank: PartnerRank): PartnerRank | null {
  const ranks: PartnerRank[] = ['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Partner Pro'];
  const currentIndex = ranks.indexOf(currentRank);
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
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
  
  const currentThreshold = RANK_INFO[currentRank].xpThreshold;
  const nextThreshold = RANK_INFO[nextRank].xpThreshold;
  const progress = currentXP - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  const percentage = Math.min(100, Math.max(0, (progress / needed) * 100));
  
  return { current: currentXP, next: nextThreshold, percentage };
}

export function isTabUnlocked(tabName: string, currentRank: PartnerRank): boolean {
  const rankInfo = getRankInfo(currentRank);
  
  // Support is always unlocked
  if (tabName === 'support') return true;
  
  // Check if tab is in unlocks for current rank or any previous rank
  const ranks: PartnerRank[] = ['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Partner Pro'];
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
export function getTasksForRank(rank: PartnerRank): string[] {
  const tasks: Record<PartnerRank, string[]> = {
    'Recruit': ['stage-1-recruit-3'], // Complete Getting Started
    'Apprentice': ['stage-1-recruit-3', 'stage-2-apprentice-6'], // Complete Getting Started + Suggest New Automation
    'Agent': ['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10'], // All previous + Create Sales Script + Log First Outreach
    'Partner': ['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15'], // All previous + Add Demo Client + Assign Demo Automation + Pitch Reflection + Invite Friend
    'Verified': ['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20'], // All previous + Verified tasks (16 is a course, not a task)
    'Partner Pro': ['stage-1-recruit-3', 'stage-2-apprentice-6', 'stage-3-agent-9', 'stage-3-agent-10', 'stage-4-partner-12', 'stage-4-partner-13', 'stage-4-partner-14', 'stage-4-partner-15', 'stage-5-verified-17', 'stage-5-verified-18', 'stage-5-verified-19', 'stage-5-verified-20'] // All tasks (16 is a course, not a task)
  };
  
  return tasks[rank] || [];
}


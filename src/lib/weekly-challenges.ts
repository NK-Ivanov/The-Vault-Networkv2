// Weekly Challenges Configuration
// These challenges rotate automatically based on the current week (1-4)
// Challenges are filtered by rank to ensure users only see challenges they can complete

import { type PartnerRank, RANK_INFO } from './partner-progression';

export interface WeeklyChallenge {
  id: string;
  challenge_type: 'engagement' | 'growth' | 'education' | 'contribution' | 'outreach';
  title: string;
  description: string;
  xp_reward: number;
  min_rank?: PartnerRank; // Minimum rank required to see this challenge
  requirements: {
    type: string;
    target: number;
    [key: string]: any;
  };
}

// Week 1 Challenges
const week1Challenges: WeeklyChallenge[] = [
  {
    id: 'week1-engagement',
    challenge_type: 'engagement',
    title: 'Daily Login Streak',
    description: 'Log in 5 days this week',
    xp_reward: 500,
    min_rank: 'Recruit', // Available to all ranks
    requirements: { type: 'login_days', target: 5 }
  },
  {
    id: 'week1-growth',
    challenge_type: 'growth',
    title: 'Client Growth',
    description: 'Add 2 new clients this week',
    xp_reward: 1000,
    min_rank: 'Partner', // Requires Partner rank (clients_demo unlock)
    requirements: { type: 'new_clients', target: 2 }
  },
  {
    id: 'week1-education',
    challenge_type: 'education',
    title: 'Knowledge Refresh',
    description: 'Complete any quiz again',
    xp_reward: 300,
    min_rank: 'Recruit', // Available to all ranks
    requirements: { type: 'quiz_completion', target: 1 }
  },
  {
    id: 'week1-contribution',
    challenge_type: 'contribution',
    title: 'Innovation Challenge',
    description: 'Suggest 1 new automation',
    xp_reward: 800,
    min_rank: 'Apprentice', // Requires Apprentice rank (automation_suggestions unlock)
    requirements: { type: 'automation_suggestion', target: 1 }
  },
  {
    id: 'week1-outreach',
    challenge_type: 'outreach',
    title: 'Outreach Master',
    description: 'Add 3 deal log entries this week',
    xp_reward: 700,
    min_rank: 'Agent', // Requires Agent rank (deal_tracking unlock)
    requirements: { type: 'deal_entries', target: 3 }
  }
];

// Week 2 Challenges
const week2Challenges: WeeklyChallenge[] = [
  {
    id: 'week2-engagement',
    challenge_type: 'engagement',
    title: 'Active Week',
    description: 'Log in 6 days this week',
    xp_reward: 600,
    min_rank: 'Recruit',
    requirements: { type: 'login_days', target: 6 }
  },
  {
    id: 'week2-growth',
    challenge_type: 'growth',
    title: 'Expansion',
    description: 'Assign 2 automations to clients',
    xp_reward: 1200,
    min_rank: 'Partner', // Requires Partner rank (clients_demo unlock)
    requirements: { type: 'automation_assignments', target: 2 }
  },
  {
    id: 'week2-education',
    challenge_type: 'education',
    title: 'Skill Builder',
    description: 'Complete 2 courses',
    xp_reward: 500,
    min_rank: 'Recruit',
    requirements: { type: 'course_completion', target: 2 }
  },
  {
    id: 'week2-contribution',
    challenge_type: 'contribution',
    title: 'Community Contributor',
    description: 'Submit a case study',
    xp_reward: 1000,
    min_rank: 'Verified', // Requires Verified rank (clients_real unlock)
    requirements: { type: 'case_study', target: 1 }
  },
  {
    id: 'week2-outreach',
    challenge_type: 'outreach',
    title: 'Connection Builder',
    description: 'Add 5 deal log entries this week',
    xp_reward: 900,
    min_rank: 'Agent', // Requires Agent rank (deal_tracking unlock)
    requirements: { type: 'deal_entries', target: 5 }
  }
];

// Week 3 Challenges
const week3Challenges: WeeklyChallenge[] = [
  {
    id: 'week3-engagement',
    challenge_type: 'engagement',
    title: 'Consistency Champion',
    description: 'Log in 7 days this week',
    xp_reward: 800,
    min_rank: 'Recruit',
    requirements: { type: 'login_days', target: 7 }
  },
  {
    id: 'week3-growth',
    challenge_type: 'growth',
    title: 'Client Acquisition',
    description: 'Add 3 new clients this week',
    xp_reward: 1500,
    min_rank: 'Partner', // Requires Partner rank
    requirements: { type: 'new_clients', target: 3 }
  },
  {
    id: 'week3-education',
    challenge_type: 'education',
    title: 'Master Learner',
    description: 'Complete 3 quizzes',
    xp_reward: 700,
    min_rank: 'Recruit',
    requirements: { type: 'quiz_completion', target: 3 }
  },
  {
    id: 'week3-contribution',
    challenge_type: 'contribution',
    title: 'Innovation Leader',
    description: 'Suggest 2 new automations',
    xp_reward: 1200,
    min_rank: 'Apprentice', // Requires Apprentice rank
    requirements: { type: 'automation_suggestion', target: 2 }
  },
  {
    id: 'week3-outreach',
    challenge_type: 'outreach',
    title: 'Outreach Expert',
    description: 'Add 7 deal log entries this week',
    xp_reward: 1100,
    min_rank: 'Agent', // Requires Agent rank
    requirements: { type: 'deal_entries', target: 7 }
  }
];

// Week 4 Challenges
const week4Challenges: WeeklyChallenge[] = [
  {
    id: 'week4-engagement',
    challenge_type: 'engagement',
    title: 'Perfect Week',
    description: 'Log in every day this week (7 days)',
    xp_reward: 1000,
    min_rank: 'Recruit',
    requirements: { type: 'login_days', target: 7 }
  },
  {
    id: 'week4-growth',
    challenge_type: 'growth',
    title: 'Rapid Growth',
    description: 'Add 4 new clients this week',
    xp_reward: 2000,
    min_rank: 'Partner', // Requires Partner rank
    requirements: { type: 'new_clients', target: 4 }
  },
  {
    id: 'week4-education',
    challenge_type: 'education',
    title: 'Knowledge Master',
    description: 'Complete 4 courses or quizzes',
    xp_reward: 900,
    min_rank: 'Recruit',
    requirements: { type: 'course_or_quiz', target: 4 }
  },
  {
    id: 'week4-contribution',
    challenge_type: 'contribution',
    title: 'Innovation Master',
    description: 'Suggest 3 new automations',
    xp_reward: 1500,
    min_rank: 'Apprentice', // Requires Apprentice rank
    requirements: { type: 'automation_suggestion', target: 3 }
  },
  {
    id: 'week4-outreach',
    challenge_type: 'outreach',
    title: 'Outreach Champion',
    description: 'Add 10 deal log entries this week',
    xp_reward: 1300,
    min_rank: 'Agent', // Requires Agent rank
    requirements: { type: 'deal_entries', target: 10 }
  }
];

// Get challenges for a specific week (1-4), filtered by rank
export const getWeeklyChallenges = (weekNumber: number, currentRank: PartnerRank = 'Recruit'): WeeklyChallenge[] => {
  let challenges: WeeklyChallenge[];
  switch (weekNumber) {
    case 1:
      challenges = week1Challenges;
      break;
    case 2:
      challenges = week2Challenges;
      break;
    case 3:
      challenges = week3Challenges;
      break;
    case 4:
      challenges = week4Challenges;
      break;
    default:
      challenges = week1Challenges;
  }

  // Filter challenges by rank
  const ranks: PartnerRank[] = ['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Seller Pro'];
  const currentRankIndex = ranks.indexOf(currentRank);

  return challenges.filter(challenge => {
    if (!challenge.min_rank) return true; // No minimum rank requirement
    const minRankIndex = ranks.indexOf(challenge.min_rank);
    return currentRankIndex >= minRankIndex; // User rank must be >= minimum rank
  });
};

// Calculate current week (1-4) based on date
export const getCurrentWeek = (): number => {
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const daysSinceYearStart = Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((daysSinceYearStart + yearStart.getDay() + 1) / 7);
  return ((weekNumber - 1) % 4) + 1; // Cycle through weeks 1-4
};


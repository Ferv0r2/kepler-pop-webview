export type LeaderboardPeriod = 'all' | 'weekly' | 'monthly' | 'daily';

export type LeaderboardMode = 'casual' | 'challenge' | 'all';

export type LeaderboardScope = 'global' | 'friends';

export type LeaderboardEntry = {
  id: string;
  userId: string;
  nickname: string;
  score: number;
  profileImage?: string;
  mode: string;
  rank: number;
  level: number;
  createdAt?: Date;
  updatedAt?: Date;
  isCurrentUser?: boolean;
};

export type LeaderboardData = {
  leaderboard: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  totalCount: number;
  period: LeaderboardPeriod;
  mode: LeaderboardMode;
  scope: LeaderboardScope;
  lastUpdated: Date;
};

export type LeaderboardFilters = {
  period: LeaderboardPeriod;
  mode: LeaderboardMode;
  scope: LeaderboardScope;
  limit?: number;
  offset?: number;
};

export type LeaderboardStats = {
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  currentUserRank?: number;
  currentUserScore?: number;
  rankChange?: number; // 이전 기간 대비 순위 변동
  periodStartDate?: Date;
  periodEndDate?: Date;
};

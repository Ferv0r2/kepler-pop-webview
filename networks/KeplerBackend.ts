import type { LevelInfo, LevelUpdateResponse, UpdateExpRequest } from '@/types/level-types';
import { UserInfo } from '@/types/user-types';

import { api } from './FetchAPI';
import type { SignInWithGoogleResponse } from './types/auth';
import type {
  LeaderboardFilters,
  LeaderboardData,
  LeaderboardStats,
  LeaderboardPeriod,
  LeaderboardMode,
} from './types/leaderboard';

// TODO: Error Handling

export const signInWithGoogle = async (token: string, locale?: string): Promise<SignInWithGoogleResponse> => {
  const response = await api.post('/auth/google', { token, locale });
  if (!response.ok) throw new Error('Failed to login');
  return response.json();
};

export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await api.get('/users/me');
  if (!response.ok) throw new Error('Failed to get user info');
  return response.json();
};

export const getDropletStatus = async (): Promise<{ droplet: number; nextChargeAt: number | null }> => {
  const response = await api.get('/users/me/droplet');
  if (!response.ok) throw new Error('Failed to get droplet status');
  return response.json();
};

export const updateDroplet = async (amount: number): Promise<void> => {
  const response = await api.post('/users/me/droplet/update', { amount });
  if (!response.ok) throw new Error('Failed to update droplet');
};

export const updateScore = async (score: number, mode: 'casual' | 'challenge'): Promise<void> => {
  const response = await api.post('/users/me/score/update', { score, mode });
  if (!response.ok) throw new Error('Failed to update score');
};

// 리더보드 관련 API 함수들
export const getLeaderboard = async (filters: LeaderboardFilters): Promise<LeaderboardData> => {
  const params = new URLSearchParams();
  params.append('period', filters.period);
  params.append('mode', filters.mode);
  params.append('scope', filters.scope);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  // 사용자가 로그인했는지 확인하여 적절한 엔드포인트 선택
  try {
    // 먼저 인증된 엔드포인트 시도 (currentUserEntry 포함)
    const response = await api.get(`/leaderboard/me?${params.toString()}`);
    if (!response.ok) {
      // 인증 실패 시 공개 엔드포인트 사용
      const publicResponse = await api.get(`/leaderboard?${params.toString()}`);
      if (!publicResponse.ok) throw new Error('Failed to fetch leaderboard');

      const data = await publicResponse.json();
      return {
        leaderboard: data.leaderboard || [],
        currentUserEntry: undefined, // 비인증 사용자는 currentUserEntry 없음
        totalCount: data.totalCount || 0,
        period: data.period || filters.period,
        mode: data.mode || filters.mode,
        scope: data.scope || filters.scope,
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
      };
    }

    const data = await response.json();
    const result = {
      leaderboard: data.leaderboard || [],
      currentUserEntry: data.currentUserEntry,
      totalCount: data.totalCount || 0,
      period: data.period || filters.period,
      mode: data.mode || filters.mode,
      scope: data.scope || filters.scope,
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
    };

    return result;
  } catch {
    // 인증 오류 시 공개 엔드포인트로 폴백
    const publicResponse = await api.get(`/leaderboard?${params.toString()}`);
    if (!publicResponse.ok) throw new Error('Failed to fetch leaderboard');

    const data = await publicResponse.json();
    return {
      leaderboard: data.leaderboard || [],
      currentUserEntry: undefined,
      totalCount: data.totalCount || 0,
      period: data.period || filters.period,
      mode: data.mode || filters.mode,
      scope: data.scope || filters.scope,
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
    };
  }
};

export const getLeaderboardStats = async (
  filters: Pick<LeaderboardFilters, 'period' | 'mode' | 'scope'>,
): Promise<LeaderboardStats> => {
  const params = new URLSearchParams();
  params.append('period', filters.period);
  params.append('mode', filters.mode);
  params.append('scope', filters.scope);

  const response = await api.get(`/leaderboard/stats?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard stats');

  const data = await response.json();

  // 현재 사용자 순위 정보가 없는 경우 별도 API로 가져오기
  let currentUserRank = data.currentUserRank;
  let currentUserScore = data.currentUserScore;

  if (!currentUserRank) {
    try {
      const userRankData = await getCurrentUserRank(filters.mode, filters.period);
      currentUserRank = userRankData.rank;
      currentUserScore = userRankData.score;
    } catch (error) {
      console.warn('Failed to get current user rank for stats:', error);
    }
  }

  // 기본값 제공
  return {
    totalPlayers: data.totalPlayers || 0,
    averageScore: data.averageScore || 0,
    highestScore: data.highestScore || 0,
    lowestScore: data.lowestScore || 0,
    currentUserRank: currentUserRank,
    currentUserScore: currentUserScore,
    rankChange: data.rankChange,
    periodStartDate: data.periodStartDate ? new Date(data.periodStartDate) : undefined,
    periodEndDate: data.periodEndDate ? new Date(data.periodEndDate) : undefined,
  };
};

export const getCurrentUserRank = async (
  mode: LeaderboardMode,
  period: LeaderboardPeriod = 'all',
): Promise<{ rank: number; score: number; totalPlayers: number }> => {
  const params = new URLSearchParams();
  params.append('mode', mode);
  params.append('period', period);

  const response = await api.get(`/users/me/rank?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch user rank');

  const data = await response.json();

  // 기본값 제공
  return {
    rank: data.rank || 0,
    score: data.score || 0,
    totalPlayers: data.totalPlayers || 0,
  };
};

export const updateGem = async (amount: number): Promise<void> => {
  const response = await api.post('/users/me/gem/update', { amount });
  if (!response.ok) throw new Error('Failed to update gem');
};

// 레벨 시스템 API 함수들
export const getLevelInfo = async (): Promise<LevelInfo> => {
  const response = await api.get('/level/info');
  if (!response.ok) throw new Error('Failed to get level info');
  return response.json();
};

export const updateExperience = async (request: UpdateExpRequest): Promise<LevelUpdateResponse> => {
  const response = await api.post('/level/update-exp', request);
  if (!response.ok) throw new Error('Failed to update experience');
  return response.json();
};

export const updateUserInfo = async (userInfo: Partial<UserInfo>): Promise<void> => {
  const response = await api.post('/users/me/update', userInfo);
  if (!response.ok) throw new Error('Failed to update user info');
};

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

import { getLeaderboard, getLeaderboardStats, getCurrentUserRank } from '@/networks/KeplerBackend';
import type {
  LeaderboardData,
  LeaderboardFilters,
  LeaderboardStats,
  LeaderboardPeriod,
  LeaderboardMode,
  LeaderboardScope,
} from '@/networks/types/leaderboard';

const DEFAULT_FILTERS: LeaderboardFilters = {
  period: 'weekly',
  mode: 'challenge',
  scope: 'global',
  limit: 50,
  offset: 0,
};

export const useLeaderboard = (initialFilters?: Partial<LeaderboardFilters>) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeaderboardFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // 리더보드 데이터 조회
  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard', filters],
    queryFn: () => getLeaderboard(filters),
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
  });

  // 리더보드 통계 조회
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<LeaderboardStats>({
    queryKey: ['leaderboard-stats', filters.period, filters.mode, filters.scope],
    queryFn: () => getLeaderboardStats(filters),
    staleTime: 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });

  // 현재 사용자 순위 조회
  const {
    data: userRankData,
    isLoading: isLoadingUserRank,
    error: userRankError,
  } = useQuery<{ rank: number; score: number; totalPlayers: number }>({
    queryKey: ['user-rank', filters.mode, filters.period],
    queryFn: () => getCurrentUserRank(filters.mode, filters.period),
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
  });

  // 필터 업데이트 함수들
  const updatePeriod = useCallback((period: LeaderboardPeriod) => {
    setFilters((prev) => ({ ...prev, period, offset: 0 }));
  }, []);

  const updateMode = useCallback((mode: LeaderboardMode) => {
    setFilters((prev) => ({ ...prev, mode, offset: 0 }));
  }, []);

  const updateScope = useCallback((scope: LeaderboardScope) => {
    setFilters((prev) => ({ ...prev, scope, offset: 0 }));
  }, []);

  const loadMore = useCallback(() => {
    if (
      leaderboardData &&
      leaderboardData.leaderboard &&
      leaderboardData.leaderboard.length < leaderboardData.totalCount
    ) {
      setFilters((prev) => ({
        ...prev,
        offset: prev.offset! + prev.limit!,
      }));
    }
  }, [leaderboardData]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // 데이터 새로고침
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['user-rank'] });
  }, [queryClient]);

  // 로딩 상태 통합
  const isLoading = isLoadingLeaderboard || isLoadingStats || isLoadingUserRank;

  // 에러 상태 통합
  const error = leaderboardError || statsError || userRankError;

  // 페이지네이션 정보
  const hasMore =
    leaderboardData && leaderboardData.leaderboard
      ? leaderboardData.leaderboard.length < leaderboardData.totalCount
      : false;

  return {
    // 데이터
    leaderboardData,
    statsData,
    userRankData,

    // 상태
    isLoading,
    error,
    hasMore,

    // 필터
    filters,
    updatePeriod,
    updateMode,
    updateScope,
    resetFilters,

    // 액션
    loadMore,
    refreshData,
    refetchLeaderboard,
  };
};

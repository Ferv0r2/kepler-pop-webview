'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, AlertCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

import { LeaderboardEntry } from '@/components/logic/leaderboard/LeaderboardEntry';
import { LeaderboardFilters } from '@/components/logic/leaderboard/LeaderboardFilters';
import { LeaderboardStats } from '@/components/logic/leaderboard/LeaderboardStats';
import { LoadingSpinner } from '@/components/logic/loading/LoadingSpinner';
import { BottomNavigation } from '@/components/logic/navigation/BottomNavigation';
import { TopNavigation } from '@/components/logic/navigation/TopNavigation';
import { Button } from '@/components/ui/button';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useUser } from '@/hooks/useUser';

export const LeaderboardView = () => {
  const t = useTranslations();
  const router = useRouter();
  const { data: userInfo } = useUser();
  const [showFilters, setShowFilters] = useState(false);

  const {
    leaderboardData,
    statsData,
    isLoading,
    error,
    hasMore,
    filters,
    updatePeriod,
    updateMode,
    updateScope,
    loadMore,
    refreshData,
  } = useLeaderboard();

  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handlePlayNow = useCallback(() => {
    if (userInfo?.locale) {
      router.push(`/${userInfo.locale}`);
    }
  }, [router, userInfo?.locale]);

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
        <LoadingSpinner text={t('leaderboard.loading')} variant="leaderboard" overlay={false} />
      </div>
    );
  }

  const { nickname, level, gameMoney, gem, profileImage } = userInfo;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-0 relative">
      <header className="sticky w-full left-0 top-0 z-10">
        <TopNavigation
          name={nickname}
          level={level}
          gameMoney={gameMoney}
          gem={gem}
          profileImage={profileImage || '/plants/sprout.png'}
        />
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 overflow-x-hidden mb-20">
        {/* 페이지 제목 */}
        <motion.div
          className="text-center mb-6 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('leaderboard.title')}</h1>
          </div>
          <p className="text-gray-400 text-sm">{t('leaderboard.description')}</p>
        </motion.div>

        {/* 통계 카드 */}
        {statsData && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <LeaderboardStats stats={statsData} isLoading={isLoading} />
          </motion.div>
        )}

        {/* 필터 토글 버튼 */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Users className="w-4 h-4 mr-2" />
              {t('leaderboard.filters.period')}: {t(`leaderboard.filters.${filters.period}`)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className={`bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 transition-all duration-200 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 transition-transform duration-200 ${
                  isLoading ? 'animate-spin text-yellow-400' : ''
                }`}
              />
              {isLoading ? t('leaderboard.loading') : t('leaderboard.refresh')}
            </Button>
          </div>
        </motion.div>

        {/* 필터 패널 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LeaderboardFilters
                period={filters.period}
                mode={filters.mode}
                scope={filters.scope}
                onPeriodChange={updatePeriod}
                onModeChange={updateMode}
                onScopeChange={updateScope}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 리더보드 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t('leaderboard.error')}</h3>
              <Button onClick={handleRefresh} variant="outline" className="mt-4">
                {t('leaderboard.refresh')}
              </Button>
            </motion.div>
          ) : isLoading && !leaderboardData ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingSpinner text={t('leaderboard.loading')} variant="leaderboard" overlay={false} />
            </motion.div>
          ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {leaderboardData.leaderboard.map((entry, index) => (
                <LeaderboardEntry
                  key={entry.id}
                  entry={entry}
                  index={index}
                  showRankChange={filters.period !== 'all'}
                />
              ))}

              {/* 더 보기 버튼 */}
              {hasMore && (
                <motion.div className="text-center pt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    onClick={loadMore}
                    disabled={isLoading}
                    variant="outline"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {isLoading ? <LoadingSpinner /> : t('leaderboard.loadMore')}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t('leaderboard.empty.title')}</h3>
              <p className="text-gray-400 mb-6">{t('leaderboard.empty.description')}</p>
              <Button onClick={handlePlayNow} className="bg-blue-600 hover:bg-blue-700">
                {t('leaderboard.empty.playNow')}
              </Button>
            </motion.div>
          )}
        </div>

        {/* 내 순위 고정 표시 */}
        {leaderboardData?.currentUserEntry && (
          <motion.div
            className="sticky bottom-4 mt-4 mb-2 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 p-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-xs text-gray-400 text-center mb-2">{t('leaderboard.myRank')}</div>
            <LeaderboardEntry
              entry={leaderboardData.currentUserEntry}
              index={0}
              showRankChange={filters.period !== 'all'}
            />
          </motion.div>
        )}
      </main>

      <footer className="sticky left-0 bottom-0 z-10">
        <BottomNavigation />
      </footer>
    </div>
  );
};

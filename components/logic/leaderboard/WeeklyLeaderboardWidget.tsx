'use client';

import { motion } from 'framer-motion';
import { Trophy, Clock, ChevronRight, Crown, Medal, Award } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { useLeaderboard } from '@/hooks/useLeaderboard';
import type { LeaderboardEntry } from '@/networks/types/leaderboard';
import { formatNumber } from '@/utils/format-helper';

interface WeeklyLeaderboardWidgetProps {
  locale: string;
}

export const WeeklyLeaderboardWidget = ({ locale }: WeeklyLeaderboardWidgetProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState('');

  const { leaderboardData, isLoading } = useLeaderboard({
    period: 'weekly',
    mode: 'challenge',
    scope: 'global',
    limit: 3,
  });

  // 주간 리더보드 리셋까지 남은 시간 계산
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);

      const diff = nextMonday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}일 ${hours}시간`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}시간 ${minutes}분`);
      } else {
        setTimeRemaining(`${minutes}분`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  const handleViewAll = () => {
    router.push(`/${locale}/leaderboard`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const topEntries = leaderboardData?.leaderboard.slice(0, 3) || [];

  return (
    <motion.div
      className="bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700/50 p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {t('leaderboard.filters.weekly')} {t('leaderboard.title')}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining} 남음</span>
            </div>
          </div>
        </div>
        <motion.button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300 transition-colors"
          whileHover={{ x: 2 }}
        >
          {t('leaderboard.filters.all')}
          <ChevronRight className="w-5 h-5 mb-1 font-bold" />
        </motion.button>
      </div>

      {/* 리더보드 리스트 */}
      <div className="space-y-3">
        {isLoading ? (
          // 로딩 스켈레톤
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-3 bg-gray-700 rounded mb-1" />
                <div className="h-2 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : topEntries.length > 0 ? (
          topEntries.map((entry: LeaderboardEntry, index: number) => (
            <motion.div
              key={entry.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                entry.isCurrentUser ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-gray-700/30'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* 순위 */}
              <div className="flex items-center justify-center w-10 h-10">
                {getRankIcon(entry.rank) || (
                  <span className={`text-sm font-bold ${entry.isCurrentUser ? 'text-blue-400' : 'text-gray-300'}`}>
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* 프로필 이미지 */}
              <div className="relative w-10 h-10">
                <Image
                  src={entry.profileImage || '/plants/sprout.png'}
                  alt={entry.nickname}
                  fill
                  className="rounded-full object-cover"
                  sizes="32px"
                />
                {entry.isCurrentUser && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-gray-800" />
                )}
              </div>

              {/* 플레이어 정보 */}
              <div className="flex-1 min-w-0">
                <div className={`text-md font-medium truncate ${entry.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                  {entry.nickname}
                </div>
                <div className="text-sm text-gray-400">
                  {formatNumber(entry.score)} {t('common.score')}
                </div>
              </div>

              {/* 레벨 */}
              <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Lv.{entry.level}</div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">{t('leaderboard.empty.description')}</div>
        )}
      </div>

      {/* 내 순위 (TOP 3에 없는 경우) */}
      {leaderboardData?.currentUserEntry && !topEntries.some((entry) => entry.isCurrentUser) && (
        <motion.div
          className="mt-3 pt-3 border-t border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-xs text-gray-400 mb-2">{t('leaderboard.myRank')}</div>
          <div className="flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8">
              <span className="text-sm font-bold text-blue-400">{leaderboardData.currentUserEntry.rank}</span>
            </div>
            <div className="relative w-8 h-8">
              <Image
                src={leaderboardData.currentUserEntry.profileImage || '/plants/sprout.png'}
                alt={leaderboardData.currentUserEntry.nickname}
                fill
                className="rounded-full object-cover"
                sizes="32px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-400 truncate">
                {leaderboardData.currentUserEntry.nickname}
              </div>
              <div className="text-xs text-gray-400">
                {formatNumber(leaderboardData.currentUserEntry.score)} {t('common.score')}
              </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
              Lv.{leaderboardData.currentUserEntry.level}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

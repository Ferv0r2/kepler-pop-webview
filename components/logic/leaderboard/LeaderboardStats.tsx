'use client';

import { motion } from 'framer-motion';
import { Users, Target, Trophy, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { LeaderboardStats as LeaderboardStatsType } from '@/networks/types/leaderboard';
import { formatNumber } from '@/utils/format-helper';

interface LeaderboardStatsProps {
  stats: LeaderboardStatsType;
  isLoading?: boolean;
}

export const LeaderboardStats = ({ stats, isLoading = false }: LeaderboardStatsProps) => {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2" />
            <div className="h-6 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const statsItems = [
    {
      icon: Users,
      label: t('leaderboard.stats.totalPlayers'),
      value: formatNumber(stats.totalPlayers),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Target,
      label: t('leaderboard.stats.averageScore'),
      value: formatNumber(stats.averageScore),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Trophy,
      label: t('leaderboard.stats.topScore'),
      value: formatNumber(stats.highestScore),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: TrendingUp,
      label: t('leaderboard.stats.yourRank'),
      value: stats.currentUserRank ? `#${formatNumber(stats.currentUserRank)}` : '-',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {statsItems.map((item, index) => (
        <motion.div
          key={item.label}
          className={`${item.bgColor} rounded-lg p-4 border border-gray-700`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 truncate">{item.label}</p>
              <p className={`text-lg font-bold ${item.color} truncate`}>{item.value}</p>
            </div>
          </div>

          {/* 순위 변동 표시 (내 순위에만) */}
          {item.label === t('leaderboard.stats.yourRank') && stats.rankChange !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-gray-400">
                {stats.rankChange > 0 && `+${stats.rankChange} ${t('leaderboard.stats.rankUp')}`}
                {stats.rankChange < 0 && `${stats.rankChange} ${t('leaderboard.stats.rankDown')}`}
                {stats.rankChange === 0 && t('leaderboard.stats.rankSame')}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

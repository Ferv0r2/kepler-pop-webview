'use client';

import { motion } from 'framer-motion';
import { Crown, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { LeaderboardEntry as LeaderboardEntryType } from '@/networks/types/leaderboard';
import { formatNumber } from '@/utils/format-helper';

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  index: number;
  showRankChange?: boolean;
  rankChange?: number;
}

export const LeaderboardEntry = ({ entry, index, showRankChange = false, rankChange }: LeaderboardEntryProps) => {
  const t = useTranslations();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getRankChangeColor = (change?: number) => {
    if (!change || change === 0) return 'text-gray-400';
    if (change > 0) return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      className={`flex items-center p-4 rounded-lg border transition-all duration-200 ${
        entry.isCurrentUser
          ? 'bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20'
          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* 순위 */}
      <div className="flex items-center justify-center w-12 h-12 mr-2 bg-gray-700 rounded-lg">
        {entry.rank <= 3 ? (
          getRankIcon(entry.rank)
        ) : (
          <div className={`text-lg font-bold ${entry.isCurrentUser ? 'text-blue-400' : 'text-gray-300'}`}>
            {entry.rank}
          </div>
        )}
      </div>

      {/* 프로필 이미지 */}
      <div className="relative w-12 h-12 mr-3">
        <Image
          src={entry.profileImage || '/plants/sprout.png'}
          alt={entry.nickname}
          fill
          className="rounded-full object-cover"
          sizes="48px"
        />
        {entry.isCurrentUser && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-900" />
        )}
      </div>

      {/* 플레이어 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold text-lg truncate ${entry.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
            {entry.nickname}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Lv.{entry.level}</span>
        </div>
        <div className="text-md text-gray-400">
          {formatNumber(entry.score)} {t('common.score')}
        </div>
      </div>

      {/* 순위 변동 */}
      {showRankChange && (
        <div className="flex items-center gap-1 ml-2">
          {getRankChangeIcon(rankChange)}
          <span className={`text-xs font-medium ${getRankChangeColor(rankChange)}`}>
            {rankChange && rankChange !== 0 ? Math.abs(rankChange) : '-'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

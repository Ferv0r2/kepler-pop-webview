'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { LeaderboardPeriod, LeaderboardMode, LeaderboardScope } from '@/networks/types/leaderboard';

interface LeaderboardFiltersProps {
  period: LeaderboardPeriod;
  mode: LeaderboardMode;
  scope: LeaderboardScope;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onModeChange: (mode: LeaderboardMode) => void;
  onScopeChange: (scope: LeaderboardScope) => void;
}

export const LeaderboardFilters = ({
  period,
  onPeriodChange,
}: // onModeChange,
LeaderboardFiltersProps) => {
  const t = useTranslations();

  const periodOptions: { value: LeaderboardPeriod; label: string }[] = [
    { value: 'daily', label: t('leaderboard.filters.daily') },
    { value: 'weekly', label: t('leaderboard.filters.weekly') },
    { value: 'monthly', label: t('leaderboard.filters.monthly') },
    { value: 'all', label: t('leaderboard.filters.all') },
  ];

  // const scopeOptions: { value: LeaderboardScope; label: string }[] = [
  //   { value: 'global', label: t('leaderboard.filters.global') },
  //   { value: 'friends', label: t('leaderboard.filters.friends') },
  // ];

  return (
    <motion.div
      className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 기간 필터 */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">{t('leaderboard.filters.period')}</h3>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange(option.value)}
              className={`text-xs ${
                period === option.value
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 범위 필터 */}
      {/* <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">{t('leaderboard.filters.scope')}</h3>
        <div className="flex flex-wrap gap-2">
          {scopeOptions.map((option) => (
            <Button
              key={option.value}
              variant={scope === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onScopeChange(option.value)}
              className={`text-xs ${
                scope === option.value
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div> */}
    </motion.div>
  );
};

'use client';

import { motion } from 'framer-motion';

import type { Reward } from '@/types/game-types';

import { getNextRewardProgress } from '../constants/game-config';

interface NextRewardPreviewProps {
  nextRewards: Reward[];
  currentScore: number;
  nextRewardThreshold?: number; // 선택적으로 만들기 (자동 계산 가능)
  onRewardPreview: () => void;
}

export const NextRewardPreview = ({ currentScore, onRewardPreview: _onRewardPreview }: NextRewardPreviewProps) => {
  // 새로운 동적 보상 시스템 사용
  const rewardProgress = getNextRewardProgress(currentScore);
  const progressPercent = rewardProgress.progressPercent;
  const remainingScore = rewardProgress.remainingScore;

  // 한 줄로 초압축
  return (
    <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600/50">
      <div className="flex items-center gap-3">
        {/* 레벨 정보 */}
        <div className="text-md font-medium text-white/80 whitespace-nowrap">Lv.{rewardProgress.nextLevel}</div>

        {/* 진행률 바 */}
        <div className="flex-1 relative bg-slate-700/50 rounded-full h-1.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="text-md text-white/60 whitespace-nowrap">{Math.round(progressPercent)}%</div>

        <div className="text-md text-yellow-400 font-medium whitespace-nowrap">
          {remainingScore > 0 ? `${(remainingScore / 1000).toFixed(0)}k` : '✓'}
        </div>
      </div>
    </div>
  );
};

'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface LevelProgressBarProps {
  currentLevel: number;
  currentExp: number;
  expRequiredForNext: number;
  skillPoints: number;
  compact?: boolean;
}

export const LevelProgressBar = ({
  currentLevel,
  currentExp,
  expRequiredForNext,
  skillPoints,
  compact = false,
}: LevelProgressBarProps) => {
  const prevLevelExp = currentLevel > 1 ? (currentLevel - 1) * 1000 + Math.pow(currentLevel - 2, 2) * 500 : 0;
  const expForCurrentLevel = expRequiredForNext - prevLevelExp;
  const expInCurrentLevel = currentExp - prevLevelExp;
  const progress = Math.max(0, Math.min(1, expInCurrentLevel / expForCurrentLevel));

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-300">Lv.{currentLevel}</span>
            {skillPoints > 0 && (
              <div className="flex items-center gap-1">
                <Zap size={12} className="text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">{skillPoints}</span>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-purple-400/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">레벨 {currentLevel}</span>
        </div>
        {skillPoints > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1 rounded-lg">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-yellow-400 font-semibold">{skillPoints}</span>
            <span className="text-yellow-300 text-sm">스킬포인트</span>
          </div>
        )}
      </div>

      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
        </motion.div>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          {expInCurrentLevel.toLocaleString()} / {expForCurrentLevel.toLocaleString()}
        </span>
        <span className="text-purple-400 font-medium">{(progress * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

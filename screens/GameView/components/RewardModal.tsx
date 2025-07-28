'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import type { Reward } from '@/types/game-types';

interface RewardModalProps {
  isOpen: boolean;
  rewards: Reward[];
  timeRemaining: number;
  onSelectReward: (reward: Reward) => void;
}

export const RewardModal = ({ isOpen, rewards, timeRemaining, onSelectReward }: RewardModalProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const t = useTranslations();

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(null);
    }
  }, [isOpen]);

  const handleRewardClick = (reward: Reward, index: number) => {
    setSelectedIndex(index);
    onSelectReward(reward);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-3 mx-2 max-w-xs w-full border border-yellow-500/30"
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          {/* 헤더 */}
          <div className="text-center mb-3">
            <motion.div
              className="text-xl font-bold text-yellow-400 mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring' }}
            >
              {t('game.reward.title')}
            </motion.div>
            <motion.div
              className="text-white/80 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t('game.reward.subtitle')}
            </motion.div>
            {/* 타이머 */}
            <motion.div
              className="mt-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="text-xs text-white/60 mb-0.5">{t('game.reward.timeRemaining')}</div>
              <div className={`text-base font-bold ${timeRemaining <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-yellow-400 h-1.5 rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeRemaining / 30) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </div>

          {/* 보상 카드들 */}
          <div className="space-y-2">
            {rewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                className={`relative cursor-pointer rounded-lg p-2 border transition-all duration-200 ${
                  selectedIndex === index
                    ? 'border-yellow-400 bg-yellow-400/10 scale-102'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700/70'
                }`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.07 }}
                whileHover={{ scale: selectedIndex === index ? 1.02 : 1.01 }}
                onClick={() => handleRewardClick(reward, index)}
              >
                {/* 보상 아이콘 */}
                <div className="flex items-center space-x-2">
                  <motion.div
                    className={`text-2xl ${reward.color}`}
                    animate={selectedIndex === index ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: selectedIndex === index ? Infinity : 0 }}
                  >
                    {typeof reward.icon === 'string' && reward.icon.startsWith('/') ? (
                      <Image src={reward.icon} alt={reward.name} className="inline-block" width={32} height={32} />
                    ) : (
                      reward.icon
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${reward.color}`}>{reward.name}</div>
                    <div className="text-white/70 text-xs mt-0.5 leading-tight truncate">{reward.description}</div>
                  </div>
                </div>
                {/* 선택 표시 */}
                {selectedIndex === index && (
                  <motion.div
                    className="absolute top-1 right-1 text-yellow-400 text-base"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    ✓
                  </motion.div>
                )}
                {/* 파티클 효과 */}
                {selectedIndex === index && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-0.5 h-0.5 bg-yellow-400 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                        }}
                        initial={{ x: 0, y: 0, opacity: 0 }}
                        animate={{
                          x: Math.cos((i * Math.PI) / 4) * 36,
                          y: Math.sin((i * Math.PI) / 4) * 36,
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 0.7,
                          delay: i * 0.07,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* 안내 메시지 */}
          <motion.div
            className="text-center mt-3 text-white/50 text-[11px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t('game.reward.autoSelectMessage')}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

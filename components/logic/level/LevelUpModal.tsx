'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Star, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { createGameOverConfetti } from '@/utils/animation-helper';

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  skillPointsGained: number;
  onClose: () => void;
  onOpenTechTree: () => void;
}

export const LevelUpModal = ({ isOpen, newLevel, skillPointsGained, onClose, onOpenTechTree }: LevelUpModalProps) => {
  useEffect(() => {
    if (isOpen) {
      // 레벨업 축하 효과
      createGameOverConfetti();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-2xl p-6 max-w-md w-full border border-purple-400/50 shadow-2xl"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="text-center relative">
              {/* 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-purple-400/20 rounded-2xl blur-xl -z-10" />

              {/* 헤더 */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-400" size={24} />
                  <h2 className="text-2xl font-bold text-white">레벨 업!</h2>
                  <Star className="text-yellow-400" size={24} />
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" type="button">
                  <X size={20} />
                </button>
              </div>

              {/* 레벨 표시 */}
              <motion.div
                className="mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              >
                <div className="inline-block bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-6xl font-bold rounded-full w-24 h-24 flex items-center justify-center shadow-lg">
                  {newLevel}
                </div>
                <p className="text-purple-200 mt-2 text-lg">새로운 레벨 달성!</p>
              </motion.div>

              {/* 스킬 포인트 */}
              {skillPointsGained > 0 && (
                <motion.div
                  className="mb-6 bg-yellow-500/20 rounded-lg p-4 border border-yellow-400/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="text-yellow-400" size={20} />
                    <span className="text-yellow-400 font-semibold text-lg">+{skillPointsGained} 스킬포인트</span>
                  </div>
                  <p className="text-yellow-200 text-sm">테크 트리에서 영구 강화를 구매하세요!</p>
                </motion.div>
              )}

              {/* 버튼들 */}
              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50"
                >
                  계속하기
                </Button>
                <Button
                  onClick={onOpenTechTree}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <span>테크 트리</span>
                  <ArrowRight size={16} className="ml-1" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Gem, Star } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { useTechTree } from '@/hooks/useTechTree';
import type { TechTreeNode, UserTechTreeNode } from '@/types/tech-tree-types';

interface TechNodeModalProps {
  node: TechTreeNode;
  userNode?: UserTechTreeNode;
  userGems: number;
  onClose: () => void;
}

export const TechNodeModal = ({ node, userNode, userGems, onClose }: TechNodeModalProps) => {
  const { purchaseNode, isPurchasing } = useTechTree();

  const currentLevel = userNode?.currentLevel || 0;
  const isMaxLevel = userNode?.isMaxLevel || false;
  const canUpgrade = userNode?.canUpgrade || false;
  const nextCost = userNode?.nextCost || node.baseCost;

  const handlePurchase = () => {
    if (canUpgrade && !isPurchasing) {
      purchaseNode(node.id);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-purple-400/30 shadow-2xl"
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: node.color }}>
                <Image src={node.icon} alt={node.name} width={32} height={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{node.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">티어 {node.tier}</span>
                  {currentLevel > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" />
                      <span className="text-sm text-yellow-400 font-medium">Lv.{currentLevel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" type="button">
              <X size={20} />
            </button>
          </div>

          {/* 설명 */}
          <p className="text-gray-300 mb-4">{node.description}</p>

          {/* 효과 정보 */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <h4 className="text-white font-semibold mb-2">효과</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">현재 효과:</span>
                <span className="text-purple-300">+{userNode?.totalEffect || 0}</span>
              </div>
              {!isMaxLevel && (
                <div className="flex justify-between">
                  <span className="text-gray-400">다음 레벨:</span>
                  <span className="text-green-300">+{node.enhancementValue}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">최대 레벨:</span>
                <span className="text-white">{node.maxLevel}</span>
              </div>
            </div>
          </div>

          {/* 진행도 */}
          {currentLevel > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">진행도</span>
                <span className="text-white">
                  {currentLevel} / {node.maxLevel}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{ width: `${(currentLevel / node.maxLevel) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 구매 정보 */}
          {!isMaxLevel && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gem size={20} className="text-purple-400" />
                <span className="text-white font-semibold">{nextCost.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-400">보유: {userGems.toLocaleString()}</div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              닫기
            </Button>
            {!isMaxLevel && (
              <Button
                onClick={handlePurchase}
                disabled={!canUpgrade || isPurchasing || userGems < nextCost}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {isPurchasing ? '구매 중...' : currentLevel > 0 ? '업그레이드' : '구매'}
              </Button>
            )}
            {isMaxLevel && (
              <div className="flex-1 flex items-center justify-center bg-green-500/20 text-green-400 rounded-lg py-2 font-semibold">
                최대 레벨 달성
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

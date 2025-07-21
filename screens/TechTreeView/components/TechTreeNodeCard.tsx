'use client';

import { motion } from 'framer-motion';
import { Lock, Star, ArrowUp } from 'lucide-react';
import Image from 'next/image';

import type { TechTreeNode, UserTechTreeNode } from '@/types/tech-tree-types';

interface TechTreeNodeCardProps {
  node: TechTreeNode;
  userNode?: UserTechTreeNode;
  onClick: () => void;
  delay?: number;
}

export const TechTreeNodeCard = ({ node, userNode, onClick, delay = 0 }: TechTreeNodeCardProps) => {
  const currentLevel = userNode?.currentLevel || 0;
  const isMaxLevel = userNode?.isMaxLevel || false;
  const canUpgrade = userNode?.canUpgrade || false;
  const isLocked = currentLevel === 0 && !canUpgrade;

  return (
    <motion.div
      className={`
        relative p-4 rounded-xl border cursor-pointer transition-all duration-300
        ${
          isLocked
            ? 'bg-gray-800/50 border-gray-600/50 opacity-60'
            : 'bg-gray-800/80 border-purple-400/30 hover:border-purple-400/60 hover:bg-gray-700/80'
        }
        ${canUpgrade ? 'ring-2 ring-yellow-400/50 animate-pulse' : ''}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      onClick={onClick}
    >
      {/* 티어 배지 */}
      <div
        className={`
        absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
        ${node.tier === 1 ? 'bg-green-500' : node.tier === 2 ? 'bg-blue-500' : 'bg-purple-500'}
      `}
      >
        {node.tier}
      </div>

      {/* 잠금 상태 */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
          <Lock className="text-gray-400" size={24} />
        </div>
      )}

      {/* 아이콘 */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${isLocked ? 'bg-gray-700' : 'bg-gradient-to-br'}
        `}
          style={{ background: isLocked ? undefined : node.color }}
        >
          <Image src={node.icon} alt={node.name} width={24} height={24} className={isLocked ? 'opacity-50' : ''} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{node.name}</h4>
          <div className="flex items-center gap-2">
            {currentLevel > 0 && (
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">Lv.{currentLevel}</span>
              </div>
            )}
            {isMaxLevel && <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">MAX</span>}
            {canUpgrade && !isMaxLevel && <ArrowUp size={12} className="text-yellow-400 animate-bounce" />}
          </div>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{node.description}</p>

      {/* 효과 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-purple-300">
          {currentLevel > 0 ? `+${userNode?.totalEffect}` : `+${node.enhancementValue}`}
        </span>
        {userNode && !isMaxLevel && <span className="text-xs text-yellow-400">💎 {userNode.nextCost}</span>}
      </div>

      {/* 진행도 바 */}
      {currentLevel > 0 && (
        <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
          <div
            className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: `${(currentLevel / node.maxLevel) * 100}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Map, Store, Trophy, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface PathNode {
  id: string;
  type: 'battle' | 'shop' | 'reward' | 'rest' | 'boss';
  name: string;
  description: string;
  icon: string;
  color: string;
  isAvailable: boolean;
  isCompleted?: boolean;
}

interface PathChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPathSelect: (pathId: string) => void;
  availablePaths: PathNode[];
  currentPath: string;
}

const PATH_NODES: PathNode[] = [
  {
    id: 'battle_1',
    type: 'battle',
    name: '일반 전투',
    description: '기본적인 타일 매칭 도전',
    icon: '/icons/sword.png',
    color: 'text-red-400',
    isAvailable: true,
  },
  {
    id: 'shop_1',
    type: 'shop',
    name: '상점',
    description: 'gem으로 아이템을 구매할 수 있습니다',
    icon: '/icons/shop.png',
    color: 'text-blue-400',
    isAvailable: true,
  },
  {
    id: 'reward_1',
    type: 'reward',
    name: '보상',
    description: '특별한 보상을 선택할 수 있습니다',
    icon: '/icons/chest.png',
    color: 'text-yellow-400',
    isAvailable: true,
  },
  {
    id: 'rest_1',
    type: 'rest',
    name: '휴식',
    description: '체력을 회복하고 특별한 효과를 얻습니다',
    icon: '/icons/heart.png',
    color: 'text-green-400',
    isAvailable: true,
  },
  {
    id: 'boss_1',
    type: 'boss',
    name: '보스 전투',
    description: '강력한 보스와의 최종 대결',
    icon: '/icons/crown.png',
    color: 'text-purple-400',
    isAvailable: false,
  },
];

export const PathChoiceModal = ({
  isOpen,
  onClose,
  onPathSelect,
  availablePaths = PATH_NODES,
  currentPath,
}: PathChoiceModalProps) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const t = useTranslations();

  const handlePathSelect = () => {
    if (selectedPath) {
      onPathSelect(selectedPath);
      setSelectedPath(null);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'battle':
        return <Trophy className="h-6 w-6" />;
      case 'shop':
        return <Store className="h-6 w-6" />;
      case 'reward':
        return <Trophy className="h-6 w-6" />;
      case 'rest':
        return <Trophy className="h-6 w-6" />;
      case 'boss':
        return <Trophy className="h-6 w-6" />;
      default:
        return <Map className="h-6 w-6" />;
    }
  };

  const getNodeBg = (type: string) => {
    switch (type) {
      case 'battle':
        return 'bg-red-500/20';
      case 'shop':
        return 'bg-blue-500/20';
      case 'reward':
        return 'bg-yellow-500/20';
      case 'rest':
        return 'bg-green-500/20';
      case 'boss':
        return 'bg-purple-500/20';
      default:
        return 'bg-slate-500/20';
    }
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
          className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-6 mx-4 max-w-4xl w-full border border-purple-500/30"
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Map className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{t('game.pathChoice.title')}</h2>
                <p className="text-white/70 text-sm">{t('game.pathChoice.subtitle')}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 경로 맵 */}
          <div className="relative mb-6">
            {/* 경로 연결선 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-20" viewBox="0 0 400 80">
                <path
                  d="M 50 40 Q 100 20 150 40 Q 200 60 250 40 Q 300 20 350 40"
                  stroke="url(#pathGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* 경로 노드들 */}
            <div className="relative flex justify-between items-center">
              {availablePaths.map((node, index) => {
                const isSelected = selectedPath === node.id;
                const isCurrent = currentPath === node.id;

                return (
                  <motion.div
                    key={node.id}
                    className={`
                      relative flex flex-col items-center cursor-pointer
                      ${!node.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => node.isAvailable && setSelectedPath(isSelected ? null : node.id)}
                    whileHover={node.isAvailable ? { scale: 1.05 } : {}}
                  >
                    {/* 노드 아이콘 */}
                    <motion.div
                      className={`
                        w-16 h-16 rounded-full border-2 flex items-center justify-center
                        ${
                          isSelected
                            ? 'border-purple-400 bg-purple-400/20 scale-110'
                            : isCurrent
                              ? 'border-green-400 bg-green-400/20'
                              : 'border-slate-600 bg-slate-700/50'
                        }
                        ${getNodeBg(node.type)}
                      `}
                      animate={
                        isSelected
                          ? {
                              scale: [1, 1.1, 1],
                              borderColor: ['#a855f7', '#ec4899', '#a855f7'],
                            }
                          : {}
                      }
                      transition={{ duration: 2, repeat: isSelected ? Infinity : 0 }}
                    >
                      <div className={`text-2xl ${node.color}`}>
                        {typeof node.icon === 'string' && node.icon.startsWith('/') ? (
                          <Image src={node.icon} alt={node.name} width={32} height={32} className="rounded" />
                        ) : (
                          getNodeIcon(node.type)
                        )}
                      </div>
                    </motion.div>

                    {/* 노드 이름 */}
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-bold ${node.color}`}>{node.name}</div>
                      <div className="text-xs text-white/70 mt-1 max-w-20 leading-tight">{node.description}</div>
                    </div>

                    {/* 선택 표시 */}
                    {isSelected && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        <span className="text-white text-xs">✓</span>
                      </motion.div>
                    )}

                    {/* 완료 표시 */}
                    {node.isCompleted && (
                      <motion.div
                        className="absolute -top-2 -left-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        <span className="text-white text-xs">✓</span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 선택된 경로 정보 */}
          {selectedPath && (
            <motion.div
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">
                  {availablePaths.find((p) => p.id === selectedPath)?.name}
                </h3>
                <p className="text-white/70 text-sm">
                  {availablePaths.find((p) => p.id === selectedPath)?.description}
                </p>
              </div>
            </motion.div>
          )}

          {/* 경로 선택 버튼 */}
          {selectedPath && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handlePathSelect}
                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {t('game.pathChoice.selectPath')}
              </Button>
            </motion.div>
          )}

          {/* 안내 메시지 */}
          <motion.div
            className="text-center mt-4 text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t('game.pathChoice.selectPathToContinue')}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

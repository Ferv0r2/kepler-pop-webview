'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';

import type { GameItemType } from '@/types/game-types';

interface ItemAreaTooltipProps {
  itemType: GameItemType;
  isVisible: boolean;
  children: ReactNode;
}

/**
 * 아이템 적용 영역을 보여주는 간단한 툴팁
 */
export const ItemAreaTooltip = ({ itemType, isVisible, children }: ItemAreaTooltipProps) => {
  const t = useTranslations();

  // 각 아이템별 적용 영역 정보와 스타일
  const getItemInfo = (
    item: GameItemType,
  ): {
    description: string;
    image: string;
    gradient: string;
    accent: string;
    pattern: number[][];
  } => {
    switch (item) {
      case 'shovel':
        return {
          description: t('game.area.shovel'),
          image: '/icons/shovel.png',
          gradient: 'from-amber-500/20 via-orange-500/20 to-yellow-500/20',
          accent: 'border-amber-400/50',
          pattern: [
            [0, 0, 0],
            [0, 1, 0], // 중앙 1개만 적용
            [0, 0, 0],
          ],
        };
      case 'mole':
        return {
          description: t('game.area.mole'),
          image: '/icons/mole.png',
          gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
          accent: 'border-cyan-400/50',
          pattern: [
            [1, 0, 1],
            [1, 2, 1], // 행과 열 전체 (2는 중심)
            [1, 0, 1],
          ],
        };
      case 'bomb':
        return {
          description: t('game.area.bomb'),
          image: '/icons/bomb.png',
          gradient: 'from-red-500/20 via-pink-500/20 to-purple-500/20',
          accent: 'border-pink-400/50',
          pattern: [
            [1, 1, 1],
            [1, 2, 1], // 중심과 주변 8개 (2는 중심)
            [1, 1, 1],
          ],
        };
      default:
        return {
          description: '',
          image: '/icons/gem.png',
          gradient: 'from-gray-500/20 to-gray-600/20',
          accent: 'border-gray-400/50',
          pattern: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
          ],
        };
    }
  };

  const itemInfo = getItemInfo(itemType);

  // 타일 패턴 렌더링 컴포넌트
  const TilePattern = ({ pattern, gradient }: { pattern: number[][]; gradient: string }) => (
    <div className="flex flex-col gap-1.5 p-2 bg-black/30 rounded-lg border border-white/20">
      {pattern.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5">
          {row.map((cell, colIndex) => {
            let cellClass = 'w-5 h-5 rounded-md border-2 transition-all duration-200';

            if (cell === 0) {
              // 비활성 타일 - 더 어둡고 투명하게
              cellClass += ' bg-gray-800/40 border-gray-600/30 opacity-50';
            } else if (cell === 1) {
              // 활성 타일 - 밝고 선명하게
              cellClass += ` bg-gradient-to-br ${gradient.replace('/20', '')} border-white/80 shadow-lg ring-1 ring-white/30`;
            } else if (cell === 2) {
              // 중심 타일 - 최대 강조
              cellClass += ` bg-gradient-to-br ${gradient.replace('/20', '')} border-yellow-300/90 ring-2 ring-yellow-300/60 shadow-xl animate-pulse`;
            }

            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className={cellClass}
                initial={{ scale: 0.6, opacity: 0, rotateY: -90 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotateY: 0,
                  ...(cell > 0 && {
                    boxShadow: [
                      '0 0 0 0 rgba(255, 255, 255, 0.4)',
                      '0 0 0 4px rgba(255, 255, 255, 0)',
                      '0 0 0 0 rgba(255, 255, 255, 0.4)',
                    ],
                  }),
                }}
                transition={{
                  delay: (rowIndex + colIndex) * 0.05,
                  duration: 0.25,
                  ease: 'easeOut',
                  boxShadow:
                    cell > 0
                      ? {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                      : undefined,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              boxShadow: [
                '0 0 0 0 rgba(255, 255, 255, 0.4)',
                '0 0 0 10px rgba(255, 255, 255, 0)',
                '0 0 0 0 rgba(255, 255, 255, 0.4)',
              ],
            }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{
              duration: 0.12,
              ease: 'easeOut',
              boxShadow: {
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          >
            {/* 화려한 토스트 툴팁 */}
            <motion.div
              className={`
                relative bg-gray-900/95 rounded-xl px-6 py-4 
                border-2 ${itemInfo.accent} 
                shadow-2xl overflow-hidden backdrop-blur-xl
                ring-2 ring-white/20
              `}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                backgroundPosition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            >
              {/* 배경 그라디언트 레이어 */}
              <div className={`absolute inset-0 bg-gradient-to-r ${itemInfo.gradient} rounded-xl`} />

              {/* 배경 반짝임 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 animate-pulse" />

              {/* 내용 - 세로 구조 */}
              <div className="relative flex flex-col items-center gap-3">
                {/* 아이템 이미지와 타일 패턴을 가로로 배치 */}
                <div className="flex items-center gap-4">
                  {/* 아이템 이미지 */}
                  <motion.div
                    className="flex-shrink-0"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Image src={itemInfo.image} alt="" width={48} height={48} className="drop-shadow-lg" />
                  </motion.div>

                  {/* 타일 패턴 표시 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08, duration: 0.15 }}
                  >
                    <TilePattern pattern={itemInfo.pattern} gradient={itemInfo.gradient} />
                  </motion.div>
                </div>

                {/* 설명 텍스트 */}
                <motion.p
                  className="text-white text-sm font-bold tracking-wide drop-shadow-xl text-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.15 }}
                >
                  {itemInfo.description}
                </motion.p>
              </div>

              {/* 경계 반짝임 */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-white/30"
                animate={{
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { GRID_SIZE } from '@/screens/GameView/constants/game-config';

export const ShovelAnimation = ({
  row,
  col,
  left,
  top,
  onComplete,
}: {
  row: number;
  col: number;
  left?: number;
  top?: number;
  onComplete: () => void;
}) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute"
        style={
          left !== undefined && top !== undefined
            ? { left: left + 'px', top: top + 'px', transform: 'translate(-50%, -50%)' }
            : { left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)' }
        }
      >
        <motion.div
          initial={{ scale: 0, rotate: -45, y: -200, x: 0 }}
          animate={{
            scale: [0, 2, 1.5],
            rotate: [-45, 15, 0],
            y: [-200, 0, 20],
          }}
          transition={{ duration: 0.7, times: [0, 0.6, 1] }}
          className="relative"
        >
          <motion.div
            animate={{
              y: [0, -20, 40],
              rotate: [0, -15, 45],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Image
              src="/icons/shovel.png"
              alt="삽 아이템"
              width={80}
              height={80}
              className="w-20 h-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]"
              style={{ objectFit: 'contain' }}
              priority
            />
          </motion.div>

          {/* 빛나는 효과 */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: [0, 0.9, 0],
              scale: [0.2, 2, 4],
            }}
            transition={{ duration: 0.8, delay: 0.5 }}
            onAnimationComplete={onComplete}
          />

          {/* 파티클 효과 */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-300"
              style={{
                top: '50%',
                left: '50%',
                boxShadow: '0 0 10px 2px rgba(253, 224, 71, 0.8)',
              }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos((i * Math.PI) / 6) * 80,
                y: Math.sin((i * Math.PI) / 6) * 80,
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{ duration: 0.7, delay: 0.6 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// 두더지 애니메이션 - 더 화려하게 개선
export const MoleAnimation = ({
  row,
  col,
  direction,
  left,
  top,
  onComplete,
}: {
  row: number;
  col: number;
  direction: 'row' | 'col';
  left?: number;
  top?: number;
  onComplete: () => void;
}) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute"
        style={
          left !== undefined && top !== undefined
            ? { left: left + 'px', top: top + 'px', transform: 'translate(-50%, -50%)' }
            : { left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)' }
        }
      >
        <motion.div
          initial={{ scale: 0, y: 100, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 1.2],
            y: [100, -20, 0],
            opacity: 1,
          }}
          transition={{ duration: 0.5, times: [0, 0.7, 1] }}
          className="relative"
        >
          {/* 땅이 갈라지는 효과 */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-900 opacity-70" />
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 h-1 bg-amber-800"
                style={{
                  transformOrigin: '0 0',
                  rotate: `${i * 45}deg`,
                  width: '40px',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1] }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            ))}
          </motion.div>

          {/* 두더지 */}
          <motion.div
            animate={{
              x: direction === 'row' ? [-150, 150] : 0,
              y: direction === 'col' ? [-150, 150] : 0,
              opacity: [1, 0],
              scale: [1, 1.2, 0.8],
            }}
            transition={{
              duration: 1,
              delay: 0.3,
              times: [0, 0.8, 1],
            }}
          >
            <Image
              src="/icons/mole.png"
              alt="두더지 아이템"
              width={64}
              height={64}
              className="w-16 h-16 drop-shadow-[0_0_8px_rgba(180,83,9,0.8)]"
              style={{ objectFit: 'contain' }}
              priority
            />
          </motion.div>

          {/* 이동 경로 효과 */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 1, delay: 0.4 }}
            onAnimationComplete={onComplete}
          >
            <motion.div
              className={`${direction === 'row' ? 'w-[300px] h-4' : 'w-4 h-[300px]'} bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full opacity-70`}
              style={{
                left: direction === 'row' ? '-150px' : '50%',
                top: direction === 'col' ? '-150px' : '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [0.3, 1],
                opacity: [0.2, 0.8, 0],
              }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />

            {/* 흙 파티클 */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-amber-600"
                style={{
                  left: direction === 'row' ? `${(i / 20) * 300 - 150}px` : '0',
                  top: direction === 'col' ? `${(i / 20) * 300 - 150}px` : '0',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: direction === 'row' ? 0 : Math.random() * 40 - 20,
                  y: direction === 'col' ? 0 : Math.random() * 40 - 20,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.3 + (i / 20) * 0.5,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const BombAnimation = ({
  row,
  col,
  left,
  top,
  onComplete,
}: {
  row: number;
  col: number;
  left?: number;
  top?: number;
  onComplete: () => void;
}) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute"
        style={
          left !== undefined && top !== undefined
            ? { left: left + 'px', top: top + 'px', transform: 'translate(-50%, -50%)' }
            : { left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)' }
        }
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, type: 'spring' }}>
          {/* 폭탄 */}
          <motion.div
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.3, 1.1, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.8,
              times: [0, 0.3, 0.5, 0.6],
            }}
          >
            <Image
              src="/icons/bomb.png"
              alt="폭탄 아이템"
              width={80}
              height={80}
              className="w-20 h-20 drop-shadow-[0_0_10px_rgba(0,0,0,0.7)]"
              style={{ objectFit: 'contain' }}
              priority
            />

            {/* 폭탄 심지 불꽃 */}
            <motion.div
              className="absolute -top-2 right-3 w-4 h-4 bg-orange-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                boxShadow: [
                  '0 0 5px 2px rgba(249, 115, 22, 0.5)',
                  '0 0 10px 4px rgba(249, 115, 22, 0.8)',
                  '0 0 5px 2px rgba(249, 115, 22, 0.5)',
                ],
              }}
              transition={{
                repeat: 2,
                duration: 0.3,
              }}
            />
          </motion.div>

          {/* 폭발 효과 */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 0.5 }}
          >
            {/* 폭발 중심 */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{
                width: '200px',
                height: '200px',
                opacity: [0, 1, 0],
                scale: [0, 1.5, 2],
              }}
              transition={{ duration: 0.8, delay: 0.5 }}
              onAnimationComplete={onComplete}
            />

            {/* 폭발 파장 링 */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-orange-400"
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={{
                  width: ['0px', '300px'],
                  height: ['0px', '300px'],
                  opacity: [0, 0.7, 0],
                  scale: [0, 1],
                }}
                transition={{
                  duration: 1,
                  delay: 0.5 + i * 0.2,
                }}
              />
            ))}

            {/* 폭발 파티클 */}
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                style={{
                  background: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#f59e0b' : '#ef4444',
                  boxShadow: '0 0 10px 2px rgba(249, 115, 22, 0.8)',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: Math.cos((i * Math.PI) / 12) * 150,
                  y: Math.sin((i * Math.PI) / 12) * 150,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.6,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* 불꽃 파티클 */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                className="absolute top-1/2 left-1/2 w-4 h-8 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full"
                style={{
                  transformOrigin: 'bottom',
                  rotate: `${i * 30}deg`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: [0, -80, -100],
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.55,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

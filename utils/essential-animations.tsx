'use client';

import { motion } from 'framer-motion';

import { GRID_SIZE } from '@/screens/GameView/constants/game-config';

// 필수 사용자 피드백 애니메이션 - 성능 최적화 버전

export const TileMatchFeedback = ({ row, col, onComplete }: { row: number; col: number; onComplete: () => void }) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      {/* 매치 링 효과 */}
      <motion.div
        className="absolute border-2 border-yellow-400 rounded-full"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.5, 2], opacity: [0, 1, 0] }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onAnimationComplete={onComplete}
      />

      {/* 중앙 점멸 */}
      <motion.div
        className="absolute w-2 h-2 bg-white rounded-full shadow-lg"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 0] }}
        transition={{ duration: 0.3, delay: 0.05 }}
      />
    </motion.div>
  );
};

export const ComboFeedback = ({
  row,
  col,
  combo,
  onComplete,
}: {
  row: number;
  col: number;
  combo: number;
  onComplete: () => void;
}) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  // 콤보가 높을수록 더 화려한 효과
  const isHighCombo = combo >= 3;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 콤보 텍스트 */}
      <motion.div
        className="absolute text-white font-bold text-lg drop-shadow-lg"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        }}
        initial={{ scale: 0, y: 20 }}
        animate={{
          scale: [0, 1.3, 1],
          y: [20, -10, -30],
          color: isHighCombo ? ['#ffffff', '#ffff00', '#ff6600'] : ['#ffffff', '#00ff00'],
        }}
        transition={{ duration: 0.6 }}
        onAnimationComplete={onComplete}
      >
        {combo}x
      </motion.div>

      {/* 고콤보 시 추가 효과 */}
      {isHighCombo && (
        <motion.div
          className="absolute"
          style={{ left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)' }}
        >
          {/* 방사형 파장 */}
          <motion.div
            className="absolute border-2 border-orange-400 rounded-full opacity-60"
            initial={{ width: 0, height: 0 }}
            animate={{ width: '80px', height: '80px', opacity: [0.6, 0] }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export const ScorePopup = ({
  row,
  col,
  score,
  onComplete,
}: {
  row: number;
  col: number;
  score: number;
  onComplete: () => void;
}) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-45"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        className="absolute text-green-400 font-semibold text-sm drop-shadow-md"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
          textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
        }}
        initial={{ scale: 0, y: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.1, 1],
          y: [0, -20, -40],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        onAnimationComplete={onComplete}
      >
        +{score}
      </motion.div>
    </motion.div>
  );
};

// 간단한 아이템 사용 피드백
export const ItemUseFeedback = ({
  row,
  col,
  itemType,
  onComplete,
}: {
  row: number;
  col: number;
  itemType: 'shovel' | 'mole' | 'bomb';
  onComplete: () => void;
}) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  const colors = {
    shovel: 'border-red-400 bg-red-500',
    mole: 'border-blue-400 bg-blue-500',
    bomb: 'border-orange-400 bg-orange-500',
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`absolute w-6 h-6 rounded-full border-2 ${colors[itemType]}`}
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: [0, 1.5, 1.2, 0],
          rotate: [180, 0, 0, 0],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        onAnimationComplete={onComplete}
      />

      {/* 충격파 효과 */}
      <motion.div
        className={`absolute border-2 ${colors[itemType]} rounded-full opacity-50`}
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ width: 0, height: 0 }}
        animate={{
          width: '60px',
          height: '60px',
          opacity: [0.5, 0],
        }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />
    </motion.div>
  );
};

// 레벨업/티어업 피드백
export const TierUpFeedback = ({
  row,
  col,
  fromTier,
  toTier,
  onComplete,
}: {
  row: number;
  col: number;
  fromTier: number;
  toTier: number;
  onComplete: () => void;
}) => {
  const gridCellSize = 100 / GRID_SIZE;
  const posX = (col + 0.5) * gridCellSize;
  const posY = (row + 0.5) * gridCellSize;

  const tierColors = {
    1: 'text-gray-400',
    2: 'text-yellow-400',
    3: 'text-purple-400',
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 업그레이드 표시 */}
      <motion.div
        className="absolute flex items-center gap-1 text-sm font-bold drop-shadow-lg"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        }}
        initial={{ scale: 0, y: 20 }}
        animate={{
          scale: [0, 1.2, 1],
          y: [20, -10, -25],
        }}
        transition={{ duration: 0.7 }}
        onAnimationComplete={onComplete}
      >
        <span className={tierColors[fromTier as keyof typeof tierColors]}>★{fromTier}</span>
        <span className="text-white">→</span>
        <span className={tierColors[toTier as keyof typeof tierColors]}>★{toTier}</span>
      </motion.div>

      {/* 반짝거리는 효과 */}
      <motion.div
        className="absolute w-8 h-8 bg-yellow-200 rounded-full opacity-70"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 2, 0],
          opacity: [0.7, 0.3, 0],
        }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
    </motion.div>
  );
};

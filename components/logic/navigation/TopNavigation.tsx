import { motion } from 'framer-motion';
import Image from 'next/image';

import { useLevel } from '@/hooks/useLevel';

export interface TopNavigationProps {
  name: string;
  gameMoney: number;
  gem: number;
  profileImage: string;
}

export const TopNavigation = ({ name, gem, profileImage }: TopNavigationProps) => {
  // 실시간 레벨 정보 가져오기
  const { data: levelInfo } = useLevel();

  // 프로그레스바용 진행률 계산 (0-100%)
  const progressPercent = levelInfo?.progressToNext ? Math.round(levelInfo.progressToNext * 100) : 0;

  return (
    <div className="flex justify-between items-center gap-4 px-4 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={profileImage || '/plants/sunflower.png'}
            alt="Player Avatar"
            width={48}
            height={48}
            className="rounded-full border-2 border-purple-400 shadow-lg"
          />
          {levelInfo?.level && (
            <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {levelInfo.level}
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <p className="text-white font-medium">{name}</p>
          <div className="bg-gray-700/50 h-1.5 rounded-full w-20 mt-1">
            <motion.div
              className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm border border-purple-400/50 rounded-lg shadow-lg">
          <Image src="/icons/gem.png" alt="Gem" width={48} height={48} className="absolute -left-5 drop-shadow" />
          <span className="min-w-16 ml-3 px-3 py-1 text-center text-white text-lg font-semibold drop-shadow">
            {gem.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

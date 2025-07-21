import { motion } from 'framer-motion';
import Image from 'next/image';

import { LevelProgressBar } from '@/components/logic/level/LevelProgressBar';

export interface TopNavigationProps {
  name: string;
  level: number;
  exp?: number;
  expRequiredForNext?: number;
  skillPoints?: number;
  gameMoney: number;
  gem: number;
  profileImage: string;
}

export const TopNavigation = ({
  name,
  level,
  exp,
  expRequiredForNext,
  skillPoints,
  gem,
  profileImage,
}: TopNavigationProps) => {
  return (
    <div className="flex justify-between items-center gap-4 px-4 pt-4 pb-2">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <motion.div
          className="relative flex-shrink-0"
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
          <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {level}
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{name}</p>
          {exp !== undefined && expRequiredForNext !== undefined && (
            <LevelProgressBar
              currentLevel={level}
              currentExp={exp}
              expRequiredForNext={expRequiredForNext}
              skillPoints={skillPoints || 0}
              compact={true}
            />
          )}
        </div>
      </div>
      <div className="relative flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm border border-purple-400/50 rounded-lg shadow-lg">
        <Image src="/icons/gem.png" alt="Gem" width={48} height={48} className="absolute -left-5 drop-shadow" />
        <span className="min-w-16 ml-3 px-3 py-1 text-center text-white text-lg font-semibold drop-shadow">
          {gem.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

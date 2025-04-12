import { motion } from 'framer-motion';
import { Coins, Droplet, Star } from 'lucide-react';
import Image from 'next/image';
import { createElement, ElementType } from 'react';

import { formatNumber } from '@/utils/format-helper';

export interface TopNavigationProps {
  name: string;
  level: number;
  energy: number;
  gameMoney: number;
  gems: number;
}

export const TopNavigation = ({ name, level, energy, gameMoney, gems }: TopNavigationProps) => {
  return (
    <div className="grid grid-cols-[auto_1fr] justify-between items-center gap-4 px-4 pt-4 pb-2">
      <div className="flex items-center gap-3">
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src="/preview/cells/corn.png"
            alt="Player Avatar"
            width={32}
            height={32}
            className="rounded-full border-2 border-purple-400 shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {level}
          </div>
        </motion.div>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <p className="text-white text-xs font-medium">{name}</p>
          <div className="bg-gray-700/50 h-1.5 rounded-full w-20 mt-1">
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full w-[65%]"></div>
          </div>
        </motion.div>
      </div>
      <motion.div
        className="grid grid-cols-3 justify-center text-right"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AssetCard icon={Droplet} color="cyan" value={energy} />
        <AssetCard icon={Coins} color="yellow" value={gameMoney} />
        <AssetCard icon={Star} color="purple" value={gems} />
      </motion.div>
    </div>
  );
};

export const AssetCard = ({ icon, color, value }: { icon: ElementType; color: string; value: number }) => {
  return (
    <div className="flex justify-between items-center gap-1.5 bg-gray-800/50 backdrop-blur-md px-1 py-0.5 rounded-full shadow-lg">
      {createElement(icon, { className: `text-${color}-400 w-4 h-4` })}
      <span className="text-white text-sm font-medium">{formatNumber(value)}</span>
    </div>
  );
};

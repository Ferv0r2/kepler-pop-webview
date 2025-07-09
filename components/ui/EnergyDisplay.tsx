'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { useDropletStatus } from '@/hooks/useUser';
import { ENERGY_CONSUME_AMOUNT, ENERGY_MAX } from '@/screens/GameView/constants/game-config';

export const EnergyDisplay = () => {
  const { data: dropletStatus, isLoading } = useDropletStatus();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!dropletStatus?.nextChargeAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimeRemaining = () => {
      const now = Date.now();
      const nextCharge = dropletStatus.nextChargeAt!;
      const remaining = Math.max(0, nextCharge - now);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [dropletStatus?.nextChargeAt]);

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getEnergyPercentage = (): number => {
    if (!dropletStatus) return 0;
    return (dropletStatus.droplet / ENERGY_MAX) * 100;
  };

  const isFull = (dropletStatus?.droplet || 0) >= ENERGY_MAX;
  const isLow = dropletStatus && dropletStatus.droplet < ENERGY_CONSUME_AMOUNT;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
        <div className="w-4 h-4 bg-white/20 rounded animate-pulse" />
        <div className="w-16 h-4 bg-white/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      className={`flex items-center w-full gap-2 backdrop-blur-sm px-3 py-2 rounded-lg border transition-all duration-300 ${
        isFull
          ? 'bg-yellow-500/20 border-yellow-400/30 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
          : isLow
            ? 'bg-red-500/20 border-red-400/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
            : 'bg-blue-500/20 border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={isLow ? { rotate: [0, -10, 10, 0] } : {}}
        transition={isLow ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 } : {}}
      >
        <Image src="/icons/droplet.png" alt="droplet" width={28} height={28} />
      </motion.div>

      <div className="flex items-center gap-1">
        <span className={`font-medium text-xl ${isFull ? 'text-yellow-300' : isLow ? 'text-red-300' : 'text-white'}`}>
          {dropletStatus?.droplet || 0}
        </span>
        <span className="text-white/60">/</span>
        <span className="text-white/60">{ENERGY_MAX}</span>
      </div>

      {!isFull && timeRemaining !== null && (
        <div className="flex items-center gap-1 ml-2">
          <Clock className="w-4 h-4 text-white/60" />
          <span className="text-white/60 text-sm font-mono">{formatTimeRemaining(timeRemaining)}</span>
        </div>
      )}

      {/* 에너지 바 */}
      <div className="ml-2 flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isFull
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
              : isLow
                ? 'bg-gradient-to-r from-red-400 to-pink-400'
                : 'bg-gradient-to-r from-blue-400 to-cyan-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${getEnergyPercentage()}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

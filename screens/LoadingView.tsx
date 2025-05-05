'use client';

import { motion } from 'framer-motion';
import { Heart, Zap, Sparkles, Star, Diamond, Gem } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';

import {
  DEFAULT_LOADING_TIME_MS,
  LOADING_MESSAGE_INTERVAL_MS,
  LOADING_COMPLETE_DELAY_MS,
  LOADING_ANIMATION_DURATION,
  LOADING_TEXT_ANIMATION_DURATION,
  LOADING_DOTS_ANIMATION_DURATION,
  LOADING_TILE_ANIMATION_DURATION,
  LOADING_TILE_ANIMATION_DELAY,
  LOADING_ANIMATION_DELAYS,
} from '@/constants/game-config';

interface LoadingScreenProps {
  onLoadComplete?: () => void;
  minLoadingTime?: number; // Minimum time to show loading screen in ms
}

export const LoadingView = ({ onLoadComplete, minLoadingTime = DEFAULT_LOADING_TIME_MS }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading game assets');
  const t = useTranslations();

  // Array of loading messages to cycle through
  const loadingMessages = useMemo(
    () => [
      t('loading.messages.loadingAssets'),
      t('loading.messages.preparingTiles'),
      t('loading.messages.generatingPuzzles'),
      t('loading.messages.polishingGems'),
      t('loading.messages.almostReady'),
    ],
    [t],
  );

  // Icons for the loading animation
  const icons = [
    { icon: Heart, color: 'from-rose-400 to-rose-600' },
    { icon: Zap, color: 'from-cyan-400 to-cyan-600' },
    { icon: Sparkles, color: 'from-emerald-400 to-emerald-600' },
    { icon: Star, color: 'from-amber-400 to-amber-600' },
    { icon: Diamond, color: 'from-violet-400 to-violet-600' },
    { icon: Gem, color: 'from-fuchsia-400 to-fuchsia-600' },
  ];

  useEffect(() => {
    const startTime = Date.now();
    let animationFrame: number;

    // Simulate loading progress
    const simulateLoading = () => {
      setProgress((prevProgress) => {
        // Calculate how much time has passed as a percentage of minLoadingTime
        const timeProgress = Math.min(100, ((Date.now() - startTime) / minLoadingTime) * 100);

        // Ensure progress is at least as far as time progress, but not too fast
        const newProgress = Math.max(prevProgress + 0.5, timeProgress);

        if (newProgress >= 100) {
          cancelAnimationFrame(animationFrame);
          setTimeout(() => {
            onLoadComplete?.();
          }, LOADING_COMPLETE_DELAY_MS);
          return 100;
        }

        animationFrame = requestAnimationFrame(simulateLoading);
        return newProgress;
      });
    };

    // Start the loading simulation
    animationFrame = requestAnimationFrame(simulateLoading);

    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setLoadingText((prevText) => {
        const currentIndex = loadingMessages.indexOf(prevText);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, LOADING_MESSAGE_INTERVAL_MS);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(messageInterval);
    };
  }, [minLoadingTime, onLoadComplete, loadingMessages]);

  // Calculate how many tiles to fill based on progress
  const filledTiles = Math.floor((icons.length * progress) / 100);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: LOADING_ANIMATION_DURATION }}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-60 h-60 rounded-full bg-pink-500/20 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Game title */}
      <motion.h1
        className="text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 font-game"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: LOADING_ANIMATION_DELAYS.TITLE, duration: LOADING_ANIMATION_DURATION }}
      >
        Kepler Pop
      </motion.h1>

      {/* Creative loading indicator using game tiles */}
      <div className="relative mb-12">
        <motion.div
          className="flex gap-3 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: LOADING_ANIMATION_DELAYS.TILES, duration: LOADING_ANIMATION_DURATION }}
        >
          {icons.map((item, index) => (
            <motion.div
              key={index}
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                index < filledTiles ? `bg-gradient-to-br ${item.color}` : 'bg-slate-800/50 border border-slate-700/50'
              }`}
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: index < filledTiles ? [0, 180, 360] : 0,
                scale: index < filledTiles ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: LOADING_TILE_ANIMATION_DURATION,
                delay: index * LOADING_TILE_ANIMATION_DELAY,
                repeat: index < filledTiles ? 0 : 0,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
            >
              {index < filledTiles ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>
              ) : (
                <div className="w-8 h-8 rounded-md bg-slate-700/30"></div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Numeric progress indicator */}
        <motion.div
          className="text-center text-white/80 text-lg font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: LOADING_ANIMATION_DELAYS.PROGRESS }}
        >
          {Math.round(progress)}%
        </motion.div>
      </div>

      {/* Loading text */}
      <motion.div
        className="text-white/60 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: LOADING_ANIMATION_DELAYS.TEXT }}
      >
        <motion.span
          key={loadingText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: LOADING_TEXT_ANIMATION_DURATION }}
        >
          {loadingText}
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: LOADING_DOTS_ANIMATION_DURATION,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'loop',
          }}
        >
          ...
        </motion.span>
      </motion.div>

      {/* Tips carousel */}
      <motion.div
        className="absolute bottom-12 left-0 right-0 text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: LOADING_ANIMATION_DELAYS.TIPS }}
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto border border-white/10">
          <div className="text-yellow-300 text-sm font-medium mb-2">{t('loading.tip')}</div>
          <p className="text-white/80 text-sm">{t('loading.challengeTip')}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { createElement, ElementType } from 'react';

import { Button } from '@/components/ui/button';
import { tileConfig } from '@/constants/tile-config';
import type { GameMode } from '@/types/game-types';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNextStep: () => void;
  currentStep: number;
  gameMode: GameMode;
  gameItems: {
    id: string;
    icon: ElementType;
    name: string;
  }[];
}

export const TutorialDialog = ({
  isOpen,
  onClose,
  onNextStep,
  currentStep,
  gameMode,
  gameItems,
}: TutorialDialogProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 border border-indigo-400/30 rounded-2xl p-6 w-[90%] max-w-md shadow-[0_0_25px_rgba(99,102,241,0.3)]"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
            How to Play
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-white/80" />
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-black/30 p-4 mb-4">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center"
            >
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-lg ${
                      tileConfig[i as keyof typeof tileConfig].bgColor[1]
                    } flex items-center justify-center`}
                  >
                    {createElement(tileConfig[i as keyof typeof tileConfig].icon[1], {
                      className: 'w-6 h-6 text-white',
                    })}
                  </div>
                ))}
              </div>
              <p className="text-white text-center mb-2">
                Swap adjacent tiles to create matches of 3 or more identical tiles.
              </p>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center"
            >
              <div className="flex gap-2 mb-4">
                {gameItems.map((item, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"
                  >
                    {createElement(item.icon, { className: 'w-6 h-6 text-white' })}
                  </div>
                ))}
              </div>
              <p className="text-white text-center mb-2">
                Use special items to clear tiles and create powerful combos.
              </p>
              <p className="text-white/70 text-sm text-center">
                Select an item, then tap a tile to activate its effect.
              </p>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center"
            >
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  </div>
                  <p className="text-white/70 text-xs">Casual</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-1">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white/70 text-xs">Challenge</p>
                </div>
              </div>
              <p className="text-white text-center mb-2">
                {gameMode === 'casual'
                  ? 'In Casual mode, you can play freely. No leaderboards, no pressure to win!'
                  : 'In Challenge mode, the tile tiers increase, and you can compete with other players on the leaderboard!'}
              </p>
              <p className="text-white/70 text-sm text-center">
                {gameMode === 'challenge' && 'Matching tiles with higher tiers will earn you a higher score.'}
              </p>
            </motion.div>
          )}
        </div>

        <div className="flex justify-between">
          <div className="flex space-x-1">
            {[1, 2, 3].map((step) => (
              <div key={step} className={`w-2 h-2 rounded-full ${currentStep === step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <Button
            onClick={onNextStep}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            {currentStep < 3 ? 'Next' : 'Start Playing'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { X, Home, RefreshCw, MousePointer, Hand } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { TileSwapMode } from '@/types/game-types';

interface SettingsMenuProps {
  isOpen: boolean;
  tileSwapMode: TileSwapMode;
  onClose: () => void;
  onRestart: () => void;
  onShowTutorial: () => void;
  onShowBackConfirmation: () => void;
  onChangeTileSwapMode: (mode: TileSwapMode) => void;
}

export const SettingsMenu = ({
  isOpen,
  tileSwapMode,
  onChangeTileSwapMode,
  onClose,
  onRestart,
  onShowTutorial,
  onShowBackConfirmation,
}: SettingsMenuProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-lg bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 border border-indigo-400/30 rounded-2xl p-6 w-[320px] shadow-[0_0_25px_rgba(99,102,241,0.3)]"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
            Settings
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

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-white/80 font-medium">Swap Mode</h4>
            <div className="flex gap-2">
              <Button
                variant={tileSwapMode === 'drag' ? 'default' : 'outline'}
                className={`border-none flex-1 flex items-center justify-center gap-2 ${
                  tileSwapMode === 'drag' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''
                }`}
                onClick={() => onChangeTileSwapMode('drag')}
              >
                <Hand className="h-4 w-4" />
                <span>Drag</span>
              </Button>
              <Button
                variant={tileSwapMode === 'select' ? 'default' : 'outline'}
                className={`border-none flex-1 flex items-center justify-center gap-2 ${
                  tileSwapMode === 'select' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''
                }`}
                onClick={() => onChangeTileSwapMode('select')}
              >
                <MousePointer className="h-4 w-4" />
                <span>Select</span>
              </Button>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="w-full flex justify-start gap-3 rounded-xl py-4 bg-gradient-to-r from-slate-800/40 to-purple-800/40 hover:from-slate-700/40 hover:to-purple-700/40 border-indigo-500/30 text-white"
              onClick={() => {
                onClose();
                onShowBackConfirmation();
              }}
            >
              <Home className="h-5 w-5 text-blue-300" />
              <span>Return to Home</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="w-full flex justify-start gap-3 rounded-xl py-4 bg-gradient-to-r from-slate-800/40 to-purple-800/40 hover:from-slate-700/40 hover:to-purple-700/40 border-indigo-500/30 text-white"
              onClick={() => {
                onClose();
                onRestart();
              }}
            >
              <RefreshCw className="h-5 w-5 text-green-300" />
              <span>Restart Game</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="w-full flex justify-start gap-3 rounded-xl py-4 bg-gradient-to-r from-slate-800/40 to-purple-800/40 hover:from-slate-700/40 hover:to-purple-700/40 border-indigo-500/30 text-white"
              onClick={() => {
                onClose();
                onShowTutorial();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-amber-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>How to Play</span>
            </Button>
          </motion.div>

          <div className="mt-6 pt-4 border-t border-indigo-500/30">
            <p className="text-center text-sm text-white/60 mb-2">Kepler Pop v1.0</p>
            <p className="text-center text-xs text-white/40">© 2025 Ferv0r2Labs</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

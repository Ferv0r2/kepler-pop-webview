'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Flame, Play } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { createElement } from 'react';

import { Button } from '@/components/ui/button';
import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GameMode } from '@/types/game-types';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  currentStep: number;
  gameMode: GameMode;
  gameItems: {
    id: string;
    icon: string;
    name: string;
  }[];
}

export const TutorialDialog = ({
  isOpen,
  onClose,
  onPrevStep,
  onNextStep,
  currentStep,
  gameMode,
  gameItems,
}: TutorialDialogProps) => {
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cosmic background with animated stars */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl">
        <div className="absolute inset-0 opacity-40">
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 4,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        className="relative bg-gradient-to-br from-slate-950/95 via-indigo-950/90 to-purple-950/95 border border-indigo-400/40 rounded-3xl p-8 w-[90%] max-w-lg shadow-[0_0_40px_rgba(99,102,241,0.4)] backdrop-blur-xl"
        initial={{ scale: 0.8, y: 50, opacity: 0, rotateX: -15 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
          duration: 0.5,
        }}
      >
        {/* Orbital rings decoration */}
        <div className="absolute -inset-6 opacity-20 pointer-events-none">
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-purple-400/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 35, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{t('tutorial.title')}</h3>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-200 relative z-20"
          >
            <X className="h-5 w-5 text-white/80" />
          </Button>
        </div>

        {/* Content area with cosmic glow */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/40 to-indigo-950/40 border border-white/10 p-6 mb-6 backdrop-blur-sm">
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-purple-500/5 rounded-2xl pointer-events-none" />

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" className="flex flex-col items-center relative z-10">
                <motion.div
                  className="flex gap-3 mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, staggerChildren: 0.1 }}
                >
                  {[1, 2, 3].map((i, index) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, type: 'spring', damping: 15 }}
                      className={`w-12 h-12 rounded-xl ${
                        tileConfig[i as keyof typeof tileConfig].bgColor[1]
                      } flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm`}
                    >
                      {createElement(tileConfig[i as keyof typeof tileConfig].icon[1], {
                        className: 'w-7 h-7 text-white',
                      })}
                    </motion.div>
                  ))}
                </motion.div>
                <motion.p
                  className="text-white text-center text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {t('tutorial.step1.description')}
                </motion.p>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" className="flex flex-col items-center relative z-10">
                <motion.div
                  className="flex gap-3 mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {gameItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, type: 'spring', damping: 15 }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm"
                    >
                      <Image src={item.icon || '/placeholder.svg'} alt={item.name} width={36} height={36} />
                    </motion.div>
                  ))}
                </motion.div>
                <motion.p
                  className="text-white text-center text-lg mb-3 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {t('tutorial.step2.description')}
                </motion.p>
                <motion.p
                  className="text-cyan-300 text-sm text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {t('tutorial.step2.instruction')}
                </motion.p>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" className="flex flex-col items-center relative z-10">
                <motion.div
                  className="flex gap-6 mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/80 to-cyan-600/80 flex items-center justify-center mb-2 shadow-lg border border-blue-400/30">
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-blue-300 text-xs font-medium">{t('game.modes.casual')}</p>
                  </motion.div>
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: 'spring', damping: 15 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/80 to-orange-600/80 flex items-center justify-center mb-2 shadow-lg border border-amber-400/30">
                      <Flame className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-amber-300 text-xs font-medium">{t('game.modes.challenge')}</p>
                  </motion.div>
                </motion.div>
                <motion.p
                  className="text-white text-center text-lg mb-3 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {gameMode === 'casual'
                    ? t('tutorial.step3.casual.description')
                    : t('tutorial.step3.challenge.description')}
                </motion.p>
                {gameMode === 'challenge' && (
                  <motion.p
                    className="text-orange-300 text-sm text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {t('tutorial.step3.challenge.instruction')}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center relative z-20">
          {/* Progress indicators - orbital style */}
          <motion.div
            className="flex space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                    : 'bg-white/20 border border-white/30'
                }`}
                animate={currentStep === step ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                {currentStep === step && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="flex space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            {currentStep > 1 && (
              <Button
                onClick={onPrevStep}
                className="bg-gradient-to-r from-slate-600/80 to-slate-700/80 hover:from-slate-500/80 hover:to-slate-600/80 text-white border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm relative z-30"
              >
                {t('modal.previous')}
              </Button>
            )}
            <Button
              onClick={onNextStep}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all duration-200 relative z-30"
            >
              {currentStep < 3 ? t('modal.next') : t('modal.startPlaying')}
            </Button>
          </motion.div>
        </div>

        {/* Subtle glow overlay - moved to bottom and made non-interactive */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

import { motion, useReducedMotion } from 'framer-motion';
import { RouteOff, Shuffle, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { TileType, TierType } from '@/types/game-types';

import { TUTORIAL_TOTAL_STEP } from '../constants/game-config';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  currentStep: number;
  gameItems: {
    id: string;
    icon: string;
  }[];
}

// 별 컴포넌트 분리
const StarField = ({ count = 20 }: { count?: number }) => {
  const shouldReduceMotion = useReducedMotion();

  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
      })),
    [count],
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 opacity-20">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: star.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 회전 링 컴포넌트 분리
const RotatingRings = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute -inset-4 opacity-15 pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-full border border-white/30"
        animate={{ rotate: 360 }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute inset-3 rounded-full border border-white/20"
        animate={{ rotate: -360 }}
        transition={{
          duration: 35,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute inset-6 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{
          duration: 45,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export const TutorialDialog = ({
  isOpen,
  onClose,
  onPrevStep,
  onNextStep,
  currentStep,
  gameItems,
}: TutorialDialogProps) => {
  const t = useTranslations();
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 개선된 오버레이 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/80 backdrop-blur-lg"
        initial={{ backdropFilter: 'blur(0px)' }}
        animate={{ backdropFilter: 'blur(12px)' }}
        exit={{ backdropFilter: 'blur(0px)' }}
      >
        <StarField count={shouldReduceMotion ? 10 : 25} />
      </motion.div>

      {/* 메인 모달 */}
      <motion.div
        className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-blue-900/98 rounded-3xl p-8 w-full max-w-lg border border-blue-400/20 shadow-[0_0_40px_rgba(99,102,241,0.4)] backdrop-blur-xl"
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 30, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
          opacity: { duration: 0.3 },
        }}
      >
        <RotatingRings />

        {/* 컨텐츠 영역 */}
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {t('tutorial.title')}
              </h3>
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

          <div className="relative overflow-hidden rounded-2xl bg-black/30 p-6 mb-6 border border-white/10">
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
                      key={`tutorial-tile-${i}`}
                      className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border"
                    >
                      <Image
                        src={tileConfig[i as TileType]?.images?.[1] || '/plants/tulip-tile-3.png'}
                        alt={`Tile ${i}`}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  ))}
                </div>
                <p className="text-white text-center mb-2">{t('tutorial.step1.description')}</p>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center"
              >
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    {[1, 2, 3].map((tier) => (
                      <div key={`tutorial-tier-${tier}`} className="flex flex-col items-center gap-2">
                        <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                          <Image
                            src={tileConfig[3]?.images?.[tier as TierType] || `/plants/tulip-tile-${tier}.png`}
                            alt={`Tier ${tier}`}
                            fill
                            className="object-cover"
                            priority
                          />
                          {/* Tier 테두리 효과 */}
                          {tier === 1 && <div className="absolute inset-0 rounded-lg border border-gray-300" />}
                          {tier === 2 && (
                            <div className="absolute inset-0 rounded-lg border-2 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                          )}
                          {tier === 3 && (
                            <div className="absolute inset-0 rounded-lg border-transparent bg-gradient-to-br from-pink-500 via-violet-500 to-amber-500 p-[2px]">
                              <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden relative">
                                <Image
                                  src={tileConfig[3]?.images?.[tier as TierType] || `/plants/sprout-tile-${tier}.png`}
                                  alt={`Tier ${tier}`}
                                  fill
                                  className="object-cover scale-105"
                                  priority
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-white/70 text-xs">{t(`tutorial.step2.tier_${tier}`)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-white text-center mb-2">{t('tutorial.step2.description')}</p>
                <p className="text-white/70 text-sm text-center">{t('tutorial.step2.instruction')}</p>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center"
              >
                <div className="flex gap-2 mb-4">
                  {['🌱', '🍃', '🌿'].map((item, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 text-xl rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <p className="text-white text-center mb-2">{t('tutorial.step3.description')}</p>
                <p className="text-white/70 text-sm text-center">{t('tutorial.step3.instruction')}</p>
              </motion.div>
            )}

            {currentStep === 4 && (
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
                      className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center"
                    >
                      <Image src={item.icon} alt={t(`game.items.${item.id}`)} width={32} height={32} />
                    </div>
                  ))}
                </div>
                <p className="text-white text-center mb-2">{t('tutorial.step4.description')}</p>
                <p className="text-white/70 text-sm text-center">{t('tutorial.step4.instruction')}</p>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center"
              >
                <div className="flex gap-2 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <RouteOff className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Shuffle className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <p className="text-white text-center mb-2">{t('tutorial.step5.description')}</p>
                <p className="text-white/70 text-sm text-center">{t('tutorial.step5.instruction')}</p>
              </motion.div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="flex space-x-1">
              {Array.from({ length: TUTORIAL_TOTAL_STEP }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${currentStep === step ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
            <div className="flex space-x-2">
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
                {currentStep < TUTORIAL_TOTAL_STEP ? t('modal.next') : t('modal.startPlaying')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

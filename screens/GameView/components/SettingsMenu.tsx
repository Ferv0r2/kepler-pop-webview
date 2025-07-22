import { motion, useReducedMotion } from 'framer-motion';
import { X, Home, RefreshCw, MousePointer, Hand, HelpCircle, Settings } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
// import { useSound } from '@/hooks/useSound';
import { useUser } from '@/hooks/useUser';
import type { TileSwapMode } from '@/types/game-types';

import { ENERGY_CONSUME_AMOUNT } from '../constants/game-config';

interface SettingsMenuProps {
  isOpen: boolean;
  tileSwapMode: TileSwapMode;
  onClose: () => void;
  onShowTutorial: () => void;
  onShowBackConfirmation: () => void;
  onChangeTileSwapMode: (mode: TileSwapMode) => void;
  onShowRestartConfirmation: () => void;
  onShowEnergyModal: () => void;
}

// 별 컴포넌트 분리
const StarField = ({ count = 15 }: { count?: number }) => {
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

export const SettingsMenu = ({
  isOpen,
  tileSwapMode,
  onChangeTileSwapMode,
  onClose,
  onShowTutorial,
  onShowBackConfirmation,
  onShowRestartConfirmation,
  onShowEnergyModal,
}: SettingsMenuProps) => {
  const t = useTranslations();
  const { data: userInfo } = useUser();
  const shouldReduceMotion = useReducedMotion();
  // const { settings: soundSettings, toggleSound, setVolume } = useSound();

  if (!isOpen) return null;

  const handleRestartClick = () => {
    onClose();

    // 에너지가 부족한 경우 에너지 모달 표시
    if (!userInfo || userInfo.droplet <= 0) {
      onShowEnergyModal();
      return;
    }

    // 에너지가 충분한 경우 다시하기 확인 모달 표시
    onShowRestartConfirmation();
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* 개선된 오버레이 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/80 backdrop-blur-lg"
        initial={{ backdropFilter: 'blur(0px)' }}
        animate={{ backdropFilter: 'blur(12px)' }}
        exit={{ backdropFilter: 'blur(0px)' }}
      >
        <StarField count={shouldReduceMotion ? 8 : 15} />
      </motion.div>

      {/* 메인 모달 */}
      <motion.div
        className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-blue-900/98 rounded-3xl p-6 w-full max-w-sm border border-blue-400/20 shadow-[0_0_40px_rgba(99,102,241,0.3)] backdrop-blur-xl"
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 30, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
          opacity: { duration: 0.3 },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <RotatingRings />

        {/* 컨텐츠 영역 */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-sm">
                <Settings className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {t('modal.settings')}
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

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-white/80 font-medium">{t('modal.tileSwapMode')}</h4>
              <div className="flex gap-2">
                <Button
                  variant={tileSwapMode === 'drag' ? 'default' : 'outline'}
                  className={`border-none flex-1 flex items-center justify-center gap-2 ${
                    tileSwapMode === 'drag' ? 'bg-gradient-to-r from-cyan-500 to-purple-600' : ''
                  }`}
                  onClick={() => onChangeTileSwapMode('drag')}
                >
                  <Hand className="h-4 w-4" />
                  <span>{t('modal.drag')}</span>
                </Button>
                <Button
                  variant={tileSwapMode === 'select' ? 'default' : 'outline'}
                  className={`border-none flex-1 flex items-center justify-center gap-2 ${
                    tileSwapMode === 'select' ? 'bg-gradient-to-r from-cyan-500 to-purple-600' : ''
                  }`}
                  onClick={() => onChangeTileSwapMode('select')}
                >
                  <MousePointer className="h-4 w-4" />
                  <span>{t('modal.select')}</span>
                </Button>
              </div>
            </div>

            {/* TODO: 효과음 설정 추가 필요 */}
            {/* <div className="space-y-2">
              <h4 className="text-white/80 font-medium">{t('modal.effects')}</h4>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSound}
                  className={`border-indigo-500/30 ${
                    soundSettings.enabled
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300'
                      : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300'
                  }`}
                >
                  {soundSettings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundSettings.volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    disabled={!soundSettings.enabled}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      soundSettings.enabled
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    style={{
                      background: soundSettings.enabled
                        ? `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${soundSettings.volume * 100}%, rgb(75, 85, 99) ${soundSettings.volume * 100}%, rgb(75, 85, 99) 100%)`
                        : 'rgb(75, 85, 99)',
                    }}
                  />
                </div>
                <span className="text-white/60 text-sm w-8 text-center">{Math.round(soundSettings.volume * 100)}%</span>
              </div>
            </div> */}

            <div className="mt-6 pt-4 border-t border-slate-600/80"></div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className={`w-full flex justify-start gap-3 rounded-lg py-5 border-indigo-500/30 text-white ${
                  !userInfo || userInfo.droplet <= 0
                    ? 'bg-gradient-to-r from-slate-700/40 to-slate-800/40 opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-slate-800/40 to-purple-800/40 hover:from-slate-700/40 hover:to-purple-700/40'
                }`}
                onClick={handleRestartClick}
                disabled={!userInfo || userInfo.droplet <= 0}
              >
                <RefreshCw
                  className={`h-5 w-5 ${!userInfo || userInfo.droplet <= 0 ? 'text-gray-400' : 'text-green-300'}`}
                />
                <span>{t('game.restart')}</span>
                <div className="flex items-center ml-auto">
                  <Image
                    src="/icons/droplet.png"
                    alt="droplet"
                    width={24}
                    height={24}
                    className={`${!userInfo || userInfo.droplet < ENERGY_CONSUME_AMOUNT ? 'text-gray-400' : 'text-cyan-300'}`}
                  />
                  <span
                    className={`mt-1 font-medium text-md ${!userInfo || userInfo.droplet < ENERGY_CONSUME_AMOUNT ? 'text-gray-400' : 'text-cyan-300'}`}
                  >
                    {`x${ENERGY_CONSUME_AMOUNT}`}
                  </span>
                </div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full flex justify-start gap-3 rounded-lg py-5 bg-gradient-to-r from-slate-800/40 to-purple-800/40 hover:from-slate-700/40 hover:to-purple-700/40 border-indigo-500/30 text-white"
                onClick={() => {
                  onClose();
                  onShowBackConfirmation();
                }}
              >
                <Home className="h-5 w-5 text-blue-300" />
                <span>{t('game.returnToHome')}</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full flex justify-start gap-3 rounded-lg py-5 bg-gradient-to-r from-slate-800/40 to-purple-800/40 hover:from-slate-700/40 hover:to-purple-700/40 border-indigo-500/30 text-white"
                onClick={() => {
                  onClose();
                  onShowTutorial();
                }}
              >
                <HelpCircle className="h-5 w-5 text-amber-300" />
                <span>{t('modal.help')}</span>
              </Button>
            </motion.div>

            <div className="mt-6 pt-4 border-t border-slate-600/80">
              <p className="text-center text-sm text-white/60 mb-2">Kepler Pop</p>
              <p className="text-center text-xs text-white/40">© 2025 Ferv0r2Labs</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

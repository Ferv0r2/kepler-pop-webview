'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Calendar, Trophy, Gift, ChevronRight, Flame } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';

import { EnergyModal } from '@/components/logic/dialogs/EnergyModal';
import { ExitModal } from '@/components/logic/dialogs/ExitModal';
import { BottomNavigation } from '@/components/logic/navigation/BottomNavigation';
import { SideNavigation } from '@/components/logic/navigation/SideNavigation';
import { TopNavigation } from '@/components/logic/navigation/TopNavigation';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { useSound } from '@/hooks/useSound';
import { useUser } from '@/hooks/useUser';
import { useRouter } from '@/i18n/routing';
import { updateDroplet } from '@/networks/KeplerBackend';
import { NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';
import type { NativeToWebMessage, EnergyChangePayload } from '@/types/native-call';
import { containerVariants, itemVariants } from '@/utils/animation-helper';
import { playButtonSound } from '@/utils/sound-helper';

import { LoadingView } from './LoadingView/LoadingView';

const useUpdateDroplet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDroplet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const MainView = () => {
  const router = useRouter();
  const { data: userInfo, isLoading } = useUser();
  const { isInWebView, sendMessage, addMessageHandler } = useWebViewBridgeContext();
  const t = useTranslations();

  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const updateDropletMutation = useUpdateDroplet();

  const { settings: soundSettings } = useSound();

  // 각 모드의 최고점수 계산
  const highScores = useMemo(() => {
    if (!userInfo?.scores) return { casual: 0, challenge: 0 };

    const casualScore = userInfo.scores.find((score) => score.mode === 'casual')?.score || 0;
    const challengeScore = userInfo.scores.find((score) => score.mode === 'challenge')?.score || 0;

    return { casual: casualScore, challenge: challengeScore };
  }, [userInfo?.scores]);

  useEffect(() => {
    if (isInWebView) {
      sendMessage({
        type: WebToNativeMessageType.WEB_APP_READY,
        payload: { timestamp: new Date().toISOString() },
      });
    }
    const unsubscribeBackState = addMessageHandler(NativeToWebMessageType.CAN_BACK_STATE, () => {
      if (!showExitModal) {
        setShowExitModal(true);
        return;
      }
      sendMessage({ type: WebToNativeMessageType.EXIT_ACTION });
      setShowExitModal(false);
    });

    const unsubscribeEnergyChange = addMessageHandler<NativeToWebMessage<EnergyChangePayload>>(
      NativeToWebMessageType.ENERGY_CHANGE,
      async (msg) => {
        const payload = msg.payload;
        try {
          if (payload?.status === 'success') {
            updateDropletMutation.mutate(payload.amount);
          }
        } catch (e) {
          console.error('에너지 변경 실패:', e);
        }
      },
    );

    return () => {
      unsubscribeBackState();
      unsubscribeEnergyChange();
    };
  }, [isInWebView, sendMessage, addMessageHandler, showExitModal, updateDropletMutation]);

  if (!userInfo || isLoading) {
    return <LoadingView />;
  }

  const { name, level, droplet, gameMoney, gem, profileImage } = userInfo;

  const handleStartGame = async (mode: 'casual' | 'challenge') => {
    if (!userInfo || userInfo.droplet <= 0) {
      setShowEnergyModal(true);
      return;
    }

    playButtonSound(soundSettings);
    updateDropletMutation.mutate(-1, {
      onSuccess: () => {
        router.push(`/game?mode=${mode}`);
      },
    });
  };

  const handleWatchAd = async () => {
    if (isLoading || !userInfo) return;
    sendMessage({
      type: WebToNativeMessageType.ENERGY_CHANGE,
      payload: { amount: 1, reason: 'ad' },
    });
    setShowEnergyModal(false);
  };

  const handlePurchase = async () => {
    if (isLoading || !userInfo) return;
    sendMessage({
      type: WebToNativeMessageType.ENERGY_CHANGE,
      payload: { amount: 5, reason: 'purchase' },
    });
    setShowEnergyModal(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleExitConfirm = () => {
    sendMessage({ type: WebToNativeMessageType.EXIT_ACTION });
    setShowExitModal(false);
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-0 relative">
        <header className="sticky w-full left-0 top-0 z-10">
          <TopNavigation
            name={name}
            level={level}
            droplet={droplet}
            gameMoney={gameMoney}
            gem={gem}
            profileImage={profileImage || '/plants/sprout.png'}
          />
        </header>

        <main className="flex-1 flex flex-col mt-16 px-4 py-2 overflow-hidden">
          {/* Game Logo and Title */}
          <motion.div
            className="flex flex-col items-center justify-center mb-6 mt-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="relative w-28 h-28 mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full animate-pulse"></div>
              <div
                className="absolute inset-2 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full animate-pulse"
                style={{ animationDelay: '0.5s' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/icons/logo.png"
                  alt="Game Logo"
                  className="rounded-full object-cover"
                  fill
                  priority
                  sizes="112px"
                  quality={85}
                  loading="eager"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkMjU1LS0yMi4qLjg0PjU4Ojo4OjU4Ojo4Ojo4Ojo4Ojo4Ojo4Ojr/2wBDAR4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              </div>
            </div>
            <p className="text-gray-300 text-sm mt-1">{t('common.today')}</p>
          </motion.div>

          {/* Game Modes and Features */}
          <motion.div
            className="grid grid-cols-2 gap-3 mb-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="bg-gradient-to-br from-purple-900/60 to-indigo-900/60 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-purple-800/30"
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartGame('casual')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">{t('common.casualMode')}</h3>
                <Play className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-gray-300 text-sm mb-3">{t('common.casualDescription')}</p>
              {highScores.casual > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-medium">
                    {t('game.highScore')}: {highScores.casual.toLocaleString()}
                  </span>
                </div>
              )}
              <ul className="text-gray-400 text-xs space-y-1">
                <li>{t('common.casualFeature1')}</li>
                <li>{t('common.casualFeature2')}</li>
              </ul>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-amber-900/60 to-orange-900/60 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-amber-800/30"
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartGame('challenge')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">{t('common.challengeMode')}</h3>
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-gray-300 text-sm mb-3">{t('common.challengeDescription')}</p>
              {highScores.challenge > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-medium">
                    {t('game.highScore')}: {highScores.challenge.toLocaleString()}
                  </span>
                </div>
              )}
              <ul className="text-gray-400 text-xs space-y-1">
                <li>{t('common.challengeFeature1')}</li>
                <li>{t('common.challengeFeature2')}</li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Daily Rewards and Events */}
          <motion.div
            className="mb-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white font-bold text-sm">{t('common.eventsAndRewards')}</h2>
              <button className="text-gray-400 text-xs flex items-center" onClick={() => handleNavigation('/events')}>
                {t('common.more')} <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <motion.div
              className="bg-gradient-to-br from-pink-900/60 to-red-900/60 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-pink-800/30 mb-3"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation('/attendance')}
            >
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/30 p-2 rounded-lg">
                  <Calendar className="text-pink-300 w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">{t('common.todayAttendance')}</h3>
                  <p className="text-gray-300 text-xs">{t('common.attendanceDescription')}</p>
                </div>
                <div className="bg-pink-500/20 rounded-lg px-2 py-1">
                  <span className="text-pink-300 text-xs font-medium">{t('common.day5')}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-amber-900/60 to-orange-900/60 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-amber-800/30"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation('/events/special')}
            >
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/30 p-2 rounded-lg">
                  <Gift className="text-amber-300 w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-white font-bold text-sm">{t('common.specialEvent')}</h3>
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-2">
                      {t('common.new')}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs">{t('common.spaceExplorationEvent')}</p>
                </div>
                <div className="bg-amber-500/20 rounded-lg px-2 py-1">
                  <span className="text-amber-300 text-xs font-medium">{t('common.2DaysLeft')}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Friends Activity */}
          <motion.div
            className="mb-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white font-bold text-sm">{t('common.friendsActivity')}</h2>
              <button className="text-gray-400 text-xs flex items-center" onClick={() => handleNavigation('/friends')}>
                {t('common.more')} <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <div className="flex -space-x-2 mb-1">
              {['sunflower', 'tulip', 'mushroom', 'crystal-cactus'].map((plant, i) => (
                <motion.div
                  key={plant}
                  className="w-8 h-8 rounded-full border-2 border-gray-800 overflow-hidden"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <Image src={`/plants/${plant}.png`} alt={plant} width={50} height={50} priority />
                </motion.div>
              ))}
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-xs text-white font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
              >
                +3
              </motion.div>
            </div>
            <p className="text-gray-400 text-xs">{t('common.friendsPlaying')}</p>
          </motion.div>
        </main>

        <footer className="sticky left-0 bottom-0 z-10">
          <BottomNavigation />
        </footer>
      </div>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-40 h-40 rounded-full bg-purple-600/10 blur-3xl"></div>
        <div className="absolute top-[40%] right-[10%] w-60 h-60 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-[20%] left-[30%] w-80 h-80 rounded-full bg-pink-500/10 blur-3xl"></div>
      </div>
      <SideNavigation unreadMailCount={0} />
      <EnergyModal
        isOpen={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        onWatchAd={handleWatchAd}
        onPurchase={handlePurchase}
        isLoading={isLoading}
      />
      <ExitModal isOpen={showExitModal} onConfirm={handleExitConfirm} onCancel={handleExitCancel} />
    </>
  );
};

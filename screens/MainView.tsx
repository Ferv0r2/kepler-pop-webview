'use client';

import { motion } from 'framer-motion';
import { Play, Calendar, Trophy, Gift, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { EnergyModal } from '@/components/logic/dialogs/EnergyModal';
import { ExitModal } from '@/components/logic/dialogs/ExitModal';
import { LoadingSpinner } from '@/components/logic/loading/LoadingSpinner';
import { BottomNavigation } from '@/components/logic/navigation/BottomNavigation';
import { SideNavigation } from '@/components/logic/navigation/SideNavigation';
import { TopNavigation } from '@/components/logic/navigation/TopNavigation';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { useRouter } from '@/i18n/routing';
import { NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';
import type { UserInfo } from '@/types/user-types';
import { containerVariants, itemVariants } from '@/utils/animation-helper';

import { LoadingView } from './LoadingView';

export const MainView = () => {
  const router = useRouter();
  const { isInWebView, sendMessage, addMessageHandler } = useWebViewBridgeContext();
  const t = useTranslations();

  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '',
    name: '',
    email: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    energy: 0,
    gameMoney: 0,
    gems: 0,
    level: 1,
    isAdFree: false,
    isSubscribed: false,
    locale: 'ko',
    gameItems: {},
  });

  const [unreadMailCount, setUnreadMailCount] = useState<number>(0);

  const [showEnergyModal, setShowEnergyModal] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  useEffect(() => {
    // Notify React Native that web app is ready
    if (isInWebView) {
      sendMessage({
        type: WebToNativeMessageType.WEB_APP_READY,
        payload: { timestamp: new Date().toISOString() },
      });
    }

    // Handle back button in main view
    const unsubscribeBackState = addMessageHandler(NativeToWebMessageType.CAN_BACK_STATE, () => {
      if (!showExitModal) {
        setShowExitModal(true);
        return;
      }
      sendMessage({ type: WebToNativeMessageType.EXIT_ACTION });
      setShowExitModal(false);
    });

    // TODO: Remove this after testing
    setUserInfo((prev) => ({
      ...prev,
      name: t('common.userName'),
      energy: 5,
      gameMoney: 1500,
      gems: 120,
      level: 1,
    }));
    setUnreadMailCount(3);

    return () => {
      unsubscribeBackState();
    };
  }, [isInWebView, sendMessage, addMessageHandler, showExitModal, t]);

  const handleStartGame = () => {
    if (userInfo.energy <= 0) {
      setShowEnergyModal(true);
      return;
    }

    setUserInfo((prev) => ({
      ...prev,
      energy: prev.energy - 1,
    }));

    router.push('/game?mode=casual');
  };

  const handleChallengeStart = () => {
    if (userInfo.energy <= 0) {
      setShowEnergyModal(true);
      return;
    }

    setUserInfo((prev) => ({
      ...prev,
      energy: prev.energy - 1,
    }));

    router.push('/game?mode=challenge');
  };

  const handleWatchAd = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // TODO: 광고 시청 대기 & 완료 후 물방울 충전 처리

      setUserInfo((prev) => ({
        ...prev,
        energy: prev.energy + 1,
      }));
    } catch (error) {
      console.error('광고 시청 오류:', error);
    } finally {
      setShowEnergyModal(false);
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // TODO: 결제 처리 대기 & 완료 후 물방울 충전 처리

      setUserInfo((prev) => ({
        ...prev,
        energy: prev.energy + 5,
      }));
    } catch (error) {
      console.error('결제 처리 오류:', error);
    } finally {
      setShowEnergyModal(false);
      setIsLoading(false);
    }
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

  if (!userInfo || !isInitialLoading) {
    return <LoadingView onLoadComplete={() => setIsInitialLoading(false)} />;
  }

  const { name, level, energy, gameMoney, gems, profileImage } = userInfo;

  return (
    <>
      <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-0 relative">
        <header className="sticky w-full left-0 top-0 z-10">
          <TopNavigation
            name={name}
            level={level}
            energy={energy}
            gameMoney={gameMoney}
            gems={gems}
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              onClick={handleStartGame}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">{t('common.casualMode')}</h3>
                <Play className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-gray-300 text-sm mb-3">{t('common.casualDescription')}</p>
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
              onClick={handleChallengeStart}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">{t('common.challengeMode')}</h3>
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-gray-300 text-sm mb-3">{t('common.challengeDescription')}</p>
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
              {['sunflower', 'tulip', 'cactus', 'crystal-cactus'].map((plant, i) => (
                <motion.div
                  key={plant}
                  className="w-8 h-8 rounded-full border-2 border-gray-800 overflow-hidden"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <Image src={`/plants/${plant}.png`} alt={plant} width={50} height={50} />
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
      {isLoading && <LoadingSpinner />}
      <SideNavigation unreadMailCount={unreadMailCount} />
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

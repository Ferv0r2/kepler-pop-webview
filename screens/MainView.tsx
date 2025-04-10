'use client';

import { motion } from 'framer-motion';
import { Droplet, Play, PlayCircle, ShoppingBag, Calendar, Trophy, Star, Gift, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ConfirmationModal } from '@/components/logic/dialogs/ConfirmationModal';
import { LoadingContainer } from '@/components/logic/LoadingContainer';
import { BottomNavigation } from '@/components/logic/navigations/BottomNavigation';
import { SideNavigation } from '@/components/logic/navigations/SideNavigation';
import { TopNavigation } from '@/components/logic/navigations/TopNavigation';
import type { UserInfo } from '@/types/UserTypes';
import { itemVariants } from '@/utils/animation-helper';

export const MainView = () => {
  const router = useRouter();

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
  });

  const [unreadMailCount, setUnreadMailCount] = useState<number>(0);

  const [showEnergyModal, setShowEnergyModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // TODO: Remove this coded, apply user info from server
    setUserInfo((prev) => ({
      ...prev,
      name: '우주 탐험가',
      energy: 5,
      gameMoney: 1500,
      gems: 120,
      level: 1,
    }));
    setUnreadMailCount(3);
  }, []);

  const handleStartGame = () => {
    if (userInfo.energy <= 0) {
      setShowEnergyModal(true);
      return;
    }

    setUserInfo((prev) => ({
      ...prev,
      energy: prev.energy - 1,
    }));
    router.push('/game');
  };

  // TODO: After update get energy function, remove this function
  const waitForSecond = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleWatchAd = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // TODO: 광고 SDK 연동
      await waitForSecond();
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
      // TODO: 인앱 결제 로직
      await waitForSecond();
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  if (!userInfo) return <LoadingContainer />;

  const { name, level, energy, gameMoney, gems } = userInfo;

  return (
    <>
      <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-0 relative">
        <header className="sticky w-full left-0 top-0 z-10">
          <TopNavigation name={name} level={level} energy={energy} gameMoney={gameMoney} gems={gems} />
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
                <img src="/icons/logo.png" alt="Game Logo" className="rounded-full" />
              </div>
            </div>
            <p className="text-gray-300 text-sm mt-1">오늘도 떠나볼까요?</p>
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
              <div className="flex justify-between items-start mb-2">
                <div className="bg-purple-500/30 p-2 rounded-lg">
                  <Play className="text-purple-300 w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="text-cyan-400 w-3.5 h-3.5" />
                  <span className="text-cyan-300 text-xs font-medium">-1</span>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm">어드벤처 모드</h3>
              <p className="text-gray-300 text-xs mt-1">스토리를 따라 퍼즐을 해결하세요</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-900/60 to-cyan-900/60 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-blue-800/30"
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation('/challenge')}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <Trophy className="text-blue-300 w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <Star className="text-purple-400 w-3.5 h-3.5" />
                  <span className="text-purple-300 text-xs font-medium">+5</span>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm">챌린지 모드</h3>
              <p className="text-gray-300 text-xs mt-1">특별한 미션에 도전하세요</p>
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
              <h2 className="text-white font-bold text-sm">이벤트 & 보상</h2>
              <button className="text-gray-400 text-xs flex items-center" onClick={() => handleNavigation('/events')}>
                더보기 <ChevronRight className="w-3 h-3 ml-0.5" />
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
                  <h3 className="text-white font-bold text-sm">오늘의 출석 체크</h3>
                  <p className="text-gray-300 text-xs">5일 연속 출석 중! 보상을 받으세요</p>
                </div>
                <div className="bg-pink-500/20 rounded-lg px-2 py-1">
                  <span className="text-pink-300 text-xs font-medium">Day 5</span>
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
                    <h3 className="text-white font-bold text-sm">특별 이벤트</h3>
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-2">NEW</span>
                  </div>
                  <p className="text-gray-300 text-xs">우주 탐험 이벤트 진행 중</p>
                </div>
                <div className="bg-amber-500/20 rounded-lg px-2 py-1">
                  <span className="text-amber-300 text-xs font-medium">2일 남음</span>
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
              <h2 className="text-white font-bold text-sm">친구 활동</h2>
              <button className="text-gray-400 text-xs flex items-center" onClick={() => handleNavigation('/friends')}>
                더보기 <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <div className="flex -space-x-2 mb-1">
              {['carrot', 'morning_glory', 'mushroom', 'strawberry'].map((cell, i) => (
                <motion.div
                  key={cell}
                  className="w-8 h-8 rounded-full border-2 border-gray-800 overflow-hidden"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <img src={`/preview/cells/${cell}.png`} alt={`Friend ${cell}`} />
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
            <p className="text-gray-400 text-xs">친구 4명이 지금 게임 중입니다</p>
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
      {isLoading && <LoadingContainer />}
      <SideNavigation unreadMailCount={unreadMailCount} />
      <ConfirmationModal
        isOpen={showEnergyModal}
        title="물방울 부족"
        message={
          <div className="space-y-4">
            <p className="text-white">게임을 시작하기 위한 물방울이 부족합니다.</p>
            <div className="bg-indigo-800/40 p-4 rounded-lg space-y-4">
              <p className="text-sm text-white/90">다음 방법으로 물방울을 얻을 수 있습니다:</p>

              <motion.div
                className={`flex items-center justify-between bg-indigo-700/30 p-3 rounded-lg ${
                  isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWatchAd}
              >
                <div className="flex items-center gap-3">
                  <PlayCircle className="text-blue-300 w-6 h-6" />
                  <span className="text-white font-medium">광고 시청하기</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="text-blue-300 w-4 h-4" />
                  <span className="text-blue-300 font-bold">+1</span>
                </div>
              </motion.div>

              <motion.div
                className={`flex items-center justify-between bg-indigo-700/30 p-3 rounded-lg ${
                  isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePurchase}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="text-green-300 w-6 h-6" />
                  <span className="text-white font-medium">물방울 구매하기</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplet className="text-blue-300 w-4 h-4" />
                  <span className="text-blue-300 font-bold">+5</span>
                </div>
              </motion.div>
            </div>
          </div>
        }
        confirmText="닫기"
        cancelText="취소"
        onConfirm={() => setShowEnergyModal(false)}
        onCancel={() => setShowEnergyModal(false)}
      />
    </>
  );
};

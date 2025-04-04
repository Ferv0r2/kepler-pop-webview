'use client';

import { motion } from 'framer-motion';
import { Droplet, Play, PlayCircle, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmationModal } from '@/components/logic/ConfirmationModal';
import { LoadingContainer } from '@/components/logic/LoadingContainer';
import { Button } from '@/components/ui/button';

export const MainView = () => {
  const router = useRouter();
  const [energy, setEnergy] = useState<number>(0);
  const [showEnergyModal, setShowEnergyModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStartGame = () => {
    if (energy <= 0) {
      setShowEnergyModal(true);
      return;
    }

    setEnergy((prev) => prev - 1);

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
      setEnergy((prev) => prev + 1);
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
      setEnergy((prev) => prev + 5);
    } catch (error) {
      console.error('결제 처리 오류:', error);
    } finally {
      setShowEnergyModal(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-violet-900 p-4">
      <motion.div
        className="text-center mb-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
      >
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-4">
          Kepler Pop
        </h1>
        <p className="text-xl text-white/80">우주로 떠나는 매칭 퍼즐 게임</p>
      </motion.div>

      <motion.div
        className="flex items-center justify-center gap-2 mb-8 bg-indigo-800/30 px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <Droplet className="text-blue-300 w-6 h-6 drop-shadow-glow" />
        <span className="text-white text-xl font-bold">{energy}</span>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <Button
          onClick={handleStartGame}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 px-10 rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <Play className="mr-2 w-6 h-6" />
          게임 시작
        </Button>
      </motion.div>

      {isLoading && <LoadingContainer />}
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
    </div>
  );
};

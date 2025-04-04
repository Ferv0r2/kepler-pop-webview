'use client';

import { motion } from 'framer-motion';
import { Droplet, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export const MainView = () => {
  const router = useRouter();
  const [energy, setEnergy] = useState<number>(5);

  const handleStartGame = () => {
    if (energy <= 0) {
      // TODO: 물방울이 부족합니다. 라는 모달과 함께 결제 혹은 광고 중 하나를 선택하는 모달을 생성한다.
      return;
    }

    setEnergy((prev) => prev - 1);
    router.push('/game');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-violet-900 p-4">
      <motion.div
        className="text-center mb-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
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
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Droplet className="text-blue-300 w-6 h-6 drop-shadow-glow" />
        <span className="text-white text-xl font-bold">{energy}</span>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Button
          onClick={handleStartGame}
          disabled={energy <= 0}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 px-10 rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="mr-2 w-6 h-6" />
          게임 시작
        </Button>
      </motion.div>

      {energy <= 0 && (
        <motion.p
          className="mt-4 text-red-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          물방울이 부족합니다. 충전을 기다려주세요.
        </motion.p>
      )}
    </div>
  );
};

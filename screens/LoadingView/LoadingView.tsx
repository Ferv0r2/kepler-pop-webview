'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo, useRef } from 'react';

import { Logo } from '@/components/logo/Logo';
import { StarsAndSparkles } from '@/components/ui/StarsAndSparkles';
import { preloadAssetsWithProgress } from '@/utils/preload-assets';

import {
  DEFAULT_LOADING_TIME_MS,
  LOADING_MESSAGE_INTERVAL_MS,
  LOADING_COMPLETE_DELAY_MS,
  LOADING_ANIMATION_DURATION,
  LOADING_TEXT_ANIMATION_DURATION,
  LOADING_DOTS_ANIMATION_DURATION,
  LOADING_ANIMATION_DELAYS,
} from './constants/loading-config';

interface LoadingScreenProps {
  onLoadComplete?: () => void;
  minLoadingTime?: number; // Minimum time to show loading screen in ms
}

export const LoadingView = ({ onLoadComplete, minLoadingTime = DEFAULT_LOADING_TIME_MS }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const t = useTranslations();
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const loadingMessages = useMemo(
    () => [
      t('loading.messages.loadingAssets'),
      t('loading.messages.preparingTiles'),
      t('loading.messages.generatingPuzzles'),
      t('loading.messages.polishingGems'),
      t('loading.messages.almostReady'),
    ],
    [t],
  );

  useEffect(() => {
    // 이미 로드된 경우 바로 완료 처리
    if (typeof window !== 'undefined' && sessionStorage.getItem('assetsLoaded') === 'true') {
      setProgress(100);
      setIsComplete(true);
      setAssetsLoaded(true);
      setTimeout(() => {
        onLoadComplete?.();
      }, LOADING_COMPLETE_DELAY_MS);
      return;
    }

    const loadAssets = async () => {
      try {
        await preloadAssetsWithProgress((assetProgress) => {
          // 에셋 로딩 진행률을 전체 진행률의 80%까지 반영
          const assetProgressWeighted = (assetProgress * 80) / 100;
          setProgress(assetProgressWeighted);
        });

        setAssetsLoaded(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('assetsLoaded', 'true');
        }
        console.log('LoadingView: 모든 에셋이 성공적으로 로드되었습니다.');
      } catch (error) {
        console.warn('LoadingView: 에셋 로드 실패:', error);
        setAssetsLoaded(true); // 실패해도 계속 진행
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('assetsLoaded', 'true');
        }
      }
    };

    loadAssets();
  }, [onLoadComplete]);

  useEffect(() => {
    // 이미 완료된 경우 즉시 완료 처리
    if (isComplete) {
      setProgress(100);
      setTimeout(() => {
        onLoadComplete?.();
      }, LOADING_COMPLETE_DELAY_MS);
      return;
    }

    // 에셋 로딩이 완료되지 않았으면 진행하지 않음
    if (!assetsLoaded) {
      return;
    }

    // Simulate loading progress (에셋 로딩 후 나머지 20% 진행)
    const simulateLoading = () => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const timeProgress = Math.min(20, (elapsedTime / (minLoadingTime * 0.2)) * 20); // 나머지 20% 진행
      const totalProgress = 80 + timeProgress; // 에셋 로딩 80% + 시간 기반 20%

      if (totalProgress >= 100 && !isComplete) {
        setIsComplete(true);
        setProgress(100);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setTimeout(() => {
          onLoadComplete?.();
        }, LOADING_COMPLETE_DELAY_MS);
        return;
      }

      setProgress(totalProgress);
      animationFrameRef.current = requestAnimationFrame(simulateLoading);
    };

    // Start loading simulation
    simulateLoading();

    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setLoadingText((prevText) => {
        const currentIndex = loadingMessages.indexOf(prevText);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, LOADING_MESSAGE_INTERVAL_MS);

    // Set initial message
    setLoadingText(loadingMessages[0]);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(messageInterval);
    };
  }, [minLoadingTime, onLoadComplete, loadingMessages, isComplete, assetsLoaded]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0B0C1D] to-[#101340]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: LOADING_ANIMATION_DURATION }}
    >
      <StarsAndSparkles />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 min-h-screen">
        <div className="flex-1 flex flex-col items-center mt-16">
          <Logo />

          {/* 로딩 인디케이터 */}
          <div className="relative my-20">
            {/* 진행률 표시 */}
            <motion.div
              className="text-center text-white/80 text-lg font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: LOADING_ANIMATION_DELAYS.PROGRESS }}
            >
              {Math.round(progress)}%
            </motion.div>
          </div>

          {/* 로딩 메시지 */}
          <motion.div
            className="text-white/60 text-lg mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: LOADING_ANIMATION_DELAYS.TEXT }}
          >
            <motion.span
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: LOADING_TEXT_ANIMATION_DURATION }}
            >
              {loadingText}
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: LOADING_DOTS_ANIMATION_DURATION,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'loop',
              }}
            >
              ...
            </motion.span>
          </motion.div>
        </div>

        {/* 팁 메시지 */}
        <motion.div
          className="w-full max-w-md mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: LOADING_ANIMATION_DELAYS.TIPS }}
        >
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="text-yellow-300 text-sm font-medium mb-2">{t('loading.tip')}</div>
            <p className="text-white/80 text-sm">{t('loading.gradeTip')}</p>
          </div>
        </motion.div>
      </div>

      {/* 장식용 배경 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-40 h-40 rounded-full bg-purple-600/10 blur-3xl"></div>
        <div className="absolute top-[40%] right-[10%] w-60 h-60 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-[20%] left-[30%] w-80 h-80 rounded-full bg-pink-500/10 blur-3xl"></div>
      </div>
    </motion.div>
  );
};

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';

import { EnergyModal } from '@/components/logic/dialogs/EnergyModal';
import { ExitModal } from '@/components/logic/dialogs/ExitModal';
import { LoadingModal } from '@/components/logic/dialogs/LoadingModal';
import { WeeklyLeaderboardWidget } from '@/components/logic/leaderboard/WeeklyLeaderboardWidget';
import { BottomNavigation } from '@/components/logic/navigation/BottomNavigation';
import { TopNavigation } from '@/components/logic/navigation/TopNavigation';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { EnergyDisplay } from '@/components/ui/EnergyDisplay';
import { useSound } from '@/hooks/useSound';
import { useUser } from '@/hooks/useUser';
import { useRouter } from '@/i18n/routing';
import { updateDroplet, updateGem } from '@/networks/KeplerBackend';
import { NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';
import type { NativeToWebMessage, EnergyUpdatePayload, PurchaseResultPayload } from '@/types/native-call';
import { itemVariants } from '@/utils/animation-helper';
import { playButtonSound } from '@/utils/sound-helper';

import { AD_ENERGY_REWARD_AMOUNT, ENERGY_CONSUME_AMOUNT } from './GameView/constants/game-config';
import { LoadingView } from './LoadingView/LoadingView';

const useUpdateDroplet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDroplet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['droplet-status'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

const useUpdateGem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const MainView = () => {
  const router = useRouter();
  const { data: userInfo, isLoading, refetch: refetchUser } = useUser();
  const { isInWebView, sendMessage, addMessageHandler } = useWebViewBridgeContext();
  const t = useTranslations();

  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isGameStarting, setIsGameStarting] = useState(false);
  const updateDropletMutation = useUpdateDroplet();
  const updateGemMutation = useUpdateGem();

  const { settings: soundSettings } = useSound();

  // 사용자 정보가 로드되면 hasLoadedOnce를 true로 설정
  useEffect(() => {
    if (userInfo && !hasLoadedOnce) {
      setHasLoadedOnce(true);

      // 주요 경로 prefetch
      router.prefetch(`/${userInfo.locale}/store`);
      router.prefetch(`/${userInfo.locale}/game?mode=challenge`);
      router.prefetch(`/${userInfo.locale}/settings`);
    }
  }, [userInfo, hasLoadedOnce, router]);

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

    const unsubscribeEnergyChange = addMessageHandler<NativeToWebMessage<EnergyUpdatePayload>>(
      NativeToWebMessageType.ENERGY_CHANGE,
      async (msg) => {
        const payload = msg.payload;
        try {
          if (payload?.status === 'success') {
            updateDropletMutation.mutate(payload.amount);
          }
        } catch (e) {
          console.error('에너지 변경 실패:', e);
        } finally {
          if (payload?.reason === 'ad') {
            setIsAdLoading(false);
          }
        }
      },
    );

    const unsubscribePurchaseResult = addMessageHandler<NativeToWebMessage<PurchaseResultPayload>>(
      NativeToWebMessageType.PURCHASE_RESULT,
      async (msg) => {
        const payload = msg.payload;
        try {
          if (payload?.status === 'success' && payload.amount) {
            updateGemMutation.mutate(payload.amount);
          }
        } catch (e) {
          console.error('구매 결과 처리 실패:', e);
        }
      },
    );

    return () => {
      unsubscribeBackState();
      unsubscribeEnergyChange();
      unsubscribePurchaseResult();
    };
  }, [isInWebView, sendMessage, addMessageHandler, showExitModal, updateDropletMutation, updateGemMutation]);

  if (!userInfo || !hasLoadedOnce) {
    return <LoadingView />;
  }

  const { nickname, level, gameMoney, gem, profileImage } = userInfo;

  const handleStartGame = async (mode: 'casual' | 'challenge') => {
    playButtonSound(soundSettings);

    // 게임 시작 로딩 표시
    setIsGameStarting(true);

    // 게임 시작 전 최신 사용자 정보 가져오기
    try {
      const { data: latestUserInfo } = await refetchUser();
      const currentUserInfo = latestUserInfo || userInfo;

      if (!currentUserInfo || currentUserInfo.droplet < ENERGY_CONSUME_AMOUNT) {
        setIsGameStarting(false);
        setShowEnergyModal(true);
        return;
      }

      updateDropletMutation.mutate(-ENERGY_CONSUME_AMOUNT, {
        onSuccess: () => {
          // 게임 시작 애니메이션을 위해 약간의 지연
          setTimeout(() => {
            setIsGameStarting(false);
            router.push(`/game?mode=${mode}`);
          }, 1000);
        },
        onError: () => {
          setIsGameStarting(false);
        },
      });
    } catch (error) {
      console.error('사용자 정보 갱신 실패:', error);
      // 실패 시 기존 userInfo로 진행
      if (!userInfo || userInfo.droplet < ENERGY_CONSUME_AMOUNT) {
        setIsGameStarting(false);
        setShowEnergyModal(true);
        return;
      }

      updateDropletMutation.mutate(-ENERGY_CONSUME_AMOUNT, {
        onSuccess: () => {
          // 게임 시작 애니메이션을 위해 약간의 지연
          setTimeout(() => {
            setIsGameStarting(false);
            router.push(`/game?mode=${mode}`);
          }, 1000);
        },
        onError: () => {
          setIsGameStarting(false);
        },
      });
    }
  };

  const handleWatchAd = async () => {
    if (isLoading || !userInfo) return;

    // 광고 로딩 시작
    setIsAdLoading(true);
    setShowEnergyModal(false);

    sendMessage({
      type: WebToNativeMessageType.ENERGY_CHANGE,
      payload: { amount: AD_ENERGY_REWARD_AMOUNT, reason: 'ad' },
    });
    playButtonSound(soundSettings);
  };

  const handlePurchase = () => {
    if (isLoading || !userInfo) return;
    router.push('/store');
    playButtonSound(soundSettings);
    setShowEnergyModal(false);
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
            name={nickname}
            level={level}
            gameMoney={gameMoney}
            gem={gem}
            profileImage={profileImage || '/plants/sprout.png'}
          />
        </header>

        <main className="flex-1 flex flex-col mt-6 py-2 mb-20 overflow-hidden">
          {highScores.challenge > 0 && (
            <motion.div
              className="max-w-56 mx-auto w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-xl border border-yellow-500/30 shadow-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="relative">
                <Image src="/icons/trophy.png" alt="Trophy" width={32} height={32} />
                <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-sm"></div>
              </div>
              <div className="text-center">
                <p className="text-yellow-300 font-medium">{t('game.highScore')}</p>
                <p className="text-yellow-400 text-lg font-bold">{highScores.challenge.toLocaleString()}</p>
              </div>
              <div className="relative">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute -inset-1 bg-yellow-400/30 rounded-full blur-sm animate-pulse"></div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="flex flex-col items-center justify-center mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="relative w-48 h-48 mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full animate-pulse"></div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full animate-pulse"
                style={{ animationDelay: '0.5s' }}
              ></div>
              <div className="absolute m-6 inset-0 flex items-center justify-center">
                <Image
                  src="/icons/map.png"
                  alt="Map"
                  fill
                  priority
                  quality={85}
                  loading="eager"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkMjU1LS0yMi4qLjg0PjU4Ojo4OjU4Ojo4Ojo4Ojo4Ojo4Ojo4Ojr/2wBDAR4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k="
                />
              </div>
            </div>
            <p className="text-gray-300 text-sm mt-1">{t('common.today')}</p>
          </motion.div>

          <div className="max-w-80 mx-auto w-full flex justify-center mb-4">
            <EnergyDisplay />
          </div>

          {/* 게임 모드 선택 */}
          <motion.div
            data-testid="challenge-mode-button"
            className="w-fit mx-auto flex-col px-3 py-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 mb-8"
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStartGame('challenge')}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-white font-semibold text-lg">{t('common.startGame')}</span>
            </div>
            <div className="flex items-center justify-center">
              <Image src="/icons/droplet.png" alt="Droplet" width={20} height={20} />
              <span className="text-white font-semibold">{`x${ENERGY_CONSUME_AMOUNT}`}</span>
            </div>
          </motion.div>

          {/* 주간 리더보드 위젯 */}
          <div className="max-w-sm md mx-auto w-full px-2">
            <WeeklyLeaderboardWidget locale={userInfo.locale} />
          </div>
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
      <EnergyModal
        isOpen={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        onWatchAd={handleWatchAd}
        onPurchase={handlePurchase}
        isLoading={isLoading}
      />
      <ExitModal isOpen={showExitModal} onConfirm={handleExitConfirm} onCancel={handleExitCancel} />
      <LoadingModal isOpen={isAdLoading} type="ad" />
      <LoadingModal isOpen={isGameStarting} type="game" />
    </>
  );
};

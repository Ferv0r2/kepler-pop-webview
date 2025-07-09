'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { BottomNavigation } from '@/components/logic/navigation/BottomNavigation';
import { TopNavigation } from '@/components/logic/navigation/TopNavigation';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { useSound } from '@/hooks/useSound';
import { useUser } from '@/hooks/useUser';
import { updateDroplet, updateGem } from '@/networks/KeplerBackend';
import { NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';
import { itemVariants } from '@/utils/animation-helper';
import { playButtonSound } from '@/utils/sound-helper';

import { LoadingView } from '../LoadingView/LoadingView';

import { PurchaseConfirmModal } from './components/PurchaseConfirmModal';
import { STORE_ITEMS } from './constants/store-config';

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
    mutationFn: (amount: number) => updateGem(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const StoreView = () => {
  const queryClient = useQueryClient();
  const { data: userInfo, isLoading } = useUser();
  const { isInWebView, sendMessage, addMessageHandler } = useWebViewBridgeContext();
  const t = useTranslations();

  const updateDropletMutation = useUpdateDroplet();
  const updateGemMutation = useUpdateGem();

  const [selectedItem, setSelectedItem] = useState<(typeof STORE_ITEMS)[0] | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'droplet' | 'gems'>('droplet');

  const { settings: soundSettings } = useSound();

  const purchaseMutation = useMutation({
    mutationFn: async (item: (typeof STORE_ITEMS)[0]) => {
      if (item.type === 'droplet') {
        // 에너지 구매는 보석으로
        if (!userInfo || userInfo.gem < item.gemCost!) {
          throw new Error('insufficient_gems');
        }
        // 실제 에너지 구매 API 호출
        updateDropletMutation.mutate(item.amount);
        updateGemMutation.mutate(-item.gemCost!);
        return { success: true, type: 'droplet', amount: item.amount };
      } else {
        // 보석 구매는 인앱 결제
        if (isInWebView) {
          sendMessage({
            type: WebToNativeMessageType.IN_APP_PURCHASE,
            payload: { productId: item.productId! },
          });
        }
        return { success: true, type: 'gems', amount: item.amount };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setShowConfirmModal(false);
      setSelectedItem(null);
      playButtonSound(soundSettings);
    },
    onError: (error) => {
      console.error('Purchase failed:', error);
      setShowConfirmModal(false);
      setSelectedItem(null);
    },
  });

  useEffect(() => {
    const unsubscribeBackState = addMessageHandler(NativeToWebMessageType.CAN_BACK_STATE, () => {
      sendMessage({ type: WebToNativeMessageType.EXIT_ACTION });
    });

    return () => {
      unsubscribeBackState();
    };
  }, [addMessageHandler, sendMessage]);

  const handleItemClick = (item: (typeof STORE_ITEMS)[0]) => {
    setSelectedItem(item);
    setShowConfirmModal(true);
    playButtonSound(soundSettings);
  };

  const handleConfirmPurchase = () => {
    if (selectedItem) {
      purchaseMutation.mutate(selectedItem);
    }
  };

  const handleCancelPurchase = () => {
    setShowConfirmModal(false);
    setSelectedItem(null);
  };

  if (!userInfo || isLoading) {
    return <LoadingView />;
  }

  const { nickname, level, gameMoney, gem, profileImage } = userInfo;

  const dropletItems = STORE_ITEMS.filter((item) => item.type === 'droplet');
  const gemItems = STORE_ITEMS.filter((item) => item.type === 'gems');

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

        <main className="flex-1 flex flex-col px-4 py-6 overflow-x-hidden mb-20">
          {/* 페이지 제목 */}
          <motion.div
            className="text-center mb-6 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Store className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">{t('store.title')}</h1>
            </div>
            <p className="text-gray-400 text-sm">{t('store.description')}</p>
          </motion.div>

          {/* 탭 네비게이션 */}
          <motion.div
            className="flex bg-gray-800/50 rounded-lg p-1 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              className={`flex-1 py-2 px-4 rounded-md text-xl font-medium transition-all duration-200 ${
                activeTab === 'droplet' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('droplet')}
            >
              <div className="flex items-center justify-center gap-2">
                <Image src="/icons/droplet.png" alt="droplet" width={32} height={32} />
                {t('store.droplet')}
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-xl font-medium transition-all duration-200 ${
                activeTab === 'gems' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('gems')}
            >
              <div className="flex items-center justify-center gap-2">
                <Image src="/icons/gem.png" alt="Gems" width={32} height={32} />
                {t('store.gems')}
              </div>
            </button>
          </motion.div>

          {/* 상품 목록 */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {(activeTab === 'droplet' ? dropletItems : gemItems).map((item, index) => (
                <motion.div
                  key={item.id}
                  className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl border border-gray-600/30 p-4 cursor-pointer hover:border-blue-500/50 transition-all duration-300"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Image
                          src={item.image}
                          alt={item.type === 'droplet' ? 'Droplet' : 'Gems'}
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{t(`store.${item.id}`)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400 font-bold text-sm">
                            {item.type === 'droplet'
                              ? t('store.droplet_unit', { count: item.amount })
                              : t('store.gem_unit', { count: item.amount })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-2xl">
                        {item.type === 'droplet' ? (
                          <div className="flex items-center gap-1">
                            <Image src="/icons/gem.png" alt="Gems" width={32} height={32} />
                            <span>{item.gemCost}</span>
                          </div>
                        ) : (
                          <span>-</span>
                          // <span>{item.price}</span>
                        )}
                      </div>
                      {/* {item.discount && <div className="text-green-400 text-sm font-medium">{item.discount}% 할인</div>} */}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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

      <PurchaseConfirmModal
        isOpen={showConfirmModal}
        item={selectedItem}
        onConfirm={handleConfirmPurchase}
        onCancel={handleCancelPurchase}
        isLoading={purchaseMutation.isPending}
        userGem={userInfo.gem}
      />
    </>
  );
};

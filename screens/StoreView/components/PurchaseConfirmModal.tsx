'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { StoreItem } from '../constants/store-config';

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  item: StoreItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  userGem: number;
}

export const PurchaseConfirmModal = ({
  isOpen,
  item,
  onConfirm,
  onCancel,
  isLoading,
  userGem,
}: PurchaseConfirmModalProps) => {
  const t = useTranslations();

  if (!item) return null;

  const hasInsufficientGems = item.type === 'droplet' && item.gemCost && userGem < item.gemCost;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-600/30 p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">{t('store.confirmPurchase')}</h2>
              <p className="text-gray-400 text-sm">{t('store.confirmPurchaseMessage')}</p>
            </div>

            {/* Item Details */}
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
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
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{t(`store.${item.id}`)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 font-bold text-sm">
                      {item.type === 'droplet'
                        ? t('store.droplet_unit', { count: item.amount })
                        : t('store.gem_unit', { count: item.amount })}
                    </span>
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
                      // <span>{item.price}원</span>
                      <span>-</span>
                    )}
                  </div>
                  {/* {item.discount && <div className="text-green-400 text-sm font-medium">{item.discount}% 할인</div>} */}
                </div>
              </div>
            </div>

            {/* Insufficient Gems Warning */}
            {hasInsufficientGems && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-300 text-md font-medium">{t('store.insufficientGems')}</span>
                </div>
                <p className="text-red-400 text-md mt-1">
                  현재 보석: {userGem}개 / 필요 보석: {item.gemCost}개
                </p>
              </div>
            )}

            {item.type === 'gems' && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-300 text-md font-medium">{'Coming Soon'}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors duration-200"
                onClick={onCancel}
                disabled={isLoading}
              >
                {t('modal.cancel')}
              </button>
              <button
                className={`flex-1 py-3 px-4 font-medium rounded-lg transition-colors duration-200 ${
                  hasInsufficientGems || item.type === 'gems'
                    ? 'bg-gray-500 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                onClick={onConfirm}
                disabled={isLoading || Boolean(hasInsufficientGems) || item.type === 'gems'}
              >
                {isLoading ? t('store.purchasing') : t('store.purchase')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

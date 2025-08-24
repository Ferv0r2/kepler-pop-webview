'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Gem } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { GameItem, GameItemType } from '@/types/game-types';

interface ShopItem {
  id: string;
  type: GameItemType;
  name: string;
  description: string;
  icon: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect: string;
}

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerGems: number;
  onPurchase: (item: ShopItem) => void;
  availableItems: ShopItem[];
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'shop_shovel',
    type: 'shovel',
    name: '강화된 삽',
    description: '더 강력한 삽으로 타일을 제거합니다',
    icon: '/icons/shovel.png',
    cost: 50,
    rarity: 'common',
    effect: '타일 제거 범위 +1',
  },
  {
    id: 'shop_mole',
    type: 'mole',
    name: '전문 두더지',
    description: '더 정확한 두더지로 특정 타일을 제거합니다',
    icon: '/icons/mole.png',
    cost: 75,
    rarity: 'rare',
    effect: '정확도 +25%',
  },
  {
    id: 'shop_bomb',
    type: 'bomb',
    name: '메가 폭탄',
    description: '더 큰 폭발 범위를 가진 폭탄입니다',
    icon: '/icons/bomb.png',
    cost: 100,
    rarity: 'epic',
    effect: '폭발 범위 +2',
  },
  {
    id: 'shop_combo_boost',
    type: 'shovel',
    name: '콤보 부스터',
    description: '콤보 점수를 2배로 증가시킵니다',
    icon: '/icons/star.png',
    cost: 150,
    rarity: 'legendary',
    effect: '콤보 점수 x2',
  },
];

export const ShopModal = ({ isOpen, onClose, playerGems, onPurchase, availableItems = SHOP_ITEMS }: ShopModalProps) => {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const t = useTranslations();

  const handlePurchase = () => {
    if (selectedItem && playerGems >= selectedItem.cost) {
      onPurchase(selectedItem);
      setSelectedItem(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-300';
      case 'rare':
        return 'text-blue-400';
      case 'epic':
        return 'text-purple-400';
      case 'legendary':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-600/20';
      case 'rare':
        return 'bg-blue-600/20';
      case 'epic':
        return 'bg-purple-600/20';
      case 'legendary':
        return 'bg-yellow-600/20';
      default:
        return 'bg-gray-600/20';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-6 mx-4 max-w-2xl w-full border border-purple-500/30 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{t('game.shop.title')}</h2>
                <p className="text-white/70 text-sm">{t('game.shop.subtitle')}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Gem 표시 */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-3 flex items-center gap-2">
              <Gem className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-lg">{playerGems}</span>
            </div>
          </div>

          {/* 상점 아이템들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {availableItems.map((item, index) => {
              const canAfford = playerGems >= item.cost;
              const isSelected = selectedItem?.id === item.id;

              return (
                <motion.div
                  key={item.id}
                  className={`
                    relative cursor-pointer rounded-lg p-4 border transition-all duration-200
                    ${
                      isSelected
                        ? 'border-purple-400 bg-purple-400/10 scale-105'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700/70'
                    }
                    ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => canAfford && setSelectedItem(isSelected ? null : item)}
                  whileHover={canAfford ? { scale: isSelected ? 1.05 : 1.02 } : {}}
                >
                  {/* 희귀도 배지 */}
                  <div
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getRarityColor(
                      item.rarity,
                    )} ${getRarityBg(item.rarity)}`}
                  >
                    {item.rarity.toUpperCase()}
                  </div>

                  {/* 아이템 아이콘 */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-3xl">
                      {typeof item.icon === 'string' && item.icon.startsWith('/') ? (
                        <Image src={item.icon} alt={item.name} width={48} height={48} className="rounded" />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-lg">{item.name}</div>
                      <div className="text-white/70 text-sm">{item.description}</div>
                    </div>
                  </div>

                  {/* 효과 설명 */}
                  <div className="mb-3">
                    <div className="text-purple-300 text-sm font-medium">{item.effect}</div>
                  </div>

                  {/* 가격 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gem className="h-4 w-4 text-purple-400" />
                      <span className={`font-bold ${canAfford ? 'text-purple-400' : 'text-red-400'}`}>{item.cost}</span>
                    </div>

                    {isSelected && (
                      <motion.div
                        className="text-purple-400 text-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* 구매 버튼 */}
          {selectedItem && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handlePurchase}
                disabled={playerGems < selectedItem.cost}
                className={`
                  w-full py-4 text-lg font-bold
                  ${
                    playerGems >= selectedItem.cost
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-slate-600 cursor-not-allowed'
                  }
                `}
              >
                {playerGems >= selectedItem.cost
                  ? `${t('game.shop.purchase')} (${selectedItem.cost} ${t('game.shop.gems')})`
                  : t('game.shop.notEnoughGems')}
              </Button>
            </motion.div>
          )}

          {/* 안내 메시지 */}
          <motion.div
            className="text-center mt-4 text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t('game.shop.selectItemToPurchase')}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

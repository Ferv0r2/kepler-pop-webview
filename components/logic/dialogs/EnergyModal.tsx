import { Store } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { AD_ENERGY_REWARD_AMOUNT } from '@/screens/GameView/constants/game-config';

import { ConfirmationModal } from './ConfirmationModal';

interface EnergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd: () => void;
  onPurchase: () => void;
  isLoading: boolean;
}

export const EnergyModal = ({ isOpen, onClose, onWatchAd, onPurchase, isLoading }: EnergyModalProps) => {
  const t = useTranslations();

  return (
    <ConfirmationModal
      isOpen={isOpen}
      title={t('game.insufficientEnergy')}
      message={
        <div className="space-y-4">
          <p className="text-white/80">{t('game.insufficientEnergyMessage')}</p>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={onWatchAd}
              variant="default"
              disabled={isLoading}
              className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <span>{t('modal.watchAd')}</span>
              <div className="flex items-center gap-1">
                <Image src="/icons/droplet.png" alt="droplet" width={24} height={24} />
                <span className="text-white font-bold">{`+${AD_ENERGY_REWARD_AMOUNT}`}</span>
              </div>
            </Button>
            <Button
              onClick={onPurchase}
              variant="secondary"
              disabled={isLoading}
              className="flex justify-between items-center bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              <span>{t('modal.purchase')}</span>
              <div className="flex items-center gap-1">
                <Store className="text-white w-4 h-4" />
              </div>
            </Button>
          </div>
        </div>
      }
      confirmText={t('modal.close')}
      cancelText={t('modal.cancel')}
      onConfirm={onClose}
      onCancel={onClose}
    />
  );
};

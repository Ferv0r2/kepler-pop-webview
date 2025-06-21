import { Droplet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

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
              className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <span>{t('modal.watchAd')}</span>
              <div className="flex items-center gap-1">
                <Droplet className="text-white w-4 h-4" />
                <span className="text-white font-bold">+1</span>
              </div>
            </Button>
            <Button
              onClick={onPurchase}
              variant="secondary"
              disabled={isLoading}
              className="flex justify-between items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <span>{t('modal.purchase')}</span>
              <div className="flex items-center gap-1">
                <Droplet className="text-white w-4 h-4" />
                <span className="text-white font-bold">+5</span>
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

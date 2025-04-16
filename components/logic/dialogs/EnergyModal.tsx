import { Droplet } from 'lucide-react';

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
  return (
    <ConfirmationModal
      isOpen={isOpen}
      title="물방울이 부족합니다"
      message={
        <div className="space-y-4">
          <p className="text-white/80">게임을 시작하기 위한 물방울이 부족합니다. 물방울을 충전하시겠습니까?</p>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={onWatchAd}
              variant="default"
              disabled={isLoading}
              className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <span>광고 시청하기</span>
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
              <span>물방울 구매하기</span>
              <div className="flex items-center gap-1">
                <Droplet className="text-white w-4 h-4" />
                <span className="text-white font-bold">+5</span>
              </div>
            </Button>
          </div>
        </div>
      }
      confirmText="닫기"
      cancelText="취소"
      onConfirm={onClose}
      onCancel={onClose}
    />
  );
};

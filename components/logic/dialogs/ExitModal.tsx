import { AlertTriangle } from 'lucide-react';

import { ConfirmationModal } from './ConfirmationModal';

interface ExitModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExitModal = ({ isOpen, onConfirm, onCancel }: ExitModalProps) => {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      title="앱 종료"
      message={
        <div className="space-y-3">
          <p className="text-white/80">앱을 종료하시겠습니까?</p>
          <div className="flex items-start gap-2 bg-yellow-400/10 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-sm font-medium">한 번 더 뒤로가기를 누르면 앱이 종료됩니다.</p>
          </div>
        </div>
      }
      confirmText="종료"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

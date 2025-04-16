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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
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

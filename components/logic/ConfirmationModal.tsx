'use client';

import { motion, useIsPresent, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalContent
          title={title}
          message={message}
          confirmText={confirmText}
          cancelText={cancelText}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </AnimatePresence>
  );
};

const ModalContent = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: Omit<ConfirmationModalProps, 'isOpen'>) => {
  // exit 애니메이션 중이면 isPresent는 false를 반환
  const isPresent = useIsPresent();
  const pointerEvents = isPresent ? 'auto' : 'none';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onCancel}
      style={{ pointerEvents }}
    >
      <motion.div
        className="bg-gradient-to-br from-indigo-900/95 to-purple-900/95 border border-indigo-400/30 rounded-2xl p-6 w-[320px] shadow-[0_0_25px_rgba(99,102,241,0.3)]"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-pink-400">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-white" disabled={!isPresent}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6 text-white/90">{message}</div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={!isPresent}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={!isPresent}>
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

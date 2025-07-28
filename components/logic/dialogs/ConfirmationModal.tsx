'use client';

import { motion, useIsPresent, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  isConfirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'default',
  isConfirmDisabled,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  const t = useTranslations();

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalContent
          title={title}
          message={message}
          confirmText={confirmText || t('modal.confirm')}
          cancelText={cancelText || t('modal.cancel')}
          variant={variant}
          isConfirmDisabled={isConfirmDisabled}
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
  variant,
  isConfirmDisabled,
  onConfirm,
  onCancel,
}: Omit<ConfirmationModalProps, 'isOpen'>) => {
  const isPresent = useIsPresent();
  const pointerEvents = isPresent ? 'auto' : 'none';

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          gradient: 'from-red-950/95 via-red-900/90 to-orange-950/95',
          border: 'border-red-400/40',
          shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.4)]',
          icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
          iconBg: 'bg-red-500/20',
        };
      case 'success':
        return {
          gradient: 'from-emerald-950/95 via-green-900/90 to-teal-950/95',
          border: 'border-emerald-400/40',
          shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
          icon: <CheckCircle className="h-6 w-6 text-emerald-400" />,
          iconBg: 'bg-emerald-500/20',
        };
      case 'info':
        return {
          gradient: 'from-blue-950/95 via-cyan-900/90 to-indigo-950/95',
          border: 'border-cyan-400/40',
          shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]',
          icon: <Info className="h-6 w-6 text-cyan-400" />,
          iconBg: 'bg-cyan-500/20',
        };
      default:
        return {
          gradient: 'from-slate-950/95 via-gray-900/90 to-slate-950/95',
          border: 'border-slate-400/30',
          shadow: 'shadow-[0_0_30px_rgba(148,163,184,0.3)]',
          icon: null,
          iconBg: '',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onCancel}
      style={{ pointerEvents }}
    >
      {/* Animated background with stars */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md">
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        className={`relative bg-gradient-to-br ${variantStyles.gradient} ${variantStyles.border} ${variantStyles.shadow} rounded-3xl p-8 w-[400px] max-w-[90vw] border backdrop-blur-xl`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
          duration: 0.4,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Orbital rings decoration */}
        <div className="absolute -inset-4 opacity-20 pointer-events-none">
          <motion.div
            className="absolute inset-0 rounded-full border border-white/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-white/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="absolute top-4 right-4 h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          disabled={!isPresent}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Header with icon */}
        <div className="flex items-center gap-4 mb-6">
          {variantStyles.icon && (
            <motion.div
              className={`p-3 rounded-2xl ${variantStyles.iconBg} backdrop-blur-sm`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            >
              {variantStyles.icon}
            </motion.div>
          )}
          <h3 className="font-bold text-xl text-white leading-tight">{title}</h3>
        </div>

        {/* Message */}
        <motion.div
          className="mb-8 text-white/90 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex gap-3 justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={!isPresent}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isPresent || isConfirmDisabled}
            className={`
              ${variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
              ${variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              ${variant === 'info' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
              ${variant === 'default' ? 'bg-white text-black hover:bg-white/90' : ''}
              ${isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-200 shadow-lg
            `}
          >
            {confirmText}
          </Button>
        </motion.div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

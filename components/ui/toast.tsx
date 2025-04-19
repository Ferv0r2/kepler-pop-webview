import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  icon: LucideIcon;
  message: string;
}

export const Toast = ({ isOpen, icon: Icon, message }: ToastProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed w-full p-4 top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="relative w-full max-w-md mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-30" />
            <div className="relative bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-purple-500/30">
              <Icon className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

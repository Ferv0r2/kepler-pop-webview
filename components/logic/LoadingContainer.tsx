import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

export const LoadingContainer = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Loader className="w-12 h-12 text-white animate-spin" />
      </motion.div>
    </div>
  );
};

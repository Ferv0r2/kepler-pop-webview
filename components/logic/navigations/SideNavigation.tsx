import { motion } from 'framer-motion';
import { Mail, Settings } from 'lucide-react';

export interface SideNavigationProps {
  unreadMailCount: number;
}

export const SideNavigation = ({ unreadMailCount }: SideNavigationProps) => {
  return (
    <div className="fixed flex flex-col top-12 right-0 p-3">
      <motion.button
        className="relative bg-gray-800/50 backdrop-blur-md p-2 rounded-full shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        onClick={() => console.log('mail')}
      >
        <Mail className="text-white w-5 h-5" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadMailCount}
        </span>
      </motion.button>
      <motion.button
        className="bg-gray-800/50 backdrop-blur-md p-2 rounded-full shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={() => console.log('settings')}
      >
        <Settings className="text-white w-5 h-5" />
      </motion.button>
    </div>
  );
};

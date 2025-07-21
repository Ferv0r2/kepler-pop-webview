import { motion } from 'framer-motion';
import { Loader, Trophy } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  variant?: 'default' | 'leaderboard';
  overlay?: boolean;
}

export const LoadingSpinner = ({ text = '', variant = 'default', overlay = true }: LoadingSpinnerProps) => {
  const containerClass = overlay
    ? 'fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]'
    : 'flex items-center justify-center p-8';

  const spinnerIcon = variant === 'leaderboard' ? Trophy : Loader;
  const SpinnerIcon = spinnerIcon;

  return (
    <div className={containerClass}>
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      >
        {/* 로딩 스피너 */}
        <motion.div
          className="relative"
          animate={variant === 'leaderboard' ? { rotate: 0 } : { rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <SpinnerIcon className={`w-12 h-12 ${variant === 'leaderboard' ? 'text-yellow-400' : 'text-white'}`} />
        </motion.div>

        {/* 로딩 텍스트 */}
        {text && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className={`text-sm font-medium ${variant === 'leaderboard' ? 'text-yellow-200' : 'text-white'}`}>
              {text}
            </p>

            {/* 점 애니메이션 */}
            <motion.div
              className="flex justify-center gap-1 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className={`w-1 h-1 rounded-full ${variant === 'leaderboard' ? 'bg-yellow-400' : 'bg-blue-400'}`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

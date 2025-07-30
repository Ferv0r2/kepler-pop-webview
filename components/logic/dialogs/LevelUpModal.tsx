import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  skillPointsGained: number;
  availableSkillPoints: number;
  onViewTechTree?: () => void;
}

export const LevelUpModal = ({
  isOpen,
  onClose,
  newLevel,
  skillPointsGained,
  availableSkillPoints,
  onViewTechTree,
}: LevelUpModalProps) => {
  const t = useTranslations();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 모달 */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              className="relative bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md border border-purple-400/50 rounded-2xl shadow-2xl max-w-sm w-full mx-4"
              initial={{ scale: 0.7, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              {/* 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-lg"></div>

              {/* 컨텐츠 */}
              <div className="relative p-6 text-center">
                {/* 축하 아이콘 */}
                <motion.div
                  className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
                >
                  <Image src="/icons/trophy.png" alt="Level Up" width={40} height={40} />
                </motion.div>

                {/* 레벨업 메시지 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mb-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-2">🎉 {t('level.levelUp')} 🎉</h2>
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-yellow-300 text-lg font-semibold">{t('level.newLevel')}</span>
                      <motion.div
                        className="bg-purple-500 text-white text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.5, duration: 0.7 }}
                      >
                        {newLevel}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* 스킬포인트 획득 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="bg-slate-800/40 p-4 rounded-xl border border-blue-400/30 mb-6"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Image src="/icons/gem.png" alt="Skill Points" width={24} height={24} />
                    <span className="text-blue-300 font-medium">{t('level.skillPointsReward')}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-blue-400 text-lg font-bold">
                      +{skillPointsGained} {t('level.skillPoints')}
                    </span>
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-blue-300/80 text-sm">
                      {t('level.totalAvailable')}: {availableSkillPoints}
                    </span>
                  </div>
                </motion.div>

                {/* 버튼들 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="flex flex-col gap-3"
                >
                  {onViewTechTree && (
                    <Button
                      onClick={onViewTechTree}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 font-medium shadow-lg"
                    >
                      🔧 {t('level.viewTechTree')}
                    </Button>
                  )}
                  <Button
                    onClick={onClose}
                    className="w-full bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 py-3 font-medium"
                  >
                    {t('common.continue')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

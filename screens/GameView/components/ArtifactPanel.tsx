'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { Artifact } from '@/types/game-types';

interface ArtifactPanelProps {
  artifacts: Artifact[];
}

export const ArtifactPanel = ({ artifacts }: ArtifactPanelProps) => {
  const t = useTranslations('game');
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);

  if (artifacts.length === 0) return null;

  return (
    <motion.div
      className="fixed right-4 top-16 z-20"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 토글 버튼 */}
      <motion.button
        className="bg-slate-800/90 backdrop-blur-sm rounded-full p-3 border border-yellow-500/30 shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center justify-center w-5 h-5 text-yellow-400 text-xl">🏺</div>
        {artifacts.length > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            {artifacts.length}
          </motion.div>
        )}
      </motion.button>

      {/* 유물 목록 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute right-0 top-12 bg-slate-800/95 backdrop-blur-sm rounded-xl p-3 border border-yellow-500/30 shadow-xl min-w-64"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: 'spring' }}
          >
            <div className="text-center mb-3">
              <div className="text-yellow-400 font-bold text-sm">{t('game.artifactPanel.title')}</div>
              <div className="text-white/60 text-xs">
                {t('game.artifactPanel.subtitle', { count: artifacts.length })}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto  overflow-x-hidden">
              {artifacts.map((artifact, index) => (
                <motion.div
                  key={artifact.id}
                  className={`relative p-3 rounded-lg border transition-all duration-200 ${
                    hoveredArtifact === artifact.id
                      ? 'border-yellow-400/50 bg-yellow-400/10'
                      : 'border-slate-600 bg-slate-700/50'
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredArtifact(artifact.id)}
                  onMouseLeave={() => setHoveredArtifact(null)}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className={`text-2xl ${artifact.color}`}
                      animate={hoveredArtifact === artifact.id ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 0.5, repeat: hoveredArtifact === artifact.id ? Infinity : 0 }}
                    >
                      {artifact.icon}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${artifact.color} truncate`}>{artifact.name}</div>
                      <div className="text-white/70 text-xs mt-1 leading-tight">{artifact.description}</div>
                    </div>
                  </div>

                  {/* 활성 상태 표시 */}
                  <motion.div
                    className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* 호버 시 추가 정보 */}
                  <AnimatePresence>
                    {hoveredArtifact === artifact.id && (
                      <motion.div
                        className="absolute left-full ml-2 top-0 bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-600 shadow-xl min-w-48 z-50"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`font-bold text-sm ${artifact.color} mb-1`}>{artifact.name}</div>
                        <div className="text-white/80 text-xs leading-relaxed">{artifact.description}</div>
                        <div className="text-yellow-400 text-xs mt-2">{t('game.artifactPanel.description')}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* 닫기 버튼 */}
            <motion.button
              className="w-full mt-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg text-white/70 text-sm transition-colors"
              onClick={() => setIsExpanded(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('game.close')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

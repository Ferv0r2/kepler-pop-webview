'use client';

import { motion } from 'framer-motion';

interface LeaderboardSkeletonProps {
  count?: number;
  showRankChange?: boolean;
}

export const LeaderboardSkeleton = ({ count = 10, showRankChange = false }: LeaderboardSkeletonProps) => {
  return (
    <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          className="flex items-center p-4 rounded-lg bg-gray-800/50 border border-gray-700 animate-pulse"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          {/* 순위 스켈레톤 */}
          <div className="w-12 h-12 mr-2 bg-gray-700 rounded-lg" />

          {/* 프로필 이미지 스켈레톤 */}
          <div className="w-12 h-12 mr-3 bg-gray-700 rounded-full" />

          {/* 플레이어 정보 스켈레톤 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-5 bg-gray-700 rounded animate-pulse"
                style={{ width: `${120 + Math.random() * 80}px` }}
              />
              <div className="h-4 bg-gray-700 rounded w-12 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-700 rounded animate-pulse" style={{ width: `${80 + Math.random() * 60}px` }} />
          </div>

          {/* 순위 변동 스켈레톤 */}
          {showRankChange && (
            <div className="flex items-center gap-1 ml-2">
              <div className="w-4 h-4 bg-gray-700 rounded animate-pulse" />
              <div className="w-6 h-3 bg-gray-700 rounded animate-pulse" />
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export const LeaderboardEntrySkeleton = ({ showRankChange = false }: { showRankChange?: boolean }) => {
  return (
    <div className="flex items-center p-4 rounded-lg bg-gray-800/50 border border-gray-700 animate-pulse">
      {/* 순위 스켈레톤 */}
      <div className="w-12 h-12 mr-2 bg-gray-700 rounded-lg" />

      {/* 프로필 이미지 스켈레톤 */}
      <div className="w-12 h-12 mr-3 bg-gray-700 rounded-full" />

      {/* 플레이어 정보 스켈레톤 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-5 bg-gray-700 rounded w-32" />
          <div className="h-4 bg-gray-700 rounded w-12" />
        </div>
        <div className="h-4 bg-gray-700 rounded w-24" />
      </div>

      {/* 순위 변동 스켈레톤 */}
      {showRankChange && (
        <div className="flex items-center gap-1 ml-2">
          <div className="w-4 h-4 bg-gray-700 rounded" />
          <div className="w-6 h-3 bg-gray-700 rounded" />
        </div>
      )}
    </div>
  );
};

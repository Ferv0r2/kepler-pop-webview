'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useState } from 'react';

import { useGlobalPreloader } from '@/hooks/useGlobalPreloader';

/**
 * 개발 환경에서 프리로딩 상태를 보여주는 디버그 컴포넌트
 */
export const PreloadDebugger = () => {
  const preloadingState = useGlobalPreloader();
  const [isVisible, setIsVisible] = useState(false);

  // 프로덕션에서는 렌더링하지 않음
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const { isLoading, progress, loadedCount, totalCount, isComplete } = preloadingState;

  const getStatusIcon = () => {
    if (isLoading) return <Activity className="w-4 h-4 text-blue-400 animate-spin" />;
    if (isComplete) return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return '로딩 중...';
    if (isComplete) return '완료';
    return '대기 중';
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-500/10 border-blue-500/30';
    if (isComplete) return 'bg-green-500/10 border-green-500/30';
    return 'bg-gray-500/10 border-gray-500/30';
  };

  return (
    <>
      {/* 토글 버튼 */}
      <motion.button
        className="fixed top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-gray-600 text-white"
        onClick={() => setIsVisible(!isVisible)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Download className="w-4 h-4" />
      </motion.button>

      {/* 디버그 패널 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-16 right-4 z-50 w-80 p-4 bg-black/80 backdrop-blur-md rounded-lg border border-gray-600 text-white shadow-lg"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              {/* 헤더 */}
              <div className="flex items-center gap-2 border-b border-gray-600 pb-2">
                <Download className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold">이미지 프리로딩 상태</h3>
              </div>

              {/* 상태 정보 */}
              <div className="space-y-3">
                {/* 전체 상태 */}
                <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon()}
                    <span className="font-medium">{getStatusText()}</span>
                  </div>

                  {/* 진행률 바 */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <div className="text-sm text-gray-300">
                    {progress.toFixed(1)}% ({loadedCount}/{totalCount} 이미지)
                  </div>
                </div>

                {/* 세부 정보 */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-gray-800/50 rounded">
                    <div className="text-gray-400">로딩됨</div>
                    <div className="font-mono font-bold text-green-400">{loadedCount}</div>
                  </div>
                  <div className="p-2 bg-gray-800/50 rounded">
                    <div className="text-gray-400">전체</div>
                    <div className="font-mono font-bold text-blue-400">{totalCount}</div>
                  </div>
                </div>

                {/* 캐시 정보 */}
                <div className="p-2 bg-gray-800/50 rounded text-sm">
                  <div className="text-gray-400 mb-1">캐시 상태</div>
                  <div className="font-mono text-xs">
                    {typeof window !== 'undefined' && sessionStorage.getItem('advancedImagesLoaded') === 'true'
                      ? '✅ 세션 캐시됨'
                      : '❌ 캐시 없음'}
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-2 pt-2 border-t border-gray-600">
                <button
                  className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('advancedImagesLoaded');
                      sessionStorage.removeItem('loadedImagesCount');
                      window.location.reload();
                    }
                  }}
                >
                  캐시 클리어
                </button>
                <button
                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                  onClick={() => window.location.reload()}
                >
                  새로고침
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

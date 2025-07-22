'use client';

import { useEffect, useState, useCallback } from 'react';

import { useMemoryMonitor } from '@/utils/memory-optimization';

interface MemoryStats {
  used: number;
  total: number;
  limit: number;
  percentage: number;
}

interface MemoryMonitorProps {
  enabled?: boolean;
  interval?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export const MemoryMonitor = ({
  enabled = process.env.NODE_ENV === 'development',
  interval = 5000,
  warningThreshold = 70,
  criticalThreshold = 85,
}: MemoryMonitorProps) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { checkMemory } = useMemoryMonitor();

  const updateMemoryStats = useCallback(() => {
    const stats = checkMemory();
    if (stats) {
      setMemoryStats(stats);

      // 경고 레벨에 따라 자동으로 모니터 표시
      if (stats.percentage >= warningThreshold) {
        setIsVisible(true);
      }
    }
  }, [checkMemory, warningThreshold]);

  useEffect(() => {
    if (!enabled) return;

    // 초기 메모리 상태 확인
    updateMemoryStats();

    const intervalId = setInterval(updateMemoryStats, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, updateMemoryStats]);

  // 키보드 단축키로 모니터 토글 (개발 환경에서만)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        setIsVisible((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [enabled]);

  if (!enabled || !memoryStats) return null;

  const getStatusColor = () => {
    if (memoryStats.percentage >= criticalThreshold) return 'text-red-400 bg-red-900/20 border-red-500/30';
    if (memoryStats.percentage >= warningThreshold) return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
    return 'text-green-400 bg-green-900/20 border-green-500/30';
  };

  const getStatusIcon = () => {
    if (memoryStats.percentage >= criticalThreshold) return '🚨';
    if (memoryStats.percentage >= warningThreshold) return '⚠️';
    return '✅';
  };

  // 경고 레벨 이하일 때는 간소한 표시
  if (!isVisible && memoryStats.percentage < warningThreshold) {
    return (
      <div className="fixed top-4 right-4 z-50 cursor-pointer" onClick={() => setIsVisible(true)}>
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-slate-400 border border-slate-600/50">
          {memoryStats.percentage.toFixed(1)}%
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`backdrop-blur-sm rounded-lg p-3 border ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <span className="font-bold text-sm">메모리 사용량</span>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>사용중:</span>
            <span className="font-mono">{memoryStats.used}MB</span>
          </div>
          <div className="flex justify-between">
            <span>전체:</span>
            <span className="font-mono">{memoryStats.total}MB</span>
          </div>
          <div className="flex justify-between">
            <span>한계:</span>
            <span className="font-mono">{memoryStats.limit}MB</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>사용률:</span>
            <span className="font-mono">{memoryStats.percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* 메모리 사용률 바 */}
        <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              memoryStats.percentage >= criticalThreshold
                ? 'bg-red-500'
                : memoryStats.percentage >= warningThreshold
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(memoryStats.percentage, 100)}%` }}
          />
        </div>

        {/* 경고 메시지 */}
        {memoryStats.percentage >= criticalThreshold && (
          <div className="mt-2 text-xs text-red-300">메모리 사용량이 매우 높습니다!</div>
        )}

        {/* 도움말 */}
        <div className="mt-2 text-xs text-slate-500">Ctrl+Shift+M으로 토글</div>
      </div>
    </div>
  );
};

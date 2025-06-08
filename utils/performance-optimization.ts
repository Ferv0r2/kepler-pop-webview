import { useCallback, useMemo, useRef } from 'react';

import type { GridItem } from '@/types/game-types';

export const useOptimizedGridRendering = (grid: GridItem[][]) => {
  const previousGridRef = useRef<GridItem[][]>([]);

  return useMemo(() => {
    const currentGrid = grid;
    const previousGrid = previousGridRef.current;

    let hasChanges = false;

    // 그리드 변경 감지 최적화
    if (previousGrid.length === currentGrid.length && previousGrid.length > 0) {
      for (let row = 0; row < currentGrid.length && !hasChanges; row++) {
        for (let col = 0; col < currentGrid[row].length && !hasChanges; col++) {
          const current = currentGrid[row][col];
          const previous = previousGrid[row]?.[col];

          // 타일의 실제 변경점만 추적
          if (
            !previous ||
            current.id !== previous.id ||
            current.type !== previous.type ||
            current.tier !== previous.tier ||
            current.isMatched !== previous.isMatched
          ) {
            hasChanges = true;
          }
        }
      }
    } else {
      hasChanges = true;
    }

    previousGridRef.current = currentGrid;

    return {
      grid: currentGrid,
      hasChanges,
    };
  }, [grid]);
};

export const useBatchedUpdates = () => {
  const batchQueueRef = useRef<Array<() => void>>([]);
  const isScheduledRef = useRef(false);

  const flushBatch = useCallback(() => {
    const batch = batchQueueRef.current;
    batchQueueRef.current = [];
    isScheduledRef.current = false;

    // 모든 업데이트를 한 번에 실행
    batch.forEach((update) => update());
  }, []);

  const batchUpdate = useCallback(
    (update: () => void) => {
      batchQueueRef.current.push(update);

      if (!isScheduledRef.current) {
        isScheduledRef.current = true;
        // 다음 프레임에서 배치 실행
        requestAnimationFrame(flushBatch);
      }
    },
    [flushBatch],
  );

  return batchUpdate;
};

// 애니메이션 프레임 스케줄러
export const useAnimationScheduler = () => {
  const animationQueueRef = useRef<Array<{ callback: () => void; priority: number }>>([]);
  const isRunningRef = useRef(false);

  const scheduleAnimation = useCallback((callback: () => void, priority = 0) => {
    animationQueueRef.current.push({ callback, priority });
    animationQueueRef.current.sort((a, b) => b.priority - a.priority);

    if (!isRunningRef.current) {
      isRunningRef.current = true;

      const processQueue = () => {
        const start = performance.now();
        const FRAME_BUDGET = 16; // 16ms 예산

        while (animationQueueRef.current.length > 0 && performance.now() - start < FRAME_BUDGET) {
          const item = animationQueueRef.current.shift();
          if (item) {
            item.callback();
          }
        }

        if (animationQueueRef.current.length > 0) {
          requestAnimationFrame(processQueue);
        } else {
          isRunningRef.current = false;
        }
      };

      requestAnimationFrame(processQueue);
    }
  }, []);

  return scheduleAnimation;
};

export const useSimpleDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);

  // 최신 콜백 참조 유지
  callbackRef.current = callback;

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);
  }, [delay]);
};

// 렌더링 성능 측정
export const useRenderPerformance = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);

  useMemo(() => {
    renderCountRef.current++;
    const now = performance.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[${componentName}] Render #${renderCountRef.current}, Time since last: ${(now - lastRenderTimeRef.current).toFixed(2)}ms`,
      );
    }

    lastRenderTimeRef.current = now;
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
  };
};

// GPU 가속 스타일 최적화
export const getOptimizedStyles = (shouldAnimate: boolean) => ({
  transform: shouldAnimate ? 'translateZ(0)' : undefined,
  willChange: shouldAnimate ? 'transform, opacity' : 'auto',
  backfaceVisibility: 'hidden' as const,
  perspective: shouldAnimate ? 1000 : undefined,
});

// 간단한 메모이제이션 캐시
export const createMemoCache = <T>() => {
  const cache = new Map<string, T>();

  return {
    get: (key: string): T | undefined => cache.get(key),
    set: (key: string, value: T): void => {
      cache.set(key, value);
      // 캐시 크기 제한 (메모리 누수 방지)
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        if (firstKey) {
          cache.delete(firstKey);
        }
      }
    },
    clear: (): void => cache.clear(),
    size: (): number => cache.size,
  };
};

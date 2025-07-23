import { useMemo, useCallback, useRef, useEffect } from 'react';

import type { GridItem } from '@/types/game-types';

interface OptimizedGridRenderingOptions {
  enabled?: boolean;
  maxRenderTime?: number; // ms
  chunkSize?: number;
}

interface GridRenderState {
  renderedChunks: Set<string>;
  visibleRange: { start: number; end: number };
  lastRenderTime: number;
}

export const useOptimizedGridRendering = (grid: GridItem[][], options: OptimizedGridRenderingOptions = {}) => {
  const {
    enabled = true,
    maxRenderTime = 16, // 60fps를 위한 16ms 제한
    chunkSize = 25,
  } = options;

  const renderStateRef = useRef<GridRenderState>({
    renderedChunks: new Set(),
    visibleRange: { start: 0, end: 0 },
    lastRenderTime: 0,
  });

  const gridCacheRef = useRef<Map<string, GridItem[][]>>(new Map());
  const renderMetricsRef = useRef({
    totalRenderTime: 0,
    renderCount: 0,
    skippedFrames: 0,
  });

  const gridHash = useMemo(() => {
    if (!enabled || !grid.length) return '';

    const startTime = performance.now();
    const hash = grid
      .map((row) => row.map((item) => `${item.id}-${item.type}-${item.tier}-${item.isMatched}`).join(','))
      .join('|');

    const endTime = performance.now();
    renderMetricsRef.current.totalRenderTime += endTime - startTime;

    return hash;
  }, [grid, enabled]);

  const cachedGrid = useMemo(() => {
    if (!enabled) return grid;

    const cached = gridCacheRef.current.get(gridHash);
    if (cached) return cached;

    const startTime = performance.now();
    const optimizedGrid = structuredClone(grid);
    const endTime = performance.now();

    const MAX_CACHE_SIZE = 5;
    if (gridCacheRef.current.size >= MAX_CACHE_SIZE) {
      const firstKey = gridCacheRef.current.keys().next().value;
      if (firstKey) {
        gridCacheRef.current.delete(firstKey);
      }
    }

    gridCacheRef.current.set(gridHash, optimizedGrid);
    renderMetricsRef.current.totalRenderTime += endTime - startTime;
    renderMetricsRef.current.renderCount++;

    return optimizedGrid;
  }, [grid, gridHash, enabled]);

  // 가시 영역 계산
  const getVisibleRange = useCallback(
    (viewportStart: number = 0, viewportEnd: number = grid.length * (grid[0]?.length || 0)) => {
      const totalItems = grid.length * (grid[0]?.length || 0);
      const start = Math.max(0, Math.floor(viewportStart / chunkSize) * chunkSize);
      const end = Math.min(totalItems, Math.ceil(viewportEnd / chunkSize) * chunkSize);

      return { start, end };
    },
    [grid, chunkSize],
  );

  // 청크 단위 렌더링
  const renderChunks = useCallback(
    (startIndex: number = 0, endIndex: number = grid.length * (grid[0]?.length || 0)) => {
      if (!enabled) return cachedGrid.flat();

      const startTime = performance.now();
      const visibleItems: GridItem[] = [];
      const flatGrid = cachedGrid.flat();

      for (let i = startIndex; i < Math.min(endIndex, flatGrid.length); i += chunkSize) {
        const chunkEnd = Math.min(i + chunkSize, flatGrid.length);
        const chunk = flatGrid.slice(i, chunkEnd);
        visibleItems.push(...chunk);

        // 시간 제한 체크
        if (performance.now() - startTime > maxRenderTime) {
          renderMetricsRef.current.skippedFrames++;
          break;
        }
      }

      const endTime = performance.now();
      renderMetricsRef.current.totalRenderTime += endTime - startTime;

      return visibleItems;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cachedGrid, enabled, chunkSize, maxRenderTime],
  );

  // 그리드 업데이트 감지
  const updateGridHash = useCallback(
    (newGrid: GridItem[][]) => {
      if (!enabled) return;

      const newHash = newGrid
        .map((row) => row.map((item) => `${item.id}-${item.type}-${item.tier}-${item.isMatched}`).join(','))
        .join('|');

      if (newHash !== gridHash) {
        renderStateRef.current.renderedChunks.clear();
      }
    },
    [enabled, gridHash],
  );

  // 렌더링 최적화를 위한 shouldUpdate 함수
  const shouldUpdateTile = useCallback(
    (item: GridItem, prevItem?: GridItem): boolean => {
      if (!enabled || !prevItem) return true;

      return (
        item.id !== prevItem.id ||
        item.type !== prevItem.type ||
        item.tier !== prevItem.tier ||
        item.isMatched !== prevItem.isMatched
      );
    },
    [enabled],
  );

  // 그리드 행을 청크로 분할
  const getGridChunks = useCallback(
    (startRow: number = 0, endRow: number = grid.length) => {
      if (!enabled) return grid.slice(startRow, endRow);

      const chunks: GridItem[][][] = [];
      const rowChunkSize = Math.ceil(chunkSize / (grid[0]?.length || 1));

      for (let i = startRow; i < endRow; i += rowChunkSize) {
        const chunkEnd = Math.min(i + rowChunkSize, endRow);
        chunks.push(grid.slice(i, chunkEnd));
      }

      return chunks;
    },
    [grid, enabled, chunkSize],
  );

  // 성능 메트릭 리셋
  const resetMetrics = useCallback(() => {
    renderMetricsRef.current = {
      totalRenderTime: 0,
      renderCount: 0,
      skippedFrames: 0,
    };
    gridCacheRef.current.clear();
    renderStateRef.current.renderedChunks.clear();
  }, []);

  // 그리드 변경 시 캐시 정리
  useEffect(() => {
    updateGridHash(grid);
  }, [grid, updateGridHash]);

  // 성능 메트릭 반환
  const getPerformanceMetrics = useCallback(() => {
    const metrics = renderMetricsRef.current;
    return {
      averageRenderTime: metrics.renderCount > 0 ? metrics.totalRenderTime / metrics.renderCount : 0,
      totalRenderTime: metrics.totalRenderTime,
      renderCount: metrics.renderCount,
      skippedFrames: metrics.skippedFrames,
      cacheSize: gridCacheRef.current.size,
      lastRenderTime: renderStateRef.current.lastRenderTime,
    };
  }, []);

  return {
    optimizedGrid: cachedGrid,

    // 렌더링 함수들
    renderChunks,
    getGridChunks,
    getVisibleRange,
    shouldUpdateTile,

    // 유틸리티
    resetMetrics,
    getPerformanceMetrics,

    // 상태
    isOptimizationEnabled: enabled,
    gridHash,
  };
};

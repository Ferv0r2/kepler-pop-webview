import type { GridItem, TileType } from '@/types/game-types';

/**
 * 그리드 깊은 복사 함수
 * 웹 워커에서도 사용 가능하도록 외부 의존성 제거
 */
export const deepCopyGrid = (grid: GridItem[][]): GridItem[][] => {
  const newGrid: GridItem[][] = new Array(grid.length);

  for (let i = 0; i < grid.length; i++) {
    const row = grid[i];
    const newRow: GridItem[] = new Array(row.length);
    for (let j = 0; j < row.length; j++) {
      const item = row[j];
      // 필수 필드만 복사하여 메모리 절약
      newRow[j] = {
        id: item.id,
        type: item.type,
        isMatched: item.isMatched,
        createdIndex: item.createdIndex,
        turn: item.turn,
        tier: item.tier,
      };
    }
    newGrid[i] = newRow;
  }

  return newGrid;
};

/**
 * 매치 탐지 알고리즘
 */
export const findMatches = (grid: GridItem[][]): Array<{ row: number; col: number }> => {
  const matches: Array<{ row: number; col: number }> = [];
  const gridSize = grid.length;

  if (gridSize === 0 || !grid[0]) return matches;

  // 가로 매치 찾기
  for (let row = 0; row < gridSize; row++) {
    let count = 1;
    let currentType = grid[row][0]?.type;
    let currentTier = grid[row][0]?.tier;

    for (let col = 1; col < gridSize; col++) {
      const cell = grid[row][col];
      if (cell?.type === currentType && cell?.tier === currentTier && !cell.isMatched) {
        count++;
      } else {
        if (count >= 3) {
          // 매치된 타일들을 결과에 추가
          for (let i = col - count; i < col; i++) {
            matches.push({ row, col: i });
          }
        }
        count = 1;
        currentType = cell?.type;
        currentTier = cell?.tier;
      }
    }

    // 마지막 그룹 체크
    if (count >= 3) {
      for (let i = gridSize - count; i < gridSize; i++) {
        matches.push({ row, col: i });
      }
    }
  }

  // 세로 매치 찾기
  for (let col = 0; col < gridSize; col++) {
    let count = 1;
    let currentType = grid[0][col]?.type;
    let currentTier = grid[0][col]?.tier;

    for (let row = 1; row < gridSize; row++) {
      const cell = grid[row][col];
      if (cell?.type === currentType && cell?.tier === currentTier && !cell.isMatched) {
        count++;
      } else {
        if (count >= 3) {
          // 매치된 타일들을 결과에 추가
          for (let i = row - count; i < row; i++) {
            matches.push({ row: i, col });
          }
        }
        count = 1;
        currentType = cell?.type;
        currentTier = cell?.tier;
      }
    }

    // 마지막 그룹 체크
    if (count >= 3) {
      for (let i = gridSize - count; i < gridSize; i++) {
        matches.push({ row: i, col });
      }
    }
  }

  return matches;
};

/**
 * 가능한 움직임 탐지 함수
 */
export const findPossibleMoves = (
  grid: GridItem[][],
): Array<{
  from: { row: number; col: number };
  to: { row: number; col: number };
}> => {
  const moves: Array<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  }> = [];
  const gridSize = grid.length;

  if (gridSize === 0) return moves;

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1], // 상, 하, 좌, 우
  ];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!grid[row][col]) continue;

      for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize && grid[newRow][newCol]) {
          // 가상 스왑 시뮬레이션
          [grid[row][col], grid[newRow][newCol]] = [grid[newRow][newCol], grid[row][col]];

          const hasMatches = findMatches(grid).length > 0;

          // 원상복구
          [grid[row][col], grid[newRow][newCol]] = [grid[newRow][newCol], grid[row][col]];

          if (hasMatches) {
            moves.push({
              from: { row, col },
              to: { row: newRow, col: newCol },
            });
          }
        }
      }
    }
  }

  return moves;
};

/**
 * 새로운 타일을 생성하는 함수
 */
export const createNewTile = (): GridItem => {
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: (Math.floor(Math.random() * 6) + 1) as TileType,
    tier: 1,
    isMatched: false,
    createdIndex: 0,
    turn: 0,
  };
};

/**
 * 그리드의 빈 공간을 채우는 함수
 */
export const fillEmptySpaces = (grid: GridItem[][], emptyValue: GridItem | null = null): GridItem[][] => {
  const newGrid = deepCopyGrid(grid);
  const rows = newGrid.length;
  const cols = newGrid[0]?.length || 0;

  for (let col = 0; col < cols; col++) {
    const column = [];

    // 빈 공간이 아닌 아이템들만 수집
    for (let row = rows - 1; row >= 0; row--) {
      if (newGrid[row][col] && newGrid[row][col] !== emptyValue) {
        column.push(newGrid[row][col]);
      }
    }

    // 컬럼을 다시 채우기
    for (let row = rows - 1; row >= 0; row--) {
      if (column.length > 0) {
        newGrid[row][col] = column.shift()!;
      } else {
        // 새로운 랜덤 타일 생성
        newGrid[row][col] = createNewTile();
      }
    }
  }

  return newGrid;
};

/**
 * 성능 측정을 위한 유틸리티 함수
 */
export const measurePerformance = <T>(fn: () => T, label: string): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (process.env.NODE_ENV === 'development') {
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

/**
 * 메모리 사용량 측정 함수
 */
export const getMemoryUsage = (): {
  used: number;
  total: number;
  percentage: number;
} | null => {
  if ('memory' in performance) {
    const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
    };
  }
  return null;
};

/**
 * 디바운스 함수
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 스로틀 함수
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 배열을 청크 단위로 처리하는 함수
 */
export const processInChunks = async <T>(
  items: T[],
  processor: (chunk: T[]) => Promise<void> | void,
  chunkSize: number = 10,
): Promise<void> => {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await processor(chunk);

    // 다음 청크 처리 전에 브라우저에 제어권 양보
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

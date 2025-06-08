import { COMBO_BONUS } from '@/screens/GameView/constants/game-config';
import { GridItem } from '@/types/game-types';

export { deepCopyGrid } from '@/utils/performance-helper';

// 인플레이스 그리드 수정 함수 (복사 없이)
export const markTileAsMatched = (grid: GridItem[][], row: number, col: number): void => {
  grid[row][col].isMatched = true;
};

export const markTilesAsMatched = (grid: GridItem[][], positions: { row: number; col: number }[]): void => {
  for (const { row, col } of positions) {
    grid[row][col].isMatched = true;
  }
};

// 그리드 영역만 복사하는 최적화된 함수
export const copyGridRegion = (
  grid: GridItem[][],
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
): GridItem[][] => {
  const newGrid: GridItem[][] = [];
  for (let i = startRow; i <= endRow; i++) {
    const newRow: GridItem[] = [];
    for (let j = startCol; j <= endCol; j++) {
      const item = grid[i][j];
      newRow.push({
        id: item.id,
        type: item.type,
        isMatched: item.isMatched,
        createdIndex: item.createdIndex,
        turn: item.turn,
        tier: item.tier,
      });
    }
    newGrid.push(newRow);
  }
  return newGrid;
};

// 빠른 그리드 검증 함수
export const hasMatchedTiles = (grid: GridItem[][]): boolean => {
  for (let i = 0; i < grid.length; i++) {
    const row = grid[i];
    for (let j = 0; j < row.length; j++) {
      if (row[j].isMatched) return true;
    }
  }
  return false;
};

// 배치된 타일 업데이트
export const batchUpdateTiles = (
  grid: GridItem[][],
  updates: Array<{ row: number; col: number; changes: Partial<GridItem> }>,
): void => {
  for (const { row, col, changes } of updates) {
    const tile = grid[row][col];
    Object.assign(tile, changes);
  }
};

export const calculateComboBonus = (combo: number): number => {
  if (combo < COMBO_BONUS.MIN_COMBO) return 0;
  if (combo >= COMBO_BONUS.MAX_COMBO) return COMBO_BONUS.MAX_BONUS;

  const progress = (combo - COMBO_BONUS.MIN_COMBO) / (COMBO_BONUS.MAX_COMBO - COMBO_BONUS.MIN_COMBO);
  return Math.floor(progress * COMBO_BONUS.MAX_BONUS) + 1;
};

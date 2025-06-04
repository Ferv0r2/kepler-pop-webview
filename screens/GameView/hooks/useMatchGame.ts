import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { GRID_SIZE, MIN_MATCH_COUNT } from '@/screens/GameView/constants/game-config';
import { GridItem, TileType } from '@/types/game-types';

export interface UseMatchGameReturn {
  grid: GridItem[][];
  setGrid: (grid: GridItem[][]) => void;
  getRandomItemType: () => TileType;
  createInitialGrid: () => GridItem[][];
  findMatches: (currentGrid: GridItem[][]) => { row: number; col: number }[];
  findPossibleMove: () => { row1: number; col1: number; row2: number; col2: number } | null;
}

export const useMatchGame = (): UseMatchGameReturn => {
  const [grid, setGrid] = useState<GridItem[][]>([]);

  // 랜덤 아이템 생성 함수
  const getRandomItemType = (): TileType => {
    return (Math.floor(Math.random() * 6) + 1) as TileType;
  };

  // 초기 그리드 생성 함수 (매치가 없는 상태로 시작)
  const createInitialGrid = (): GridItem[][] => {
    const grid: GridItem[][] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      const newRow: GridItem[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        let itemType: TileType;
        do {
          itemType = getRandomItemType();
        } while (
          // 가로 매치 체크
          (col >= 2 && newRow[col - 1]?.type === itemType && newRow[col - 2]?.type === itemType) ||
          // 세로 매치 체크
          (row >= 2 && grid[row - 1][col]?.type === itemType && grid[row - 2][col]?.type === itemType)
        );
        newRow.push({
          id: `${row}-${col}-${uuidv4()}`,
          type: itemType,
          isMatched: false,
          createdIndex: 0,
          turn: 0,
          tier: 1,
        });
      }
      grid.push(newRow);
    }

    return grid;
  };

  const findMatches = (currentGrid: GridItem[][]): { row: number; col: number }[] => {
    const matches: { row: number; col: number }[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const currentTile = currentGrid[row][col];
        if (
          currentTile.type === currentGrid[row][col + 1].type &&
          currentTile.type === currentGrid[row][col + 2].type &&
          currentTile.tier === currentGrid[row][col + 1].tier &&
          currentTile.tier === currentGrid[row][col + 2].tier
        ) {
          let matchLength = MIN_MATCH_COUNT;
          while (
            col + matchLength < GRID_SIZE &&
            currentGrid[row][col + matchLength].type === currentTile.type &&
            currentGrid[row][col + matchLength].tier === currentTile.tier
          ) {
            matchLength++;
          }
          for (let i = 0; i < matchLength; i++) {
            matches.push({ row, col: col + i });
          }
          col += matchLength - 1;
        }
      }
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const currentTile = currentGrid[row][col];
        if (
          currentTile.type === currentGrid[row + 1][col].type &&
          currentTile.type === currentGrid[row + 2][col].type &&
          currentTile.tier === currentGrid[row + 1][col].tier &&
          currentTile.tier === currentGrid[row + 2][col].tier
        ) {
          let matchLength = MIN_MATCH_COUNT;
          while (
            row + matchLength < GRID_SIZE &&
            currentGrid[row + matchLength][col].type === currentTile.type &&
            currentGrid[row + matchLength][col].tier === currentTile.tier
          ) {
            matchLength++;
          }
          for (let i = 0; i < matchLength; i++) {
            matches.push({ row: row + i, col });
          }
          row += matchLength - 1;
        }
      }
    }

    return matches;
  };

  // 특정 위치(row, col)에서 가로/세로로 3개 이상 연속되는지 검사
  const findMatchesAt = (currentGrid: GridItem[][], row: number, col: number): boolean => {
    const type = currentGrid[row][col].type;
    const tier = currentGrid[row][col].tier;

    // 가로 검사
    let count = 1;
    // 왼쪽
    for (let c = col - 1; c >= 0; c--) {
      if (currentGrid[row][c].type === type && currentGrid[row][c].tier === tier) count++;
      else break;
    }
    // 오른쪽
    for (let c = col + 1; c < GRID_SIZE; c++) {
      if (currentGrid[row][c].type === type && currentGrid[row][c].tier === tier) count++;
      else break;
    }
    if (count >= MIN_MATCH_COUNT) return true;

    // 세로 검사
    count = 1;
    // 위
    for (let r = row - 1; r >= 0; r--) {
      if (currentGrid[r][col].type === type && currentGrid[r][col].tier === tier) count++;
      else break;
    }
    // 아래
    for (let r = row + 1; r < GRID_SIZE; r++) {
      if (currentGrid[r][col].type === type && currentGrid[r][col].tier === tier) count++;
      else break;
    }
    if (count >= MIN_MATCH_COUNT) return true;

    return false;
  };

  const findPossibleMove = useCallback((): { row1: number; col1: number; row2: number; col2: number } | null => {
    // deepCopyGrid 없이, swap 후 검사, 원상복구
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // 오른쪽과 swap
        if (col < GRID_SIZE - 1) {
          [grid[row][col], grid[row][col + 1]] = [grid[row][col + 1], grid[row][col]];
          if (findMatchesAt(grid, row, col) || findMatchesAt(grid, row, col + 1)) {
            [grid[row][col], grid[row][col + 1]] = [grid[row][col + 1], grid[row][col]];
            return { row1: row, col1: col, row2: row, col2: col + 1 };
          }
          [grid[row][col], grid[row][col + 1]] = [grid[row][col + 1], grid[row][col]];
        }
        // 아래와 swap
        if (row < GRID_SIZE - 1) {
          [grid[row][col], grid[row + 1][col]] = [grid[row + 1][col], grid[row][col]];
          if (findMatchesAt(grid, row, col) || findMatchesAt(grid, row + 1, col)) {
            [grid[row][col], grid[row + 1][col]] = [grid[row + 1][col], grid[row][col]];
            return { row1: row, col1: col, row2: row + 1, col2: col };
          }
          [grid[row][col], grid[row + 1][col]] = [grid[row + 1][col], grid[row][col]];
        }
      }
    }
    return null;
  }, [grid]);

  return {
    grid,
    setGrid,
    getRandomItemType,
    createInitialGrid,
    findMatches,
    findPossibleMove,
  };
};

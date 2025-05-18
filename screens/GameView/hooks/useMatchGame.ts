import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { GRID_SIZE, MIN_MATCH_COUNT } from '@/screens/GameView/constants/game-config';
import { GridItem, TileType } from '@/types/game-types';
import { deepCopyGrid } from '@/utils/game-helper';

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

  const findPossibleMove = useCallback((): { row1: number; col1: number; row2: number; col2: number } | null => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (col < GRID_SIZE - 1) {
          const tempGrid = deepCopyGrid(grid);
          const temp = { ...tempGrid[row][col] };
          tempGrid[row][col] = { ...tempGrid[row][col + 1] };
          tempGrid[row][col + 1] = temp;

          if (findMatches(tempGrid).length > 0) {
            return { row1: row, col1: col, row2: row, col2: col + 1 };
          }
        }

        if (row < GRID_SIZE - 1) {
          const tempGrid = deepCopyGrid(grid);
          const temp = { ...tempGrid[row][col] };
          tempGrid[row][col] = { ...tempGrid[row + 1][col] };
          tempGrid[row + 1][col] = temp;

          if (findMatches(tempGrid).length > 0) {
            return { row1: row, col1: col, row2: row + 1, col2: col };
          }
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

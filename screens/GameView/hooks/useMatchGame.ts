import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { GRID_SIZE, MIN_MATCH_COUNT } from '@/screens/GameView/constants/game-config';
import { GridItem, TileType, TierType, Artifact } from '@/types/game-types';
import { findMatches } from '@/utils/performance-helper';

export interface UseMatchGameReturn {
  grid: GridItem[][];
  setGrid: (grid: GridItem[][]) => void;
  getRandomItemType: () => TileType;
  createInitialGrid: () => GridItem[][];
  findMatches: (currentGrid: GridItem[][]) => { row: number; col: number }[];
  findPossibleMove: () => { row1: number; col1: number; row2: number; col2: number } | null;
  // 새로운 확률 기반 효과 함수들
  applyProbabilityEffects: (
    matches: { row: number; col: number }[],
    currentGrid: GridItem[][],
    activeArtifacts: Artifact[],
  ) => GridItem[][];
  processSpecialTileEffects: (currentGrid: GridItem[][], activeArtifacts: Artifact[]) => GridItem[][];
}

export const useMatchGame = (): UseMatchGameReturn => {
  const [grid, setGrid] = useState<GridItem[][]>([]);

  // 확률 계산 헬퍼 함수
  const rollProbability = (chance: number): boolean => {
    return Math.random() < chance / 100;
  };

  // 인접한 타일들 가져오기
  const getAdjacentTiles = (row: number, col: number): { row: number; col: number }[] => {
    const adjacent = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1], // 상하좌우
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        adjacent.push({ row: newRow, col: newCol });
      }
    }
    return adjacent;
  };

  // 랜덤 아이템 생성 함수
  const getRandomItemType = (): TileType => {
    return (Math.floor(Math.random() * 5) + 1) as TileType;
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
    // 그리드가 초기화되지 않았으면 null 반환
    if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) {
      return null;
    }

    // cloneDeep 없이, swap 후 검사, 원상복구
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

  // 확률 기반 유물 효과 적용
  const applyProbabilityEffects = useCallback(
    (matches: { row: number; col: number }[], currentGrid: GridItem[][], activeArtifacts: Artifact[]): GridItem[][] => {
      const newGrid = structuredClone(currentGrid);

      matches.forEach(({ row, col }) => {
        const tile = newGrid[row][col];
        if (!tile) return;

        activeArtifacts.forEach((artifact) => {
          if (!artifact.isActive || artifact.effect.type !== 'probability_modifier') return;

          // 색채 폭탄: 매치 시 20% 확률로 인접 타일이 같은 타입으로 변환
          if (artifact.effect.condition === 'convert_adjacent' && rollProbability(artifact.effect.value)) {
            const adjacentTiles = getAdjacentTiles(row, col);
            adjacentTiles.forEach(({ row: adjRow, col: adjCol }) => {
              if (newGrid[adjRow] && newGrid[adjRow][adjCol]) {
                newGrid[adjRow][adjCol].type = tile.type;
              }
            });
          }

          // 진화 촉진제: 2등급 타일 매치 시 50% 확률로 3등급으로 즉시 승급
          if (
            artifact.effect.condition === 'tier_2_to_3' &&
            tile.tier === 2 &&
            rollProbability(artifact.effect.value)
          ) {
            tile.tier = 3 as TierType;
          }

          // 유성의 축복 (기존 유물 강화): 1등급 타일 매치 시 10% 확률로 3등급 승급
          if (
            artifact.effect.condition === 'tier_upgrade' &&
            tile.tier === 1 &&
            rollProbability(artifact.effect.value * 100) // 0.1을 10%로 변환
          ) {
            tile.tier = 3 as TierType;
          }

          // 변이 유발기: 10% 확률로 랜덤 타일 1개가 다른 타입으로 변환
          if (artifact.effect.condition === 'random_mutation' && rollProbability(artifact.effect.value)) {
            const randomRow = Math.floor(Math.random() * GRID_SIZE);
            const randomCol = Math.floor(Math.random() * GRID_SIZE);
            if (newGrid[randomRow] && newGrid[randomRow][randomCol]) {
              newGrid[randomRow][randomCol].type = getRandomItemType();
            }
          }
        });
      });

      return newGrid;
    },
    [getRandomItemType, getAdjacentTiles, rollProbability],
  );

  // 특수 타일 효과 처리 (매치 후 추가 생성 등)
  const processSpecialTileEffects = useCallback(
    (currentGrid: GridItem[][], activeArtifacts: Artifact[]): GridItem[][] => {
      const newGrid = structuredClone(currentGrid);

      // 타일 복제기: 3등급 타일 생성 시 30% 확률로 동일 타일 1개 추가 생성
      const duplicatorArtifact = activeArtifacts.find((a) => a.isActive && a.effect.condition === 'duplicate_tier_3');

      if (duplicatorArtifact) {
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            const tile = newGrid[row][col];
            if (tile && tile.tier === 3 && rollProbability(duplicatorArtifact.effect.value)) {
              // 빈 공간을 찾아 동일한 타일 생성
              const emptySpaces = [];
              for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                  if (!newGrid[r][c] || newGrid[r][c].isMatched) {
                    emptySpaces.push({ row: r, col: c });
                  }
                }
              }

              if (emptySpaces.length > 0) {
                const randomEmpty = emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
                newGrid[randomEmpty.row][randomEmpty.col] = {
                  id: `duplicated-${randomEmpty.row}-${randomEmpty.col}-${Date.now()}`,
                  type: tile.type,
                  tier: tile.tier,
                  isMatched: false,
                  createdIndex: 0,
                  turn: 0,
                };
              }
            }
          }
        }
      }

      return newGrid;
    },
    [rollProbability],
  );

  return {
    grid,
    setGrid,
    getRandomItemType,
    createInitialGrid,
    findMatches,
    findPossibleMove,
    // 새로운 확률 기반 효과 함수들
    applyProbabilityEffects,
    processSpecialTileEffects,
  };
};

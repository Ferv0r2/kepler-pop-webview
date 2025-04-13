import { v4 as uuidv4 } from 'uuid';

import { GRID_SIZE } from '@/constants/game-config';
import { GridItem, ItemType } from '@/types/game-types';

export const useMatchGame = () => {
  // 랜덤 아이템 생성 함수
  const getRandomItemType = (): ItemType => {
    return (Math.floor(Math.random() * 6) + 1) as ItemType;
  };

  // 초기 그리드 생성 함수 (매치가 없는 상태로 시작)
  const createInitialGrid = (): GridItem[][] => {
    const grid: GridItem[][] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      const newRow: GridItem[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        let itemType: ItemType;
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
  return {
    getRandomItemType,
    createInitialGrid,
  };
};

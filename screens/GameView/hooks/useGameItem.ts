'use client';

import { useState } from 'react';

import { DIRECTIONS } from '@/screens/GameView/constants/game-config';
import type { GameItem, GameItemType, GridItem, ItemAnimation, Artifact } from '@/types/game-types';

// 아이템 초기 설정을 상수로 분리
const INITIAL_GAME_ITEMS: GameItem[] = [
  {
    id: 'shovel',
    count: 0,
    icon: '/icons/shovel.png',
  },
  {
    id: 'mole',
    count: 0,
    icon: '/icons/mole.png',
  },
  {
    id: 'bomb',
    count: 0,
    icon: '/icons/bomb.png',
  },
];

export interface UseGameItemReturn {
  gameItems: GameItem[];
  selectedGameItem: GameItemType | null;
  isItemAnimating: boolean;
  itemAnimation: {
    type: GameItemType;
    row: number;
    col: number;
    direction?: 'row' | 'col';
    left?: number;
    top?: number;
  } | null;
  setSelectedGameItem: (itemId: GameItemType | null) => void;
  setItemAnimation: (itemAnimation: ItemAnimation | null) => void;
  setIsItemAnimating: (isAnimating: boolean) => void;
  executeItem: (grid: GridItem[][]) => { grid: GridItem[][]; consumed: boolean } | void;
  executeItemDirect: (
    grid: GridItem[][],
    itemType: GameItemType,
    row: number,
    col: number,
    direction?: 'row' | 'col',
    activeArtifacts?: Artifact[],
  ) => { grid: GridItem[][]; consumed: boolean } | void;
  addItem: (itemId: GameItemType, amount?: number) => void;
  clearItemAnimation: () => void;
  resetItems: () => void;
  // 새로운 아이템 강화 효과 함수들
  applyItemEnhancements: (
    itemType: GameItemType,
    activeArtifacts: Artifact[],
  ) => {
    enhanced: boolean;
    rangeMultiplier: number;
    shouldConsume: boolean;
  };
}

export const useGameItem = (): UseGameItemReturn => {
  const [gameItems, setGameItems] = useState<GameItem[]>(INITIAL_GAME_ITEMS);
  const [selectedGameItem, setSelectedGameItem] = useState<GameItemType | null>(null);
  const [isItemAnimating, setIsItemAnimating] = useState<boolean>(false);
  const [itemAnimation, setItemAnimation] = useState<ItemAnimation | null>(null);

  const itemEffects: Record<
    GameItemType,
    (grid: GridItem[][], row: number, col: number, direction?: 'row' | 'col') => GridItem[][]
  > = {
    shovel: (grid, row, col) => {
      return removeTile(grid, row, col);
    },
    mole: (grid, row, col, direction) => {
      if (direction === 'row') {
        return removeRow(grid, row);
      } else {
        return removeCol(grid, col);
      }
    },
    bomb: (grid, row, col) => {
      return removeAdjacentTiles(grid, row, col);
    },
  };

  const executeItem = (grid: GridItem[][]) => {
    if (!itemAnimation) {
      return;
    }
    const { type, row, col, direction } = itemAnimation;
    return executeItemDirect(grid, type, row, col, direction);
  };

  const executeItemDirect = (
    grid: GridItem[][],
    itemType: GameItemType,
    row: number,
    col: number,
    direction?: 'row' | 'col',
    activeArtifacts: Artifact[] = [],
  ) => {
    const itemIndex = gameItems.findIndex((item) => item.id === itemType);
    if (itemIndex === -1 || gameItems[itemIndex].count <= 0) {
      return;
    }

    // 아이템 강화 효과 체크
    const enhancements = applyItemEnhancements(itemType, activeArtifacts);

    let updatedGrid: GridItem[][] = grid;

    switch (itemType) {
      case 'shovel':
        updatedGrid = itemEffects['shovel'](updatedGrid, row, col);
        // 만능 도구 효과: 25% 강화로 인접 타일도 제거
        if (enhancements.enhanced && enhancements.rangeMultiplier > 1) {
          updatedGrid = removeAdjacentTiles(updatedGrid, row, col);
        }
        break;
      case 'mole':
        updatedGrid = itemEffects['mole'](updatedGrid, row, col, direction);
        break;
      case 'bomb':
        // 폭탄 강화기: 5x5 범위로 확장
        if (enhancements.enhanced && activeArtifacts.some((a) => a.id === 'bomb_enhancer')) {
          updatedGrid = removeBomb5x5(updatedGrid, row, col);
        } else {
          updatedGrid = itemEffects['bomb'](updatedGrid, row, col);
        }
        break;
    }

    // 연속 사용권: 30% 확률로 소모되지 않음
    let shouldConsumeItem = true;
    const continuousUseArtifact = activeArtifacts.find((a) => a.isActive && a.effect.condition === 'item_no_consume');

    if (continuousUseArtifact && Math.random() < continuousUseArtifact.effect.value / 100) {
      shouldConsumeItem = false;
    }

    if (shouldConsumeItem) {
      setGameItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          count: newItems[itemIndex].count - 1,
        };
        return newItems;
      });
    }

    // Clear selection after item use
    setSelectedGameItem(null);
    setItemAnimation(null);
    setIsItemAnimating(false);

    return { grid: updatedGrid, consumed: shouldConsumeItem };
  };

  const addItem = (itemId: GameItemType, amount = 1) => {
    setGameItems((prevItems) => {
      const itemIndex = prevItems.findIndex((item) => item.id === itemId);
      if (itemIndex === -1) return prevItems;

      const newItems = [...prevItems];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        count: newItems[itemIndex].count + amount,
      };
      return newItems;
    });
  };

  const removeTile = (grid: GridItem[][], row: number, col: number): GridItem[][] => {
    const newGrid = structuredClone(grid);
    newGrid[row][col].isMatched = true;
    return newGrid;
  };

  const removeRow = (grid: GridItem[][], row: number): GridItem[][] => {
    const newGrid = structuredClone(grid);
    for (let col = 0; col < newGrid[row].length; col++) {
      newGrid[row][col].isMatched = true;
    }
    return newGrid;
  };

  const removeCol = (grid: GridItem[][], col: number): GridItem[][] => {
    const newGrid = structuredClone(grid);
    for (let row = 0; row < newGrid.length; row++) {
      newGrid[row][col].isMatched = true;
    }
    return newGrid;
  };

  const removeAdjacentTiles = (grid: GridItem[][], row: number, col: number): GridItem[][] => {
    const newGrid = structuredClone(grid);
    newGrid[row][col].isMatched = true;

    for (const [dx, dy] of DIRECTIONS) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
        newGrid[newRow][newCol].isMatched = true;
      }
    }

    return newGrid;
  };

  // 폭탄 강화기용 5x5 범위 제거
  const removeBomb5x5 = (grid: GridItem[][], row: number, col: number): GridItem[][] => {
    const newGrid = structuredClone(grid);

    for (let r = Math.max(0, row - 2); r <= Math.min(grid.length - 1, row + 2); r++) {
      for (let c = Math.max(0, col - 2); c <= Math.min(grid[0].length - 1, col + 2); c++) {
        newGrid[r][c].isMatched = true;
      }
    }

    return newGrid;
  };

  // 아이템 강화 효과 계산
  const applyItemEnhancements = (
    itemType: GameItemType,
    activeArtifacts: Artifact[],
  ): { enhanced: boolean; rangeMultiplier: number; shouldConsume: boolean } => {
    let enhanced = false;
    let rangeMultiplier = 1;
    let shouldConsume = true;

    activeArtifacts.forEach((artifact) => {
      if (!artifact.isActive) return;

      if (artifact.effect.type === 'item_enhancement') {
        // 만능 도구: 모든 아이템 효과 25% 강화
        if (artifact.effect.condition === 'enhance_all_items') {
          enhanced = true;
          rangeMultiplier = 1 + artifact.effect.value / 100;
        }
        // 폭탄 강화기: 폭탄을 5x5 범위로 변경
        else if (artifact.effect.condition === 'bomb_5x5' && itemType === 'bomb') {
          enhanced = true;
          rangeMultiplier = 2.5; // 특수 효과 표시용
        }
      }
      // 연속 사용권: 30% 확률로 소모되지 않음
      else if (artifact.effect.condition === 'item_no_consume') {
        if (Math.random() < artifact.effect.value / 100) {
          shouldConsume = false;
        }
      }
    });

    return { enhanced, rangeMultiplier, shouldConsume };
  };

  const clearItemAnimation = () => {
    setSelectedGameItem(null);
    setItemAnimation(null);
    setIsItemAnimating(false);
  };

  const resetItems = () => {
    setGameItems(INITIAL_GAME_ITEMS);
    clearItemAnimation();
  };

  return {
    gameItems,
    selectedGameItem,
    isItemAnimating,
    itemAnimation,
    setItemAnimation,
    setSelectedGameItem,
    setIsItemAnimating,
    executeItem,
    executeItemDirect,
    addItem,
    clearItemAnimation,
    resetItems,
    // 새로운 아이템 강화 효과 함수
    applyItemEnhancements,
  };
};

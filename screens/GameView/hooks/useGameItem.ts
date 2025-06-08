'use client';

import { cloneDeep } from 'lodash';
import { useState } from 'react';

import { DIRECTIONS } from '@/screens/GameView/constants/game-config';
import type { GameItem, GameItemType, GridItem, ItemAnimation } from '@/types/game-types';

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
  executeItem: (grid: GridItem[][]) => GridItem[][] | void;
  addItem: (itemId: GameItemType, amount?: number) => void;
  clearItemAnimation: () => void;
}

export const useGameItem = (): UseGameItemReturn => {
  const [gameItems, setGameItems] = useState<GameItem[]>([
    {
      id: 'shovel',
      name: 'Shovel',
      count: 3,
      icon: '/icons/shovel.png',
    },
    {
      id: 'mole',
      name: 'Mole',
      count: 10,
      icon: '/icons/mole.png',
    },
    {
      id: 'bomb',
      name: 'Bomb',
      count: 1,
      icon: '/icons/bomb.png',
    },
  ]);
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
    const itemIndex = gameItems.findIndex((item) => item.id === type);
    if (itemIndex === -1 || gameItems[itemIndex].count <= 0) {
      return;
    }

    let updatedGrid: GridItem[][] = grid;

    switch (type) {
      case 'shovel':
        updatedGrid = itemEffects['shovel'](updatedGrid, row, col);
        break;
      case 'mole':
        updatedGrid = itemEffects['mole'](updatedGrid, row, col, direction);
        break;
      case 'bomb':
        updatedGrid = itemEffects['bomb'](updatedGrid, row, col);
        break;
    }

    setGameItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        count: newItems[itemIndex].count - 1,
      };
      return newItems;
    });
    clearItemAnimation();
    return updatedGrid;
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
    const newGrid = cloneDeep(grid);
    newGrid[row][col].isMatched = true;
    return newGrid;
  };

  const removeRow = (grid: GridItem[][], row: number): GridItem[][] => {
    const newGrid = cloneDeep(grid);
    for (let col = 0; col < newGrid[row].length; col++) {
      newGrid[row][col].isMatched = true;
    }
    return newGrid;
  };

  const removeCol = (grid: GridItem[][], col: number): GridItem[][] => {
    const newGrid = cloneDeep(grid);
    for (let row = 0; row < newGrid.length; row++) {
      newGrid[row][col].isMatched = true;
    }
    return newGrid;
  };

  const removeAdjacentTiles = (grid: GridItem[][], row: number, col: number): GridItem[][] => {
    const newGrid = cloneDeep(grid);
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

  const clearItemAnimation = () => {
    setSelectedGameItem(null);
    setItemAnimation(null);
    setIsItemAnimating(false);
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
    addItem,
    clearItemAnimation,
  };
};

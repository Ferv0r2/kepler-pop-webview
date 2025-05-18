'use client';

import { useState } from 'react';

import { DIRECTIONS } from '@/screens/GameView/constants/game-config';
import type { GameItem, GameItemType, GridItem } from '@/types/game-types';
import { deepCopyGrid } from '@/utils/game-helper';

export interface UseGameItemReturn {
  gameItems: GameItem[];
  selectedGameItem: GameItemType | null;
  selectGameItem: (itemId: GameItemType | null) => void;
  executeItem: (itemId: GameItemType, callback: () => void) => boolean;
  addItem: (itemId: GameItemType, amount?: number) => void;
  // Function to remove a single tile
  removeTile: (grid: GridItem[][], row: number, col: number) => GridItem[][];
  // Function to remove a random row
  removeRow: (grid: GridItem[][], row: number) => GridItem[][];
  // Function to remove a col
  removeCol: (grid: GridItem[][], col: number) => GridItem[][];
  // Function to remove adjacent tiles
  removeAdjacentTiles: (grid: GridItem[][], row: number, col: number) => GridItem[][];
}

export const useGameItem = (): UseGameItemReturn => {
  // Initial items with counts
  const [gameItems, setGameItems] = useState<GameItem[]>([
    {
      id: 'shovel',
      name: '모종삽',
      count: 3,
      icon: '/icons/shovel.png',
    },
    {
      id: 'mole',
      name: '두더지',
      count: 2,
      icon: '/icons/mole.png',
    },
    {
      id: 'bomb',
      name: '폭탄',
      count: 1,
      icon: '/icons/bomb.png',
    },
  ]);

  const [selectedGameItem, setSelectedGameItem] = useState<GameItemType | null>(null);

  const selectGameItem = (itemId: GameItemType | null) => {
    setSelectedGameItem(itemId);
  };

  const executeItem = (itemId: GameItemType, callback: () => void): boolean => {
    const itemIndex = gameItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1 || gameItems[itemIndex].count <= 0) return false;

    setGameItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        count: newItems[itemIndex].count - 1,
      };
      return newItems;
    });

    callback();
    setSelectedGameItem(null);
    return true;
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

  // Remove a single tile
  const removeTile = (grid: GridItem[][], row: number, col: number): GridItem[][] => {
    const newGrid = deepCopyGrid(grid);
    newGrid[row][col].isMatched = true;
    return newGrid;
  };

  const removeRow = (grid: GridItem[][], row: number): GridItem[][] => {
    const newGrid = deepCopyGrid(grid);
    for (let col = 0; col < newGrid[row].length; col++) {
      newGrid[row][col].isMatched = true;
    }
    return newGrid;
  };

  const removeCol = (grid: GridItem[][], col: number): GridItem[][] => {
    const newGrid = deepCopyGrid(grid);
    for (let row = 0; row < newGrid.length; row++) {
      newGrid[row][col].isMatched = true;
    }
    return newGrid;
  };

  const removeAdjacentTiles = (grid: GridItem[][], row: number, col: number): GridItem[][] => {
    const newGrid = deepCopyGrid(grid);
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

  return {
    gameItems,
    selectedGameItem,
    selectGameItem,
    executeItem,
    addItem,
    removeTile,
    removeRow,
    removeCol,
    removeAdjacentTiles,
  };
};

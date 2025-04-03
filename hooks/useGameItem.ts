'use client';

import { Aperture, Bomb, Shovel } from 'lucide-react';
import { useState } from 'react';

import { DIRECTIONS } from '@/constants/game-config';
import type { GameItem, GameItemType, GridItem } from '@/types/GameTypes';
import { deepCopyGrid } from '@/utils/game-helper';

// Define the return type for the hook
export interface UseGameItemReturn {
  items: GameItem[];
  selectedItem: GameItemType | null;
  selectItem: (itemId: GameItemType | null) => void;
  useItem: (itemId: GameItemType, callback: () => void) => boolean;
  addItem: (itemId: GameItemType, amount?: number) => void;
  // Function to remove a single tile
  removeTile: (grid: GridItem[][], row: number, col: number) => GridItem[][];
  // Function to remove a random row
  removeRow: (grid: GridItem[][], row: number) => GridItem[][];
  // Function to remove adjacent tiles
  removeAdjacentTiles: (grid: GridItem[][], row: number, col: number) => GridItem[][];
}

export const useGameItem = (): UseGameItemReturn => {
  // Initial items with counts
  const [items, setItems] = useState<GameItem[]>([
    {
      id: 'shovel',
      name: '모종삽',
      count: 3,
      icon: Shovel,
    },
    {
      id: 'mole',
      name: '두더지',
      count: 2,
      icon: Aperture,
    },
    {
      id: 'bomb',
      name: '알폭탄',
      count: 1,
      icon: Bomb,
    },
  ]);

  const [selectedItem, setSelectedItem] = useState<GameItemType | null>(null);

  // Select an item
  const selectItem = (itemId: GameItemType | null) => {
    setSelectedItem(itemId);
  };

  // Use an item and decrease its count
  const useItem = (itemId: GameItemType, callback: () => void): boolean => {
    const itemIndex = items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1 || items[itemIndex].count <= 0) return false;

    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        count: newItems[itemIndex].count - 1,
      };
      return newItems;
    });

    callback();
    setSelectedItem(null);
    return true;
  };

  // Add items (for future use, like rewards)
  const addItem = (itemId: GameItemType, amount = 1) => {
    setItems((prevItems) => {
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

  // Remove a row
  const removeRow = (grid: GridItem[][], row: number): GridItem[][] => {
    const newGrid = deepCopyGrid(grid);
    for (let col = 0; col < newGrid[row].length; col++) {
      newGrid[row][col].isMatched = true;
    }
    return newGrid;
  };

  // Remove adjacent tiles
  const removeAdjacentTiles = (grid: GridItem[][], row: number, col: number): GridItem[][] => {
    const newGrid = deepCopyGrid(grid);
    // Mark the center tile
    newGrid[row][col].isMatched = true;

    // Mark adjacent tiles
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
    items,
    selectedItem,
    selectItem,
    useItem,
    addItem,
    removeTile,
    removeRow,
    removeAdjacentTiles,
  };
};

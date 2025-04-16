'use client';

import { useState, useEffect } from 'react';

import type { TileSwapMode } from '@/types/game-types';

interface GameSettings {
  tileSwapMode: TileSwapMode;
  setTileSwapMode: (mode: TileSwapMode) => void;
}

export const useGameSettings = (): GameSettings => {
  const [tileSwapMode, setTileSwapMode] = useState<TileSwapMode>('select');

  useEffect(() => {
    const savedSettings = localStorage.getItem('game-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.tileSwapMode) {
          setTileSwapMode(parsedSettings.tileSwapMode);
        }
      } catch (error) {
        console.error('Error parsing game settings:', error);
        localStorage.removeItem('game-settings');
      }
    }
  }, []);

  const handleSetTileSwapMode = (mode: TileSwapMode) => {
    setTileSwapMode(mode);
    const currentSettings = {
      tileSwapMode: mode,
    };
    localStorage.setItem('game-settings', JSON.stringify(currentSettings));
  };

  return {
    tileSwapMode,
    setTileSwapMode: handleSetTileSwapMode,
  };
};

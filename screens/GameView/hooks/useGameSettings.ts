'use client';

import { useState, useEffect } from 'react';

import type { TileSwapMode } from '@/types/game-types';

interface GameSettings {
  tileSwapMode: TileSwapMode;
  setTileSwapMode: (mode: TileSwapMode) => void;
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (seen: boolean) => void;
}

const getHasSeenTutorial = () => {
  if (typeof window === 'undefined') return false;
  const savedSettings = localStorage.getItem('game-settings');
  if (savedSettings) {
    try {
      const parsedSettings = JSON.parse(savedSettings) as { hasSeenTutorial?: boolean };
      return parsedSettings?.hasSeenTutorial || false;
    } catch (error) {
      console.error('Error parsing game settings:', error);
    }
  }
  return false;
};

export const useGameSettings = (): GameSettings => {
  const [tileSwapMode, setTileSwapMode] = useState<TileSwapMode>('drag');
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean>(getHasSeenTutorial());

  useEffect(() => {
    const savedSettings = localStorage.getItem('game-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as { tileSwapMode?: TileSwapMode };
        if (parsedSettings?.tileSwapMode) {
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
      hasSeenTutorial,
    };
    localStorage.setItem('game-settings', JSON.stringify(currentSettings));
  };

  const handleSetHasSeenTutorial = (seen: boolean) => {
    setHasSeenTutorial(seen);
    const currentSettings = {
      tileSwapMode,
      hasSeenTutorial: seen,
    };
    localStorage.setItem('game-settings', JSON.stringify(currentSettings));
  };

  return {
    tileSwapMode,
    setTileSwapMode: handleSetTileSwapMode,
    hasSeenTutorial,
    setHasSeenTutorial: handleSetHasSeenTutorial,
  };
};

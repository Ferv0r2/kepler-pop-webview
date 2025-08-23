'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw, Shuffle, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect, type TouchEvent, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ItemAnimationManager } from '@/components/logic/managers/ItemAnimationManager';
import { useLocale } from '@/components/providers/LocaleProvider';
import { Button } from '@/components/ui/button';
import { ItemAreaTooltip } from '@/components/ui/ItemAreaTooltip';
import { ConfettiManager } from '@/components/ui/LottieConfetti';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toast } from '@/components/ui/toast';
import { useSound } from '@/hooks/useSound';
import { SUPPORTED_LOCALES } from '@/i18n/constants';
import {
  ANIMATION_DURATION,
  CHALLENGE_MODE_MOVE_COUNT,
  GRID_SIZE,
  HINT_MOVE_INTERVAL_MS,
  SCORE,
  SHOW_EFFECT_TIME_MS,
  SHOW_HINT_TIME_MS,
  SHOW_STREAK_MAINTAIN_TIME_MS,
  TILE_MAX_TIER,
  TUTORIAL_TOTAL_STEP,
} from '@/screens/GameView/constants/game-config';
import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GridItem, TileType, GameState, GameItemType, TierType } from '@/types/game-types';
import { createParticles, createOptimizedParticles } from '@/utils/animation-helper';
import { calculateComboBonus, batchUpdateTiles } from '@/utils/game-helper';
import { useOptimizedGridRendering, useRenderPerformance } from '@/utils/performance-optimization';
import {
  playMatchSound,
  playComboSound,
  playItemSound,
  playShuffleSound,
  preloadAllSounds,
  playButtonSound,
  playGameOverSound,
} from '@/utils/sound-helper';

import { LOCALE_NAMES } from '../SettingsView/constants/settings-config';

import { TileComponent } from './components/TileComponent';
import { TutorialDialog } from './components/TutorialDialog';
import { useGameItem } from './hooks/useGameItem';
import { useGameSettings } from './hooks/useGameSettings';
import { useMatchGame } from './hooks/useMatchGame';

// Language Dropdown Component
const LanguageDropdown = ({ locale, setLocale }: { locale: string; setLocale: (locale: string) => void }) => {
  return (
    <Select value={locale} onValueChange={setLocale}>
      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        {SUPPORTED_LOCALES.map((language) => (
          <SelectItem key={language} value={language} className="text-white hover:bg-gray-700 focus:bg-gray-700">
            {LOCALE_NAMES[language] || language}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Settings Modal Component
const SettingsModal = ({
  isOpen,
  onClose,
  onRestartGame,
  onShowTutorial,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRestartGame: () => void;
  onShowTutorial: () => void;
}) => {
  const t = useTranslations();
  const { settings: soundSettings, toggleSound } = useSound();
  const { locale, setLocale } = useLocale();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 shadow-2xl border border-slate-600/50 max-w-sm w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{t('settings.title')}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Sound Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">{t('settings.soundVolume')}</span>
                <Button
                  variant={soundSettings.enabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleSound}
                  className="w-20"
                >
                  {soundSettings.enabled ? t('common.on') : t('common.off')}
                </Button>
              </div>
            </div>

            {/* Language Settings */}
            <div className="space-y-2">
              <span className="text-white">{t('settings.language')}</span>
              <LanguageDropdown locale={locale} setLocale={setLocale} />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <Button onClick={onShowTutorial} variant="outline" className="w-full">
                {t('settings.tutorial')}
              </Button>
              <Button onClick={onRestartGame} variant="outline" className="w-full text-red-400 hover:text-red-300">
                {t('game.restart')}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const GameViewSimple = () => {
  const { grid, setGrid, getRandomItemType, createInitialGrid, findMatches, findPossibleMove } = useMatchGame();
  const { hasSeenTutorial, setHasSeenTutorial } = useGameSettings();
  const {
    gameItems,
    selectedGameItem,
    setSelectedGameItem,
    setIsItemAnimating,
    setItemAnimation,
    executeItem,
    isItemAnimating,
    itemAnimation,
    resetItems,
  } = useGameItem();
  const { settings: soundSettings } = useSound();
  const t = useTranslations();

  const [lastMatchTime, setLastMatchTime] = useState<number>(Date.now());
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    moves: CHALLENGE_MODE_MOVE_COUNT,
    isSwapping: false,
    isChecking: false,
    isGameOver: false,
    combo: 1,
    turn: 1,
    isProcessingMatches: false,
  });
  const [showScorePopup, setShowScorePopup] = useState<{
    score: number;
    x: number;
    y: number;
  } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintPosition, setHintPosition] = useState<{ row1: number; col1: number; row2: number; col2: number } | null>(
    null,
  );
  const [tileChangeIndex, setTileChangeIndex] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [showShuffleToast, setShowShuffleToast] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showShuffleConfirmation, setShowShuffleConfirmation] = useState(false);
  const [showShuffleButton, setShowShuffleButton] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showBonusMovesAnimation, setShowBonusMovesAnimation] = useState<number>(0);
  const [longPressItem, setLongPressItem] = useState<GameItemType | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [highScore, setHighScore] = useState<number>(0);
  const tileRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const refillPromiseRef = useRef<Promise<void> | null>(null);

  // Performance optimization hooks
  const { grid: optimizedGrid } = useOptimizedGridRendering(grid);
  const { renderCount } = useRenderPerformance('GameView');

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('keplerGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Save high score when game ends
  useEffect(() => {
    if (gameState.isGameOver && gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('keplerGameHighScore', gameState.score.toString());
    }
  }, [gameState.isGameOver, gameState.score, highScore]);

  const handleTileClick = (row: number, col: number) => {
    if (
      gameState.isSwapping ||
      gameState.isChecking ||
      gameState.isGameOver ||
      isInitializing ||
      isItemAnimating ||
      gameState.isProcessingMatches ||
      isShuffling
    )
      return;

    if (selectedGameItem) {
      activeSelectedGameItem(row, col);
      setTileChangeIndex((prev) => prev + 1);
      return;
    }
  };

  const handleDragStart = (row: number, col: number) => {
    if (
      gameState.isSwapping ||
      gameState.isChecking ||
      gameState.isGameOver ||
      isInitializing ||
      isItemAnimating ||
      gameState.isProcessingMatches ||
      isShuffling
    ) {
      setIsDragging(false);
      setDraggedTile(null);
      return;
    }

    if (selectedGameItem) {
      activeSelectedGameItem(row, col);
      setTileChangeIndex((prev) => prev + 1);
      return;
    }

    setDraggedTile({ row, col });
    setIsDragging(true);
  };

  const handleDragEnter = (row: number, col: number) => {
    if (
      !isDragging ||
      !draggedTile ||
      gameState.isSwapping ||
      gameState.isChecking ||
      gameState.isGameOver ||
      isInitializing ||
      isItemAnimating ||
      isShuffling
    ) {
      setIsDragging(false);
      setDraggedTile(null);
      return;
    }

    const isAdjacent =
      (Math.abs(draggedTile.row - row) === 1 && draggedTile.col === col) ||
      (Math.abs(draggedTile.col - col) === 1 && draggedTile.row === row);

    if (isAdjacent) {
      setIsDragging(false);
      setDraggedTile(null);
      setTileChangeIndex((prev) => prev + 1);
      swapTiles(draggedTile.row, draggedTile.col, row, col);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTile(null);
  };

  const onTouchMove = (event: TouchEvent) => {
    if (isDragging) {
      const touch = event.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const tileElement = element?.closest('[data-row]');
      if (tileElement) {
        const row = Number.parseInt(tileElement.getAttribute('data-row') || '0', 10);
        const col = Number.parseInt(tileElement.getAttribute('data-col') || '0', 10);
        handleDragEnter(row, col);
      }
    }
  };

  const removeMatchedTiles = useCallback(
    (currentGrid: GridItem[][]): { newGrid: GridItem[][]; newTileIds: string[] } => {
      const newGrid = structuredClone(currentGrid);
      const newTileIds: string[] = [];

      for (let col = 0; col < GRID_SIZE; col++) {
        const columnTiles: GridItem[] = [];
        for (let row = 0; row < GRID_SIZE; row++) {
          if (!newGrid[row][col].isMatched) {
            columnTiles.push(newGrid[row][col]);
          }
        }

        const missingTiles = GRID_SIZE - columnTiles.length;
        const newTiles: GridItem[] = [];

        for (let i = 0; i < missingTiles; i++) {
          const newTileId = `${i}-${col}-${uuidv4()}`;
          const newTile = {
            id: newTileId,
            type: getRandomItemType(),
            isMatched: false,
            createdIndex: tileChangeIndex + 1,
            turn: gameState.turn,
            tier: 1 as TierType,
          };
          newTiles.push(newTile);
          newTileIds.push(newTileId);
        }

        const updatedColumn = [...newTiles, ...columnTiles];
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = updatedColumn[row];
        }
      }

      return { newGrid, newTileIds };
    },
    [getRandomItemType, tileChangeIndex, gameState.turn],
  );

  const calculateMatchScore = useCallback((matchCount: number, combo: number, streak: number) => {
    return matchCount * SCORE * combo * (streak > 1 ? streak : 1);
  }, []);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  }, []);

  const processMatches = useCallback(
    async (
      matches: { row: number; col: number }[],
      currentGrid: GridItem[][],
      isFirstMatch = false,
      swappedTiles?: { row: number; col: number }[],
      currentCombo = gameState.combo,
      currentScore?: number,
    ) => {
      if (matches.length === 0) return;

      const nextCombo = currentCombo + 1;
      const matchScore = calculateMatchScore(matches.length, nextCombo, streakCount);

      const bonusMoves = calculateComboBonus(nextCombo);
      const shouldDecreaseMoves = isFirstMatch && !selectedGameItem;
      const movesAdjustment = shouldDecreaseMoves ? -1 : 0;
      const newMoves = gameState.moves + movesAdjustment + bonusMoves;
      const baseScore = currentScore ?? gameState.score;
      const newScore = baseScore + matchScore;

      // Update state
      updateGameState({
        isProcessingMatches: true,
        isChecking: true,
        score: newScore,
        moves: newMoves,
        turn: isFirstMatch ? gameState.turn + 1 : gameState.turn,
        combo: nextCombo,
      });

      // Play sound effects
      if (matches.length > 0) {
        if (nextCombo > 1) {
          playComboSound(soundSettings);
        } else {
          playMatchSound(soundSettings);
        }
      }

      // Show UI effects
      if (matches.length > 0) {
        const centerRow = matches.reduce((sum, m) => sum + m.row, 0) / matches.length;
        const centerCol = matches.reduce((sum, m) => sum + m.col, 0) / matches.length;

        setShowScorePopup({ score: matchScore, x: centerCol, y: centerRow });
        if (bonusMoves > 0) {
          setShowBonusMovesAnimation(bonusMoves);
        }

        // Particle effects
        const x = (centerCol + 0.5) / GRID_SIZE;
        const y = (centerRow + 0.5) / GRID_SIZE;
        const level = (currentGrid[matches[0].row][matches[0].col].tier || 1) as TierType;
        const itemType = (currentGrid[matches[0].row][matches[0].col].type || 1) as TileType;
        const color = tileConfig[itemType]?.color[level]?.replace('text-', '') || 'red';
        createOptimizedParticles(x, y, color);

        setTimeout(() => setShowScorePopup(null), SHOW_EFFECT_TIME_MS);
        if (bonusMoves > 0) {
          setTimeout(() => setShowBonusMovesAnimation(0), SHOW_EFFECT_TIME_MS);
        }
      }

      // Update matched tiles
      const tileUpdates: Array<{ row: number; col: number; changes: Partial<GridItem> }> = [];

      matches.forEach(({ row, col }, index) => {
        if (!swappedTiles) {
          if (index === 0) {
            const challengeMatchCondition = currentGrid[row][col].tier < TILE_MAX_TIER;
            if (challengeMatchCondition) {
              tileUpdates.push({
                row,
                col,
                changes: { tier: (currentGrid[row][col].tier + 1) as TierType, isMatched: false },
              });
            } else {
              tileUpdates.push({ row, col, changes: { isMatched: true } });
            }
          } else {
            tileUpdates.push({ row, col, changes: { isMatched: true } });
          }
        } else {
          const isSwapped = swappedTiles.some((tile) => tile.row === row && tile.col === col);
          if (isSwapped) {
            if (currentGrid[row][col].tier < 3) {
              tileUpdates.push({
                row,
                col,
                changes: { tier: (currentGrid[row][col].tier + 1) as TierType, isMatched: false },
              });
            } else {
              tileUpdates.push({ row, col, changes: { isMatched: true } });
            }
          } else {
            tileUpdates.push({ row, col, changes: { isMatched: true } });
          }
        }
      });

      // Update grid
      const newGrid = structuredClone(currentGrid);
      batchUpdateTiles(newGrid, tileUpdates);
      setGrid(newGrid);

      // Wait for match animation
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Remove tiles and refill
      const { newGrid: afterRemovalGrid, newTileIds } = removeMatchedTiles(newGrid);
      setGrid(afterRemovalGrid);
      setTileChangeIndex((prev) => prev + 1);

      // Wait for refill animation
      if (newTileIds.length > 0) {
        const refillPromise = new Promise<void>((resolve) => setTimeout(resolve, 300));
        refillPromiseRef.current = refillPromise;
        await refillPromise;
        refillPromiseRef.current = null;
      }

      // Additional wait time
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check for new matches
      const newMatches = findMatches(afterRemovalGrid);
      if (newMatches.length > 0) {
        await processMatches(newMatches, afterRemovalGrid, false, undefined, nextCombo, newScore);
      } else {
        // Check game over
        const isGameOver = newMoves <= 0;
        updateGameState({
          isSwapping: false,
          isChecking: false,
          isProcessingMatches: false,
          combo: 1,
          isGameOver,
        });

        if (isGameOver) {
          playGameOverSound(soundSettings);
        }
      }
    },
    [
      gameState.combo,
      gameState.moves,
      gameState.score,
      gameState.turn,
      calculateMatchScore,
      streakCount,
      selectedGameItem,
      updateGameState,
      setGrid,
      removeMatchedTiles,
      findMatches,
      soundSettings,
    ],
  );

  const swapTiles = useCallback(
    async (row1: number, col1: number, row2: number, col2: number) => {
      setGameState((prev) => ({ ...prev, isSwapping: true }));
      let newGrid = structuredClone(grid);

      setShowHint(false);

      const swappedTiles = [
        { row: row1, col: col1 },
        { row: row2, col: col2 },
      ];

      const temp = { ...newGrid[row1][col1] };
      newGrid[row1][col1] = { ...newGrid[row2][col2] };
      newGrid[row2][col2] = temp;

      setGrid(newGrid);

      // Wait for swap animation
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

      const matches = findMatches(newGrid);

      // Additional wait time
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION + 50));

      if (matches.length > 0) {
        const now = Date.now();
        if (now - lastMatchTime < SHOW_STREAK_MAINTAIN_TIME_MS) {
          setStreakCount((prev) => prev + 1);
        } else {
          setStreakCount(1);
        }
        setLastMatchTime(now);

        await processMatches(matches, newGrid, true, swappedTiles, gameState.combo, gameState.score);
      } else {
        // Revert swap if no matches
        newGrid = structuredClone(newGrid);
        const temp2 = { ...newGrid[row1][col1] };
        newGrid[row1][col1] = { ...newGrid[row2][col2] };
        newGrid[row2][col2] = temp2;
        setGrid(newGrid);
        setGameState((prev) => ({
          ...prev,
          moves: prev.moves - 1,
          turn: prev.turn + 1,
          isSwapping: false,
          isGameOver: prev.moves - 1 <= 0,
        }));

        if (gameState.moves - 1 <= 0) {
          playGameOverSound(soundSettings);
        }
      }
    },
    [
      grid,
      setGrid,
      findMatches,
      lastMatchTime,
      processMatches,
      gameState.moves,
      gameState.score,
      gameState.combo,
      soundSettings,
    ],
  );

  const restartGame = () => {
    setGameState({
      score: 0,
      moves: CHALLENGE_MODE_MOVE_COUNT,
      isSwapping: false,
      isChecking: false,
      isGameOver: false,
      combo: 1,
      turn: 0,
      isProcessingMatches: false,
    });
    setTileChangeIndex(0);
    setGrid(createInitialGrid());
    setShowScorePopup(null);
    setStreakCount(0);
    setIsDragging(false);
    setDraggedTile(null);
    setIsShuffling(false);
    setShowShuffleConfirmation(false);
    setShowShuffleButton(false);
    resetItems();
    setShowSettingsModal(false);
  };

  const handleGameItemSelect = (itemId: GameItemType) => {
    if (selectedGameItem === itemId) {
      setSelectedGameItem(null);
      return;
    }
    setSelectedGameItem(itemId);
  };

  const handleLongPressStart = (itemId: GameItemType) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }

    const timer = setTimeout(() => {
      setLongPressItem(itemId);
    }, 300);

    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressItem(null);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const activeSelectedGameItem = async (row: number, col: number) => {
    if (!selectedGameItem) return;
    const tileEl = tileRefs.current[row]?.[col];
    let left: number | undefined = undefined;
    let top: number | undefined = undefined;
    if (tileEl) {
      const rect = tileEl.getBoundingClientRect();
      left = rect.left + rect.width / 2;
      top = rect.top + rect.height / 2;
    }
    const randomDirection = Math.random() < 0.5 ? 'row' : 'col';
    setItemAnimation({ type: selectedGameItem, row, col, direction: randomDirection, left, top });
    setIsItemAnimating(true);
  };

  const handleItemAnimationComplete = () => {
    const updatedGrid = executeItem(grid);
    if (!updatedGrid) return;

    playItemSound(soundSettings);

    let removedTileCount = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const originalTile = grid[row][col];
        const updatedTile = updatedGrid[row][col];
        if (!originalTile.isMatched && updatedTile.isMatched) {
          removedTileCount++;
        }
      }
    }

    let itemScore = 0;
    let totalScore = gameState.score;

    if (removedTileCount > 0) {
      itemScore = calculateMatchScore(removedTileCount, gameState.combo, streakCount);
      const bonusMoves = calculateComboBonus(gameState.combo);
      totalScore = gameState.score + itemScore;

      updateGameState({
        score: totalScore,
        moves: gameState.moves + bonusMoves,
        combo: gameState.combo + 1,
      });

      const centerRow = GRID_SIZE / 2;
      const centerCol = GRID_SIZE / 2;

      setShowScorePopup({ score: itemScore, x: centerCol, y: centerRow });
      if (bonusMoves > 0) {
        setShowBonusMovesAnimation(bonusMoves);
      }

      const x = (centerCol + 0.5) / GRID_SIZE;
      const y = (centerRow + 0.5) / GRID_SIZE;
      createParticles(x, y, 'purple');

      setTimeout(() => setShowScorePopup(null), SHOW_EFFECT_TIME_MS);
      if (bonusMoves > 0) {
        setTimeout(() => setShowBonusMovesAnimation(0), SHOW_EFFECT_TIME_MS);
      }
    }

    setGrid(updatedGrid);

    setTimeout(async () => {
      const afterRemovalGrid = removeMatchedTiles(updatedGrid);
      setGrid(afterRemovalGrid.newGrid);
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      const matches = findMatches(afterRemovalGrid.newGrid);
      if (matches.length > 0) {
        processMatches(matches, afterRemovalGrid.newGrid, true, undefined, gameState.combo + 1, totalScore);
      } else {
        setGameState((prev) => ({
          ...prev,
          isSwapping: false,
          isChecking: false,
          combo: 1,
        }));

        const possibleMove = findPossibleMove();
        if (possibleMove && (showShuffleConfirmation || showShuffleButton)) {
          setShowShuffleConfirmation(false);
          setShowShuffleButton(false);
        }
      }
    }, ANIMATION_DURATION);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const nextTutorialStep = () => {
    if (tutorialStep < TUTORIAL_TOTAL_STEP) {
      setTutorialStep(tutorialStep + 1);
    } else {
      playButtonSound(soundSettings);
      closeTutorial();
    }
  };

  const shuffleGrid = useCallback(() => {
    const flatGrid = grid.flat();

    for (let i = flatGrid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flatGrid[i], flatGrid[j]] = [flatGrid[j], flatGrid[i]];
    }

    const newGrid: GridItem[][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid.push(flatGrid.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE));
    }

    const matches = findMatches(newGrid);
    if (matches.length > 0) {
      return shuffleGrid();
    }

    return newGrid;
  }, [findMatches, grid]);

  useEffect(() => {
    if (grid.length > 0 && !gameState.isSwapping && !gameState.isChecking && gameState.moves > 0 && !isShuffling) {
      const possibleMove = findPossibleMove();
      if (!possibleMove && !showShuffleConfirmation && !showShuffleButton) {
        setShowShuffleConfirmation(true);
      } else if (possibleMove && (showShuffleConfirmation || showShuffleButton)) {
        setShowShuffleConfirmation(false);
        setShowShuffleButton(false);
      }
    }
  }, [
    grid,
    gameState.isSwapping,
    gameState.isChecking,
    gameState.moves,
    isShuffling,
    findPossibleMove,
    showShuffleConfirmation,
    showShuffleButton,
  ]);

  useEffect(() => {
    if (isShuffling) {
      setShowShuffleConfirmation(false);
      setShowShuffleButton(false);
    }
  }, [isShuffling]);

  useEffect(() => {
    setGrid(createInitialGrid());

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, SHOW_EFFECT_TIME_MS);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  useEffect(() => {
    const ensureSoundsLoaded = async () => {
      try {
        await preloadAllSounds();
      } catch (error) {
        console.warn('GameView: Failed to load sounds:', error);
      }
    };

    ensureSoundsLoaded();
  }, []);

  useEffect(() => {
    if (lastMatchTime > 0 && !gameState.isSwapping && !gameState.isChecking && !gameState.isGameOver) {
      const timer = setTimeout(() => {
        const possibleMove = findPossibleMove();
        if (possibleMove) {
          setHintPosition(possibleMove);
          setShowHint(true);
          setTimeout(() => {
            setShowHint(false);
          }, SHOW_HINT_TIME_MS);
        }
      }, HINT_MOVE_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [lastMatchTime, gameState.isSwapping, gameState.isChecking, gameState.isGameOver, findPossibleMove]);

  const handleShuffleConfirm = () => {
    setShowShuffleConfirmation(false);
    setShowShuffleButton(false);

    playShuffleSound(soundSettings);

    const shuffleCost = 3;
    const newMoves = Math.max(0, gameState.moves - shuffleCost);
    const isGameOver = newMoves <= 0;

    setGameState((prev) => ({
      ...prev,
      moves: newMoves,
      turn: prev.turn + 1,
      isGameOver,
    }));

    if (isGameOver) {
      setIsShuffling(false);
      playGameOverSound(soundSettings);
      return;
    }

    setIsShuffling(true);

    setTimeout(() => {
      setIsShuffling(false);
      setShowShuffleToast(true);
      setTimeout(() => setShowShuffleToast(false), 2000);
    }, 1500);

    setTimeout(() => {
      const newGrid = shuffleGrid();
      setGrid(newGrid);
    }, 1000);
  };

  return (
    <ConfettiManager>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1000]">
        {itemAnimation && (
          <ItemAnimationManager
            itemType={itemAnimation.type}
            row={itemAnimation.row}
            col={itemAnimation.col}
            direction={itemAnimation.direction}
            left={itemAnimation.left}
            top={itemAnimation.top}
            onComplete={handleItemAnimationComplete}
          />
        )}
      </div>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <header className="fixed w-full h-16 inset-0 z-20 p-2">
          <div className="flex justify-end">
            <Button
              data-testid="game-settings"
              variant="ghost"
              size="icon"
              onClick={() => setShowSettingsModal(true)}
              className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </header>

        <main className="w-full max-w-lg mx-auto flex flex-col items-center relative z-10">
          <motion.div
            className="w-full flex flex-col items-center relative z-10 p-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full max-w-lg">
              <div className="flex justify-between items-center mb-6 gap-4">
                <motion.div
                  className="relative flex-2"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <motion.div className="absolute -inset-1 rounded-lg blur opacity-30 transition-all duration-500 bg-gradient-to-r from-pink-500 to-purple-500" />
                  <motion.div
                    data-testid="game-score"
                    className="relative w-full backdrop-blur-sm px-4 py-2 rounded-lg border shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all duration-500 bg-black/90 border-pink-500/30"
                  >
                    <div className="text-pink-400 mb-1 tracking-widest">
                      {t('common.score')} <span className="text-white/50">{highScore > 0 ? `(${highScore})` : ''}</span>
                    </div>
                    <motion.div
                      key={gameState.score}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl font-bold tracking-wider relative text-pink-400"
                    >
                      {gameState.score.toLocaleString()}
                    </motion.div>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="relative flex-1"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30" />
                  <div
                    data-testid="game-moves"
                    className="relative w-full bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    <div className="text-blue-400 mb-1 tracking-widest">{t('common.moves')}</div>
                    <motion.div
                      key={gameState.moves}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl font-bold text-blue-400 tracking-wider relative"
                    >
                      {Math.max(gameState.moves, 0)}
                      <AnimatePresence>
                        {showBonusMovesAnimation > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                            animate={{ opacity: 1, scale: 1, y: -20 }}
                            exit={{ opacity: 0, y: -40 }}
                            transition={{ duration: 0.8 }}
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-green-400 font-bold text-lg z-20"
                          >
                            +{showBonusMovesAnimation}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="w-full p-2">
            <motion.div
              className="relative w-full bg-black/40 p-3 rounded-xl border-2 border-purple-600/50 shadow-[0_0_20px_rgba(147,51,234,0.4)] backdrop-blur-sm"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <AnimatePresence>
                {gameState.isGameOver && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl z-20 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      className="relative w-5/6 max-w-md"
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 20 }}
                      transition={{ type: 'spring', damping: 25, delay: 0.1 }}
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl opacity-70 blur-md animate-pulse" />
                      <div className="relative bg-gradient-to-b from-slate-900/95 to-purple-900/95 rounded-2xl p-4 border border-indigo-400/30 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                        <motion.div
                          className="flex justify-center p-4"
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                        >
                          <Image src="/icons/trophy.png" alt="Trophy" width={64} height={64} />
                        </motion.div>
                        <motion.div
                          className="text-center mb-6 bg-slate-800/40 p-4 rounded-xl border border-yellow-500/30"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          <p className="text-lg text-white/80 mb-1">{t('game.finalScore')}</p>
                          <motion.div
                            className="text-4xl font-bold text-yellow-300"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1.2, 1] }}
                            transition={{ delay: 0.6, duration: 0.7, times: [0, 0.6, 1] }}
                          >
                            {gameState.score.toLocaleString()}
                          </motion.div>
                          {gameState.score > highScore && (
                            <motion.div
                              className="mt-2 text-yellow-400 font-bold"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.8 }}
                            >
                              🎉 {t('game.newRecord')} 🎉
                            </motion.div>
                          )}
                        </motion.div>
                        <motion.div
                          className="flex flex-col gap-3"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                        >
                          <Button
                            onClick={restartGame}
                            className="flex items-center justify-center font-bold py-6 px-6 rounded-lg text-md shadow-lg transition-all duration-300 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white hover:shadow-xl"
                          >
                            <RefreshCw className="w-5 h-5 mr-2 text-white" />
                            {t('game.restart')}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                data-testid="game-grid"
                className="grid gap-1.5 place-items-center w-full mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                  touchAction: 'none',
                  maxWidth: 'calc(100vw - 1rem)',
                }}
              >
                {optimizedGrid.map((row, rowIndex) =>
                  row.map((item, colIndex) => (
                    <TileComponent
                      key={`${item.id}-${renderCount}`}
                      item={item}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      isSelected={false}
                      isDragged={draggedTile?.row === rowIndex && draggedTile?.col === colIndex}
                      showHint={
                        showHint &&
                        ((hintPosition?.row1 === rowIndex && hintPosition?.col1 === colIndex) ||
                          (hintPosition?.row2 === rowIndex && hintPosition?.col2 === colIndex))
                      }
                      isShuffling={isShuffling}
                      onTileClick={() => handleTileClick(rowIndex, colIndex)}
                      onMouseDown={() => handleDragStart(rowIndex, colIndex)}
                      onMouseEnter={() => handleDragEnter(rowIndex, colIndex)}
                      onMouseUp={() => handleDragEnd()}
                      onTouchStart={() => handleDragStart(rowIndex, colIndex)}
                      onTouchMove={(e) => onTouchMove(e)}
                      onTouchEnd={() => handleDragEnd()}
                      tileRef={(el) => {
                        if (!tileRefs.current[rowIndex]) tileRefs.current[rowIndex] = [];
                        tileRefs.current[rowIndex][colIndex] = el;
                      }}
                    />
                  )),
                )}

                <AnimatePresence>
                  {showScorePopup && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -30 }}
                      exit={{ opacity: 0, y: -60 }}
                      transition={{ duration: 0.8 }}
                      className="absolute text-yellow-300 font-bold text-xl z-20"
                      style={{
                        left: `${(showScorePopup.x / GRID_SIZE) * 100}%`,
                        top: `${(showScorePopup.y / GRID_SIZE) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      +{showScorePopup.score}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                className="mt-6 flex justify-center gap-3"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
              >
                {gameItems.map(({ id, count, icon }) => (
                  <ItemAreaTooltip key={id} itemType={id as GameItemType} isVisible={longPressItem === id}>
                    <motion.div
                      className={`
                  relative flex flex-col flex-1 text-center items-center p-3 rounded-lg cursor-pointer
                  ${
                    selectedGameItem === id
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 ring-2 ring-white shadow-lg'
                      : 'bg-gradient-to-br from-slate-700 to-slate-800'
                  }
                  ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                  drop-shadow-md transition-all duration-200
                `}
                      onClick={() => count > 0 && handleGameItemSelect(id as GameItemType)}
                      onTouchStart={() => count > 0 && handleLongPressStart(id as GameItemType)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchCancel={handleLongPressEnd}
                      onMouseDown={() => count > 0 && handleLongPressStart(id as GameItemType)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      whileHover={{ scale: count > 0 ? 1.05 : 1 }}
                      whileTap={{ scale: count > 0 ? 0.95 : 1 }}
                    >
                      <div className="text-3xl mb-2">
                        <Image
                          className={`${selectedGameItem === id ? 'animate-item-selected' : ''}`}
                          src={icon}
                          alt={t(`game.items.${id}`)}
                          width={64}
                          height={64}
                          priority
                        />
                      </div>
                      <div className="text-sm font-bold text-white">{t(`game.items.${id}`)}</div>
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {count}
                      </div>
                    </motion.div>
                  </ItemAreaTooltip>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Shuffle Confirmation Alert */}
      <AnimatePresence>
        {showShuffleConfirmation && (
          <motion.div
            className="fixed top-22 left-8 right-8 z-50"
            initial={{ opacity: 0, x: 40, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-xl p-4 shadow-lg max-w-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shuffle className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">{t('game.noMovesAvailable')}</h4>
                  <p className="mt-1 text-slate-300 text-sm">{t('game.shuffleCostMessage', { count: 3 })}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowShuffleConfirmation(false);
                    setShowShuffleButton(true);
                  }}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleShuffleConfirm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
              >
                {t('game.shuffle')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shuffle Button */}
      <AnimatePresence>
        {showShuffleButton && (
          <motion.div
            className="fixed left-4 top-16 flex justify-center z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowShuffleConfirmation(true);
                setShowShuffleButton(false);
              }}
              className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
            >
              <Shuffle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onRestartGame={restartGame}
        onShowTutorial={() => {
          playButtonSound(soundSettings);
          setShowTutorial(true);
          setTutorialStep(1);
          setShowSettingsModal(false);
        }}
      />

      <TutorialDialog
        isOpen={showTutorial}
        onClose={closeTutorial}
        onNextStep={nextTutorialStep}
        onPrevStep={prevTutorialStep}
        currentStep={tutorialStep}
        gameItems={gameItems}
      />

      <Toast isOpen={showShuffleToast} icon={Shuffle} message={t('game.shuffleMessage', { count: 3 })} />

      {/* Shuffling Loading Screen */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl z-20 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="relative w-5/6 max-w-md"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 25, delay: 0.1 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-2xl opacity-70 blur-md animate-pulse" />
              <div className="relative bg-gradient-to-b from-slate-900/95 to-blue-900/95 rounded-2xl p-4 border border-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <motion.div
                  className="flex justify-center p-4"
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <Image src="/icons/dice.png" alt="Dice" width={80} height={80} />
                </motion.div>
                <motion.div
                  className="text-center mb-6 bg-slate-800/40 p-4 rounded-xl border border-blue-500/30"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <p className="text-lg text-white/80 mb-1">{t('game.shuffling')}</p>
                  <motion.div
                    className="text-2xl font-bold text-blue-300"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {t('game.pleaseWait')}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfettiManager>
  );
};

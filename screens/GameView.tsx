'use client';

import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Settings, Home, RefreshCw, Trophy, Flame } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createElement, useState, useEffect, TouchEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmationModal } from '@/components/logic/dialogs/ConfirmationModal';
import { SettingsMenu } from '@/components/logic/dialogs/SettingsMenu';
import { TutorialDialog } from '@/components/logic/dialogs/TutorialDialog';
import { Button } from '@/components/ui/button';
import {
  ANIMATION_DURATION,
  CASUAL_MODE_MOVE_COUNT,
  CHALLENGE_MODE_MOVE_COUNT,
  CONFETTI_ANIMATION_DURATION,
  GRID_SIZE,
  MIN_MATCH_COUNT,
  SCORE,
  SHOW_EFFECT_TIME_MS,
  SHOW_HINT_TIME_MS,
  SHOW_STREAK_MAINTAIN_TIME_MS,
  TILE_MAX_TIER,
} from '@/constants/game-config';
import { tileConfig } from '@/constants/tile-config';
import { useBackButton } from '@/hooks/useBackButton';
import { useGameItem } from '@/hooks/useGameItem';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useMatchGame } from '@/hooks/useMatchGame';
import type { GameMode, GridItem, ItemType, GameState, GameItemType, TierType } from '@/types/game-types';
import { createParticles, fallVariant, swapVariant } from '@/utils/animation-helper';
import { deepCopyGrid } from '@/utils/game-helper';

import { LoadingView } from './LoadingView';

export const GameView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') as GameMode;
  const { getRandomItemType, createInitialGrid } = useMatchGame();
  const { tileSwapMode, setTileSwapMode, hasSeenTutorial, setHasSeenTutorial } = useGameSettings();
  const {
    gameItems,
    selectedGameItem,
    selectGameItem,
    executeItem,
    removeTile,
    removeRow,
    removeCol,
    removeAdjacentTiles,
  } = useGameItem();
  const [grid, setGrid] = useState<GridItem[][]>([]);
  const [selectedTile, setSelectedTile] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    moves: gameMode === 'casual' ? CASUAL_MODE_MOVE_COUNT : CHALLENGE_MODE_MOVE_COUNT,
    isSwapping: false,
    isChecking: false,
    isGameOver: false,
    combo: 1,
    turn: 1,
  });
  const [showScorePopup, setShowScorePopup] = useState<{
    score: number;
    x: number;
    y: number;
  } | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  // const [artifactFragments, setArtifactFragments] = useState(0);
  // turn이나 move와 달리 모든 타일 변화를 카운트하는 변수
  const [tileChangeIndex, setTileChangeIndex] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintPosition, setHintPosition] = useState<{ row1: number; col1: number; row2: number; col2: number } | null>(
    null,
  );
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [showStreak, setShowStreak] = useState<boolean>(false);
  const [lastMatchTime, setLastMatchTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const itemEffects: Record<GameItemType, (row: number, col: number) => GridItem[][]> = {
    shovel: (row, col) => {
      return removeTile(grid, row, col);
    },
    mole: (row, col) => {
      const randomDirection = Math.random() < 0.5 ? 'row' : 'col';
      if (randomDirection === 'row') {
        return removeRow(grid, row);
      } else {
        return removeCol(grid, col);
      }
    },
    bomb: (row, col) => {
      return removeAdjacentTiles(grid, row, col);
    },
  };

  const handleTileClick = (row: number, col: number) => {
    if (gameState.isSwapping || gameState.isChecking || gameState.isGameOver) return;

    if (selectedGameItem) {
      activeSelectedGameItem(row, col);
      setTileChangeIndex((prev) => prev + 1);
      return;
    }

    if (tileSwapMode === 'select') {
      if (selectedTile === null) {
        setSelectedTile({ row, col });
        return;
      }

      if (selectedTile.row === row && selectedTile.col === col) {
        setSelectedTile(null);
        return;
      }

      setTileChangeIndex((prev) => prev + 1);
      const isAdjacent =
        (Math.abs(selectedTile.row - row) === 1 && selectedTile.col === col) ||
        (Math.abs(selectedTile.col - col) === 1 && selectedTile.row === row);

      if (isAdjacent) {
        swapTiles(selectedTile.row, selectedTile.col, row, col);
      } else {
        setSelectedTile({ row, col });
      }
    }
  };

  const handleDragStart = (row: number, col: number) => {
    if (gameState.isSwapping || gameState.isChecking || gameState.isGameOver || selectedGameItem) return;

    setDraggedTile({ row, col });
    setIsDragging(true);
  };

  const handleDragEnter = (row: number, col: number) => {
    if (!isDragging || !draggedTile || gameState.isSwapping || gameState.isChecking || gameState.isGameOver) return;

    // Check if the tile is adjacent to the dragged tile
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
    if (tileSwapMode === 'drag' && isDragging) {
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

  const swapTiles = async (row1: number, col1: number, row2: number, col2: number) => {
    setGameState((prev) => ({ ...prev, isSwapping: true }));
    let newGrid = deepCopyGrid(grid);

    // Hide hint when swapping
    setShowHint(false);

    // Swapped tiles info
    const swappedTiles = [
      { row: row1, col: col1 },
      { row: row2, col: col2 },
    ];

    // Execute swap
    const temp = { ...newGrid[row1][col1] };
    newGrid[row1][col1] = { ...newGrid[row2][col2] };
    newGrid[row2][col2] = temp;

    setGrid(newGrid);
    setSelectedTile(null);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

    const matches = findMatches(newGrid);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION + 100));
    if (matches.length > 0) {
      // Check if this match was made quickly after the last one
      const now = Date.now();
      if (now - lastMatchTime < SHOW_STREAK_MAINTAIN_TIME_MS) {
        setStreakCount((prev) => prev + 1);
        setShowStreak(true);
        setTimeout(() => setShowStreak(false), SHOW_EFFECT_TIME_MS);
      } else {
        setStreakCount(1);
      }
      setLastMatchTime(now);

      processMatches(matches, newGrid, true, swappedTiles);
    } else {
      newGrid = deepCopyGrid(newGrid);
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
    }
  };

  const findMatches = (currentGrid: GridItem[][]): { row: number; col: number }[] => {
    const matches: { row: number; col: number }[] = [];

    // Check horizontal matches
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

    // Check vertical matches
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

  const findPossibleMove = (): { row1: number; col1: number; row2: number; col2: number } | null => {
    // Check all possible swaps to find a valid move
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // Check right swap
        if (col < GRID_SIZE - 1) {
          const tempGrid = deepCopyGrid(grid);
          const temp = { ...tempGrid[row][col] };
          tempGrid[row][col] = { ...tempGrid[row][col + 1] };
          tempGrid[row][col + 1] = temp;

          if (findMatches(tempGrid).length > 0) {
            return { row1: row, col1: col, row2: row, col2: col + 1 };
          }
        }

        // Check down swap
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
  };

  const showHintMove = () => {
    const possibleMove = findPossibleMove();
    if (possibleMove) {
      setHintPosition(possibleMove);
      setShowHint(true);

      setTimeout(() => {
        setShowHint(false);
      }, SHOW_HINT_TIME_MS);
    }
  };

  const processMatches = async (
    matches: { row: number; col: number }[],
    currentGrid: GridItem[][],
    isFirstMatch = false,
    swappedTiles?: { row: number; col: number }[],
  ) => {
    const combo = gameState.combo + 1;
    const matchScore = matches.length * SCORE * combo * (streakCount > 1 ? streakCount : 1);

    setGameState((prev) => ({
      ...prev,
      isChecking: true,
      score: prev.score + matchScore,
      moves: isFirstMatch ? prev.moves - 1 : prev.moves,
      turn: isFirstMatch ? prev.turn + 1 : prev.turn,
      combo,
    }));

    if (matches.length > 0) {
      const centerRow = matches.reduce((sum, m) => sum + m.row, 0) / matches.length;
      const centerCol = matches.reduce((sum, m) => sum + m.col, 0) / matches.length;

      setShowScorePopup({
        score: matchScore,
        x: centerCol,
        y: centerRow,
      });

      const x = (centerCol + 0.5) / GRID_SIZE;
      const y = (centerRow + 0.5) / GRID_SIZE;
      const level = (currentGrid[matches[0].row][matches[0].col].tier || 1) as TierType;
      const itemType = (currentGrid[matches[0].row][matches[0].col].type || 1) as ItemType;
      const color = tileConfig[itemType]?.color[level]?.replace('text-', '') || 'red';
      createParticles(x, y, color);

      setTimeout(() => {
        setShowScorePopup(null);
      }, SHOW_EFFECT_TIME_MS);
    }

    let newGrid = deepCopyGrid(currentGrid);
    matches.forEach(({ row, col }, index) => {
      if (!swappedTiles) {
        // Item usage: upgrade first tile, remove others
        if (index === 0) {
          const challengeMatchCondition = gameMode === 'challenge' && newGrid[row][col].tier < TILE_MAX_TIER;
          if (challengeMatchCondition) {
            newGrid[row][col].tier += 1;
            newGrid[row][col].isMatched = false;
          } else {
            newGrid[row][col].isMatched = true;
          }
        } else {
          newGrid[row][col].isMatched = true;
        }
      } else {
        // Swap case: upgrade swapped tiles, remove others
        const isSwapped = swappedTiles.some((tile) => tile.row === row && tile.col === col);
        if (isSwapped) {
          if (gameMode === 'challenge' && newGrid[row][col].tier < 3) {
            newGrid[row][col].tier += 1;
            newGrid[row][col].isMatched = false;
          } else {
            newGrid[row][col].isMatched = true;
          }
        } else {
          newGrid[row][col].isMatched = true;
        }
      }
    });

    setGrid(newGrid);
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

    newGrid = removeMatchedTiles(newGrid);
    setGrid(newGrid);
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION * 1.5));

    const newMatches = findMatches(newGrid);
    if (newMatches.length > 0) {
      processMatches(newMatches, newGrid, false);
    } else {
      setGameState((prev) => ({
        ...prev,
        isSwapping: false,
        isChecking: false,
        combo: 1,
        isGameOver: prev.moves <= 0,
      }));

      if (gameState.moves <= 1) {
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 160,
            origin: { x: 0.5, y: 0.5 },
            disableForReducedMotion: true,
          });
        }, CONFETTI_ANIMATION_DURATION);
      }
    }
  };

  const removeMatchedTiles = (currentGrid: GridItem[][]): GridItem[][] => {
    const newGrid = deepCopyGrid(currentGrid);

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
        newTiles.push({
          id: `${i}-${col}-${uuidv4()}`,
          type: getRandomItemType(),
          isMatched: false,
          createdIndex: tileChangeIndex,
          turn: gameState.turn,
          tier: 1,
        });
      }
      const updatedColumn = [...newTiles, ...columnTiles];
      for (let row = 0; row < GRID_SIZE; row++) {
        newGrid[row][col] = updatedColumn[row];
      }
    }

    return newGrid;
  };

  const restartGame = () => {
    setGameState({
      score: 0,
      moves: gameMode === 'casual' ? CASUAL_MODE_MOVE_COUNT : CHALLENGE_MODE_MOVE_COUNT,
      isSwapping: false,
      isChecking: false,
      isGameOver: false,
      combo: 1,
      turn: 0,
    });
    setTileChangeIndex(0);
    setGrid(createInitialGrid());
    setSelectedTile(null);
    setShowScorePopup(null);
    setStreakCount(0);
    setShowStreak(false);
  };

  const handleGameItemSelect = (itemId: GameItemType) => {
    if (selectedTile) {
      selectGameItem(null);
      return;
    }

    if (selectedGameItem === itemId) {
      selectGameItem(null);
      return;
    }
    selectGameItem(itemId);
  };

  const activeSelectedGameItem = async (row: number, col: number) => {
    if (!selectedGameItem) return;

    const updatedGrid = itemEffects[selectedGameItem](row, col);
    executeItem(selectedGameItem, () => {
      selectGameItem(null);
    });

    setGrid(updatedGrid);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

    const afterRemovalGrid = removeMatchedTiles(updatedGrid);
    setGrid(afterRemovalGrid);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION * 1.5));

    const matches = findMatches(afterRemovalGrid);
    if (matches.length > 0) {
      processMatches(matches, afterRemovalGrid, true);
    } else {
      setGameState((prev) => ({
        ...prev,
        isSwapping: false,
        isChecking: false,
        combo: 1,
      }));
    }
  };

  const handleBackClick = () => {
    if (gameState.isGameOver) {
      router.back();
      return;
    }
    setShowBackConfirmation(true);
  };

  const handleBackConfirm = () => {
    setShowBackConfirmation(false);
    router.back();
  };

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < 3) {
      setTutorialStep(tutorialStep + 1);
    } else {
      closeTutorial();
    }
  };

  // Prevent hydration errors by creating grid on client side only
  useEffect(() => {
    setGrid(createInitialGrid());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  // Register back button handler
  useBackButton(() => {
    setShowBackConfirmation(true);
  });

  useEffect(() => {
    return () => {
      setIsDragging(false);
      setDraggedTile(null);
    };
  }, []);

  if (isLoading) {
    return <LoadingView onLoadComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-60 h-60 rounded-full bg-pink-500/20 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="sticky w-full top-0 left-0 right-0 z-20 p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <motion.div
        className="w-full flex flex-col items-center relative z-10 p-2"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-lg">
          <div className="flex justify-between items-center mb-6">
            <motion.div
              className="relative flex-2"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg blur opacity-30" />
              <div className="relative w-full bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <div className="text-xs text-pink-400 mb-1 font-mono tracking-widest">SCORE</div>
                <motion.div
                  key={gameState.score}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold text-pink-400 font-mono tracking-wider"
                >
                  {gameState.score.toLocaleString()}
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="relative flex-1 mx-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur opacity-30" />
              <div className="relative w-full bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-violet-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <div className="text-xs text-violet-400 mb-1 font-mono tracking-widest">COMBO</div>
                <motion.div
                  key={gameState.combo}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold text-violet-400 font-mono tracking-wider"
                >
                  {gameState.combo}x
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="relative flex-1"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30" />
              <div className="relative w-full bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <div className="text-xs text-blue-400 mb-1 font-mono tracking-widest">MOVES</div>
                <motion.div
                  key={gameState.moves}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold text-blue-400 font-mono tracking-wider"
                >
                  {gameState.moves}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showStreak && streakCount > 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/4 z-30 flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg px-3 py-1 rounded-full shadow-lg"
          >
            <Flame className="inline-block mr-1 h-5 w-5" />
            {streakCount}x STREAK!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg p-2">
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
                  <div className="relative bg-gradient-to-b from-slate-900/95 to-purple-900/95 rounded-2xl p-8 border border-indigo-400/30 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                    <div className="absolute -top-10 -right-10 text-yellow-300 text-4xl animate-pulse opacity-70">
                      ✨
                    </div>
                    <div
                      className="absolute -bottom-6 -left-6 text-pink-300 text-3xl animate-pulse opacity-70"
                      style={{ animationDelay: '0.5s' }}
                    >
                      ✨
                    </div>
                    <motion.div
                      className="flex justify-center mb-6"
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                        GAME OVER!
                      </h2>
                    </motion.div>
                    <motion.div
                      className="text-center mb-6 bg-slate-800/60 p-4 rounded-xl"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <p className="text-lg text-white/80 mb-1">Final Score</p>
                      <motion.div
                        className="text-4xl font-bold text-yellow-300"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [0.8, 1.2, 1] }}
                        transition={{ delay: 0.6, duration: 0.7, times: [0, 0.6, 1] }}
                      >
                        {gameState.score.toLocaleString()}
                      </motion.div>
                    </motion.div>
                    <motion.div
                      className="flex justify-center mb-6"
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                    >
                      <Trophy className="w-16 h-16 text-yellow-400" />
                    </motion.div>
                    <motion.div
                      className="flex flex-col gap-3"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <Button
                        onClick={restartGame}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Play Again
                      </Button>
                      <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="bg-slate-800/30 border-indigo-500/50 text-white hover:bg-slate-800/50 rounded-xl py-3"
                      >
                        <Home className="w-5 h-5 mr-2" />
                        Return to Home
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="grid gap-1.5 place-items-center"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              touchAction: 'none',
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((item, colIndex) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={item.isMatched ? fallVariant.initial : swapVariant.initial}
                  animate={{
                    ...(item.isMatched ? fallVariant.animate : swapVariant.animate),
                    scale: item.isMatched
                      ? 0
                      : selectedTile?.row === rowIndex && selectedTile?.col === colIndex
                        ? 1.1
                        : draggedTile?.row === rowIndex && draggedTile?.col === colIndex
                          ? 1.1
                          : 1,
                    rotate: selectedTile?.row === rowIndex && selectedTile?.col === colIndex ? [0, 5, 0, -5, 0] : 0,
                  }}
                  transition={item.isMatched ? fallVariant.transition : swapVariant.transition}
                  className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-xl
                  ${tileConfig[item.type].bgColor[item.tier]}
                  ${
                    selectedTile?.row === rowIndex && selectedTile?.col === colIndex
                      ? 'ring-4 ring-white shadow-[0_0_15px_rgba(255,255,255,0.7)]'
                      : draggedTile?.row === rowIndex && draggedTile?.col === colIndex
                        ? 'ring-4 ring-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.7)]'
                        : 'shadow-md hover:shadow-lg'
                  }
                  ${
                    showHint &&
                    ((hintPosition?.row1 === rowIndex && hintPosition?.col1 === colIndex) ||
                      (hintPosition?.row2 === rowIndex && hintPosition?.col2 === colIndex))
                      ? 'animate-pulse ring-2 ring-yellow-300'
                      : ''
                  }
                  cursor-pointer
                  flex items-center justify-center
                  transition-shadow duration-200
                  relative overflow-hidden
                  touch-none
                `}
                  onClick={() => tileSwapMode === 'select' && handleTileClick(rowIndex, colIndex)}
                  onMouseDown={() => tileSwapMode === 'drag' && handleDragStart(rowIndex, colIndex)}
                  onMouseEnter={() => tileSwapMode === 'drag' && handleDragEnter(rowIndex, colIndex)}
                  onMouseUp={() => tileSwapMode === 'drag' && handleDragEnd()}
                  onTouchStart={() => tileSwapMode === 'drag' && handleDragStart(rowIndex, colIndex)}
                  onTouchMove={(e: TouchEvent<HTMLDivElement>) => onTouchMove(e)}
                  onTouchEnd={() => tileSwapMode === 'drag' && handleDragEnd()}
                  data-row={rowIndex}
                  data-col={colIndex}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                  {item.tier > 1 && (
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-yellow-300 shadow-[0_0_5px_rgba(253,224,71,0.7)]"></div>
                  )}
                  <motion.div
                    animate={{
                      rotate: selectedTile?.row === rowIndex && selectedTile?.col === colIndex ? 360 : 0,
                    }}
                    transition={{
                      duration: 1,
                      type: 'tween',
                      repeat:
                        selectedTile?.row === rowIndex && selectedTile?.col === colIndex ? Number.POSITIVE_INFINITY : 0,
                    }}
                    className="relative z-10"
                  >
                    {createElement(tileConfig[item.type].icon[item.tier], {
                      className: 'w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md',
                      strokeWidth: 2.5,
                    })}
                  </motion.div>
                </motion.div>
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
            {gameItems.map(({ id, count, icon, name }) => (
              <motion.div
                key={id}
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
                whileHover={{ scale: count > 0 ? 1.05 : 1 }}
                whileTap={{ scale: count > 0 ? 0.95 : 1 }}
              >
                <div className="text-3xl mb-2">{createElement(icon, { className: 'w-8 h-8 text-white' })}</div>
                <div className="text-sm font-bold text-white">{name}</div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {count}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {gameMode === 'casual' && (
            <motion.div
              className="mt-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={showHintMove}
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Need a hint?
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      <ConfirmationModal
        isOpen={showBackConfirmation}
        title="Exit Game"
        message={
          <div className="space-y-3">
            <p className="text-white">Are you sure you want to exit the game?</p>
            <div className="flex items-start gap-2 bg-yellow-400/10 p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-yellow-300 text-sm font-medium">
                Your progress will not be saved and any used items will not be refunded.
              </p>
            </div>
          </div>
        }
        confirmText="Exit"
        cancelText="Continue"
        onConfirm={handleBackConfirm}
        onCancel={() => setShowBackConfirmation(false)}
      />

      <SettingsMenu
        isOpen={showSettingsMenu}
        tileSwapMode={tileSwapMode}
        onChangeTileSwapMode={setTileSwapMode}
        onClose={() => setShowSettingsMenu(false)}
        onRestart={restartGame}
        onShowTutorial={() => {
          setShowTutorial(true);
          setTutorialStep(1);
        }}
        onShowBackConfirmation={() => setShowBackConfirmation(true)}
      />

      <TutorialDialog
        isOpen={showTutorial}
        onClose={closeTutorial}
        onNextStep={nextTutorialStep}
        currentStep={tutorialStep}
        gameMode={gameMode}
        gameItems={gameItems}
      />
    </div>
  );
};

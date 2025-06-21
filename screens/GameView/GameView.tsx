'use client';

import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { cloneDeep } from 'lodash';
import { ArrowLeft, Settings, Home, RefreshCw, Shuffle } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, type TouchEvent, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmationModal } from '@/components/logic/dialogs/ConfirmationModal';
import { ItemAnimationManager } from '@/components/logic/managers/ItemAnimationManager';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { useBackButton } from '@/hooks/useBackButton';
import {
  ANIMATION_DURATION,
  CASUAL_MODE_MOVE_COUNT,
  CHALLENGE_MODE_MOVE_COUNT,
  GRID_SIZE,
  HINT_MOVE_INTERVAL_MS,
  SCORE,
  SHOW_EFFECT_TIME_MS,
  SHOW_HINT_TIME_MS,
  SHOW_STREAK_MAINTAIN_TIME_MS,
  TILE_MAX_TIER,
} from '@/screens/GameView/constants/game-config';
import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GameMode, GridItem, TileType, GameState, GameItemType, TierType } from '@/types/game-types';
import { createParticles } from '@/utils/animation-helper';
import { calculateComboBonus, batchUpdateTiles } from '@/utils/game-helper';
import { useOptimizedGridRendering, useRenderPerformance } from '@/utils/performance-optimization';

import { LoadingView } from '../LoadingView/LoadingView';

import { SettingsMenu } from './components/SettingsMenu';
import { TileComponent } from './components/TileComponent';
import { TutorialDialog } from './components/TutorialDialog';
import { useGameItem } from './hooks/useGameItem';
import { useGameSettings } from './hooks/useGameSettings';
import { useGameWorker } from './hooks/useGameWorker';
import { useMatchGame } from './hooks/useMatchGame';

export const GameView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') as GameMode;
  const { grid, setGrid, getRandomItemType, createInitialGrid, findMatches, findPossibleMove } = useMatchGame();
  const { tileSwapMode, setTileSwapMode, hasSeenTutorial, setHasSeenTutorial } = useGameSettings();
  const {
    gameItems,
    selectedGameItem,
    setSelectedGameItem,
    setIsItemAnimating,
    setItemAnimation,
    executeItem,
    isItemAnimating,
    itemAnimation,
  } = useGameItem();

  const [lastMatchTime, setLastMatchTime] = useState<number>(Date.now());

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
    isProcessingMatches: false,
  });
  const [showScorePopup, setShowScorePopup] = useState<{
    score: number;
    x: number;
    y: number;
  } | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintPosition, setHintPosition] = useState<{ row1: number; col1: number; row2: number; col2: number } | null>(
    null,
  );
  const [tileChangeIndex, setTileChangeIndex] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showShuffleToast, setShowShuffleToast] = useState<boolean>(false);
  const [showBonusMovesAnimation, setShowBonusMovesAnimation] = useState<number>(0);
  const tileRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const t = useTranslations();
  const refillPromiseRef = useRef<Promise<void> | null>(null);

  // 성능 최적화 훅
  const { grid: optimizedGrid, hasChanges } = useOptimizedGridRendering(grid);
  const { renderCount } = useRenderPerformance('GameView');

  // Web Worker 훅
  const { isWorkerAvailable } = useGameWorker({ enabled: true });

  // 개발 환경에서 성능 추적
  if (process.env.NODE_ENV === 'development') {
    if (hasChanges) {
      console.log('[Performance] Grid changed, re-rendering optimized tiles');
    }
    if (!isWorkerAvailable) {
      console.warn('[Performance] Web Worker is not available, falling back to main thread');
    }
  }

  const handleTileClick = (row: number, col: number) => {
    if (
      gameState.isSwapping ||
      gameState.isChecking ||
      gameState.isGameOver ||
      isItemAnimating ||
      gameState.isProcessingMatches
    )
      return;

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
    if (
      gameState.isSwapping ||
      gameState.isChecking ||
      gameState.isGameOver ||
      isItemAnimating ||
      gameState.isProcessingMatches
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
      isItemAnimating
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

  const removeMatchedTiles = useCallback(
    (currentGrid: GridItem[][]): { newGrid: GridItem[][]; newTileIds: string[] } => {
      const newGrid = cloneDeep(currentGrid);
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
    ) => {
      if (matches.length === 0) return;

      const nextCombo = currentCombo + 1;
      const matchScore = calculateMatchScore(matches.length, nextCombo, streakCount);
      const bonusMoves = calculateComboBonus(nextCombo);
      const shouldDecreaseMoves = isFirstMatch && !selectedGameItem;
      const movesAdjustment = shouldDecreaseMoves ? -1 : 0;
      const newMoves = gameState.moves + movesAdjustment + bonusMoves;

      // 상태 업데이트
      updateGameState({
        isProcessingMatches: true,
        isChecking: true,
        score: gameState.score + matchScore,
        moves: newMoves,
        turn: isFirstMatch ? gameState.turn + 1 : gameState.turn,
        combo: nextCombo,
      });

      setLastMatchTime(Date.now());

      // UI 효과 표시
      if (matches.length > 0) {
        const centerRow = matches.reduce((sum, m) => sum + m.row, 0) / matches.length;
        const centerCol = matches.reduce((sum, m) => sum + m.col, 0) / matches.length;

        setShowScorePopup({ score: matchScore, x: centerCol, y: centerRow });
        if (bonusMoves > 0) {
          setShowBonusMovesAnimation(bonusMoves);
        }

        // 파티클 효과
        const x = (centerCol + 0.5) / GRID_SIZE;
        const y = (centerRow + 0.5) / GRID_SIZE;
        const level = (currentGrid[matches[0].row][matches[0].col].tier || 1) as TierType;
        const itemType = (currentGrid[matches[0].row][matches[0].col].type || 1) as TileType;
        const color = tileConfig[itemType]?.color[level]?.replace('text-', '') || 'red';
        createParticles(x, y, color);

        setTimeout(() => setShowScorePopup(null), SHOW_EFFECT_TIME_MS);
        if (bonusMoves > 0) {
          setTimeout(() => setShowBonusMovesAnimation(0), SHOW_EFFECT_TIME_MS);
        }
      }

      // 매칭된 타일 업데이트
      const tileUpdates: Array<{ row: number; col: number; changes: Partial<GridItem> }> = [];

      matches.forEach(({ row, col }, index) => {
        if (!swappedTiles) {
          if (index === 0) {
            const challengeMatchCondition = gameMode === 'challenge' && currentGrid[row][col].tier < TILE_MAX_TIER;
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
            if (gameMode === 'challenge' && currentGrid[row][col].tier < 3) {
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

      // 그리드 업데이트
      const newGrid = cloneDeep(currentGrid);
      batchUpdateTiles(newGrid, tileUpdates);
      setGrid(newGrid);

      // 매칭 애니메이션 대기
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 타일 제거 및 리필
      const { newGrid: afterRemovalGrid, newTileIds } = removeMatchedTiles(newGrid);
      setGrid(afterRemovalGrid);
      setTileChangeIndex((prev) => prev + 1);

      // 리필 애니메이션이 있는 경우에만 대기
      if (newTileIds.length > 0) {
        // 리필 애니메이션 완료까지 대기
        const refillPromise = new Promise<void>((resolve) => setTimeout(resolve, 500)); // Dummy promise
        refillPromiseRef.current = refillPromise;

        await refillPromise;
        refillPromiseRef.current = null;
      }

      // 추가 대기 시간 (애니메이션 완전 완료 보장)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 다음 매칭 확인
      const newMatches = findMatches(afterRemovalGrid);
      if (newMatches.length > 0) {
        // 연쇄 매칭 발견 - 재귀 호출
        await processMatches(newMatches, afterRemovalGrid, false, undefined, nextCombo);
      } else {
        // 연쇄 매칭 종료
        const isGameOver = newMoves <= 0;

        updateGameState({
          isSwapping: false,
          isChecking: false,
          isProcessingMatches: false,
          combo: 1,
          isGameOver,
        });

        if (isGameOver) {
          confetti({
            particleCount: 100,
            spread: 160,
            origin: { x: 0.5, y: 0.5 },
            disableForReducedMotion: true,
          });
        }
      }
    },
    [
      gameState,
      streakCount,
      selectedGameItem,
      gameMode,
      calculateMatchScore,
      updateGameState,
      findMatches,
      removeMatchedTiles,
      setGrid,
    ],
  );

  const swapTiles = useCallback(
    async (row1: number, col1: number, row2: number, col2: number) => {
      setGameState((prev) => ({ ...prev, isSwapping: true }));
      let newGrid = cloneDeep(grid);

      setShowHint(false);

      const swappedTiles = [
        { row: row1, col: col1 },
        { row: row2, col: col2 },
      ];

      const temp = { ...newGrid[row1][col1] };
      newGrid[row1][col1] = { ...newGrid[row2][col2] };
      newGrid[row2][col2] = temp;

      setGrid(newGrid);
      setSelectedTile(null);

      // 스와핑 애니메이션 대기
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

      const matches = findMatches(newGrid);

      // 추가 대기 시간
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION + 100));

      if (matches.length > 0) {
        const now = Date.now();
        if (now - lastMatchTime < SHOW_STREAK_MAINTAIN_TIME_MS) {
          setStreakCount((prev) => prev + 1);
        } else {
          setStreakCount(1);
        }
        setLastMatchTime(now);

        // 매칭 처리 (async 함수로 변경)
        await processMatches(matches, newGrid, true, swappedTiles);
      } else {
        // 매칭이 없으면 되돌리기
        newGrid = cloneDeep(newGrid);
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
    },
    [grid, findMatches, lastMatchTime, processMatches, setGrid],
  );

  const restartGame = () => {
    setGameState({
      score: 0,
      moves: gameMode === 'casual' ? CASUAL_MODE_MOVE_COUNT : CHALLENGE_MODE_MOVE_COUNT,
      isSwapping: false,
      isChecking: false,
      isGameOver: false,
      combo: 1,
      turn: 0,
      isProcessingMatches: false,
    });
    setTileChangeIndex(0);
    setGrid(createInitialGrid());
    setSelectedTile(null);
    setShowScorePopup(null);
    setStreakCount(0);
  };

  const handleGameItemSelect = (itemId: GameItemType) => {
    if (selectedTile) {
      setSelectedGameItem(null);
      return;
    }

    if (selectedGameItem === itemId) {
      setSelectedGameItem(null);
      return;
    }
    setSelectedGameItem(itemId);
  };

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

    // 아이템으로 제거된 타일 수 계산
    let removedTileCount = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // 아이템 사용 전에는 타일이 매칭되지 않았고, 사용 후에는 매칭된 경우
        const originalTile = grid[row][col];
        const updatedTile = updatedGrid[row][col];
        if (!originalTile.isMatched && updatedTile.isMatched) {
          removedTileCount++;
        }
      }
    }

    // 아이템으로 제거된 타일들에 대한 점수 계산 및 추가
    if (removedTileCount > 0) {
      const itemScore = calculateMatchScore(removedTileCount, gameState.combo, streakCount);
      const bonusMoves = calculateComboBonus(gameState.combo);

      // 상태 업데이트
      updateGameState({
        score: gameState.score + itemScore,
        moves: gameState.moves + bonusMoves,
        combo: gameState.combo + 1,
      });

      // UI 효과 표시
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
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION * 1.5));
      const matches = findMatches(afterRemovalGrid.newGrid);
      if (matches.length > 0) {
        processMatches(matches, afterRemovalGrid.newGrid, true);
      } else {
        setGameState((prev) => ({
          ...prev,
          isSwapping: false,
          isChecking: false,
          combo: 1,
        }));
      }
    }, ANIMATION_DURATION);
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

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const nextTutorialStep = () => {
    if (tutorialStep < 3) {
      setTutorialStep(tutorialStep + 1);
    } else {
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
    if (grid.length > 0 && !gameState.isSwapping && !gameState.isChecking && gameState.moves > 0) {
      const possibleMove = findPossibleMove();
      if (!possibleMove) {
        setGameState((prev) => ({ ...prev, isSwapping: true }));
        setShowShuffleToast(true);
        setTimeout(() => {
          const newGrid = shuffleGrid();
          setGrid(newGrid);
          setGameState((prev) => ({ ...prev, isSwapping: false }));
          setTimeout(() => setShowShuffleToast(false), 2000);
        }, ANIMATION_DURATION);
      }
    }
  }, [grid, gameState.isSwapping, gameState.isChecking, gameState.moves, findPossibleMove, shuffleGrid, setGrid]);

  useEffect(() => {
    setGrid(createInitialGrid());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

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

  useBackButton(() => {
    setShowBackConfirmation(true);
  });

  if (isLoading) {
    return <LoadingView onLoadComplete={() => setIsLoading(false)} />;
  }

  return (
    <>
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
        <header className="fixed w-full h-16 inset-0 z-20 p-4">
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
        </header>

        <main className="w-full max-w-lg mx-auto flex flex-col items-center relative z-10 p-2">
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
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg blur opacity-30" />
                  <div className="relative w-full bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    <div className="text-pink-400 mb-1 tracking-widest">{t('common.score')}</div>
                    <motion.div
                      key={gameState.score}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl font-bold text-pink-400 tracking-wider"
                    >
                      {gameState.score.toLocaleString()}
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
                            {t('game.gameOver')}
                          </h2>
                        </motion.div>
                        <motion.div
                          className="text-center mb-6 bg-slate-800/60 p-4 rounded-xl"
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
                        </motion.div>
                        <motion.div
                          className="flex justify-center mb-6"
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                        >
                          <div className="text-5xl text-yellow-400">🏆</div>
                        </motion.div>
                        <motion.div
                          className="flex flex-col gap-3"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                        >
                          <Button
                            onClick={restartGame}
                            className="flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl text-md shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            {t('game.playAgain')}
                          </Button>
                          <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="flex items-center justify-center bg-slate-800/30 border-indigo-500/50 text-white hover:bg-slate-800/50 rounded-xl py-3 text-md"
                          >
                            <Home className="w-5 h-5 mr-2" />
                            {t('game.returnToHome')}
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
                {optimizedGrid.map((row, rowIndex) =>
                  row.map((item, colIndex) => (
                    <TileComponent
                      key={`${item.id}-${renderCount}`}
                      item={item}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      isSelected={selectedTile?.row === rowIndex && selectedTile?.col === colIndex}
                      isDragged={draggedTile?.row === rowIndex && draggedTile?.col === colIndex}
                      showHint={
                        showHint &&
                        ((hintPosition?.row1 === rowIndex && hintPosition?.col1 === colIndex) ||
                          (hintPosition?.row2 === rowIndex && hintPosition?.col2 === colIndex))
                      }
                      onTileClick={() => tileSwapMode === 'select' && handleTileClick(rowIndex, colIndex)}
                      onMouseDown={() => tileSwapMode === 'drag' && handleDragStart(rowIndex, colIndex)}
                      onMouseEnter={() => tileSwapMode === 'drag' && handleDragEnter(rowIndex, colIndex)}
                      onMouseUp={() => tileSwapMode === 'drag' && handleDragEnd()}
                      onTouchStart={() => tileSwapMode === 'drag' && handleDragStart(rowIndex, colIndex)}
                      onTouchMove={(e) => onTouchMove(e)}
                      onTouchEnd={() => tileSwapMode === 'drag' && handleDragEnd()}
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
                    <div className="text-3xl mb-2">
                      <Image
                        className={`${selectedGameItem === id ? 'animate-item-selected' : ''}`}
                        src={icon}
                        alt={name}
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
                ))}
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={showBackConfirmation}
        title={t('modal.confirmExit')}
        message={
          <div className="space-y-3">
            <p className="text-white">{t('modal.exitMessage')}</p>
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
              <p className="text-yellow-300 text-sm font-medium">{t('modal.exitMessage')}</p>
            </div>
          </div>
        }
        confirmText={t('common.exit')}
        cancelText={t('common.continue')}
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
        onPrevStep={prevTutorialStep}
        currentStep={tutorialStep}
        gameMode={gameMode}
        gameItems={gameItems}
      />

      <Toast isOpen={showShuffleToast} icon={Shuffle} message={t('game.shuffleMessage')} />
    </>
  );
};

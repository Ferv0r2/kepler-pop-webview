'use client';

import { Settings, RefreshCw, Shuffle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
import type { GridItem, GameState, GameItemType, TierType } from '@/types/game-types';
import { calculateComboBonus, batchUpdateTiles } from '@/utils/game-helper';
import { CanvasGameRenderer } from '@/utils/canvas-renderer';
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
import { TutorialDialog } from './components/TutorialDialog';
import { RewardModal } from './components/RewardModal';
import { ArtifactPanel } from './components/ArtifactPanel';
import { useGameItem } from './hooks/useGameItem';
import { useGameSettings } from './hooks/useGameSettings';
import { useMatchGame } from './hooks/useMatchGame';
import { useRewardSystem } from './hooks/useRewardSystem';

// Settings Modal Component (reused from optimized version)
const SettingsModal = memo(
  ({
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
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 shadow-2xl border border-slate-600/50 max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{t('settings.title')}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
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

            <div className="space-y-2">
              <span className="text-white">{t('settings.language')}</span>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {SUPPORTED_LOCALES.map((language) => (
                    <SelectItem
                      key={language}
                      value={language}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      {LOCALE_NAMES[language] || language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
    );
  },
);

SettingsModal.displayName = 'SettingsModal';

export const GameViewCanvas = () => {
  const { grid, setGrid, getRandomItemType, createInitialGrid, findMatches, findPossibleMove } = useMatchGame();
  const { hasSeenTutorial, setHasSeenTutorial } = useGameSettings();
  const { gameItems, selectedGameItem, setSelectedGameItem, executeItemDirect, resetItems, addItem } = useGameItem();

  // 리워드 시스템
  const {
    rewardState,
    showRewardModal,
    availableRewards,
    timeRemaining,
    selectReward,
    checkScoreReward,
    applyArtifactEffects,
    getShuffleCost,
    resetRewardState,
  } = useRewardSystem(gameItems);
  const { settings: soundSettings } = useSound();
  const t = useTranslations();

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasGameRenderer | null>(null);

  // Game state
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

  // UI state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [showShuffleConfirmation, setShowShuffleConfirmation] = useState(false);
  const [showShuffleButton, setShowShuffleButton] = useState(false);
  const [showShuffleToast, setShowShuffleToast] = useState(false);
  const [showBonusMovesAnimation, setShowBonusMovesAnimation] = useState(0);

  // Game stats
  const [streakCount, setStreakCount] = useState(0);
  const [lastMatchTime, setLastMatchTime] = useState(Date.now());
  const [highScore, setHighScore] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);

  // Interaction state
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null);
  const [longPressItem, setLongPressItem] = useState<GameItemType | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Canvas renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasGameRenderer(canvasRef.current);
      rendererRef.current.startRenderLoop();
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Update renderer when grid changes
  useEffect(() => {
    if (rendererRef.current && grid.length > 0) {
      rendererRef.current.updateGrid(grid);
    }
  }, [grid]);

  // Load high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('keplerGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Save high score
  useEffect(() => {
    if (gameState.isGameOver && gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('keplerGameHighScore', gameState.score.toString());
    }
  }, [gameState.isGameOver, gameState.score, highScore]);

  // Canvas interaction handlers
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (
        !rendererRef.current ||
        gameState.isSwapping ||
        gameState.isChecking ||
        gameState.isGameOver ||
        isInitializing ||
        gameState.isProcessingMatches ||
        isShuffling
      ) {
        return;
      }

      const tile = rendererRef.current.getTileFromPosition(e.clientX, e.clientY);

      if (tile) {
        if (selectedGameItem) {
          activeSelectedGameItem(tile.row, tile.col);
        } else {
          setDraggedTile(tile);
          rendererRef.current.setDraggedTile(tile.row, tile.col);
        }
      }
    },
    [gameState, isInitializing, isShuffling, selectedGameItem],
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!rendererRef.current) return;

      const tile = rendererRef.current.getTileFromPosition(e.clientX, e.clientY);

      // 연쇄 매칭 중이거나 게임 상태가 불안정할 때는 호버 효과도 비활성화
      if (
        gameState.isProcessingMatches ||
        gameState.isSwapping ||
        gameState.isChecking ||
        gameState.isGameOver ||
        isShuffling
      ) {
        rendererRef.current.setSelectedItem(null);
        rendererRef.current.setHoveredTile(null, null);
        return;
      }

      // 아이템 선택 시 호버 효과
      if (selectedGameItem && tile) {
        rendererRef.current.setSelectedItem(selectedGameItem);
        rendererRef.current.setHoveredTile(tile.row, tile.col);
      } else {
        rendererRef.current.setSelectedItem(null);
        rendererRef.current.setHoveredTile(null, null);
      }

      // 드래그 로직 (연쇄 매칭 중에는 비활성화)
      if (draggedTile && !gameState.isSwapping && !gameState.isProcessingMatches && tile) {
        if (tile.row !== draggedTile.row || tile.col !== draggedTile.col) {
          const isAdjacent =
            (Math.abs(draggedTile.row - tile.row) === 1 && draggedTile.col === tile.col) ||
            (Math.abs(draggedTile.col - tile.col) === 1 && draggedTile.row === tile.row);

          if (isAdjacent) {
            setDraggedTile(null);
            rendererRef.current.setDraggedTile(null, null);
            swapTiles(draggedTile.row, draggedTile.col, tile.row, tile.col);
          }
        }
      }
    },
    [
      draggedTile,
      gameState.isSwapping,
      gameState.isProcessingMatches,
      gameState.isChecking,
      gameState.isGameOver,
      isShuffling,
      selectedGameItem,
    ],
  );

  const handleCanvasPointerUp = useCallback(() => {
    if (rendererRef.current) {
      setDraggedTile(null);
      rendererRef.current.setDraggedTile(null, null);
    }
  }, []);

  const handleCanvasPointerLeave = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.setSelectedItem(null);
      rendererRef.current.setHoveredTile(null, null);
      setDraggedTile(null);
      rendererRef.current.setDraggedTile(null, null);
    }
  }, []);

  // Remove matched tiles
  const removeMatchedTiles = useCallback(
    (currentGrid: GridItem[][]): { newGrid: GridItem[][]; newTileIds: string[]; dropAnimations: any[] } => {
      const newGrid = structuredClone(currentGrid);
      const newTileIds: string[] = [];
      const dropAnimations: any[] = [];

      for (let col = 0; col < GRID_SIZE; col++) {
        const columnTiles: GridItem[] = [];
        let dropDistance = 0;

        for (let row = GRID_SIZE - 1; row >= 0; row--) {
          if (!newGrid[row][col].isMatched) {
            if (dropDistance > 0) {
              dropAnimations.push({
                id: newGrid[row][col].id,
                fromRow: row,
                toRow: row + dropDistance,
                col: col,
              });
            }
            columnTiles.unshift(newGrid[row][col]);
          } else {
            dropDistance++;
          }
        }

        // Create new tiles
        const missingCount = GRID_SIZE - columnTiles.length;
        for (let i = 0; i < missingCount; i++) {
          const newTileId = `${i}-${col}-${uuidv4()}`;
          const newTile = {
            id: newTileId,
            type: getRandomItemType(),
            isMatched: false,
            createdIndex: Date.now(),
            turn: gameState.turn,
            tier: 1 as TierType,
          };
          columnTiles.unshift(newTile);
          newTileIds.push(newTileId);

          dropAnimations.push({
            id: newTileId,
            fromRow: -missingCount + i,
            toRow: i,
            col: col,
          });
        }

        // Update column
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = columnTiles[row];
        }
      }

      return { newGrid, newTileIds, dropAnimations };
    },
    [getRandomItemType, gameState.turn],
  );

  // 리워드 선택 핸들러
  const handleRewardSelect = useCallback(
    (reward: any) => {
      if (reward.type === 'moves') {
        setGameState((prev) => ({
          ...prev,
          moves: prev.moves + reward.value,
        }));
      } else if (reward.type === 'items') {
        const itemId = reward.id.split('_')[1];
        addItem(itemId, reward.value);
      }
      // gem 과 artifact 은 따로 처리 필요 (현재는 생략)
      selectReward(reward);
    },
    [addItem, selectReward, setGameState],
  );

  // Process matches
  const processMatches = useCallback(
    async (
      matches: { row: number; col: number }[],
      currentGrid: GridItem[][],
      isFirstMatch = false,
      swappedTiles?: { row: number; col: number }[],
    ) => {
      if (matches.length === 0) return;

      const baseMatchScore = matches.length * SCORE * (gameState.combo + 1) * (streakCount > 1 ? streakCount : 1);
      const bonusMoves = calculateComboBonus(gameState.combo + 1);
      const shouldDecreaseMoves = isFirstMatch && !selectedGameItem;
      const newMoves = gameState.moves + (shouldDecreaseMoves ? -1 : 0) + bonusMoves;

      // 유물 효과 적용
      const { score: matchScore } = applyArtifactEffects(currentGrid, gameState.combo + 1, baseMatchScore);
      const newScore = gameState.score + matchScore;

      // Update state
      setGameState((prev) => ({
        ...prev,
        isProcessingMatches: true,
        isChecking: true,
        score: newScore,
        moves: newMoves,
        turn: isFirstMatch ? prev.turn + 1 : prev.turn,
        combo: prev.combo + 1,
      }));

      // Play sounds
      if (gameState.combo > 0) {
        playComboSound(soundSettings);
      } else {
        playMatchSound(soundSettings);
      }

      // Show animations
      if (bonusMoves > 0) {
        setShowBonusMovesAnimation(bonusMoves);
        setTimeout(() => setShowBonusMovesAnimation(0), SHOW_EFFECT_TIME_MS);
      }

      // Animate matches in canvas
      if (rendererRef.current) {
        const matchTiles = matches.map((m) => ({
          ...m,
          id: currentGrid[m.row][m.col].id,
        }));
        rendererRef.current.handleMatchAnimation(matchTiles);
      }

      // Mark tiles as matched
      const tileUpdates: Array<{ row: number; col: number; changes: Partial<GridItem> }> = [];
      matches.forEach(({ row, col }, index) => {
        const shouldUpgrade =
          (index === 0 && !swappedTiles) || swappedTiles?.some((tile) => tile.row === row && tile.col === col);

        if (shouldUpgrade && currentGrid[row][col].tier < TILE_MAX_TIER) {
          tileUpdates.push({
            row,
            col,
            changes: { tier: (currentGrid[row][col].tier + 1) as TierType, isMatched: false },
          });
        } else {
          tileUpdates.push({ row, col, changes: { isMatched: true } });
        }
      });

      const newGrid = structuredClone(currentGrid);
      batchUpdateTiles(newGrid, tileUpdates);
      setGrid(newGrid);

      // Wait for match animation
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Remove and refill
      const { newGrid: afterRemovalGrid, newTileIds, dropAnimations } = removeMatchedTiles(newGrid);
      setGrid(afterRemovalGrid);

      // Animate drops in canvas
      if (rendererRef.current && dropAnimations.length > 0) {
        rendererRef.current.handleDropAnimation(dropAnimations);

        // Animate new tiles
        const newTileAnimations = newTileIds
          .map((id) => {
            const tile = afterRemovalGrid.flat().find((t) => t.id === id);
            if (tile) {
              const tileRow = afterRemovalGrid.findIndex((r) => r.includes(tile));
              const tileCol = afterRemovalGrid[tileRow].indexOf(tile);
              return { id, row: tileRow, col: tileCol };
            }
            return null;
          })
          .filter(Boolean) as { id: string; row: number; col: number }[];

        rendererRef.current.handleNewTileAnimation(newTileAnimations);
      }

      // Wait for drop animation
      if (newTileIds.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      // Check for cascading matches
      const newMatches = findMatches(afterRemovalGrid);
      if (newMatches.length > 0) {
        await processMatches(newMatches, afterRemovalGrid, false);
      } else {
        const isGameOver = newMoves <= 0;
        setGameState((prev) => ({
          ...prev,
          isSwapping: false,
          isChecking: false,
          isProcessingMatches: false,
          combo: 1,
          isGameOver,
        }));

        // 리워드 체크 (첫 번째 매치이고 게임이 끝나지 않았을 때만)
        if (isFirstMatch && !isGameOver) {
          checkScoreReward(newScore);
        }

        if (isGameOver) {
          playGameOverSound(soundSettings);
        }
      }
    },
    [
      gameState,
      streakCount,
      selectedGameItem,
      setGrid,
      removeMatchedTiles,
      findMatches,
      soundSettings,
      applyArtifactEffects,
      checkScoreReward,
    ],
  );

  // Swap tiles
  const swapTiles = useCallback(
    async (row1: number, col1: number, row2: number, col2: number) => {
      setGameState((prev) => ({ ...prev, isSwapping: true }));

      let newGrid = structuredClone(grid);
      const tile1Id = newGrid[row1][col1].id;
      const tile2Id = newGrid[row2][col2].id;

      // Animate swap in canvas
      if (rendererRef.current) {
        rendererRef.current.handleSwapAnimation(row1, col1, row2, col2, tile1Id, tile2Id);
      }

      // Perform swap
      [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
      setGrid(newGrid);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const matches = findMatches(newGrid);

      if (matches.length > 0) {
        const now = Date.now();
        if (now - lastMatchTime < SHOW_STREAK_MAINTAIN_TIME_MS) {
          setStreakCount((prev) => prev + 1);
        } else {
          setStreakCount(1);
        }
        setLastMatchTime(now);

        const swappedTiles = [
          { row: row1, col: col1 },
          { row: row2, col: col2 },
        ];
        await processMatches(matches, newGrid, true, swappedTiles);
      } else {
        // Revert swap animation
        if (rendererRef.current) {
          rendererRef.current.handleSwapAnimation(row2, col2, row1, col1, tile2Id, tile1Id);
        }

        // Revert swap
        [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
        setGrid(newGrid);

        await new Promise((resolve) => setTimeout(resolve, 200));

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
    [grid, setGrid, findMatches, lastMatchTime, processMatches, gameState.moves, soundSettings],
  );

  // Active item effect
  const activeSelectedGameItem = useCallback(
    async (row: number, col: number) => {
      if (!selectedGameItem) return;

      playItemSound(soundSettings);

      // Set item animation for the executeItem function to use
      let direction: 'row' | 'col' | undefined;
      if (selectedGameItem === 'mole') {
        // For mole, we can choose row or col based on which has more tiles
        const rowCount = grid[row].filter((tile) => !tile.isMatched).length;
        const colCount = grid.map((r) => r[col]).filter((tile) => !tile.isMatched).length;
        direction = rowCount >= colCount ? 'row' : 'col';
      }

      // Execute item effect directly
      const updatedGrid = executeItemDirect(grid, selectedGameItem, row, col, direction);
      if (updatedGrid) {
        setGrid(updatedGrid);

        // Animate affected tiles
        if (rendererRef.current) {
          const affectedTiles = [];
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if (updatedGrid[r][c].isMatched) {
                affectedTiles.push({ row: r, col: c, id: updatedGrid[r][c].id });
              }
            }
          }
          rendererRef.current.handleMatchAnimation(affectedTiles);
        }

        // Process matches after item effect
        setTimeout(async () => {
          const { newGrid: afterRemovalGrid, dropAnimations } = removeMatchedTiles(updatedGrid);
          setGrid(afterRemovalGrid);

          if (rendererRef.current && dropAnimations.length > 0) {
            rendererRef.current.handleDropAnimation(dropAnimations);
          }

          await new Promise((resolve) => setTimeout(resolve, 400));

          const matches = findMatches(afterRemovalGrid);
          if (matches.length > 0) {
            await processMatches(matches, afterRemovalGrid, true);
          }
        }, 300);
      }
    },
    [
      selectedGameItem,
      executeItemDirect,
      grid,
      soundSettings,
      setGrid,
      removeMatchedTiles,
      findMatches,
      processMatches,
    ],
  );

  // Restart game
  const restartGame = useCallback(() => {
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
    setStreakCount(0);
    setGrid(createInitialGrid());
    setShowSettingsModal(false);
    setIsShuffling(false);
    setShowShuffleConfirmation(false);
    setShowShuffleButton(false);
    resetItems();
    resetRewardState();
  }, [createInitialGrid, setGrid, resetItems, resetRewardState]);

  // Initialize game
  useEffect(() => {
    setGrid(createInitialGrid());
    setTimeout(() => setIsInitializing(false), SHOW_EFFECT_TIME_MS);
    preloadAllSounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show tutorial
  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  // Check for possible moves
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
  }, [grid, gameState, isShuffling, findPossibleMove, showShuffleConfirmation, showShuffleButton]);

  // Show hint
  useEffect(() => {
    if (lastMatchTime > 0 && !gameState.isSwapping && !gameState.isChecking && !gameState.isGameOver) {
      const timer = setTimeout(() => {
        const possibleMove = findPossibleMove();
        if (possibleMove && rendererRef.current) {
          rendererRef.current.setHintTiles([
            { row: possibleMove.row1, col: possibleMove.col1 },
            { row: possibleMove.row2, col: possibleMove.col2 },
          ]);

          setTimeout(() => {
            if (rendererRef.current) {
              rendererRef.current.setHintTiles([]);
            }
          }, SHOW_HINT_TIME_MS);
        }
      }, HINT_MOVE_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [lastMatchTime, gameState, findPossibleMove]);

  // Handle item selection
  const handleGameItemSelect = useCallback(
    (itemId: GameItemType) => {
      // 연쇄 매칭 중에는 아이템 선택 차단
      if (
        gameState.isProcessingMatches ||
        gameState.isSwapping ||
        gameState.isChecking ||
        gameState.isGameOver ||
        isShuffling
      ) {
        return;
      }

      const newSelection = itemId === selectedGameItem ? null : itemId;
      setSelectedGameItem(newSelection);
      if (rendererRef.current) {
        rendererRef.current.setSelectedTile(null, null);
        // 아이템 선택 해제 시 효과 제거
        if (!newSelection) {
          rendererRef.current.setSelectedItem(null);
          rendererRef.current.setHoveredTile(null, null);
        }
      }
    },
    [
      selectedGameItem,
      setSelectedGameItem,
      gameState.isProcessingMatches,
      gameState.isSwapping,
      gameState.isChecking,
      gameState.isGameOver,
      isShuffling,
    ],
  );

  // Handle long press
  const handleLongPressStart = useCallback((itemId: GameItemType) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setLongPressItem(itemId);
    }, 300);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setLongPressItem(null);
  }, []);

  // Shuffle grid
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

  // Handle shuffle
  const handleShuffleConfirm = useCallback(() => {
    setShowShuffleConfirmation(false);
    setShowShuffleButton(false);
    playShuffleSound(soundSettings);

    const shuffleCost = getShuffleCost();
    const newMoves = Math.max(0, gameState.moves - shuffleCost);
    const isGameOver = newMoves <= 0;

    setGameState((prev) => ({
      ...prev,
      moves: newMoves,
      turn: prev.turn + 1,
      isGameOver,
    }));

    if (!isGameOver) {
      setIsShuffling(true);
      if (rendererRef.current) {
        rendererRef.current.setShuffling(true);
      }

      setTimeout(() => {
        const newGrid = shuffleGrid();
        setGrid(newGrid);
        setIsShuffling(false);
        if (rendererRef.current) {
          rendererRef.current.setShuffling(false);
        }
        setShowShuffleToast(true);
        setTimeout(() => setShowShuffleToast(false), 2000);
      }, 1000);
    } else {
      playGameOverSound(soundSettings);
    }
  }, [soundSettings, gameState.moves, shuffleGrid, setGrid]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ConfettiManager>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <header className="fixed w-full h-16 inset-0 z-20 p-2">
          <div className="flex justify-end">
            <Button
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
          <div className="w-full flex flex-col items-center relative z-10 p-2">
            <div className="w-full max-w-lg">
              <div className="flex justify-between items-center mb-6 gap-4">
                {/* Score Display */}
                <motion.div
                  className="relative flex-2"
                  key={`score-${gameState.score}`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute -inset-1 rounded-lg blur opacity-30 bg-gradient-to-r from-pink-500 to-purple-500" />
                  <div className="relative w-full backdrop-blur-sm px-4 py-2 rounded-lg border shadow-[0_0_15px_rgba(236,72,153,0.3)] bg-black/90 border-pink-500/30">
                    <div className="text-pink-400 mb-1 tracking-widest">
                      {t('common.score')} {highScore > 0 && <span className="text-white/50">({highScore})</span>}
                    </div>
                    <motion.div
                      className="text-2xl font-bold tracking-wider text-pink-400"
                      key={gameState.score}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.2 }}
                    >
                      {gameState.score.toLocaleString()}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Moves Display */}
                <motion.div
                  className="relative flex-1"
                  key={`moves-${gameState.moves}`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30" />
                  <div className="relative w-full bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <div className="text-blue-400 mb-1 tracking-widest">{t('common.moves')}</div>
                    <motion.div
                      className="text-2xl font-bold text-blue-400 tracking-wider relative"
                      key={gameState.moves}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.2 }}
                    >
                      {Math.max(gameState.moves, 0)}
                      <AnimatePresence>
                        {showBonusMovesAnimation > 0 && (
                          <motion.div
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-green-400 font-bold text-lg z-20"
                            initial={{ opacity: 0, y: 0, scale: 0.8 }}
                            animate={{ opacity: 1, y: -10, scale: 1.2 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
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
          </div>

          <div className="w-full p-2">
            <div className="relative w-full bg-black/40 p-3 rounded-xl border-2 border-purple-600/50 shadow-[0_0_20px_rgba(147,51,234,0.4)] backdrop-blur-sm">
              {/* Canvas Game Grid */}
              <canvas
                ref={canvasRef}
                className="w-full aspect-square cursor-pointer"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerLeave}
                style={{ touchAction: 'none', background: 'transparent' }}
              />

              {/* Game Over Modal */}
              <AnimatePresence>
                {gameState.isGameOver && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl z-20 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="relative w-5/6 max-w-md"
                      initial={{ scale: 0.8, opacity: 0, y: 50 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: 50 }}
                      transition={{ duration: 0.4, type: 'spring', damping: 25 }}
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl opacity-70 blur-md animate-pulse" />
                      <div className="relative bg-gradient-to-b from-slate-900/95 to-purple-900/95 rounded-2xl p-4 border border-indigo-400/30 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                        <motion.div
                          className="flex justify-center p-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.3, type: 'spring' }}
                        >
                          <Image src="/icons/trophy.png" alt="Trophy" width={64} height={64} />
                        </motion.div>
                        <motion.div
                          className="text-center mb-6 bg-slate-800/40 p-4 rounded-xl border border-yellow-500/30"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                        >
                          <p className="text-lg text-white/80 mb-1">{t('game.finalScore')}</p>
                          <motion.div
                            className="text-4xl font-bold text-yellow-300"
                            initial={{ scale: 0.5 }}
                            animate={{ scale: [0.5, 1.2, 1] }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                          >
                            {gameState.score.toLocaleString()}
                          </motion.div>
                          <AnimatePresence>
                            {gameState.score > highScore && (
                              <motion.div
                                className="mt-2 text-yellow-400 font-bold"
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.6, duration: 0.3 }}
                              >
                                🎉 {t('game.newRecord')} 🎉
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        >
                          <Button
                            onClick={restartGame}
                            className="w-full flex items-center justify-center font-bold py-6 px-6 rounded-lg text-md shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
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

              {/* Game Items */}
              <div className="mt-6 flex justify-center gap-3">
                {gameItems.map(({ id, count, icon }) => {
                  const isDisabled =
                    count === 0 ||
                    gameState.isProcessingMatches ||
                    gameState.isSwapping ||
                    gameState.isChecking ||
                    gameState.isGameOver ||
                    isShuffling;

                  return (
                    <ItemAreaTooltip key={id} itemType={id as GameItemType} isVisible={longPressItem === id}>
                      <motion.div
                        className={`
                          relative flex flex-col flex-1 text-center items-center p-3 rounded-lg
                          ${
                            selectedGameItem === id
                              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 ring-2 ring-white shadow-lg'
                              : 'bg-gradient-to-br from-slate-700 to-slate-800'
                          }
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          drop-shadow-md
                        `}
                        onClick={() => !isDisabled && handleGameItemSelect(id as GameItemType)}
                        onPointerDown={() => !isDisabled && handleLongPressStart(id as GameItemType)}
                        onPointerUp={handleLongPressEnd}
                        onPointerLeave={handleLongPressEnd}
                        whileHover={{ scale: !isDisabled ? 1.05 : 1 }}
                        whileTap={{ scale: !isDisabled ? 0.95 : 1 }}
                        animate={{
                          scale: selectedGameItem === id ? [1, 1.05, 1] : 1,
                          rotateY: selectedGameItem === id ? [0, 5, 0] : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div
                          className="text-3xl mb-2"
                          animate={{
                            rotateZ: selectedGameItem === id ? [0, -5, 5, 0] : 0,
                            scale: selectedGameItem === id ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ duration: 0.4, repeat: selectedGameItem === id ? Infinity : 0 }}
                        >
                          <Image src={icon} alt={t(`game.items.${id}`)} width={64} height={64} priority />
                        </motion.div>
                        <div className="text-sm font-bold text-white">{t(`game.items.${id}`)}</div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                          key={count}
                          animate={{ scale: [0.8, 1.2, 1] }}
                          transition={{ duration: 0.3 }}
                        >
                          {count}
                        </motion.div>
                      </motion.div>
                    </ItemAreaTooltip>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Shuffle Confirmation */}
        <AnimatePresence>
          {showShuffleConfirmation && (
            <motion.div
              className="fixed top-22 left-8 right-8 z-50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-xl p-4 shadow-lg max-w-sm"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <motion.div
                    className="p-2 bg-blue-500/20 rounded-lg"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Shuffle className="h-4 w-4 text-blue-400" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{t('game.noMovesAvailable')}</h4>
                    <p className="mt-1 text-slate-300 text-sm">
                      {t('game.shuffleCostMessage', { count: getShuffleCost() })}
                    </p>
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
                  disabled={gameState.isProcessingMatches}
                  className={`
                    w-full text-white text-sm py-2
                    ${
                      gameState.isProcessingMatches ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }
                  `}
                >
                  {t('game.shuffle')}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
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
          )}
        </AnimatePresence>

        {/* Tutorial Dialog */}
        <TutorialDialog
          isOpen={showTutorial}
          onClose={() => {
            setShowTutorial(false);
            setHasSeenTutorial(true);
          }}
          onNextStep={() => {
            if (tutorialStep < TUTORIAL_TOTAL_STEP) {
              setTutorialStep(tutorialStep + 1);
            } else {
              playButtonSound(soundSettings);
              setShowTutorial(false);
              setHasSeenTutorial(true);
            }
          }}
          onPrevStep={() => {
            if (tutorialStep > 0) {
              setTutorialStep(tutorialStep - 1);
            }
          }}
          currentStep={tutorialStep}
          gameItems={gameItems}
        />

        {/* Shuffle Toast */}
        <Toast
          isOpen={showShuffleToast}
          icon={Shuffle}
          message={t('game.shuffleMessage', { count: getShuffleCost() })}
        />

        {/* Shuffling Loading */}
        <AnimatePresence>
          {isShuffling && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl z-20 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="relative w-5/6 max-w-md"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-2xl opacity-70 blur-md animate-pulse" />
                <div className="relative bg-gradient-to-b from-slate-900/95 to-blue-900/95 rounded-2xl p-4 border border-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  <motion.div
                    className="flex justify-center p-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Image src="/icons/dice.png" alt="Dice" width={80} height={80} />
                  </motion.div>
                  <motion.div
                    className="text-center mb-6 bg-slate-800/40 p-4 rounded-xl border border-blue-500/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-lg text-white/80 mb-1">{t('game.shuffling')}</p>
                    <motion.div
                      className="text-2xl font-bold text-blue-300"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {t('game.pleaseWait')}
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reward Modal */}
        <RewardModal
          isOpen={showRewardModal}
          rewards={availableRewards}
          timeRemaining={timeRemaining}
          onSelectReward={handleRewardSelect}
        />

        {/* Artifact Panel */}
        <ArtifactPanel artifacts={rewardState.activeArtifacts} />
      </div>
    </ConfettiManager>
  );
};

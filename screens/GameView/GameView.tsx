'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cloneDeep } from 'lodash';
import { ArrowLeft, Settings, Home, RefreshCw, Shuffle, AlertTriangle, Zap, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, type TouchEvent, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmationModal } from '@/components/logic/dialogs/ConfirmationModal';
import { EnergyModal } from '@/components/logic/dialogs/EnergyModal';
import { ItemAnimationManager } from '@/components/logic/managers/ItemAnimationManager';
import { Button } from '@/components/ui/button';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { Toast } from '@/components/ui/toast';
import { useBackButton } from '@/hooks/useBackButton';
import { useSound } from '@/hooks/useSound';
import { useUser } from '@/hooks/useUser';
import { updateDroplet, updateGem, updateScore } from '@/networks/KeplerBackend';
import {
  ANIMATION_DURATION,
  CASUAL_MODE_MOVE_COUNT,
  CHALLENGE_MODE_MOVE_COUNT,
  ENERGY_CONSUME_AMOUNT,
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
import type {
  GameMode,
  GridItem,
  TileType,
  GameState,
  GameItemType,
  TierType,
  Reward,
  Artifact,
} from '@/types/game-types';
import { createParticles, createOptimizedParticles, createGameOverConfetti } from '@/utils/animation-helper';
import { calculateComboBonus, batchUpdateTiles } from '@/utils/game-helper';
import {
  useOptimizedGridRendering,
  useRenderPerformance,
  useConfettiOptimizer,
} from '@/utils/performance-optimization';
import {
  playMatchSound,
  playComboSound,
  playItemSound,
  playShuffleSound,
  playGameOverSound,
  preloadAllSounds,
  playRewardSound,
  SoundSettings,
  playArtifactSound,
  playButtonSound,
} from '@/utils/sound-helper';

import { LoadingView } from '../LoadingView/LoadingView';

import { ArtifactPanel } from './components/ArtifactPanel';
import { RewardModal } from './components/RewardModal';
import { SettingsMenu } from './components/SettingsMenu';
import { TileComponent } from './components/TileComponent';
import { TutorialDialog } from './components/TutorialDialog';
import { useGameItem } from './hooks/useGameItem';
import { useGameSettings } from './hooks/useGameSettings';
import { useGameWorker } from './hooks/useGameWorker';
import { useMatchGame } from './hooks/useMatchGame';
import { useRewardSystem } from './hooks/useRewardSystem';

const useUpdateDroplet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDroplet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['droplet-status'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

const useUpdateScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ score, mode }: { score: number; mode: GameMode }) => updateScore(score, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

const useUpdateGem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => updateGem(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

function applyAutoRemoveArtifacts(
  artifacts: Artifact[],
  grid: GridItem[][],
  turn: number,
  soundSettings: SoundSettings,
  setGrid: (g: GridItem[][]) => void,
  removeMatchedTiles: (g: GridItem[][]) => { newGrid: GridItem[][] },
) {
  const autoRemoveArtifacts = artifacts.filter(
    (artifact) => artifact.isActive && artifact.effect.type === 'auto_remove',
  );
  autoRemoveArtifacts.forEach((artifact) => {
    if (turn > 0 && turn % artifact.effect.value === 0) {
      let maxTier = 1;
      let maxTiles: { row: number; col: number }[] = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const tile = grid[row][col];
          if (tile.tier > maxTier) {
            maxTier = tile.tier;
            maxTiles = [{ row, col }];
          } else if (tile.tier === maxTier) {
            maxTiles.push({ row, col });
          }
        }
      }
      if (maxTiles.length > 0) {
        const { row, col } = maxTiles[Math.floor(Math.random() * maxTiles.length)];
        const newGrid = cloneDeep(grid);
        newGrid[row][col].isMatched = true;
        setGrid(newGrid);
        setTimeout(() => {
          const { newGrid: afterRemovalGrid } = removeMatchedTiles(newGrid);
          setGrid(afterRemovalGrid);

          playArtifactSound(soundSettings);
        }, 200);
      }
    }
  });
}

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
    addItem,
    resetItems,
  } = useGameItem();
  const { settings: soundSettings } = useSound();

  // 보상 시스템 훅
  const {
    rewardState,
    showRewardModal,
    availableRewards,
    timeRemaining,
    selectReward: selectRewardBase,
    checkScoreReward,
    applyArtifactEffects,
    getShuffleCost,
    resetRewardState,
  } = useRewardSystem(gameItems);

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
  const [showShuffleToast, setShowShuffleToast] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showRestartConfirmation, setShowRestartConfirmation] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [showShuffleConfirmation, setShowShuffleConfirmation] = useState(false);
  const [showShuffleButton, setShowShuffleButton] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showBonusMovesAnimation, setShowBonusMovesAnimation] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const tileRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const t = useTranslations();
  const refillPromiseRef = useRef<Promise<void> | null>(null);

  // 성능 최적화 훅
  const { grid: optimizedGrid, hasChanges } = useOptimizedGridRendering(grid);
  const { renderCount } = useRenderPerformance('GameView');
  const runConfetti = useConfettiOptimizer();

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

  const { data: userInfo } = useUser();
  const updateDropletMutation = useUpdateDroplet();
  const updateScoreMutation = useUpdateScore();
  const updateGemMutation = useUpdateGem();

  // 현재 모드의 최고 점수 가져오기
  const currentModeHighScore = useMemo(() => {
    if (!userInfo?.scores || !gameMode) return 0;
    const modeScore = userInfo.scores.find((score) => score.mode === gameMode);
    return modeScore?.score || 0;
  }, [userInfo?.scores, gameMode]);

  // 현재 점수가 최고 점수를 넘었는지 확인
  useEffect(() => {
    if (gameState.score > currentModeHighScore && currentModeHighScore > 0) {
      setIsNewHighScore(true);
    }
  }, [gameState.score, currentModeHighScore]);

  // 게임 종료 시 점수 업데이트
  const updateUserScore = useCallback(
    async (finalScore: number) => {
      if (!userInfo) return;

      // 이미 업데이트 중이면 중복 호출 방지
      if (updateScoreMutation.isPending) return;

      try {
        // 모든 점수를 백엔드로 전송 (기간별 점수 업데이트를 위해)
        // 백엔드에서 최고점수 vs 기간별 점수를 각각 처리함
        await updateScoreMutation.mutateAsync({ score: finalScore, mode: gameMode });
      } catch (error) {
        console.error('Failed to update score:', error);
      }
    },
    [userInfo, updateScoreMutation, gameMode],
  );

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
      let matchScore = calculateMatchScore(matches.length, nextCombo, streakCount);

      // 유물 효과 적용
      const { score: modifiedScore } = applyArtifactEffects(currentGrid, nextCombo, matchScore);
      matchScore = modifiedScore;

      const bonusMoves = calculateComboBonus(nextCombo);
      const shouldDecreaseMoves = isFirstMatch && !selectedGameItem;
      const movesAdjustment = shouldDecreaseMoves ? -1 : 0;
      const newMoves = gameState.moves + movesAdjustment + bonusMoves;
      const newScore = gameState.score + matchScore;

      // 상태 업데이트
      updateGameState({
        isProcessingMatches: true,
        isChecking: true,
        score: newScore,
        moves: newMoves,
        turn: isFirstMatch ? gameState.turn + 1 : gameState.turn,
        combo: nextCombo,
      });

      // 효과음 재생
      if (matches.length > 0) {
        if (nextCombo > 1) {
          // 콤보 효과음 재생
          playComboSound(soundSettings);
        } else {
          // 일반 매치 효과음 재생
          playMatchSound(soundSettings);
        }
      }

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
        runConfetti(() => {
          createOptimizedParticles(x, y, color);
        });

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
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 타일 제거 및 리필
      const { newGrid: afterRemovalGrid, newTileIds } = removeMatchedTiles(newGrid);
      setGrid(afterRemovalGrid);
      setTileChangeIndex((prev) => prev + 1);

      // 리필 애니메이션이 있는 경우에만 대기
      if (newTileIds.length > 0) {
        // 리필 애니메이션 완료까지 대기
        const refillPromise = new Promise<void>((resolve) => setTimeout(resolve, 300)); // Dummy promise
        refillPromiseRef.current = refillPromise;

        await refillPromise;
        refillPromiseRef.current = null;
      }

      // 추가 대기 시간 (애니메이션 완전 완료 보장)
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 다음 매칭 확인
      const newMatches = findMatches(afterRemovalGrid);
      if (newMatches.length > 0) {
        // 연쇄 매칭 발견 - 재귀 호출
        await processMatches(newMatches, afterRemovalGrid, false, undefined, nextCombo);
      } else {
        // 연쇄 매칭이 완전히 끝났을 때만 보상 체크 (첫 번째 매치에서만)
        if (isFirstMatch && newMoves > 0) {
          checkScoreReward(newScore);
        }

        // auto_remove 유물 효과
        const thisTurn = isFirstMatch ? gameState.turn + 1 : gameState.turn;
        applyAutoRemoveArtifacts(
          rewardState.activeArtifacts,
          grid,
          thisTurn,
          soundSettings,
          setGrid,
          removeMatchedTiles,
        );

        // 상태 업데이트 및 게임 오버 처리
        const isGameOver = newMoves <= 0;
        updateGameState({
          isSwapping: false,
          isChecking: false,
          isProcessingMatches: false,
          combo: 1,
          isGameOver,
        });

        if (isGameOver) {
          runConfetti(() => {
            createGameOverConfetti();
          });
          playGameOverSound(soundSettings);
          updateUserScore(newScore);
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
      applyArtifactEffects,
      selectedGameItem,
      updateGameState,
      setGrid,
      removeMatchedTiles,
      findMatches,
      soundSettings,
      runConfetti,
      gameMode,
      rewardState.activeArtifacts,
      grid,
      checkScoreReward,
      updateUserScore,
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
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION + 50));

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

        // 게임 종료 시 점수 업데이트 및 효과
        if (gameState.moves - 1 <= 0) {
          runConfetti(() => {
            createGameOverConfetti();
          });

          // 게임 오버 효과음 재생
          playGameOverSound(soundSettings);

          updateUserScore(gameState.score);
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
      runConfetti,
      soundSettings,
      updateUserScore,
    ],
  );

  const restartGame = () => {
    // 에너지 상태를 최신으로 업데이트

    // 에너지 소모
    updateDropletMutation.mutate(-ENERGY_CONSUME_AMOUNT, {
      onSuccess: () => {
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
        setIsNewHighScore(false);
        setShowRestartConfirmation(false);

        // 보상 상태 초기화
        resetRewardState();

        // 드래그 관련 상태 초기화
        setIsDragging(false);
        setDraggedTile(null);

        // 셔플 관련 상태 초기화
        setIsShuffling(false);
        setShowShuffleConfirmation(false);
        setShowShuffleButton(false);

        // 아이템 관련 상태 초기화
        resetItems();
      },
    });
  };

  const handleRestartConfirm = () => {
    playButtonSound(soundSettings);
    setShowRestartConfirmation(false);

    // 에너지가 부족한 경우 에너지 모달 표시
    if (!userInfo || userInfo.droplet < ENERGY_CONSUME_AMOUNT) {
      setShowEnergyModal(true);
      return;
    }

    restartGame();
  };

  const handleRestartCancel = () => {
    setShowRestartConfirmation(false);
  };

  const handleWatchAd = async () => {
    if (!userInfo) return;
    // 광고 시청 후 에너지 추가 로직은 네이티브 앱에서 처리
    setShowEnergyModal(false);
  };

  const handlePurchase = async () => {
    if (!userInfo) return;
    // 구매 후 에너지 추가 로직은 네이티브 앱에서 처리
    setShowEnergyModal(false);
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

    // 아이템 효과음 재생
    playItemSound(soundSettings);

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
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
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

        // 아이템 사용 후 매칭 가능 여부 확인
        const possibleMove = findPossibleMove();
        if (possibleMove && (showShuffleConfirmation || showShuffleButton)) {
          setShowShuffleConfirmation(false);
          setShowShuffleButton(false);
        }
      }
    }, ANIMATION_DURATION);
  };

  const handleBackClick = () => {
    playButtonSound(soundSettings);
    if (gameState.isGameOver) {
      router.back();
      return;
    }
    setShowBackConfirmation(true);
  };

  const handleBackConfirm = () => {
    playButtonSound(soundSettings);
    setShowBackConfirmation(false);
    router.back();
  };

  const handleSettingsClick = () => {
    playButtonSound(soundSettings);
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
        // 가능한 이동이 없고 셔플 관련 UI가 표시되지 않았을 때만 표시
        setShowShuffleConfirmation(true);
      } else if (possibleMove && (showShuffleConfirmation || showShuffleButton)) {
        // 가능한 이동이 생기면 셔플 관련 UI 모두 숨기기
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

  // 섞기 중일 때 기존 섞기 팝업들 숨기기
  useEffect(() => {
    if (isShuffling) {
      setShowShuffleConfirmation(false);
      setShowShuffleButton(false);
    }
  }, [isShuffling]);

  useEffect(() => {
    setGrid(createInitialGrid());
    // 초기화 완료 후 isInitializing을 false로 설정
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

  // 효과음 미리 로드 확인 및 추가 로드
  useEffect(() => {
    const ensureSoundsLoaded = async () => {
      try {
        await preloadAllSounds();
        console.log('GameView: 효과음 로드 확인 완료');
      } catch (error) {
        console.warn('GameView: 효과음 로드 실패:', error);
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

  useBackButton(() => {
    setShowBackConfirmation(true);
  });

  const handleShuffleConfirm = () => {
    setShowShuffleConfirmation(false);
    setShowShuffleButton(false);

    // 셔플 효과음 재생
    playShuffleSound(soundSettings);

    // 유물 효과를 고려한 섞기 비용 계산
    const shuffleCost = getShuffleCost();
    const newMoves = Math.max(0, gameState.moves - shuffleCost);
    const isGameOver = newMoves <= 0;

    setGameState((prev) => ({
      ...prev,
      moves: newMoves,
      turn: prev.turn + 1,
      isGameOver,
    }));

    // 게임 종료 시 점수 업데이트
    if (isGameOver) {
      runConfetti(() => {
        createGameOverConfetti();
      });

      // 게임 오버 효과음 재생
      playGameOverSound(soundSettings);
      setIsShuffling(false);

      updateUserScore(gameState.score);
      return;
    }

    // 섞기 중 상태 활성화
    setIsShuffling(true);

    // 섞기 로딩 시간 (1.5초)
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

  // 보상 선택 핸들러
  const handleRewardSelect = useCallback(
    (reward: Reward) => {
      selectRewardBase(reward);

      // 보상 타입에 따른 처리
      if (reward.type === 'moves') {
        // 이동 횟수 추가
        setGameState((prev) => ({
          ...prev,
          moves: prev.moves + reward.value,
        }));
      } else if (reward.type === 'items') {
        // 아이템 추가
        const itemId = reward.id.split('_')[1] as GameItemType;
        addItem(itemId, reward.value);
      } else if (reward.type === 'gem') {
        updateGemMutation.mutate(reward.value);
      }
      playRewardSound(soundSettings);
      // artifact는 이미 selectRewardBase에서 처리됨
    },
    [selectRewardBase, soundSettings, addItem, updateGemMutation],
  );

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
                  <motion.div
                    className={`absolute -inset-1 rounded-lg blur opacity-30 transition-all duration-500 ${
                      isNewHighScore
                        ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400'
                        : 'bg-gradient-to-r from-pink-500 to-purple-500'
                    }`}
                    animate={
                      isNewHighScore
                        ? {
                            opacity: [0.3, 0.6, 0.3],
                          }
                        : {}
                    }
                    transition={
                      isNewHighScore
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                        : {}
                    }
                  />
                  <motion.div
                    className={`relative w-full backdrop-blur-sm px-4 py-2 rounded-lg border shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all duration-500 ${
                      isNewHighScore
                        ? 'bg-black/90 border-yellow-500/50 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                        : 'bg-black/90 border-pink-500/30'
                    }`}
                    animate={
                      isNewHighScore
                        ? {
                            scale: [1, 1.02, 1],
                            boxShadow: [
                              '0 0 20px rgba(250,204,21,0.5)',
                              '0 0 30px rgba(250,204,21,0.8)',
                              '0 0 20px rgba(250,204,21,0.5)',
                            ],
                          }
                        : {}
                    }
                    transition={
                      isNewHighScore
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                        : {}
                    }
                  >
                    <div className="text-pink-400 mb-1 tracking-widest">
                      {t('common.score')}{' '}
                      <span
                        className={`transition-all duration-300 ${isNewHighScore ? 'text-yellow-400 font-bold' : 'text-white/50'}`}
                      >
                        {currentModeHighScore > 0 ? `(${currentModeHighScore})` : ''}
                      </span>
                      {isNewHighScore && (
                        <motion.span
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          transition={{ duration: 0.5, type: 'spring' }}
                          className="inline-block ml-1 text-yellow-400"
                        >
                          ⭐
                        </motion.span>
                      )}
                    </div>
                    <motion.div
                      key={gameState.score}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`text-2xl font-bold tracking-wider relative ${
                        isNewHighScore ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'text-pink-400'
                      }`}
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
                      <div className="relative bg-gradient-to-b from-slate-900/95 to-purple-900/95 rounded-2xl p-4 border border-indigo-400/30 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
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
                        </motion.div>
                        <motion.div
                          className="flex flex-col gap-3"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                        >
                          <Button
                            onClick={handleRestartConfirm}
                            disabled={!userInfo || userInfo.droplet <= 0}
                            className={`flex items-center justify-center font-bold py-4 px-6 rounded-lg text-md shadow-lg transition-all duration-300 ${
                              !userInfo || userInfo.droplet <= 0
                                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-gray-300 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white hover:shadow-xl'
                            }`}
                          >
                            <RefreshCw
                              className={`w-5 h-5 mr-2 ${!userInfo || userInfo.droplet <= 0 ? 'text-gray-300' : 'text-white'}`}
                            />
                            <div className="flex items-center gap-2">
                              <span>{t('game.restart')}</span>
                              <div className="flex items-center">
                                <Image src="/icons/droplet.png" alt="Droplet" width={24} height={24} />
                                <span className="mt-1 font-medium text-md">{`x${ENERGY_CONSUME_AMOUNT}`}</span>
                              </div>
                            </div>
                          </Button>
                          <Button
                            onClick={() => {
                              router.back();
                              playButtonSound(soundSettings);
                            }}
                            variant="outline"
                            className="flex items-center justify-center bg-slate-800/30 border-indigo-500/50 text-white hover:bg-slate-800/50 rounded-lg py-4 text-md"
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
                      isShuffling={isShuffling}
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
                {gameItems.map(({ id, count, icon }) => (
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
            <div className="flex items-start gap-2 bg-yellow-400/10 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-sm font-medium">{t('modal.exitMessage')}</p>
            </div>
          </div>
        }
        confirmText={t('common.exit')}
        cancelText={t('common.continue')}
        onConfirm={handleBackConfirm}
        onCancel={() => setShowBackConfirmation(false)}
      />

      <ConfirmationModal
        isOpen={showRestartConfirmation}
        title={t('game.restartConfirm')}
        message={
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-cyan-400/10 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-cyan-300 text-sm font-medium">
                {t('game.restartMessage', { count: ENERGY_CONSUME_AMOUNT })}
              </p>
            </div>
          </div>
        }
        confirmText={t('modal.confirm')}
        cancelText={t('modal.cancel')}
        onConfirm={handleRestartConfirm}
        onCancel={handleRestartCancel}
      />

      {/* 셔플 확인 알림 */}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
              >
                {t('game.shuffle')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 섞기 버튼 */}
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

      <EnergyModal
        isOpen={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        onWatchAd={handleWatchAd}
        onPurchase={handlePurchase}
        isLoading={false}
      />

      <SettingsMenu
        isOpen={showSettingsMenu}
        tileSwapMode={tileSwapMode}
        onChangeTileSwapMode={(mode) => {
          playButtonSound(soundSettings);
          setTileSwapMode(mode);
        }}
        onClose={() => setShowSettingsMenu(false)}
        onShowTutorial={() => {
          playButtonSound(soundSettings);
          setShowTutorial(true);
          setTutorialStep(1);
        }}
        onShowBackConfirmation={() => {
          playButtonSound(soundSettings);
          setShowBackConfirmation(true);
        }}
        onShowRestartConfirmation={() => {
          playButtonSound(soundSettings);
          setShowRestartConfirmation(true);
        }}
        onShowEnergyModal={() => {
          playButtonSound(soundSettings);
          setShowEnergyModal(true);
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

      <Toast isOpen={showShuffleToast} icon={Shuffle} message={t('game.shuffleMessage', { count: getShuffleCost() })} />

      <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />

      {/* 보상 모달 */}
      <RewardModal
        isOpen={showRewardModal}
        rewards={availableRewards}
        timeRemaining={timeRemaining}
        onSelectReward={handleRewardSelect}
      />

      {/* 유물 패널 */}
      <ArtifactPanel artifacts={rewardState.activeArtifacts} />

      {/* 섞기 중 로딩 화면 */}
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
    </>
  );
};

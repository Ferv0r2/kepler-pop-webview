'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw, Shuffle, X } from 'lucide-react';
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
import { useWebViewBridge } from '@/hooks/useWebViewBridge';
import { SUPPORTED_LOCALES } from '@/i18n/constants';
import {
  CHALLENGE_MODE_MOVE_COUNT,
  GRID_SIZE,
  HINT_MOVE_INTERVAL_MS,
  SCORE,
  SHOW_EFFECT_TIME_MS,
  SHOW_STREAK_MAINTAIN_TIME_MS,
  TILE_MAX_TIER,
  TUTORIAL_TOTAL_STEP,
} from '@/screens/GameView/constants/game-config';
import type { GridItem, GameState, GameItemType, TierType, Reward, ArtifactId, Artifact } from '@/types/game-types';
import { WebToNativeMessageType } from '@/types/native-call';
import { CanvasGameRenderer } from '@/utils/canvas-renderer';
import { calculateComboBonus, batchUpdateTiles } from '@/utils/game-helper';
import {
  playMatchSound,
  playComboSound,
  playItemSound,
  playShuffleSound,
  preloadAllSounds,
  playButtonSound,
  playGameOverSound,
  playRewardSound,
  playBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  setBackgroundMusicVolume,
  preloadBackgroundMusic,
  type SoundSettings,
} from '@/utils/sound-helper';

import { LOCALE_NAMES } from '../SettingsView/constants/settings-config';

import { ArtifactPanel } from './components/ArtifactPanel';
import { NextRewardPreview } from './components/NextRewardPreview';
import { PathChoiceModal } from './components/PathChoiceModal';
import { RewardModal } from './components/RewardModal';
import { ShopModal } from './components/ShopModal';
import { TutorialDialog } from './components/TutorialDialog';
import { useGameItem } from './hooks/useGameItem';
import { useGameSettings } from './hooks/useGameSettings';
import { useMatchGame } from './hooks/useMatchGame';
import { usePathProgress } from './hooks/usePathProgress';
import { useRewardSystem } from './hooks/useRewardSystem';

// Settings Modal Component - 튜토리얼 모달과 동일한 스타일
const SettingsModal = memo(
  ({
    isOpen,
    onClose,
    onRestartGame,
    onShowTutorial,
    soundSettings,
    toggleSound,
    toggleMusic,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onRestartGame: () => void;
    onShowTutorial: () => void;
    soundSettings: SoundSettings;
    toggleSound: () => void;
    toggleMusic: () => void;
  }) => {
    const t = useTranslations();
    const { locale, setLocale } = useLocale();

    if (!isOpen) return null;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 개선된 오버레이 */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/80 backdrop-blur-lg"
          initial={{ backdropFilter: 'blur(0px)' }}
          animate={{ backdropFilter: 'blur(12px)' }}
          exit={{ backdropFilter: 'blur(0px)' }}
        />

        {/* 메인 모달 */}
        <motion.div
          className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-blue-900/98 rounded-3xl p-6 w-full max-w-md border border-blue-400/20 shadow-[0_0_40px_rgba(99,102,241,0.4)] backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 30, opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
            opacity: { duration: 0.3 },
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-sm">
                  <Settings className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  {t('settings.title')}
                </h2>
              </motion.div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-200 relative z-20"
              >
                <X className="h-5 w-5 text-white/80" />
              </Button>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="relative overflow-hidden rounded-2xl bg-black/30 p-6 mb-6 border border-white/10">
              <div className="space-y-6">
                {/* 효과음 설정 */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">{t('settings.soundVolume')}</span>
                    <Button
                      variant={soundSettings.enabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleSound}
                      className={`w-24 text-base transition-all duration-200 ${
                        soundSettings.enabled
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                          : 'bg-gray-600/50 border-gray-500 text-gray-300 hover:bg-gray-500/50'
                      }`}
                    >
                      {soundSettings.enabled ? t('common.on') : t('common.off')}
                    </Button>
                  </div>
                </motion.div>

                {/* 배경음악 설정 */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">{t('modal.music')}</span>
                    <Button
                      variant={soundSettings.musicEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const willBeEnabled = !soundSettings.musicEnabled;
                        toggleMusic();
                        if (willBeEnabled) {
                          void playBackgroundMusic({
                            ...soundSettings,
                            musicEnabled: willBeEnabled,
                          });
                        }
                      }}
                      className={`w-24 text-base transition-all duration-200 ${
                        soundSettings.musicEnabled
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                          : 'bg-gray-600/50 border-gray-500 text-gray-300 hover:bg-gray-500/50'
                      }`}
                    >
                      {soundSettings.musicEnabled ? t('common.on') : t('common.off')}
                    </Button>
                  </div>
                </motion.div>

                {/* 언어 설정 */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">{t('settings.language')}</span>
                    <Select value={locale} onValueChange={(value) => void setLocale(value)}>
                      <SelectTrigger className="text-base bg-gray-600/50 border-gray-500 text-gray-300 focus:border-blue-400 focus:ring-blue-400/20 hover:bg-gray-500/50 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-600/50 border-gray-500 text-gray-300 backdrop-blur-xl hover:bg-gray-500/50">
                        {SUPPORTED_LOCALES.map((language) => (
                          <SelectItem
                            key={language}
                            value={language}
                            className="text-white text-base hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                          >
                            {LOCALE_NAMES[language] || language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex flex-col gap-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Button
                  onClick={onShowTutorial}
                  className="w-full text-lg py-3 bg-gradient-to-r from-slate-600/80 to-slate-700/80 hover:from-slate-500/80 hover:to-slate-600/80 text-white border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
                >
                  {t('settings.tutorial')}
                </Button>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Button
                  onClick={onRestartGame}
                  className="w-full text-lg py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 backdrop-blur-sm"
                >
                  {t('game.restart')}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  },
);

SettingsModal.displayName = 'SettingsModal';

export const GameView = memo(() => {
  const { grid, setGrid, getRandomItemType, createInitialGrid, findMatches, findPossibleMove } = useMatchGame();
  const { hasSeenTutorial, setHasSeenTutorial } = useGameSettings();
  const { gameItems, selectedGameItem, setSelectedGameItem, executeItemDirect, resetItems, addItem } = useGameItem();
  // GlobalPreloadProvider는 백그라운드에서 동작하지만 현재는 직접 사용하지 않음

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
    shouldTriggerTurnBasedEffect,
  } = useRewardSystem(gameItems);
  const { settings: soundSettings, toggleSound, toggleMusic } = useSound();
  const { isInWebView, sendMessage } = useWebViewBridge();
  const t = useTranslations();

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasGameRenderer | null>(null);

  // Grid ref for latest state access
  const gridRef = useRef<GridItem[][]>(grid);

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
  const [showExitToast, setShowExitToast] = useState(false);
  const [lastBackPressTime, setLastBackPressTime] = useState(0);

  // 새로운 상태들
  const [showShopModal, setShowShopModal] = useState(false);
  const [showPathChoiceModal, setShowPathChoiceModal] = useState(false);
  const [playerGems, setPlayerGems] = useState(() => {
    // localStorage에서 gem 수 불러오기
    const savedGems = localStorage.getItem('keplerPlayerGems');
    return savedGems ? parseInt(savedGems, 10) : 100; // 기본값 100
  });

  // TODO: 경로 진행 시스템
  const pathProgress = usePathProgress(gameState.score);
  // const [pathExpanded, setPathExpanded] = useState(false);

  // Game stats
  const [streakCount, setStreakCount] = useState(0);
  const [lastMatchTime, setLastMatchTime] = useState(Date.now());

  // Artifact effects
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [multiplierEndTurn, setMultiplierEndTurn] = useState(0);
  const [triggeredArtifacts, setTriggeredArtifacts] = useState<Set<string>>(new Set());
  const [showTriggeredEffects, setShowTriggeredEffects] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isProcessingArtifacts, setIsProcessingArtifacts] = useState(false);

  // Interaction state
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null);
  const [longPressItem, setLongPressItem] = useState<GameItemType | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const artifactAnimationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const artifactAnimationStartTimeRef = useRef<number | null>(null);
  const minimumDisplayTimeRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to clear artifact animations with minimum display time consideration
  const clearArtifactAnimations = useCallback(() => {
    const minimumDisplayTime = 2000; // 2초 최소 표시 시간
    const currentTime = Date.now();
    const startTime = artifactAnimationStartTimeRef.current;

    if (startTime && currentTime - startTime < minimumDisplayTime) {
      // 최소 시간이 지나지 않았다면 지연된 정리 예약
      const remainingTime = minimumDisplayTime - (currentTime - startTime);

      if (minimumDisplayTimeRef.current) {
        clearTimeout(minimumDisplayTimeRef.current);
      }

      minimumDisplayTimeRef.current = setTimeout(() => {
        if (artifactAnimationTimerRef.current) {
          clearTimeout(artifactAnimationTimerRef.current);
          artifactAnimationTimerRef.current = null;
        }
        setShowTriggeredEffects(false);
        setTriggeredArtifacts(new Set());
        artifactAnimationStartTimeRef.current = null;
        minimumDisplayTimeRef.current = null;
      }, remainingTime);
    } else {
      // 최소 시간이 지났다면 즉시 정리
      if (artifactAnimationTimerRef.current) {
        clearTimeout(artifactAnimationTimerRef.current);
        artifactAnimationTimerRef.current = null;
      }
      if (minimumDisplayTimeRef.current) {
        clearTimeout(minimumDisplayTimeRef.current);
        minimumDisplayTimeRef.current = null;
      }
      setShowTriggeredEffects(false);
      setTriggeredArtifacts(new Set());
      artifactAnimationStartTimeRef.current = null;
    }
  }, []);

  // Cleanup artifact animations when game state changes
  useEffect(() => {
    // Only clear if user is actively interacting and animation has been shown for minimum time
    if (gameState.isSwapping || gameState.isProcessingMatches || gameState.isChecking) {
      if (showTriggeredEffects) {
        clearArtifactAnimations();
      }
    }
  }, [
    gameState.isSwapping,
    gameState.isProcessingMatches,
    gameState.isChecking,
    showTriggeredEffects,
    clearArtifactAnimations,
  ]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (artifactAnimationTimerRef.current) {
        clearTimeout(artifactAnimationTimerRef.current);
        artifactAnimationTimerRef.current = null;
      }
      if (minimumDisplayTimeRef.current) {
        clearTimeout(minimumDisplayTimeRef.current);
        minimumDisplayTimeRef.current = null;
      }
    };
  }, []);

  // Initialize Canvas renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      initializeGame();
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Update gridRef whenever grid changes
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // 게임 초기화 함수
  const initializeGame = useCallback(() => {
    if (!canvasRef.current || rendererRef.current) return;

    // 캔버스 초기화
    rendererRef.current = new CanvasGameRenderer(canvasRef.current);

    // 실제 로딩 진행률 체크
    const checkLoadingProgress = setInterval(() => {
      if (rendererRef.current) {
        const progress = rendererRef.current.getLoadingProgress();
        setLoadingProgress(progress);

        // 실제 로딩이 완료되면
        if (rendererRef.current.isAssetsLoaded()) {
          clearInterval(checkLoadingProgress);

          // 로딩 완료 후 게임 시작
          setTimeout(() => {
            if (rendererRef.current) {
              // 그리드 생성 (렌더러 업데이트는 useEffect에서 처리)
              const initialGrid = createInitialGrid();
              setGrid(initialGrid);

              rendererRef.current.startRenderLoop();
              setIsInitializing(false);

              // 게임 초기화 완료 후 튜토리얼 체크
              setTimeout(() => {
                if (!hasSeenTutorial) {
                  setShowTutorial(true);
                }
              }, 100);
            }
          }, 200);
        }
      }
    }, 50); // 50ms마다 체크

    return () => {
      clearInterval(checkLoadingProgress);
    };
  }, [createInitialGrid, setGrid, hasSeenTutorial, setShowTutorial]);

  // Update renderer when grid changes (debounced for performance)
  useEffect(() => {
    if (rendererRef.current && grid.length > 0) {
      // 타이머를 사용해서 빠른 연속 업데이트를 방지
      const updateTimer = setTimeout(() => {
        if (rendererRef.current) {
          rendererRef.current.updateGrid(grid);
        }
      }, 10); // 10ms debounce

      return () => clearTimeout(updateTimer);
    }
  }, [grid]);

  // Load high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('keplerGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Save gems to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('keplerPlayerGems', playerGems.toString());
  }, [playerGems]);

  // Save high score
  useEffect(() => {
    if (gameState.isGameOver && gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('keplerGameHighScore', gameState.score.toString());
    }
  }, [gameState.isGameOver, gameState.score, highScore]);

  // Handle score multiplier expiration
  useEffect(() => {
    if (multiplierEndTurn > 0 && gameState.turn >= multiplierEndTurn) {
      setScoreMultiplier(1);
      setMultiplierEndTurn(0);
      console.log('Time Warp effect expired');
    }
  }, [gameState.turn, multiplierEndTurn]);

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
          void activeSelectedGameItem(tile.row, tile.col);
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
            void swapTiles(draggedTile.row, draggedTile.col, tile.row, tile.col);
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
    (
      currentGrid: GridItem[][],
    ): {
      newGrid: GridItem[][];
      newTileIds: string[];
      dropAnimations: { id: string; fromRow: number; toRow: number; col: number }[];
    } => {
      const newGrid = structuredClone(currentGrid);
      const newTileIds: string[] = [];
      const dropAnimations: { id: string; fromRow: number; toRow: number; col: number }[] = [];

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
    (reward: Reward) => {
      // 보상 효과음 재생
      playRewardSound(soundSettings);

      if (reward.type === 'moves') {
        setGameState((prev) => ({
          ...prev,
          moves: prev.moves + reward.value,
        }));
      } else if (reward.type === 'items') {
        const itemId = reward.id.split('_')[1] as GameItemType;
        addItem(itemId, reward.value);
      }
      // gem 과 artifact 은 따로 처리 필요 (현재는 생략)
      selectReward(reward);

      // 유물이라면 obtainedTurn 설정
      if (reward.type === 'artifact' && reward.id.startsWith('artifact_')) {
        const artifactIdParts = reward.id.split('_');
        if (artifactIdParts.length >= 4) {
          const artifactId = `${artifactIdParts[1]}_${artifactIdParts[2]}` as ArtifactId;
          // 현재 활성화된 유물 목록에서 해당 유물을 찾아서 obtainedTurn 설정
          const activeArtifact = rewardState.activeArtifacts.find((a) => a.id === artifactId);
          if (activeArtifact && !activeArtifact.obtainedTurn) {
            activeArtifact.obtainedTurn = gameState.turn;
          }
        }
      }

      // 경로 완료 체크 및 다음 경로 진행
      if (pathProgress.canAdvance) {
        const nextPath = pathProgress.advanceToNextPath();
        if (nextPath) {
          console.log('Advanced to next path:', nextPath.name);
        }
      }
    },
    [addItem, selectReward, setGameState, pathProgress, soundSettings],
  );

  // 상점 구매 핸들러
  const handleShopPurchase = useCallback(
    (item: { cost: number; name: string }) => {
      if (playerGems >= item.cost) {
        const newGemCount = playerGems - item.cost;
        setPlayerGems(newGemCount);
        // 아이템 효과 적용 로직 추가 필요
        console.log('Purchased:', item.name);
      }
    },
    [playerGems],
  );

  // 경로 선택 핸들러
  const handlePathSelect = useCallback(
    (pathId: string) => {
      pathProgress.setCurrentPath(pathId);
      setShowPathChoiceModal(false);
      // 경로에 따른 게임 상태 변경 로직 추가 필요
      console.log('Selected path:', pathId);
    },
    [pathProgress],
  );

  // Helper function to calculate match score
  const calculateMatchScore = useCallback(
    (matchCount: number, combo: number, streak: number): number => {
      const baseScore = matchCount * SCORE * combo * (streak > 1 ? streak : 1);
      const artifactScore = applyArtifactEffects(grid, combo, baseScore).score;
      return artifactScore * scoreMultiplier;
    },
    [applyArtifactEffects, grid, scoreMultiplier],
  );

  // Helper function to collect artifacts to trigger
  const collectArtifactsToTrigger = useCallback(
    (turn: number): Array<{ artifact: Artifact; type: 'turn_based' | 'auto_remove' }> => {
      const artifactsToTrigger: Array<{ artifact: Artifact; type: 'turn_based' | 'auto_remove' }> = [];

      if (turn > 0) {
        rewardState.activeArtifacts.forEach((artifact) => {
          if (!artifact.isActive) return;

          if (artifact.effect.type === 'turn_based' && shouldTriggerTurnBasedEffect(artifact.id, turn)) {
            artifactsToTrigger.push({ artifact, type: 'turn_based' });
          } else if (artifact.effect.type === 'auto_remove' && artifact.effect.value) {
            const triggerInterval = artifact.effect.value;
            const obtainedTurn = artifact.obtainedTurn || 0;
            const turnsSinceObtained = turn - obtainedTurn;

            if (turnsSinceObtained > 0 && turnsSinceObtained % triggerInterval === 0) {
              artifactsToTrigger.push({ artifact, type: 'auto_remove' });
            }
          }
        });
      }

      return artifactsToTrigger;
    },
    [rewardState.activeArtifacts, shouldTriggerTurnBasedEffect],
  );

  // Helper function to process tile upgrades
  const processTileUpgrades = useCallback(
    (
      matches: { row: number; col: number }[],
      currentGrid: GridItem[][],
      swappedTiles?: { row: number; col: number }[],
    ): Array<{ row: number; col: number; changes: Partial<GridItem> }> => {
      const countMatchGroupSize = (targetRow: number, targetCol: number): number => {
        const visited = new Set<string>();
        const targetTile = currentGrid[targetRow][targetCol];
        let count = 0;

        const dfs = (row: number, col: number) => {
          const key = `${row}-${col}`;
          if (visited.has(key) || row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
            return;
          }

          const currentTile = currentGrid[row][col];
          if (currentTile.type !== targetTile.type || currentTile.tier !== targetTile.tier) {
            return;
          }

          const isInMatches = matches.some((match) => match.row === row && match.col === col);
          if (!isInMatches) {
            return;
          }

          visited.add(key);
          count++;

          dfs(row - 1, col);
          dfs(row + 1, col);
          dfs(row, col - 1);
          dfs(row, col + 1);
        };

        dfs(targetRow, targetCol);
        return count;
      };

      const tileUpdates: Array<{ row: number; col: number; changes: Partial<GridItem> }> = [];

      matches.forEach(({ row, col }, index) => {
        const shouldUpgrade =
          (index === 0 && !swappedTiles) || swappedTiles?.some((tile) => tile.row === row && tile.col === col);

        if (shouldUpgrade && currentGrid[row][col].tier < TILE_MAX_TIER) {
          const currentTier = currentGrid[row][col].tier;
          let newTier: TierType;
          if (currentTier === 1) {
            const matchGroupSize = countMatchGroupSize(row, col);
            if (matchGroupSize >= 5) {
              newTier = 3;
            } else {
              newTier = 2;
            }
          } else {
            newTier = (currentTier + 1) as TierType;
          }

          tileUpdates.push({
            row,
            col,
            changes: { tier: newTier, isMatched: false },
          });
        } else {
          tileUpdates.push({ row, col, changes: { isMatched: true } });
        }
      });

      return tileUpdates;
    },
    [],
  );

  // Process matches
  const processMatches = useCallback(
    async (
      matches: { row: number; col: number }[],
      currentGrid: GridItem[][],
      isFirstMatch = false,
      swappedTiles?: { row: number; col: number }[],
      artifactsToTrigger?: Array<{ artifact: Artifact; type: 'turn_based' | 'auto_remove' }>,
    ): Promise<void> => {
      if (matches.length === 0) return;

      // Calculate score and moves
      const bonusMoves = calculateComboBonus(gameState.combo + 1);
      const shouldDecreaseMoves = isFirstMatch && !selectedGameItem;
      const newMoves = gameState.moves + (shouldDecreaseMoves ? -1 : 0) + bonusMoves;

      // Calculate match score using helper
      const matchScore = calculateMatchScore(matches.length, gameState.combo + 1, streakCount);
      const newScore = gameState.score + matchScore;

      // Calculate new turn - 첫 매치에서만 턴 증가
      const newTurn = isFirstMatch ? gameState.turn + 1 : gameState.turn;

      // Update state - 첫 번째 매치에서만 처리 상태 설정
      setGameState((prev) => ({
        ...prev,
        isProcessingMatches: isFirstMatch ? true : prev.isProcessingMatches,
        isChecking: isFirstMatch ? true : prev.isChecking,
        score: newScore,
        moves: newMoves,
        turn: newTurn,
        combo: prev.combo + 1,
      }));

      // Collect artifacts to trigger using helper
      let currentArtifactsToTrigger: Array<{ artifact: Artifact; type: 'turn_based' | 'auto_remove' }> = [];
      if (!artifactsToTrigger && isFirstMatch && newTurn > 0) {
        currentArtifactsToTrigger = collectArtifactsToTrigger(newTurn);
      } else if (artifactsToTrigger) {
        currentArtifactsToTrigger = artifactsToTrigger;
      }

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
        const matchTiles: { row: number; col: number; id: string }[] = [];
        const upgradeTiles: { id: string; row: number; col: number }[] = [];

        matches.forEach((m) => {
          const tile = currentGrid[m.row][m.col];
          const shouldUpgrade =
            (matches.indexOf(m) === 0 && !swappedTiles) ||
            swappedTiles?.some((tile) => tile.row === m.row && tile.col === m.col);

          if (shouldUpgrade && tile.tier < TILE_MAX_TIER) {
            // 티어 상승하는 타일은 업그레이드 애니메이션 사용
            upgradeTiles.push({
              id: tile.id,
              row: m.row,
              col: m.col,
            });
          } else {
            // 일반 매칭 타일은 매칭 애니메이션 사용
            matchTiles.push({
              ...m,
              id: tile.id,
            });
          }
        });

        // 매칭 애니메이션 실행
        if (matchTiles.length > 0) {
          rendererRef.current.handleMatchAnimation(matchTiles);
        }

        // 티어 업그레이드 애니메이션 실행
        if (upgradeTiles.length > 0) {
          rendererRef.current.handleTierUpgradeAnimation(upgradeTiles);
        }
      }

      // Process tile upgrades using helper
      const tileUpdates = processTileUpgrades(matches, currentGrid, swappedTiles);

      // 티어 업그레이드를 위한 임시 그리드 생성 (시각적 표시용)
      const tempGrid = structuredClone(currentGrid);
      batchUpdateTiles(tempGrid, tileUpdates);

      // 캔버스 렌더러에만 임시 그리드 전달 (시각적 업데이트)
      if (rendererRef.current) {
        rendererRef.current.updateGrid(tempGrid);
      }

      // Wait for match animation (업그레이드 애니메이션 중간 지점에서 전환)
      await new Promise((resolve) => setTimeout(resolve, 280));

      // Remove and refill - 최종 상태만 한 번에 업데이트
      const { newGrid: afterRemovalGrid, newTileIds, dropAnimations } = removeMatchedTiles(tempGrid);
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
        await new Promise((resolve) => setTimeout(resolve, 320));
      }

      // Check for cascading matches
      const newMatches = findMatches(afterRemovalGrid);
      if (newMatches.length > 0) {
        // 연쇄 매칭에서는 유물을 재실행하지 않음 (첫 번째 매치에서만 실행)
        await processMatches(newMatches, afterRemovalGrid, false, undefined, undefined);
      } else {
        const isGameOver = newMoves <= 0;

        // 매칭 완료 후 힌트 숨기기
        if (rendererRef.current) {
          rendererRef.current.setHintTiles([]);
        }

        setGameState((prev) => ({
          ...prev,
          isSwapping: false,
          isChecking: false,
          isProcessingMatches: false,
          combo: 1,
          isGameOver,
        }));

        // 연쇄 매치 완료 후 그리드 상태 안정화 대기
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 유물 효과 처리 전에 전역 그리드를 업데이트
        setGrid(afterRemovalGrid);
        gridRef.current = afterRemovalGrid; // 즉시 ref 업데이트

        // 유물 효과 처리 (업데이트된 그리드 상태에서)
        if (currentArtifactsToTrigger && currentArtifactsToTrigger.length > 0 && !isGameOver) {
          // 상태 업데이트 대기 후 유물 효과 처리
          await new Promise((resolve) => setTimeout(resolve, 10));
          await processArtifactEffects(currentArtifactsToTrigger);

          // 유물 효과 후 최신 그리드 상태로 매치 확인
          await new Promise((resolve) => setTimeout(resolve, 50));
          const finalGrid = gridRef.current;
          const artifactMatches = findMatches(finalGrid);
          if (artifactMatches.length > 0) {
            console.log('🔄 Artifact effects created new matches, processing cascade...');
            await processMatches(artifactMatches, finalGrid, false);

            // 유물 효과로 인한 연쇄 완료 후에도 리워드 체크
            checkScoreReward(gameState.score);
          }

          // 유물 효과 후 추가 매치 처리 완료 후 게임 상태 리셋
          setGameState((prev) => ({
            ...prev,
            isSwapping: false,
            isChecking: false,
            isProcessingMatches: false,
          }));
        }

        // 리워드 체크 (첫 번째 매치이고 게임이 끝나지 않았을 때만)
        if (isFirstMatch && !isGameOver) {
          checkScoreReward(newScore);
        }

        if (isGameOver) {
          playGameOverSound(soundSettings);
          // 게임 오버 시 배경음악 일시정지
          if (soundSettings.musicEnabled) {
            pauseBackgroundMusic();
          }
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
      gridRef,
      scoreMultiplier,
      isProcessingArtifacts,
      rewardState.activeArtifacts,
      shouldTriggerTurnBasedEffect,
      addItem,
    ],
  );

  // Swap tiles
  const swapTiles = useCallback(
    async (row1: number, col1: number, row2: number, col2: number) => {
      setGameState((prev) => ({ ...prev, isSwapping: true }));

      let newGrid = structuredClone(grid);
      const tile1Id = newGrid[row1][col1].id;
      const tile2Id = newGrid[row2][col2].id;

      // 먼저 스왑된 그리드로 매칭 체크 (논리 계산용)
      const tempGrid = structuredClone(newGrid);
      [tempGrid[row1][col1], tempGrid[row2][col2]] = [tempGrid[row2][col2], tempGrid[row1][col1]];
      const matches = findMatches(tempGrid);

      if (matches.length > 0) {
        // 성공한 스왑: 시각적 애니메이션 후 논리 그리드 업데이트
        if (rendererRef.current) {
          rendererRef.current.setHintTiles([]);
          rendererRef.current.handleSwapAnimation(row1, col1, row2, col2, tile1Id, tile2Id);
        }

        await new Promise((resolve) => setTimeout(resolve, 250));

        // 애니메이션 완료 후 논리 그리드 업데이트
        [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
        setGrid(newGrid);

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
        // 실패한 스왑: 논리 그리드는 건드리지 않고 시각적으로만 왕복
        if (rendererRef.current) {
          rendererRef.current.setHintTiles([]);
          rendererRef.current.handleFailedSwapAnimation(row1, col1, row2, col2, tile1Id, tile2Id, () => {
            // 스왑 실패 시에도 턴은 증가시키고 이동 수 감소
            const newTurn = gameState.turn + 1;
            const newMoves = gameState.moves - 1;
            const isGameOver = newMoves <= 0;

            // 애니메이션 완료 후 게임 상태 업데이트
            setGameState((prev) => ({
              ...prev,
              moves: newMoves,
              turn: newTurn,
              isSwapping: false,
              isGameOver,
            }));

            // 스왑 실패 시에도 턴 기반 유물 효과 처리
            if (!isGameOver && newTurn > 0) {
              const artifactsToTrigger = collectArtifactsToTrigger(newTurn);
              if (artifactsToTrigger.length > 0) {
                // 상태 업데이트 대기 후 유물 효과 처리
                setTimeout(() => {
                  void processArtifactEffects(artifactsToTrigger);
                }, 200);
              }
            }

            if (isGameOver) {
              playGameOverSound(soundSettings);
              // 게임 오버 시 배경음악 일시정지
              if (soundSettings.musicEnabled) {
                pauseBackgroundMusic();
              }
            }
          });
        }
      }
    },
    [grid, setGrid, findMatches, lastMatchTime, processMatches, gameState.moves, gameState.turn, soundSettings],
  );

  // Active item effect
  const activeSelectedGameItem = useCallback(
    (row: number, col: number) => {
      if (!selectedGameItem) return;

      playItemSound(soundSettings);

      // Set item animation for the executeItem function to use
      let direction: 'row' | 'col' | undefined;
      if (selectedGameItem === 'mole') {
        // 두더지는 랜덤하게 가로 또는 세로 선택
        const randomChoice = Math.random();
        direction = randomChoice < 0.5 ? 'row' : 'col';
      }

      // Execute item effect directly
      const result = executeItemDirect(grid, selectedGameItem, row, col, direction, rewardState.activeArtifacts);
      if (result) {
        const { grid: updatedGrid } = result;
        setGrid(updatedGrid);

        // 아이템으로 제거된 타일들의 점수 계산 및 반영
        const removedTiles = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (updatedGrid[r][c].isMatched) {
              removedTiles.push({ row: r, col: c, id: updatedGrid[r][c].id });
            }
          }
        }

        if (removedTiles.length > 0) {
          // 아이템으로 제거된 타일들의 점수 계산
          const itemScore = removedTiles.length * SCORE * (gameState.combo + 1) * (streakCount > 1 ? streakCount : 1);

          // 점수 업데이트 (Time Warp 점수 배수 적용)
          const finalItemScore = itemScore * scoreMultiplier;
          setGameState((prev) => ({
            ...prev,
            score: prev.score + finalItemScore,
            combo: prev.combo + 1,
          }));

          // 애니메이션 표시
          if (rendererRef.current) {
            rendererRef.current.handleMatchAnimation(removedTiles);
          }
        }

        // Process matches after item effect
        setTimeout(() => {
          const { newGrid: afterRemovalGrid, newTileIds, dropAnimations } = removeMatchedTiles(updatedGrid);
          setGrid(afterRemovalGrid);

          if (rendererRef.current && dropAnimations.length > 0) {
            rendererRef.current.handleDropAnimation(dropAnimations);

            // Animate new tiles - 이 부분이 누락되어 있었습니다
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

          setTimeout(() => {
            const matches = findMatches(afterRemovalGrid);
            if (matches.length > 0) {
              // 아이템 사용 후 매칭이 발생하면 힌트 숨기기
              if (rendererRef.current) {
                rendererRef.current.setHintTiles([]);
              }
              void processMatches(matches, afterRemovalGrid, true);
            }
          }, 400);
        }, 400); // Wait for match animation duration
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
      gameState.combo,
      gameState.score,
      streakCount,
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

    // 게임 재시작 시 배경음악 재개 (설정이 켜져있는 경우)
    if (soundSettings.musicEnabled) {
      resumeBackgroundMusic();
    }
  }, [createInitialGrid, setGrid, resetItems, resetRewardState, soundSettings]);

  // Initialize game sounds only - grid will be initialized after canvas renderer is ready
  useEffect(() => {
    void preloadAllSounds();
    void preloadBackgroundMusic(); // 배경음악 미리 로드만
  }, []);

  // Handle background music enable/disable
  useEffect(() => {
    if (soundSettings.musicEnabled) {
      void playBackgroundMusic(soundSettings);
    } else {
      pauseBackgroundMusic();
    }
  }, [soundSettings.musicEnabled]);

  // Handle background music volume changes
  useEffect(() => {
    if (soundSettings.musicEnabled) {
      setBackgroundMusicVolume(soundSettings.musicVolume);
    }
  }, [soundSettings.musicVolume]);

  // Check for possible moves
  useEffect(() => {
    if (grid.length > 0 && !gameState.isSwapping && !gameState.isChecking && gameState.moves > 0 && !isShuffling) {
      try {
        const possibleMove = findPossibleMove();
        if (!possibleMove && !showShuffleConfirmation && !showShuffleButton) {
          setShowShuffleConfirmation(true);
        } else if (possibleMove && (showShuffleConfirmation || showShuffleButton)) {
          setShowShuffleConfirmation(false);
          setShowShuffleButton(false);
        }
      } catch (error) {
        console.warn('Error checking for possible moves:', error);
      }
    }
  }, [grid, gameState, isShuffling, findPossibleMove, showShuffleConfirmation, showShuffleButton]);

  // Show hint - 매칭이 발생할 때까지 계속 보이기
  useEffect(() => {
    if (
      lastMatchTime > 0 &&
      !gameState.isSwapping &&
      !gameState.isChecking &&
      !gameState.isGameOver &&
      grid.length > 0
    ) {
      const timer = setTimeout(() => {
        try {
          const possibleMove = findPossibleMove();
          if (possibleMove && rendererRef.current) {
            rendererRef.current.setHintTiles([
              { row: possibleMove.row1, col: possibleMove.col1 },
              { row: possibleMove.row2, col: possibleMove.col2 },
            ]);
          }
        } catch (error) {
          console.warn('Error finding possible move for hint:', error);
        }
      }, HINT_MOVE_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [lastMatchTime, gameState, findPossibleMove, grid]);

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
      // 게임 오버 시 배경음악 일시정지
      if (soundSettings.musicEnabled) {
        pauseBackgroundMusic();
      }
    }
  }, [soundSettings, gameState.moves, shuffleGrid, setGrid]);

  // Handle window resize - 캔버스 다시 그리기
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // 디바운스를 사용하여 리사이즈 이벤트 최적화
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (rendererRef.current) {
          rendererRef.current.resize();
          // 리사이즈 후 그리드 업데이트하여 다시 그리기
          if (grid.length > 0) {
            rendererRef.current.updateGrid(grid);
          }
        }
      }, 100); // 100ms 디바운스
    };

    window.addEventListener('resize', handleResize);
    // orientation change도 감지 (모바일)
    window.addEventListener('orientationchange', () => {
      // orientation change는 약간의 지연 후 처리
      setTimeout(handleResize, 200);
    });

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [grid]);

  // 백버튼 핸들러 (웹뷰 환경)
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      // 브라우저 히스토리가 없는 경우 (첫 페이지인 경우)
      if (window.history.length <= 1 || window.location.pathname === '/') {
        e.preventDefault();

        const currentTime = Date.now();

        // 2초 이내에 다시 백버튼을 누른 경우
        if (currentTime - lastBackPressTime < 2000) {
          if (isInWebView) {
            // 웹뷰 브릿지를 통해 앱 종료 요청
            sendMessage({
              type: WebToNativeMessageType.EXIT_ACTION,
            });
          } else {
            // 웹뷰가 아닌 경우 브라우저 탭 닫기 시도
            window.close();
          }
        } else {
          // 첫 번째 백버튼 누름 - 토스트 표시
          setShowExitToast(true);
          setLastBackPressTime(currentTime);

          // 2초 후 토스트 숨기기
          setTimeout(() => {
            setShowExitToast(false);
          }, 2000);
        }

        // 히스토리에 더미 항목 추가하여 뒤로가기 방지
        window.history.pushState(null, '', window.location.href);
      }
    };

    // 페이지 로드 시 더미 히스토리 추가
    window.history.pushState(null, '', window.location.href);

    // popstate 이벤트 리스너 등록
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [lastBackPressTime, isInWebView, sendMessage]);

  // Artifact Effect Helper Functions
  const applyChaosEngineEffect = useCallback(() => {
    const currentGrid = structuredClone(gridRef.current);
    const availablePositions: Array<{ row: number; col: number }> = [];

    // Find all positions with tiles
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentGrid[row][col] && !currentGrid[row][col].isMatched) {
          availablePositions.push({ row, col });
        }
      }
    }

    // Select 2 random positions to swap
    if (availablePositions.length >= 2) {
      const pos1 = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      const remaining = availablePositions.filter((p) => p.row !== pos1.row || p.col !== pos1.col);
      const pos2 = remaining[Math.floor(Math.random() * remaining.length)];

      // Swap the tiles
      const temp = currentGrid[pos1.row][pos1.col];
      currentGrid[pos1.row][pos1.col] = currentGrid[pos2.row][pos2.col];
      currentGrid[pos2.row][pos2.col] = temp;

      setGrid(currentGrid);
      gridRef.current = currentGrid; // 즉시 ref 업데이트

      // Update canvas renderer
      if (rendererRef.current) {
        // 스왑된 타일들에 시각적 효과 (매치 애니메이션으로 강조)
        const swappedTiles = [
          { row: pos1.row, col: pos1.col, id: currentGrid[pos1.row][pos1.col].id },
          { row: pos2.row, col: pos2.col, id: currentGrid[pos2.row][pos2.col].id },
        ];
        rendererRef.current.handleMatchAnimation(swappedTiles);

        // Update grid after animation
        setTimeout(() => {
          if (rendererRef.current) {
            rendererRef.current.updateGrid(currentGrid);
          }
        }, 200);
      }

      console.log(`Chaos Engine: Swapped tiles at (${pos1.row},${pos1.col}) and (${pos2.row},${pos2.col})`);
    }
  }, [gridRef, setGrid]);

  const applyCrystalConverterEffect = useCallback(() => {
    const currentGrid = structuredClone(gridRef.current);
    const availablePositions: Array<{ row: number; col: number }> = [];

    // Find all positions with tiles that can be upgraded
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentGrid[row][col] && !currentGrid[row][col].isMatched && currentGrid[row][col].tier < TILE_MAX_TIER) {
          availablePositions.push({ row, col });
        }
      }
    }

    // Convert up to 3 random tiles to max tier
    const tilesToConvert = Math.min(3, availablePositions.length);
    const selectedPositions = [];

    for (let i = 0; i < tilesToConvert; i++) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      const pos = availablePositions.splice(randomIndex, 1)[0];
      selectedPositions.push(pos);

      // Upgrade to max tier
      currentGrid[pos.row][pos.col].tier = TILE_MAX_TIER;
    }

    if (selectedPositions.length > 0) {
      setGrid(currentGrid);
      gridRef.current = currentGrid; // 즉시 ref 업데이트

      // Update canvas renderer with tier upgrade animation
      if (rendererRef.current) {
        const upgradeTiles = selectedPositions.map((pos) => ({
          id: currentGrid[pos.row][pos.col].id,
          row: pos.row,
          col: pos.col,
        }));

        // Show tier upgrade animation
        rendererRef.current.handleTierUpgradeAnimation(upgradeTiles);

        // Update grid after animation
        setTimeout(() => {
          if (rendererRef.current) {
            rendererRef.current.updateGrid(currentGrid);
          }
        }, 280);
      }

      console.log(`Crystal Converter: Upgraded ${selectedPositions.length} tiles to max tier`);
    }
  }, [gridRef, setGrid]);

  const applyStellarBroomEffect = useCallback(() => {
    const currentGrid = structuredClone(gridRef.current);
    let highestTier = 0;
    const highestTierPositions: Array<{ row: number; col: number }> = [];

    // Find the highest tier tiles on the grid
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = currentGrid[row][col];
        if (tile && !tile.isMatched) {
          if (tile.tier > highestTier) {
            highestTier = tile.tier;
            highestTierPositions.length = 0; // Clear previous positions
            highestTierPositions.push({ row, col });
          } else if (tile.tier === highestTier) {
            highestTierPositions.push({ row, col });
          }
        }
      }
    }

    // Remove one random highest tier tile
    if (highestTierPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * highestTierPositions.length);
      const pos = highestTierPositions[randomIndex];

      // Show match animation for the tile to be removed
      if (rendererRef.current) {
        const removeTile = [
          {
            row: pos.row,
            col: pos.col,
            id: currentGrid[pos.row][pos.col].id,
          },
        ];
        rendererRef.current.handleMatchAnimation(removeTile);
      }

      // Mark tile as matched immediately
      currentGrid[pos.row][pos.col].isMatched = true;

      // Drop tiles and refill synchronously
      const { newGrid: afterRemovalGrid, dropAnimations } = removeMatchedTiles(currentGrid);
      setGrid(afterRemovalGrid);
      gridRef.current = afterRemovalGrid; // 즉시 ref 업데이트

      // Update canvas renderer with drop animation
      if (rendererRef.current) {
        if (dropAnimations.length > 0) {
          rendererRef.current.handleDropAnimation(dropAnimations);
        }

        // Update grid after a short delay for visual effect
        setTimeout(() => {
          if (rendererRef.current) {
            rendererRef.current.updateGrid(afterRemovalGrid);
          }
        }, 280);
      }

      console.log(`Stellar Broom: Removed highest tier (${highestTier}) tile at (${pos.row},${pos.col})`);
    }
  }, [gridRef, setGrid, removeMatchedTiles]);

  const applyPrimalCleanserEffect = useCallback(() => {
    // Same logic as Stellar Broom but with different logging
    applyStellarBroomEffect();
    console.log('Primal Cleanser: Effect applied (same as Stellar Broom)');
  }, [applyStellarBroomEffect]);

  const applyTimeWarpEffect = useCallback(() => {
    // 시간 왜곡기: 다음 3턴 동안 점수 2배
    const currentTurn = gameState.turn;
    const endTurn = currentTurn + 3;

    setScoreMultiplier(2);
    setMultiplierEndTurn(endTurn);

    console.log(`Time Warp: Score x2 active until turn ${endTurn}`);
  }, [gameState.turn, setScoreMultiplier, setMultiplierEndTurn]);

  // 연쇄 매치 완료 후 유물 효과 처리 함수
  const processArtifactEffects = useCallback(
    async (artifactsToTrigger: Array<{ artifact: Artifact; type: 'turn_based' | 'auto_remove' }>): Promise<void> => {
      // 유물 처리가 이미 진행 중인 경우만 건너뛰기 (중복 방지)
      if (isProcessingArtifacts) {
        console.log('⏸️ Artifact processing skipped - already processing');
        return;
      }

      // 게임이 종료된 경우 처리 건너뛰기
      if (gameState.isGameOver) {
        console.log('⏸️ Artifact processing skipped - game over');
        return;
      }

      // 유물 처리 시작 표시
      setIsProcessingArtifacts(true);

      try {
        // 유물을 획득 순서대로 정렬
        const sortedArtifacts = artifactsToTrigger.sort((a, b) => {
          const indexA = rewardState.activeArtifacts.findIndex((artifact) => artifact.id === a.artifact.id);
          const indexB = rewardState.activeArtifacts.findIndex((artifact) => artifact.id === b.artifact.id);
          return indexA - indexB;
        });

        // 이전 애니메이션 정리
        if (artifactAnimationTimerRef.current) {
          clearTimeout(artifactAnimationTimerRef.current);
          artifactAnimationTimerRef.current = null;
        }

        // 모든 유물 ID를 한 번에 설정하여 리렌더링 최소화
        const allArtifactIds = new Set(sortedArtifacts.map(({ artifact }) => artifact.id));
        setTriggeredArtifacts(allArtifactIds);
        setShowTriggeredEffects(true);

        // 애니메이션 시작 시간 기록
        artifactAnimationStartTimeRef.current = Date.now();

        // 애니메이션 시작 대기
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 각 유물 효과를 순차 실행 (하지만 화면 업데이트는 하지 않음)
        for (const { artifact, type } of sortedArtifacts) {
          // 게임이 종료된 경우만 중단
          if (gameState.isGameOver) {
            console.log('⏸️ Artifact processing interrupted - game over');
            break;
          }

          console.log(`🎆 Artifact activated: ${artifact.id}`);

          // 각 유물 효과 실행
          if (type === 'turn_based') {
            switch (artifact.id) {
              case 'time_warp':
                console.log('✨ Time Warp activated!');
                applyTimeWarpEffect();
                break;
              case 'chaos_engine':
                console.log('🌪️ Chaos Engine activated!');
                applyChaosEngineEffect();
                break;
              case 'crystal_converter':
                console.log('💎 Crystal Converter activated!');
                applyCrystalConverterEffect();
                break;
              case 'mystery_box': {
                console.log('📦 Mystery Box activated!');
                const items: GameItemType[] = ['shovel', 'mole', 'bomb'];
                const randomItem = items[Math.floor(Math.random() * items.length)];
                addItem(randomItem, 1);
                console.log(`Mystery Box gave ${randomItem}!`);
                break;
              }
            }
          } else if (type === 'auto_remove') {
            switch (artifact.id) {
              case 'stellar_broom':
                console.log('🪐 Stellar Broom activated!');
                applyStellarBroomEffect();
                break;
              case 'primal_cleanser':
                console.log('🌌 Primal Cleanser activated!');
                applyPrimalCleanserEffect();
                break;
            }
          }

          // 유물 효과 적용 후 안정화 대기 (더 짧게)
          await new Promise((resolve) => setTimeout(resolve, 30));
        }

        // 유물 처리 완료 - 즉시 다음 처리 허용
        setIsProcessingArtifacts(false);

        // 최소 표시 시간과 애니메이션 시간 중 더 긴 시간 사용
        const totalAnimationTime = sortedArtifacts.length * 200 + 1200; // 각 유물 당 200ms + 기본 1200ms
        const minimumDisplayTime = 2000; // 2초 최소 표시 시간
        const actualDisplayTime = Math.max(totalAnimationTime, minimumDisplayTime);

        // 애니메이션 UI만 타이머로 관리
        artifactAnimationTimerRef.current = setTimeout(() => {
          setShowTriggeredEffects(false);
          setTriggeredArtifacts(new Set());
          artifactAnimationTimerRef.current = null;
          artifactAnimationStartTimeRef.current = null;
        }, actualDisplayTime);
      } catch (error) {
        console.error('❌ Artifact processing error:', error);
        // 에러 발생 시에도 상태 리셋
        setIsProcessingArtifacts(false);
        setShowTriggeredEffects(false);
        setTriggeredArtifacts(new Set());
      }
    },
    [
      gameState,
      isProcessingArtifacts,
      rewardState.activeArtifacts,
      setIsProcessingArtifacts,
      setTriggeredArtifacts,
      setShowTriggeredEffects,
      applyTimeWarpEffect,
      applyChaosEngineEffect,
      applyCrystalConverterEffect,
      applyStellarBroomEffect,
      applyPrimalCleanserEffect,
      addItem,
    ],
  );

  return (
    <ConfettiManager>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        {/* 로딩 오버레이 */}
        {isInitializing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="mb-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500/30 border-t-purple-400 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{Math.round(loadingProgress)}%</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-white text-xl font-medium mb-2">{t('loading.pleaseWait')}</p>
                <p className="text-white/70 text-sm">{t('loading.messages.loadingAssets')}</p>
              </div>

              {/* 진행률 바 */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${loadingProgress}%`,
                  }}
                />
              </div>

              <p className="text-purple-300 text-sm font-medium">{Math.round(loadingProgress)}% </p>
            </div>
          </div>
        )}

        {/* 게임 UI */}
        <div className="relative flex flex-col h-full w-full">
          <header className="fixed w-full h-16 inset-0 z-20 p-2">
            <div className="flex justify-between items-center">
              {/* 왼쪽 빈 공간 */}
              <div className="flex-1" />

              <div className="flex items-center gap-3">
                {/* TODO: 경로 기능 with 상점 오른쪽: Gem 표시와 설정 버튼 */}
                {/* <motion.div
                  className="relative flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm border border-purple-400/50 rounded-lg shadow-lg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Image
                    src="/icons/gem.png"
                    alt="Gem"
                    width={48}
                    height={48}
                    className="absolute -left-5 drop-shadow"
                  />
                  <span className="min-w-16 ml-3 px-3 py-1 text-center text-white text-lg font-semibold drop-shadow">
                    {playerGems.toLocaleString()}
                  </span>
                </motion.div> */}

                {/* Shuffle Button (when confirmation is dismissed) */}
                <AnimatePresence>
                  {showShuffleButton && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowShuffleConfirmation(true);
                        }}
                        disabled={gameState.isProcessingMatches || isShuffling}
                        className={`
                          bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full
                          ${gameState.isProcessingMatches || isShuffling ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                          <Shuffle className="h-6 w-6" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettingsModal(true)}
                  className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full flex flex-col items-center justify-center relative z-10 min-h-screen overflow-hidden">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
              {/* Score and Moves Panel */}
              <div className="w-full px-2 mb-4">
                <div className="flex justify-between items-center gap-2 sm:gap-4">
                  {/* Score Display */}
                  <motion.div
                    className="relative flex-2"
                    key={`score-${gameState.score}`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute -inset-1 rounded-lg blur opacity-30 bg-gradient-to-r from-pink-500 to-purple-500" />
                    <div className="relative w-full backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-lg border shadow-[0_0_15px_rgba(236,72,153,0.3)] bg-black/90 border-pink-500/30">
                      <div className="text-pink-400 text-md mb-1 tracking-widest">
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
                    <div className="relative w-full bg-black/90 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      <div className="text-blue-400 text-md mb-1 tracking-widest">{t('common.moves')}</div>
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

              {/* Next Reward Preview */}
              <div className="w-full px-2 mb-4">
                <NextRewardPreview
                  nextRewards={availableRewards}
                  currentScore={gameState.score}
                  onRewardPreview={() => {
                    // 보상 미리보기 클릭 시 동작 (현재는 비어있음)
                  }}
                />
              </div>

              {/* 경로 시스템 - 점수 패널과 게임 보드 사이 */}
              {/* <div className="w-full px-2 mb-4">
              <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white/80">{t('game.pathProgress.title')}</div>
                  <div className="flex items-center gap-2">
                    {!pathExpanded && (
                      <div className="text-xs text-white/60">
                        {(() => {
                          const nextPath = pathProgress.availablePaths.find(
                            (path) => !path.isCompleted && path.scoreRequired > gameState.score,
                          );
                          if (!nextPath) return t('game.pathProgress.final');
                          return nextPath.type === 'shop'
                            ? '🏪'
                            : nextPath.type === 'reward'
                            ? '🎁'
                            : nextPath.type === 'rest'
                            ? '💚'
                            : nextPath.type === 'boss'
                            ? '👑'
                            : '⚔️';
                        })()}{' '}
                        {(() => {
                          const nextPath = pathProgress.availablePaths.find(
                            (path) => !path.isCompleted && path.scoreRequired > gameState.score,
                          );
                          if (!nextPath) return t('game.pathProgress.final');
                          return nextPath.type === 'shop'
                            ? t('game.pathProgress.shop')
                            : nextPath.type === 'reward'
                            ? t('game.pathProgress.reward')
                            : nextPath.type === 'rest'
                            ? t('game.pathProgress.rest')
                            : nextPath.type === 'boss'
                            ? t('game.pathProgress.boss')
                            : t('game.pathProgress.battle');
                        })()}
                      </div>
                    )}
                    <button
                      onClick={() => setPathExpanded(!pathExpanded)}
                      className="text-white/60 hover:text-white/80 transition-colors"
                    >
                      {pathExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!pathExpanded && (
                    <motion.div
                      key="collapsed"
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-white/70">{t('game.pathProgress.nextStep')}:</div>
                        <div className="text-sm font-bold text-yellow-400">
                          {pathProgress.nextScoreThreshold > 0
                            ? t('game.pathProgress.scoreRequired', {
                                score: pathProgress.nextScoreThreshold.toLocaleString(),
                              })
                            : t('game.pathProgress.completed')}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {pathExpanded && (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{
                        duration: 0.4,
                        ease: 'easeInOut',
                        height: { duration: 0.3 },
                        opacity: { duration: 0.2, delay: 0.1 },
                        y: { duration: 0.3 },
                      }}
                    >
                      <div className="relative flex justify-between items-center mb-4">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-full h-8" viewBox="0 0 400 32">
                            <path
                              d="M 30 16 Q 100 8 150 16 Q 200 24 250 16 Q 300 8 350 16"
                              stroke="url(#pathGradient)"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray="3,3"
                              className="animate-pulse"
                            />
                            <defs>
                              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="50%" stopColor="#ec4899" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {pathProgress.availablePaths.map((path, index) => {
                          const pathId = path.id;
                          const isCurrent = pathProgress.currentPath === pathId;
                          const isCompleted = path.isCompleted;
                          const isAvailable = path.isAvailable;

                          return (
                            <motion.div
                              key={pathId}
                              className="relative flex flex-col items-center cursor-pointer"
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: 'easeOut',
                              }}
                              onClick={() => {
                                if (isAvailable) {
                                  if (pathId.includes('shop')) {
                                    setShowShopModal(true);
                                  } else {
                                    setShowPathChoiceModal(true);
                                  }
                                }
                              }}
                              whileHover={isAvailable ? { scale: 1.05 } : {}}
                            >
                              <div
                                className={`
                                  w-10 h-10 rounded-full border-2 flex items-center justify-center
                                  ${
                                    isCurrent
                                      ? 'border-green-400 bg-green-400/20'
                                      : isCompleted
                                      ? 'border-blue-400 bg-blue-400/20'
                                      : 'border-slate-600 bg-slate-700/50'
                                  }
                                `}
                              >
                                <div className="text-lg text-white">{path.icon}</div>
                              </div>

                              <div className="mt-1 text-center">
                                <div className="text-xs text-white/70 max-w-16 leading-tight">{path.name}</div>
                              </div>

                              {isCompleted && (
                                <motion.div
                                  className="absolute -top-1 -left-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', delay: 0.5 + index * 0.1 }}
                                >
                                  <span className="text-white text-xs">✓</span>
                                </motion.div>
                              )}

                              {isCurrent && (
                                <motion.div
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <span className="text-white text-xs">●</span>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      <motion.div
                        className="mt-3 pt-3 border-t border-slate-600/50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white/80">{t('game.pathProgress.nextStep')}</div>
                          <div className="text-sm font-bold text-yellow-400">
                            {t('game.pathProgress.scoreRequired', {
                              score: pathProgress.nextScoreThreshold.toLocaleString(),
                            })}
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pathProgress.progressPercentage}%` }}
                            transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div> */}

              {/* Game Board Container */}
              <div className="w-full max-w-[min(100vw,100vh,600px)] mx-auto px-2">
                <div className="relative w-full bg-black/40 rounded-xl border-2 border-purple-600/50 shadow-[0_0_20px_rgba(147,51,234,0.4)] backdrop-blur-sm pb-2">
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
                  <div className="flex justify-center gap-2 flex-wrap">
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
                            relative flex flex-col text-center items-center p-1 sm:p-2 rounded-lg min-w-[80px]
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
                              className="mb-1"
                              animate={{
                                rotateZ: selectedGameItem === id ? [0, -5, 5, 0] : 0,
                                scale: selectedGameItem === id ? [1, 1.1, 1] : 1,
                              }}
                              transition={{ duration: 0.4, repeat: selectedGameItem === id ? Infinity : 0 }}
                            >
                              <Image
                                src={icon}
                                alt={t(`game.items.${id}`)}
                                width={36}
                                height={36}
                                className="sm:w-12 sm:h-12"
                                priority
                              />
                            </motion.div>
                            <div className="text-sm font-bold text-white leading-tight">{t(`game.items.${id}`)}</div>
                            <motion.div
                              className="absolute -top-1 -right-1 bg-red-500 text-white text-느 font-bold rounded-full w-5 h-5 flex items-center justify-center"
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
                        gameState.isProcessingMatches
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
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
                  void playButtonSound(soundSettings);
                  setShowTutorial(true);
                  setTutorialStep(1);
                  setShowSettingsModal(false);
                }}
                soundSettings={soundSettings}
                toggleSound={toggleSound}
                toggleMusic={toggleMusic}
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

          {/* Exit Toast */}
          <Toast isOpen={showExitToast} icon={X} message="한번 더 누르면 게임이 종료됩니다" />

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

          {/* Shop Modal */}
          <ShopModal
            isOpen={showShopModal}
            onClose={() => setShowShopModal(false)}
            playerGems={playerGems}
            onPurchase={handleShopPurchase}
            availableItems={[]}
          />

          {/* Path Choice Modal */}
          <PathChoiceModal
            isOpen={showPathChoiceModal}
            onClose={() => setShowPathChoiceModal(false)}
            onPathSelect={handlePathSelect}
            availablePaths={[]}
            currentPath={pathProgress.currentPath}
          />

          {/* Artifact Panel */}
          <ArtifactPanel
            artifacts={rewardState.activeArtifacts}
            currentTurn={gameState.turn}
            gameState={{
              moveCount: gameState.moves,
              combo: gameState.combo,
              score: gameState.score,
            }}
            triggeredArtifacts={triggeredArtifacts}
            showTriggeredEffects={showTriggeredEffects}
          />

          {/* Enhanced Triggered Artifact Notification */}
          <AnimatePresence mode="wait">
            {showTriggeredEffects && triggeredArtifacts.size > 0 && (
              <motion.div
                key="artifact-notification-container"
                className="fixed left-4 top-4 z-30 pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col gap-2">
                  {Array.from(triggeredArtifacts).map((artifactId, index) => {
                    const artifact = rewardState.activeArtifacts.find((a) => a.id === artifactId);
                    if (!artifact) return null;

                    return (
                      <motion.div
                        key={artifactId}
                        className="mb-2 relative"
                        initial={{ x: -120, opacity: 0, scale: 0.3 }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{ x: -120, opacity: 0, scale: 0.3 }}
                        transition={{
                          delay: index * 0.15,
                          duration: 0.6,
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        }}
                      >
                        <div className="relative bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-xl p-3 border border-yellow-400/40 shadow-2xl">
                          {/* Artifact Info Container */}
                          <div className="flex items-center gap-3">
                            <motion.div
                              className={`text-3xl ${artifact.color} relative`}
                              animate={{
                                rotate: [0, 8, -8, 0],
                                scale: [1, 1.15, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            >
                              {artifact.icon}

                              {/* Pulsing glow effect */}
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: `radial-gradient(circle, ${artifact.color}40 0%, transparent 60%)`,
                                  filter: 'blur(8px)',
                                }}
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                              />
                            </motion.div>

                            {/* Artifact Details */}
                            <div className="flex-1 min-w-0">
                              <div className="text-yellow-300 font-semibold text-sm truncate">{artifact.name}</div>
                              <div className="text-gray-300 text-xs opacity-90">효과 발동됨</div>
                            </div>
                          </div>

                          {/* Border glow animation */}
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2 border-yellow-400/60"
                            animate={{
                              opacity: [0.3, 0.8, 0.3],
                              scale: [1, 1.02, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ConfettiManager>
  );
});

GameView.displayName = 'GameView';

'use client';

import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Sparkles, Star, Diamond, Gem, ArrowLeft, Settings, Home, X, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createElement, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmationModal } from '@/components/logic/dialogs/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { ANIMATION_DURATION, GRID_SIZE, MIN_MATCH_COUNT, SCORE } from '@/constants/game-config';
import { useGameItem } from '@/hooks/useGameItem';
import { useMatchGame } from '@/hooks/useMatchGame';
import type { GridItem, ItemType, GameState, GameItemType } from '@/types/game-types';
import { createParticles, fallVariant, swapVariant } from '@/utils/animation-helper';
import { deepCopyGrid } from '@/utils/game-helper';

const tileConfig: Record<
  ItemType,
  { color: Record<number, string>; bgColor: Record<number, string>; icon: Record<number, React.ElementType> }
> = {
  1: {
    color: {
      1: 'text-red-500',
      2: 'text-red-600',
      3: 'text-red-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-red-400 to-red-600',
      2: 'bg-gradient-to-br from-red-600 to-red-800',
      3: 'bg-gradient-to-br from-red-800 to-red-900',
    },
    icon: {
      1: Heart,
      2: Heart,
      3: Heart,
    },
  },
  2: {
    color: {
      1: 'text-blue-500',
      2: 'text-blue-600',
      3: 'text-blue-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-blue-400 to-blue-600',
      2: 'bg-gradient-to-br from-blue-600 to-blue-800',
      3: 'bg-gradient-to-br from-blue-800 to-blue-900',
    },
    icon: {
      1: Zap,
      2: Zap,
      3: Zap,
    },
  },
  3: {
    color: {
      1: 'text-green-500',
      2: 'text-green-600',
      3: 'text-green-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-green-400 to-green-600',
      2: 'bg-gradient-to-br from-green-600 to-green-800',
      3: 'bg-gradient-to-br from-green-800 to-green-900',
    },
    icon: {
      1: Sparkles,
      2: Sparkles,
      3: Sparkles,
    },
  },
  4: {
    color: {
      1: 'text-yellow-500',
      2: 'text-yellow-600',
      3: 'text-yellow-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      2: 'bg-gradient-to-br from-yellow-600 to-yellow-800',
      3: 'bg-gradient-to-br from-yellow-800 to-yellow-900',
    },
    icon: {
      1: Star,
      2: Star,
      3: Star,
    },
  },
  5: {
    color: {
      1: 'text-purple-500',
      2: 'text-purple-600',
      3: 'text-purple-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-purple-400 to-purple-600',
      2: 'bg-gradient-to-br from-purple-600 to-purple-800',
      3: 'bg-gradient-to-br from-purple-800 to-purple-900',
    },
    icon: {
      1: Diamond,
      2: Diamond,
      3: Diamond,
    },
  },
  6: {
    color: {
      1: 'text-pink-500',
      2: 'text-pink-600',
      3: 'text-pink-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-pink-400 to-pink-600',
      2: 'bg-gradient-to-br from-pink-600 to-pink-800',
      3: 'bg-gradient-to-br from-pink-800 to-pink-900',
    },
    icon: {
      1: Gem,
      2: Gem,
      3: Gem,
    },
  },
};

export const GameBoard = () => {
  const router = useRouter();
  const { getRandomItemType, createInitialGrid } = useMatchGame();
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
    moves: 20,
    isSwapping: false,
    isChecking: false,
    isGameOver: false,
    combo: 0,
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

  // const addArtifactFragment = () => {
  //   setArtifactFragments((prev) => prev + 1);
  // };

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
  };

  const swapTiles = async (row1: number, col1: number, row2: number, col2: number) => {
    setGameState((prev) => ({ ...prev, isSwapping: true }));
    let newGrid = deepCopyGrid(grid);

    // 스왑된 타일 정보
    const swappedTiles = [
      { row: row1, col: col1 },
      { row: row2, col: col2 },
    ];

    // 스왑 실행
    const temp = { ...newGrid[row1][col1] };
    newGrid[row1][col1] = { ...newGrid[row2][col2] };
    newGrid[row2][col2] = temp;

    setGrid(newGrid);
    setSelectedTile(null);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

    const matches = findMatches(newGrid);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION + 100));
    if (matches.length > 0) {
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

    // 가로 매치 확인
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

    // 세로 매치 확인
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

  const processMatches = async (
    matches: { row: number; col: number }[],
    currentGrid: GridItem[][],
    isFirstMatch: boolean = false,
    swappedTiles?: { row: number; col: number }[],
  ) => {
    const combo = gameState.combo + 1;
    const matchScore = matches.length * SCORE * combo;

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
      const color = tileConfig[currentGrid[matches[0].row][matches[0].col].type].color[
        currentGrid[matches[0].row][matches[0].col].tier
      ].replace('text-', '');
      createParticles(x, y, color);

      setTimeout(() => {
        setShowScorePopup(null);
      }, 800);
    }

    let newGrid = deepCopyGrid(currentGrid);
    matches.forEach(({ row, col }, index) => {
      if (!swappedTiles) {
        // 아이템 사용인 경우: 첫 번째 타일만 업그레이드, 나머지는 제거
        if (index === 0) {
          if (newGrid[row][col].tier < 3) {
            newGrid[row][col].tier += 1;
            newGrid[row][col].isMatched = false;
          } else {
            newGrid[row][col].isMatched = true;
            // addArtifactFragment();
          }
        } else {
          newGrid[row][col].isMatched = true;
        }
      } else {
        // 스왑의 경우: 스왑된 타일이면 업그레이드, 나머지는 제거
        const isSwapped = swappedTiles.some((tile) => tile.row === row && tile.col === col);
        if (isSwapped) {
          if (newGrid[row][col].tier < 3) {
            newGrid[row][col].tier += 1;
            newGrid[row][col].isMatched = false;
          } else {
            newGrid[row][col].isMatched = true;
            // addArtifactFragment();
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
        combo: 0,
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
        }, 500);
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
      moves: 20,
      isSwapping: false,
      isChecking: false,
      isGameOver: false,
      combo: 0,
      turn: 0,
    });
    setTileChangeIndex(0);
    setGrid(createInitialGrid());
    setSelectedTile(null);
    setShowScorePopup(null);
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
        combo: 0,
      }));
    }
  };

  const handleBackClick = () => {
    if (gameState.isGameOver) {
      router.push('/');
    }
    setShowBackConfirmation(true);
  };

  const handleConfirmGoBack = () => {
    setShowBackConfirmation(false);
    router.push('/');
  };

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  // Hydration 오류 방지를 위해 Grid는 클라이언트 측에서만 생성
  useEffect(() => {
    setGrid(createInitialGrid());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-violet-900 p-4">
      <motion.div
        className="w-full max-w-lg flex justify-between items-center mb-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <motion.h1
          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          Kepler Pop
        </motion.h1>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSettingsClick}
          className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </motion.div>

      <div className="flex justify-center gap-8 my-4">
        <motion.div
          className="text-white bg-indigo-700/50 px-4 py-2 rounded-full shadow-lg"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <span className="font-bold">점수:</span>{' '}
          <motion.span
            key={gameState.score}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {gameState.score}
          </motion.span>
        </motion.div>
        <motion.div
          className="text-white bg-purple-700/50 px-4 py-2 rounded-full shadow-lg"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <span className="font-bold">남은 이동:</span>{' '}
          <motion.span
            key={gameState.moves}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {gameState.moves}
          </motion.span>
        </motion.div>
      </div>

      {gameState.combo > 1 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="mt-2 text-yellow-300 font-bold text-xl"
        >
          {gameState.combo}x 콤보!
        </motion.div>
      )}

      <motion.div
        className="relative bg-indigo-800/30 p-3 rounded-xl border-2 border-indigo-600/50 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <AnimatePresence>
          {gameState.isGameOver && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-20 backdrop-blur-md"
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
                <div className="relative bg-gradient-to-b from-indigo-900/95 to-purple-900/95 rounded-2xl p-8 border border-indigo-400/30 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                  <div className="absolute -top-10 -right-10 text-yellow-300 text-4xl animate-pulse opacity-70">✨</div>
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
                      게임 종료!
                    </h2>
                  </motion.div>
                  <motion.div
                    className="text-center mb-6 bg-indigo-800/40 p-4 rounded-xl"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <p className="text-lg text-white/80 mb-1">최종 점수</p>
                    <motion.div
                      className="text-3xl font-bold text-yellow-300"
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
                    <div className="text-6xl text-yellow-400">🏆</div>
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
                      다시 도전하기
                    </Button>
                    <Button
                      onClick={() => router.push('/')}
                      variant="outline"
                      className="bg-indigo-800/30 border-indigo-500/50 text-white hover:bg-indigo-800/30 rounded-xl py-3"
                    >
                      <Home className="w-5 h-5 mr-2" />
                      메인으로 돌아가기
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="grid gap-1.5"
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
                      : 1,
                  rotate: selectedTile?.row === rowIndex && selectedTile?.col === colIndex ? [0, 5, 0, -5, 0] : 0,
                }}
                transition={item.isMatched ? fallVariant.transition : swapVariant.transition}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-full 
                  ${tileConfig[item.type].bgColor[item.tier]}
                  ${
                    selectedTile?.row === rowIndex && selectedTile?.col === colIndex
                      ? 'ring-4 ring-white shadow-[0_0_10px rgba(255,255,255,0.7)]'
                      : 'shadow-md hover:shadow-lg'
                  }
                  cursor-pointer
                  flex items-center justify-center
                  transition-shadow duration-200
                  relative overflow-hidden
                `}
                onClick={() => handleTileClick(rowIndex, colIndex)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
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
                    ? 'from-indigo-500 to-purple-600 ring-2 ring-white shadow-lg'
                    : 'from-indigo-700 to-purple-800'
                }
                ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                bg-gradient-to-br drop-shadow-md transition-all duration-200
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
      </motion.div>

      <ConfirmationModal
        isOpen={showBackConfirmation}
        title="게임 종료"
        message={
          <div className="space-y-3">
            <p className="text-white">게임을 종료하시겠습니까?</p>
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
                진행 상황은 저장되지 않으며, 사용한 물방울은 돌려받을 수 없습니다.
              </p>
            </div>
          </div>
        }
        confirmText="나가기"
        cancelText="계속하기"
        onConfirm={handleConfirmGoBack}
        onCancel={() => setShowBackConfirmation(false)}
      />

      <AnimatePresence>
        {showSettingsMenu && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-lg bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsMenu(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-indigo-900/95 to-purple-900/95 border border-indigo-400/30 rounded-2xl p-6 w-[320px] shadow-[0_0_25px_rgba(99,102,241,0.3)]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                  설정
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettingsMenu(false)}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5 text-white/80" />
                </Button>
              </div>

              <div className="space-y-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full flex justify-start gap-3 rounded-xl py-4 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 hover:from-indigo-700/40 hover:to-purple-700/40 border-indigo-500/30 text-white"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setShowBackConfirmation(true);
                    }}
                  >
                    <Home className="h-5 w-5 text-blue-300" />
                    <span>메인으로 돌아가기</span>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full flex justify-start gap-3 rounded-xl py-4 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 hover:from-indigo-700/40 hover:to-purple-700/40 border-indigo-500/30 text-white"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      restartGame();
                    }}
                  >
                    <RefreshCw className="h-5 w-5 text-green-300" />
                    <span>게임 재시작</span>
                  </Button>
                </motion.div>

                <div className="mt-6 pt-4 border-t border-indigo-500/30">
                  <p className="text-center text-sm text-white/60 mb-2">Kepler Pop v1.0</p>
                  <p className="text-center text-xs text-white/40">© 2023 우주 개발팀</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

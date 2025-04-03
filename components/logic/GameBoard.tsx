'use client';

import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Sparkles, Star, Diamond, Gem } from 'lucide-react';
import { createElement, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { ANIMATION_DURATION, GRID_SIZE, SCORE } from '@/constants/game-config';
import { useGameItem } from '@/hooks/useGameItem';
import { useMatchGame } from '@/hooks/useMatchGame';
import type { GridItem, ItemType, GameState, GameItemType } from '@/types/GameTypes';
import { createParticles } from '@/utils/animation-helper';
import { deepCopyGrid } from '@/utils/game-helper';

// 아이템 색상 및 아이콘 매핑
const itemConfig: Record<ItemType, { color: string; bgColor: string; icon: React.ElementType }> = {
  1: {
    color: 'text-red-500',
    bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
    icon: Heart,
  },
  2: {
    color: 'text-blue-500',
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    icon: Zap,
  },
  3: {
    color: 'text-green-500',
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
    icon: Sparkles,
  },
  4: {
    color: 'text-yellow-500',
    bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    icon: Star,
  },
  5: {
    color: 'text-purple-500',
    bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    icon: Diamond,
  },
  6: {
    color: 'text-pink-500',
    bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
    icon: Gem,
  },
};

export const GameBoard = () => {
  const { getRandomItemType, createInitialGrid } = useMatchGame();
  const { items, selectedItem, selectItem } = useGameItem();
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
  });
  const [showScorePopup, setShowScorePopup] = useState<{
    score: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setGrid(createInitialGrid());
  }, []);

  // 아이템 선택 핸들러
  const handleItemClick = (row: number, col: number) => {
    if (gameState.isSwapping || gameState.isChecking || gameState.isGameOver) return;

    if (selectedTile === null) {
      setSelectedTile({ row, col });
      return;
    }

    if (selectedTile.row === row && selectedTile.col === col) {
      setSelectedTile(null);
      return;
    }

    const isAdjacent =
      (Math.abs(selectedTile.row - row) === 1 && selectedTile.col === col) ||
      (Math.abs(selectedTile.col - col) === 1 && selectedTile.row === row);

    if (isAdjacent) {
      swapItems(selectedTile.row, selectedTile.col, row, col);
    } else {
      setSelectedTile({ row, col });
    }
  };

  // 아이템 스왑 함수
  const swapItems = async (row1: number, col1: number, row2: number, col2: number) => {
    setGameState((prev) => ({ ...prev, isSwapping: true }));
    let newGrid = deepCopyGrid(grid);

    // 스왑 실행
    const temp = { ...newGrid[row1][col1] };
    newGrid[row1][col1] = { ...newGrid[row2][col2] };
    newGrid[row2][col2] = temp;

    setGrid(newGrid);
    setSelectedTile(null);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

    const matches = findMatches(newGrid);

    if (matches.length > 0) {
      processMatches(matches, newGrid, true);
    } else {
      // 매치가 없으면 스왑 원상복구
      newGrid = deepCopyGrid(newGrid);
      const temp2 = { ...newGrid[row1][col1] };
      newGrid[row1][col1] = { ...newGrid[row2][col2] };
      newGrid[row2][col2] = temp2;
      setGrid(newGrid);
      // 매치가 없더라도 이동은 소모되도록 처리
      setGameState((prev) => ({
        ...prev,
        moves: prev.moves - 1,
        isSwapping: false,
        isGameOver: prev.moves - 1 <= 0,
      }));
    }
  };

  // 매치 찾기 함수
  const findMatches = (currentGrid: GridItem[][]): { row: number; col: number }[] => {
    const matches: { row: number; col: number }[] = [];

    // 가로 매치 확인
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const type = currentGrid[row][col].type;
        if (type === currentGrid[row][col + 1].type && type === currentGrid[row][col + 2].type) {
          let matchLength = 3;
          while (col + matchLength < GRID_SIZE && currentGrid[row][col + matchLength].type === type) {
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
        const type = currentGrid[row][col].type;
        if (type === currentGrid[row + 1][col].type && type === currentGrid[row + 2][col].type) {
          let matchLength = 3;
          while (row + matchLength < GRID_SIZE && currentGrid[row + matchLength][col].type === type) {
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

  // 매치 처리 함수
  const processMatches = async (
    matches: { row: number; col: number }[],
    currentGrid: GridItem[][],
    isFirstMatch: boolean = false,
  ) => {
    const combo = gameState.combo + 1;
    const matchScore = matches.length * SCORE * combo;

    setGameState((prev) => ({
      ...prev,
      isChecking: true,
      score: prev.score + matchScore,
      moves: isFirstMatch ? prev.moves - 1 : prev.moves,
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
      const color = itemConfig[currentGrid[matches[0].row][matches[0].col].type].color.replace('text-', '');
      createParticles(x, y, color);

      setTimeout(() => {
        setShowScorePopup(null);
      }, 800);
    }

    let newGrid = deepCopyGrid(currentGrid);
    // 매치된 아이템 표시
    matches.forEach(({ row, col }) => {
      newGrid[row][col].isMatched = true;
    });

    setGrid(newGrid);
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

    // 매치된 아이템 제거 및 타일 드롭 처리
    newGrid = removeMatchedItems(newGrid);
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

  // 매치된 아이템 제거 및 타일 드롭 함수
  const removeMatchedItems = (currentGrid: GridItem[][]): GridItem[][] => {
    const newGrid = deepCopyGrid(currentGrid);

    for (let col = 0; col < GRID_SIZE; col++) {
      const columnTiles: GridItem[] = [];
      // 매치되지 않은 타일만 수집 (상단부터)
      for (let row = 0; row < GRID_SIZE; row++) {
        if (!newGrid[row][col].isMatched) {
          columnTiles.push(newGrid[row][col]);
        }
      }
      // 부족한 타일 수만큼 새 타일 생성 (새 타일은 상단에 배치)
      const missingTiles = GRID_SIZE - columnTiles.length;
      const newTiles: GridItem[] = [];
      for (let i = 0; i < missingTiles; i++) {
        newTiles.push({
          id: `${i}-${col}-${uuidv4()}`,
          type: getRandomItemType(),
          isMatched: false,
          isNew: true,
        });
      }
      // 새 타일과 기존 타일을 합쳐서 업데이트 (상단: 새 타일, 하단: 기존 타일)
      const updatedColumn = [...newTiles, ...columnTiles];
      for (let row = 0; row < GRID_SIZE; row++) {
        newGrid[row][col] = updatedColumn[row];
      }
    }

    return newGrid;
  };

  // 게임 재시작 함수
  const restartGame = () => {
    setGrid(createInitialGrid());
    setSelectedTile(null);
    setGameState({
      score: 0,
      moves: 20,
      isSwapping: false,
      isChecking: false,
      isGameOver: false,
      combo: 0,
    });
    setShowScorePopup(null);
  };

  const handleGameItemSelect = (itemId: GameItemType) => {
    if (selectedItem === itemId) {
      selectItem(null);
      return;
    }
    selectItem(itemId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-violet-900 p-4">
      <div className="text-center mb-6">
        <motion.h1
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          Kepler Pop
        </motion.h1>
        <div className="flex justify-center gap-8 mt-8">
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
      </div>

      <motion.div
        className="relative bg-indigo-800/30 p-3 rounded-xl border-2 border-indigo-600/50 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <AnimatePresence>
          {gameState.isGameOver && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl z-20 backdrop-blur-sm"
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div className="text-center p-8 bg-gradient-to-b from-indigo-900 to-purple-900 rounded-xl border-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                <motion.h2
                  className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-4"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  게임 종료!
                </motion.h2>
                <motion.p
                  className="text-2xl text-white mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  최종 점수: <span className="font-bold text-yellow-300">{gameState.score}</span>
                </motion.p>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
                  <Button
                    onClick={restartGame}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    다시 시작
                  </Button>
                </motion.div>
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
                key={item.id}
                initial={item.isNew ? { y: -50, opacity: 0 } : { scale: 1 }}
                animate={{
                  scale: item.isMatched
                    ? 0
                    : selectedTile?.row === rowIndex && selectedTile?.col === colIndex
                      ? 1.1
                      : 1,
                  opacity: item.isMatched ? 0 : 1,
                  y: 0,
                  rotate: selectedTile?.row === rowIndex && selectedTile?.col === colIndex ? [0, 5, 0, -5, 0] : 0,
                }}
                transition={{
                  scale: {
                    duration: item.isNew ? 0.3 : 0.2,
                    type: item.isNew ? 'spring' : 'tween',
                    stiffness: 200,
                    damping: 15,
                  },
                  opacity: { duration: item.isNew ? 0.3 : 0.2 },
                  y: { duration: item.isNew ? 0.3 : 0.2 },
                  rotate: {
                    duration: 1,
                    type: 'tween',
                    repeat:
                      selectedTile?.row === rowIndex && selectedTile?.col === colIndex ? Number.POSITIVE_INFINITY : 0,
                  },
                }}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-full 
                  ${itemConfig[item.type].bgColor}
                  ${
                    selectedTile?.row === rowIndex && selectedTile?.col === colIndex
                      ? 'ring-4 ring-white shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                      : 'shadow-md hover:shadow-lg'
                  }
                  cursor-pointer
                  flex items-center justify-center
                  transition-shadow duration-200
                  relative overflow-hidden
                `}
                onClick={() => handleItemClick(rowIndex, colIndex)}
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
                  {createElement(itemConfig[item.type].icon, {
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
          {items.map(({ id, count, icon, name }) => (
            <motion.div
              key={id}
              className={`
        relative flex flex-col flex-1 text-center items-center p-3 rounded-lg cursor-pointer
        ${
          selectedItem === id
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 ring-2 ring-white shadow-lg'
            : 'bg-indigo-800 hover:bg-indigo-700'
        }
        ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}
        transition-all duration-200
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
    </div>
  );
};

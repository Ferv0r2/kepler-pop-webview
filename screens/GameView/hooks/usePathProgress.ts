import { useState, useCallback, useMemo } from 'react';

export interface PathNode {
  id: string;
  type: 'battle' | 'shop' | 'reward' | 'rest' | 'boss';
  name: string;
  description: string;
  icon: string;
  color: string;
  isAvailable: boolean;
  isCompleted: boolean;
  scoreRequired: number;
  rewards?: string[];
}

export interface PathProgress {
  currentPath: string;
  completedPaths: string[];
  availablePaths: PathNode[];
  nextScoreThreshold: number;
  progressPercentage: number;
}

const DEFAULT_PATHS: PathNode[] = [
  {
    id: 'battle_1',
    type: 'battle',
    name: '일반 전투',
    description: '기본적인 타일 매칭 도전',
    icon: '⚔️',
    color: 'text-red-400',
    isAvailable: true,
    isCompleted: false,
    scoreRequired: 0,
    rewards: ['moves', 'items'],
  },
  {
    id: 'shop_1',
    type: 'shop',
    name: '상점',
    description: 'gem으로 아이템을 구매할 수 있습니다',
    icon: '🏪',
    color: 'text-blue-400',
    isAvailable: false,
    isCompleted: false,
    scoreRequired: 5000,
    rewards: ['shop_access'],
  },
  {
    id: 'reward_1',
    type: 'reward',
    name: '보상',
    description: '특별한 보상을 선택할 수 있습니다',
    icon: '🎁',
    color: 'text-yellow-400',
    isAvailable: false,
    isCompleted: false,
    scoreRequired: 10000,
    rewards: ['artifact', 'gem'],
  },
  {
    id: 'rest_1',
    type: 'rest',
    name: '휴식',
    description: '체력을 회복하고 특별한 효과를 얻습니다',
    icon: '💚',
    color: 'text-green-400',
    isAvailable: false,
    isCompleted: false,
    scoreRequired: 15000,
    rewards: ['heal', 'buff'],
  },
  {
    id: 'boss_1',
    type: 'boss',
    name: '보스 전투',
    description: '강력한 보스와의 최종 대결',
    icon: '👑',
    color: 'text-purple-400',
    isAvailable: false,
    isCompleted: false,
    scoreRequired: 25000,
    rewards: ['legendary_artifact', 'boss_reward'],
  },
];

export const usePathProgress = (currentScore: number) => {
  const [completedPaths, setCompletedPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('battle_1');

  const availablePaths = useMemo(() => {
    return DEFAULT_PATHS.map((path) => ({
      ...path,
      isAvailable: path.scoreRequired <= currentScore || completedPaths.includes(path.id),
      isCompleted: completedPaths.includes(path.id),
    }));
  }, [currentScore, completedPaths]);

  const nextScoreThreshold = useMemo(() => {
    const nextPath = availablePaths.find((path) => !path.isCompleted && path.scoreRequired > currentScore);
    return nextPath ? nextPath.scoreRequired : 0;
  }, [availablePaths, currentScore]);

  const progressPercentage = useMemo(() => {
    if (nextScoreThreshold === 0) return 100;
    return Math.min((currentScore / nextScoreThreshold) * 100, 100);
  }, [currentScore, nextScoreThreshold]);

  const completePath = useCallback((pathId: string) => {
    setCompletedPaths((prev) => [...prev, pathId]);
  }, []);

  const advanceToNextPath = useCallback(() => {
    const currentIndex = DEFAULT_PATHS.findIndex((path) => path.id === currentPath);
    if (currentIndex < DEFAULT_PATHS.length - 1) {
      const nextPath = DEFAULT_PATHS[currentIndex + 1];
      if (nextPath.scoreRequired <= currentScore) {
        setCurrentPath(nextPath.id);
        return nextPath;
      }
    }
    return null;
  }, [currentPath, currentScore]);

  const canAdvance = useMemo(() => {
    return nextScoreThreshold > 0 && currentScore >= nextScoreThreshold;
  }, [nextScoreThreshold, currentScore]);

  return {
    currentPath,
    completedPaths,
    availablePaths,
    nextScoreThreshold,
    progressPercentage,
    completePath,
    advanceToNextPath,
    canAdvance,
    setCurrentPath,
  };
};

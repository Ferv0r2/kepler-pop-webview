import type { RewardThreshold } from '@/types/game-types';

export const GRID_SIZE = 8;
export const MIN_MATCH_COUNT = 3;
export const ANIMATION_DURATION = 150;
export const CONFETTI_ANIMATION_DURATION = 500;

export const SHOW_EFFECT_TIME_MS = 1500;
export const SHOW_STREAK_MAINTAIN_TIME_MS = 2500;
export const SHOW_HINT_TIME_MS = 5000;

export const HINT_MOVE_INTERVAL_MS = 10000;

export const TILE_MAX_TIER = 3;

export const CASUAL_MODE_MOVE_COUNT = 30;
export const CHALLENGE_MODE_MOVE_COUNT = 20;

export const DIRECTIONS = [
  [-1, 0], // up
  [1, 0], // down
  [0, -1], // left
  [0, 1], // right
  [-1, -1], // up-left
  [-1, 1], // up-right
  [1, -1], // down-left
  [1, 1], // down-right
];

export const SCORE = 10;

export const COMBO_BONUS = {
  MIN_COMBO: 3,
  MAX_COMBO: 10,
  MAX_BONUS: 5,
} as const;

// 보상 시스템 상수들
export const REWARD_THRESHOLDS: RewardThreshold[] = [
  { score: 2000, moves: 3, items: 2 },
  { score: 5000, moves: 5, items: 3 },
  { score: 10000, moves: 8, items: 5 },
  { score: 20000, moves: 12, items: 6 },
  { score: 50000, moves: 15, items: 8 },
  { score: 100000, moves: 20, items: 10 },
  { score: 200000, moves: 25, items: 12 },
  { score: 500000, moves: 30, items: 15 },
  { score: 1000000, moves: 50, items: 20 },
];

export const REWARD_PROBABILITIES = {
  moves: 0.5,
  items: 0.4,
  artifact: 0.1,
};
export const REWARD_SELECTION_TIMEOUT = 30000; // 30초

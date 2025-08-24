import type { RewardThreshold } from '@/types/game-types';

export const ENERGY_CONSUME_AMOUNT = 5;
export const AD_ENERGY_REWARD_AMOUNT = 10;
export const ENERGY_MAX = 50;

// 부활 시스템 상수들
export const REVIVE_GEM_COST = 5;
export const REVIVE_BONUS_MOVES = 10;

export const GRID_SIZE = 7;
export const MIN_MATCH_COUNT = 3;
// 게임 애니메이션 타이밍 상수
export const ANIMATION_DURATION = {
  TILE_APPEAR: 300, // 타일 나타남 효과
  TILE_DROP: 300, // 타일 떨어짐 효과
  TILE_MATCH: 200, // 타일 매칭 효과
  TILE_SHUFFLE: 600, // 셔플 효과
  MODAL_TRANSITION: 300, // 모달 전환
  BUTTON_HOVER: 200, // 버튼 호버
  PARTICLE_FADE: 800, // 파티클 소멸
  COMBO_PULSE: 1000, // 콤보 펄스
} as const;

export const CONFETTI_ANIMATION_DURATION = 500;

export const SHOW_EFFECT_TIME_MS = 1500;
export const SHOW_STREAK_MAINTAIN_TIME_MS = 2500;
export const SHOW_HINT_TIME_MS = 5000;

export const HINT_MOVE_INTERVAL_MS = 5000;

export const TILE_MAX_TIER = 3;

export const TUTORIAL_TOTAL_STEP = 5;

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

// 보상 시스템 기본 설정
export const REWARD_BASE_CONFIG = {
  BASE_SCORE: 2000,
  SCORE_MULTIPLIER: 2.2,
  BASE_MOVES: 3,
  MOVES_INCREMENT: 2,
  BASE_ITEMS: 2,
  ITEMS_INCREMENT: 1.2,
  BASE_GEM: 1,
  GEM_MULTIPLIER: 1.6,
} as const;

// 레벨 기반 보상 계산 함수
export const calculateRewardThreshold = (level: number): RewardThreshold => {
  const score = Math.floor(REWARD_BASE_CONFIG.BASE_SCORE * Math.pow(REWARD_BASE_CONFIG.SCORE_MULTIPLIER, level - 1));
  const moves = Math.floor(REWARD_BASE_CONFIG.BASE_MOVES + (level - 1) * REWARD_BASE_CONFIG.MOVES_INCREMENT);
  const items = Math.floor(REWARD_BASE_CONFIG.BASE_ITEMS + (level - 1) * REWARD_BASE_CONFIG.ITEMS_INCREMENT);
  const gem = Math.floor(REWARD_BASE_CONFIG.BASE_GEM * Math.pow(REWARD_BASE_CONFIG.GEM_MULTIPLIER, level - 1));

  return { score, moves, items, gem };
};

// 현재 점수에 따른 보상 레벨 계산
export const getRewardLevel = (currentScore: number): number => {
  let level = 1;
  while (calculateRewardThreshold(level).score <= currentScore) {
    level++;
  }
  return level - 1; // 현재 달성한 레벨 반환
};

// 다음 보상까지의 진행률 계산
export const getNextRewardProgress = (
  currentScore: number,
): {
  currentLevel: number;
  nextLevel: number;
  currentThreshold: RewardThreshold;
  nextThreshold: RewardThreshold;
  progressPercent: number;
  remainingScore: number;
} => {
  const currentLevel = getRewardLevel(currentScore);
  const nextLevel = currentLevel + 1;

  const currentThreshold =
    currentLevel === 0 ? { score: 0, moves: 0, items: 0, gem: 0 } : calculateRewardThreshold(currentLevel);
  const nextThreshold = calculateRewardThreshold(nextLevel);

  const scoreRange = nextThreshold.score - currentThreshold.score;
  const progressInRange = currentScore - currentThreshold.score;
  const progressPercent = Math.min(100, Math.max(0, (progressInRange / scoreRange) * 100));
  const remainingScore = Math.max(0, nextThreshold.score - currentScore);

  return {
    currentLevel,
    nextLevel,
    currentThreshold,
    nextThreshold,
    progressPercent,
    remainingScore,
  };
};

// 하위 호환성을 위한 기존 REWARD_THRESHOLDS (첫 9레벨만)
export const REWARD_THRESHOLDS: RewardThreshold[] = Array.from({ length: 9 }, (_, i) =>
  calculateRewardThreshold(i + 1),
);

export const REWARD_PROBABILITIES = {
  moves: 0.4,
  items: 0.3,
  gem: 0.2,
  artifact: 0.1,
};
export const REWARD_SELECTION_TIMEOUT = 30000; // 30초

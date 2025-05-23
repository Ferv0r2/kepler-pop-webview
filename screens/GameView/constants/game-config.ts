export const GRID_SIZE = 8;
export const MIN_MATCH_COUNT = 3;
export const ANIMATION_DURATION = 200;
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

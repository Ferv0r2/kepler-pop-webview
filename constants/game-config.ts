export const GRID_SIZE = 8;
export const MIN_MATCH_COUNT = 3;
export const ANIMATION_DURATION = 200;
export const CONFETTI_ANIMATION_DURATION = 500;

export const SHOW_EFFECT_TIME_MS = 1500;
export const SHOW_STREAK_MAINTAIN_TIME_MS = 2500;
export const SHOW_HINT_TIME_MS = 3000;

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

// Loading screen constants
export const DEFAULT_LOADING_TIME_MS = 2000;
export const LOADING_MESSAGE_INTERVAL_MS = 2000;
export const LOADING_COMPLETE_DELAY_MS = 500;
export const LOADING_ANIMATION_DURATION = 0.5;
export const LOADING_TEXT_ANIMATION_DURATION = 0.3;
export const LOADING_DOTS_ANIMATION_DURATION = 1.2;
export const LOADING_TILE_ANIMATION_DURATION = 0.8;
export const LOADING_TILE_ANIMATION_DELAY = 0.1;

// Loading screen animation delays
export const LOADING_ANIMATION_DELAYS = {
  TITLE: 0.2,
  TILES: 0.4,
  PROGRESS: 0.6,
  TEXT: 0.7,
  TIPS: 0.9,
} as const;

export const COMBO_BONUS = {
  MIN_COMBO: 3,
  MAX_COMBO: 10,
  MAX_BONUS: 5,
} as const;

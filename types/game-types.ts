export type TileType = 1 | 2 | 3 | 4 | 5;
export type TierType = 1 | 2 | 3;
export type GameMode = 'casual' | 'challenge';
export type TileSwapMode = 'drag' | 'select';
export type GridItem = {
  id: string;
  type: TileType;
  isMatched: boolean;
  createdIndex: number;
  turn: number;
  tier: TierType;
};

export type GameState = {
  score: number;
  moves: number;
  isSwapping: boolean;
  isChecking: boolean;
  isGameOver: boolean;
  combo: number;
  turn: number;
  isProcessingMatches: boolean;
};

export type GameItem = {
  id: string;
  count: number;
  icon: string;
};

export type GameItemType = 'shovel' | 'mole' | 'bomb';

export type ItemAnimation = {
  type: GameItemType;
  row: number;
  col: number;
  direction?: 'row' | 'col';
  left?: number;
  top?: number;
};

// 보상 시스템 타입들
export type RewardType = 'moves' | 'items' | 'artifact' | 'gem';

export type Reward = {
  type: RewardType;
  id: string;
  name: string;
  description: string;
  icon: string;
  value: number;
  color: string;
};

export type ArtifactId =
  | 'seed_spore'
  | 'leaf_balance'
  | 'vine_link'
  | 'blossom_burst'
  | 'stellar_broom'
  | 'primal_cleanser'
  | 'starlight_core'
  | 'twin_core'
  | 'comet_blessing'
  // New artifacts
  | 'time_warp'
  | 'chaos_engine'
  | 'crystal_converter'
  | 'mystery_box'
  | 'bomb_enhancer';

export type Artifact = {
  id: ArtifactId;
  name: string;
  description: string;
  effect: ArtifactEffect;
  isActive: boolean;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  obtainedTurn?: number;
};

export type ArtifactEffect = {
  type:
    | 'cost_reduction'
    | 'combo_boost'
    | 'auto_remove'
    | 'score_boost'
    | 'special'
    | 'tile_conversion'
    | 'probability_modifier'
    | 'item_enhancement'
    | 'turn_based'
    | 'one_time'
    | 'passive_bonus'
    | 'movement_modifier'
    | 'gravity_effect'
    | 'vision_effect';
  value: number;
  condition?: string;
  triggerTurn?: number;
  probability?: number;
  duration?: number;
  usesRemaining?: number;
};

export type RewardState = {
  achievedScores: Set<number>;
  activeArtifacts: Artifact[];
  rewardHistory: RewardHistory[];
};

export type RewardHistory = {
  score: number;
  selectedReward: Reward;
  timestamp: Date;
};

export type RewardThreshold = {
  score: number;
  moves: number;
  items: number;
  gem: number;
};

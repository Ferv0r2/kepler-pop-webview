export type TileType = 1 | 2 | 3 | 4 | 5 | 6;
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
  name: string;
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

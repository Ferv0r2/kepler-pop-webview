export type TechTreeCategory = 'movement' | 'items' | 'shuffle' | 'combo' | 'artifacts';
export type EnhancementType =
  | 'extra_moves'
  | 'combo_bonus'
  | 'artifact_chance'
  | 'shuffle_cost_reduction'
  | 'item_efficiency';

export type TechTreeNode = {
  id: string;
  name: string;
  description: string;
  category: TechTreeCategory;
  tier: number;
  maxLevel: number;
  baseCost: number;
  enhancementType: EnhancementType;
  enhancementValue: number;
  prerequisites: string[];
  icon: string;
  color: string;
};

export type UserTechTreeNode = {
  nodeId: string;
  currentLevel: number;
  maxLevel: number;
  nextCost: number;
  canUpgrade: boolean;
  isMaxLevel: boolean;
  totalEffect: number;
  nextLevelEffect: number;
};

export type TechTreeState = {
  allNodes: TechTreeNode[];
  userNodes: UserTechTreeNode[];
  userSkillPoints: number;
  userGems: number;
};

export type GameEnhancementEffects = {
  extraMoves: number;
  comboBonus: number; // 퍼센트
  artifactChance: number; // 퍼센트
  shuffleCostReduction: number; // 퍼센트
  itemEfficiency: number; // 퍼센트
};

export type LevelUpNotification = {
  newLevel: number;
  skillPointsGained: number;
  showNotification: boolean;
};

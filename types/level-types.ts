export interface LevelInfo {
  userId: string;
  level: number;
  currentExp: number;
  expForCurrentLevel: number; // 현재 레벨 달성에 필요했던 경험치
  expForNextLevel: number; // 다음 레벨까지 필요한 경험치
  progressToNext: number; // 다음 레벨까지의 진행률 (0-1)
  totalSkillPoints: number;
  usedSkillPoints: number;
  availableSkillPoints: number;
}

export interface LevelUpdateResponse {
  currentLevel: number;
  currentExp: number;
  expGained: number;
  expForCurrentLevel: number;
  expForNextLevel: number;
  skillPointsGained: number;
  totalSkillPoints: number;
  availableSkillPoints: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface UpdateExpRequest {
  score: number;
}

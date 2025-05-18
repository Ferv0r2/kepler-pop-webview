import { COMBO_BONUS } from '@/screens/GameView/constants/game-config';
import { GridItem } from '@/types/game-types';

export const deepCopyGrid = (grid: GridItem[][]): GridItem[][] => {
  return grid.map((row) => row.map((item) => ({ ...item })));
};

export const calculateComboBonus = (combo: number): number => {
  if (combo < COMBO_BONUS.MIN_COMBO) return 0;
  if (combo >= COMBO_BONUS.MAX_COMBO) return COMBO_BONUS.MAX_BONUS;

  const progress = (combo - COMBO_BONUS.MIN_COMBO) / (COMBO_BONUS.MAX_COMBO - COMBO_BONUS.MIN_COMBO);
  return Math.floor(progress * COMBO_BONUS.MAX_BONUS) + 1;
};

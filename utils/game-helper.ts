import { GridItem } from '@/types/game-types';

export const deepCopyGrid = (grid: GridItem[][]): GridItem[][] => {
  return grid.map((row) => row.map((item) => ({ ...item })));
};

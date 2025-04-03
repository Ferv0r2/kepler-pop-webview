import { GridItem } from '@/types/GameTypes';

export const deepCopyGrid = (grid: GridItem[][]): GridItem[][] => {
  return grid.map((row) => row.map((item) => ({ ...item })));
};

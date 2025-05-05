import type { GameItemType } from './game-types';

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  energy: number;
  gameMoney: number;
  gems: number;
  level: number;
  isAdFree: boolean;
  isSubscribed: boolean;
  locale: string;
  gameItems: Partial<Record<GameItemType, number>>;
  profileImage?: string;
};

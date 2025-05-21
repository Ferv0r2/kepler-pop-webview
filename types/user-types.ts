import type { GameItemType } from './game-types';

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  droplet: number;
  gameMoney: number;
  gem: number;
  score: number;
  level: number;
  exp: number;
  isSubscribed: boolean;
  locale: string;
  gameItems: Partial<Record<GameItemType, number>>;
  profileImage?: string;
};

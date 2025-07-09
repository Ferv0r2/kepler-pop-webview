import type { GameItemType } from './game-types';

export type UserScore = {
  id: string;
  userId: string;
  mode: 'casual' | 'challenge';
  score: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DropletStatus = {
  droplet: number;
  nextChargeAt: number | null;
};

export type UserInfo = {
  id: string;
  nickname: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  droplet: number;
  gameMoney: number;
  gem: number;
  level: number;
  exp: number;
  isSubscribed: boolean;
  locale: string;
  gameItems: Partial<Record<GameItemType, number>>;
  profileImage?: string;
  scores: UserScore[];
};

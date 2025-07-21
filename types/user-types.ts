import type { GameItemType } from './game-types';

export type UserScore = {
  id: string;
  userId: string;
  mode: 'casual' | 'challenge';
  score: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PeriodScore = {
  id: string;
  user: UserInfo;
  userId: string;
  mode: 'casual' | 'challenge';
  periodType: 'daily' | 'weekly' | 'monthly';
  periodStartDate: Date;
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
  skillPoints: number; // 레벨 시스템 추가
  expRequiredForNext: number; // 레벨 시스템 추가
  isSubscribed: boolean;
  locale: string;
  gameItems: Partial<Record<GameItemType, number>>;
  profileImage?: string;
  scores: UserScore[];
  periodScores: PeriodScore[];
};

import { UserInfo } from '@/types/user-types';

export const mockUser: UserInfo = {
  id: '11111111-1111-1111-1111-111111111111',
  nickname: '우주 탐험가',
  email: 'space_explorer@google.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  droplet: 100,
  gameMoney: 100,
  gem: 100,
  level: 1,
  exp: 0,
  isSubscribed: false,
  gameItems: {
    shovel: 3,
    mole: 2,
    bomb: 1,
  },
  profileImage: '/plants/sprout.png',
  scores: [],
  locale: 'ko',
};

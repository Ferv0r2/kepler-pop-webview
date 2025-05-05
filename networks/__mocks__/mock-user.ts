import { UserInfo } from '@/types/user-types';

export const mockUser: UserInfo = {
  id: '11111111-1111-1111-1111-111111111111',
  name: '우주 탐험가',
  email: 'space_explorer@google.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  energy: 100,
  gameMoney: 100,
  gems: 100,
  level: 1,
  isAdFree: false,
  isSubscribed: false,
  gameItems: {
    shovel: 3,
    mole: 2,
    bomb: 1,
  },
  locale: 'ko',
};

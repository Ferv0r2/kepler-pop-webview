import { UserInfo } from '@/types/user-types';

export interface AuthRequest {
  token: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
}

export interface SignInWithGoogleResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

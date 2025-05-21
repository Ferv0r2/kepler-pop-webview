import { UserInfo } from '@/types/user-types';

import { api } from './FetchAPI';
import type { SignInWithGoogleResponse } from './types/auth';

// TODO: Error Handling

export const signInWithGoogle = async (token: string): Promise<SignInWithGoogleResponse> => {
  const response = await api.post('/auth/google', { token });
  if (!response.ok) throw new Error('Failed to login');
  return response.json();
};

export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await api.get('/users/me');
  if (!response.ok) throw new Error('Failed to get user info');
  return response.json();
};

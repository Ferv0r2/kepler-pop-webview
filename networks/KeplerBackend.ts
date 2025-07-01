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

export const getDropletStatus = async (): Promise<{ droplet: number; nextChargeAt: number | null }> => {
  const response = await api.get('/users/me/droplet');
  if (!response.ok) throw new Error('Failed to get droplet status');
  return response.json();
};

export const updateDroplet = async (amount: number): Promise<void> => {
  const response = await api.post('/users/me/droplet/update', { amount });
  if (!response.ok) throw new Error('Failed to update droplet');
};

export const updateScore = async (score: number, mode: 'casual' | 'challenge'): Promise<void> => {
  const response = await api.post('/users/me/score/update', { score, mode });
  if (!response.ok) throw new Error('Failed to update score');
};

export const updateGem = async (amount: number): Promise<void> => {
  const response = await api.post('/users/me/gem/update', { amount });
  if (!response.ok) throw new Error('Failed to update gem');
};

export const updateUserInfo = async (userInfo: Partial<UserInfo>): Promise<void> => {
  const response = await api.post('/users/me/update', userInfo);
  if (!response.ok) throw new Error('Failed to update user info');
};

'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api } from '@/networks/FetchAPI';
import type { AuthRequest, AuthResponse } from '@/networks/types/auth';
import { useAuthStore } from '@/store/authStore';

const authMutation = async (token: string): Promise<AuthResponse> => {
  const response = await api.post<AuthRequest>('/auth/google', { token });
  return await response.json();
};

export default function AuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { setTokens } = useAuthStore();

  const { mutate: handleGoogleLogin, isPending } = useMutation({
    mutationFn: authMutation,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);

      const currentLocale = window.location.pathname.split('/')[1];
      router.replace(`/${currentLocale}`);
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setError('Login failed');
    },
  });

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      setError(null);
      handleGoogleLogin(credentialResponse.credential);
    }
  };

  const handleLoginError = () => {
    setError('Google login failed');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Google 로그인</h1>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} useOneTap />
        </div>
        {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
        {isPending && <p className="mt-4 text-sm text-center text-gray-600">로그인 중...</p>}
      </div>
    </div>
  );
}

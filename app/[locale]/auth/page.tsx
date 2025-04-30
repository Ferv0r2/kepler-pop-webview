'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { api } from '@/networks/FetchAPI';
import type { AuthRequest, AuthResponse } from '@/networks/types/auth';
import { useAuthStore } from '@/store/authStore';

const authMutation = async (token: string): Promise<AuthResponse> => {
  const response = await api.post<AuthRequest>('/auth/google', { token });
  return await response.json();
};

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [error, setError] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<
    Array<{
      width: number;
      height: number;
      left: string;
      top: string;
    }>
  >([]);

  const { setTokens } = useAuthStore();

  useEffect(() => {
    setBubbles(
      [...Array(20)].map(() => ({
        width: Math.random() * 10 + 5,
        height: Math.random() * 10 + 5,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      })),
    );
  }, []);

  const { mutate: handleGoogleLogin, isPending } = useMutation({
    mutationFn: authMutation,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);

      const currentLocale = window.location.pathname.split('/')[1];
      router.replace(`/${currentLocale}`);
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setError(t('loginFailed'));
    },
  });

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      setError(null);
      handleGoogleLogin(credentialResponse.credential);
    }
  };

  const handleLoginError = () => {
    setError(t('loginFailed'));
  };

  return (
    <div className="relative grid grid-rows-[1fr_auto] items-center justify-center min-h-screen overflow-hidden bg-gradient-to-b from-blue-900 to-purple-900">
      <div className="relative w-screen h-full">
        <Image
          src="/banners/loading-banner.png"
          alt="Loading..."
          fill
          className="object-contain w-full h-full"
          priority
          sizes="100vw"
        />
      </div>

      <div className="sticky inset-x-0 bottom-0 p-4 w-full space-y-4 z-10">
        <div className="flex flex-col gap-2 items-center justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              width="100%"
              auto_select={false}
              cancel_on_tap_outside={true}
              prompt_parent_id="google-login-button"
            />
          </motion.div>
          <p className={`text-xs ${error ? 'text-red-500' : 'text-white/80'}`}>
            {error ? error : isPending ? t('loggingIn') : t('pleaseLogin')}
          </p>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/80">{t('termsAndPrivacy')}</p>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        {bubbles.map((bubble, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: bubble.width,
              height: bubble.height,
              left: bubble.left,
              top: bubble.top,
            }}
            animate={{
              y: [0, -1000],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

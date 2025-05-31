'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { signInWithGoogle } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';
import { GoogleIdTokenMessage, NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';

export default function AuthPage() {
  const router = useRouter();
  const [bubbles, setBubbles] = useState<
    Array<{
      width: number;
      height: number;
      left: string;
      top: string;
    }>
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addMessageHandler, sendMessage } = useWebViewBridgeContext();
  const { setTokens } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations('auth');

  const { mutate: handleGoogleLogin } = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: async (data) => {
      const { accessToken, refreshToken, user } = data;
      setTokens(accessToken, refreshToken);
      queryClient.setQueryData(['user'], user);
      const currentLocale = window.location.pathname.split('/')[1];
      router.replace(`/${currentLocale}`);
    },
    onError: (error: unknown) => {
      console.error('Login failed:', error);
      let message = t('loginFailed');
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string' &&
        (error as { message: string }).message.includes('jwt expired')
      ) {
        message = t('sessionExpired');
      }
      setErrorMsg(message);
    },
  });

  useEffect(() => {
    setBubbles(
      [...Array(20)].map(() => ({
        width: Math.random() * 10 + 5,
        height: Math.random() * 10 + 5,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      })),
    );

    sendMessage({
      type: WebToNativeMessageType.NEED_TO_LOGIN,
    });
  }, [sendMessage]);

  useEffect(() => {
    const unsubscribeGoogleIdToken = addMessageHandler<GoogleIdTokenMessage>(
      NativeToWebMessageType.GOOGLE_ID_TOKEN,
      ({ payload }) => {
        if (payload) {
          handleGoogleLogin(payload.token);
        }
      },
    );

    return () => {
      unsubscribeGoogleIdToken();
    };
  }, [addMessageHandler, handleGoogleLogin]);

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
      {errorMsg && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-white/80 text-red-600 px-6 py-3 rounded shadow-lg font-semibold">
          {errorMsg}
        </div>
      )}
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

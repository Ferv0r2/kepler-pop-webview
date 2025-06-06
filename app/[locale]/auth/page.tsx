'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { Logo } from '@/components/logo/Logo';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { StarsAndSparkles } from '@/components/ui/StarsAndSparkles';
import { CHARACTERS } from '@/constants/characters';
import { signInWithGoogle } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';
import { GoogleIdTokenMessage, NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';

export default function AuthPage() {
  const router = useRouter();
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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#0B0C1D] to-[#101340] flex flex-col">
      <StarsAndSparkles />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 mt-16">
        <Logo />
        <p className="text-white/60 text-center font-['Inter'] mt-8">{t('pleaseLogin')}</p>

        <div className="flex flex-row w-64 justify-center items-end gap-6 mb-8 flex-wrap mt-16">
          {CHARACTERS.map((character) => (
            <div key={character.name} className="flex flex-col items-center">
              <Image
                src={character.image}
                alt={character.name}
                width={64}
                height={64}
                className="object-contain drop-shadow-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-white/80 text-red-600 px-6 py-3 rounded-3xl shadow-lg font-semibold"
        >
          {errorMsg}
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { Logo } from '@/components/logo/Logo';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { StarsAndSparkles } from '@/components/ui/StarsAndSparkles';
import { CHARACTERS } from '@/constants/characters';
import { useGTM } from '@/hooks/useGTM';
import { useRouter } from '@/i18n/routing';
import { signInWithGoogle, guestLogin } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';
import { GoogleIdTokenMessage, NativeToWebMessageType } from '@/types/native-call';

export default function AuthPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addMessageHandler } = useWebViewBridgeContext();
  const { setTokens, setGuestTokens, generateDeviceId, validateTokens, deviceId } = useAuthStore();
  const { trackLogin } = useGTM();
  const t = useTranslations('auth');

  const googleLoginWithLocale = async (token: string) => {
    // 현재 URL에서 locale 추출
    const locale = window.location.pathname.split('/')[1] || 'en';
    return signInWithGoogle(token, locale);
  };

  const { mutate: handleGoogleLogin } = useMutation({
    mutationFn: googleLoginWithLocale,
    onSuccess: async (data) => {
      const { accessToken, refreshToken } = data;
      setTokens(accessToken, refreshToken);

      // GTM 로그인 이벤트 전송
      trackLogin('google');

      router.replace('/');
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
      setTimeout(() => {
        setErrorMsg(null);
      }, 3000);
    },
  });

  const { mutate: handleGuestLogin } = useMutation({
    mutationFn: async () => {
      const deviceId = generateDeviceId();
      console.log('🎮 Guest login with deviceId:', deviceId);
      const locale = window.location.pathname.split('/')[1] || 'en';
      return { deviceId, result: await guestLogin(deviceId, locale) };
    },
    onSuccess: async ({ deviceId, result }) => {
      const { accessToken, refreshToken } = result;
      setGuestTokens(accessToken, refreshToken, deviceId);

      // GTM 게스트 로그인 이벤트 전송
      // trackLogin('guest'); // TODO: GTM에서 guest 로그인 타입 지원 시 활성화

      router.replace('/');
    },
    onError: (error: unknown) => {
      console.error('Guest login failed:', error);
      setErrorMsg(t('guestLoginFailed'));
      setTimeout(() => {
        setErrorMsg(null);
      }, 3000);
    },
  });

  // 유효한 토큰이 있으면 자동으로 메인 페이지로 이동
  useEffect(() => {
    const isValidAuth = validateTokens();
    if (isValidAuth) {
      console.log('[AuthPage] Valid auth found, redirecting to home');
      router.replace('/');
      return;
    }

    // sendMessage({
    //   type: WebToNativeMessageType.NEED_TO_LOGIN,
    // });
  }, [validateTokens, router]);

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

        {/* 로그인 버튼들 */}
        <div className="mt-8 flex flex-col gap-4 w-full max-w-sm px-4">
          {/* 게스트 로그인 버튼 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleGuestLogin()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                     text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200
                     flex items-center justify-center gap-3 text-lg"
          >
            <span>🎮</span>
            {deviceId ? t('continueAsGuest') || '게스트로 계속하기' : t('playAsGuest')}
          </motion.button>

          {/* 개발 환경에서만 보이는 구글 로그인 버튼 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="flex flex-col items-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  console.log('Google login successful:', credentialResponse);
                  // ID token을 사용하여 로그인
                  if (credentialResponse.credential) {
                    handleGoogleLogin(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  console.error('Google login failed');
                  setErrorMsg(t('loginFailed'));
                  setTimeout(() => {
                    setErrorMsg(null);
                  }, 3000);
                }}
                theme="filled_blue"
                size="large"
                text="signin_with"
              />
              <p className="text-white/40 text-xs mt-2 text-center">개발 환경에서만 표시됩니다</p>
            </div>
          )}
        </div>

        {/* 게스트 모드 설명 */}
        <div className="mt-6 px-4 max-w-sm">
          <p className="text-white/60 text-sm text-center leading-relaxed">{t('guestDescription')}</p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 w-full max-w-3/4 -translate-x-1/2 z-10 bg-white/80 text-red-600 px-6 py-3 rounded-3xl shadow-lg"
        >
          {errorMsg}
        </motion.div>
      )}
    </div>
  );
}

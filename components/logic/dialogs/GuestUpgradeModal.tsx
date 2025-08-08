'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { migrateGuestToUser, signInWithGoogle } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';
import { GoogleIdTokenMessage, NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';

interface GuestUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
  isDifferentAccountMode?: boolean;
}

export function GuestUpgradeModal({
  isOpen,
  onClose,
  onUpgradeSuccess,
  isDifferentAccountMode = false,
}: GuestUpgradeModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { addMessageHandler, sendMessage } = useWebViewBridgeContext();
  const { accessToken, setTokens } = useAuthStore();
  const t = useTranslations();

  // 간단한 JWT 파서 (payload.type 확인용)
  const parseJwt = (token: string): Record<string, unknown> | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);
      return JSON.parse(jsonPayload) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const { mutate: handleGoogleUpgrade } = useMutation({
    mutationFn: async (googleToken: string) => {
      if (!isDifferentAccountMode && !accessToken) throw new Error('No guest token available');
      const locale = window.location.pathname.split('/')[1] || 'en';

      // 다른 계정 로그인 모드: 현재 토큰이 게스트라면 마이그레이션 우선, 아니면 계정 전환 로그인
      if (isDifferentAccountMode) {
        return signInWithGoogle(googleToken, locale);
      }
      const payload = accessToken ? parseJwt(accessToken) : null;
      const isGuestToken = !!(payload && typeof payload === 'object' && payload['type'] === 'guest');
      if (accessToken && isGuestToken) {
        return migrateGuestToUser(accessToken, googleToken, locale);
      }
      // 일반 업그레이드 플로우
      return migrateGuestToUser(accessToken!, googleToken, locale);
    },
    onSuccess: async (data) => {
      const { accessToken: newAccessToken, refreshToken } = data;
      setTokens(newAccessToken, refreshToken || '', false); // isGuest = false

      // 성공 메시지 표시
      if (isDifferentAccountMode) {
        console.log('✅ Successfully logged in with different account');
        setSuccessMsg(t('auth.loginSuccess'));
      } else {
        console.log('✅ Guest account successfully upgraded to new user account');
        setSuccessMsg(t('auth.migrationSuccess'));
      }
      setIsUpgrading(false);

      // 2초 후 모달 닫기 및 콜백 실행
      setTimeout(() => {
        onUpgradeSuccess();
        onClose();
        setSuccessMsg(null);
      }, 2000);
    },
    onError: (error: unknown) => {
      console.error('Migration failed:', error);

      // 기존 계정 마이그레이션 시도 에러 체크
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string' &&
        (error as { message: string }).message.includes('EXISTING_ACCOUNT_MIGRATION_NOT_ALLOWED')
      ) {
        setErrorMsg(t('auth.existingAccountMigrationBlocked'));
      } else {
        setErrorMsg(isDifferentAccountMode ? t('auth.loginFailed') : t('auth.migrationFailed'));
      }

      setTimeout(() => setErrorMsg(null), 5000); // 기존 계정 에러는 더 오래 표시
      setIsUpgrading(false);
    },
  });

  const handleLoginRequest = () => {
    setIsUpgrading(true);

    // 개발 환경이 아닌 경우에만 네이티브 브릿지 사용
    if (process.env.NODE_ENV !== 'development') {
      // Google 로그인 요청
      sendMessage({
        type: WebToNativeMessageType.NEED_TO_LOGIN,
      });

      // Google ID 토큰 수신 대기
      const unsubscribe = addMessageHandler<GoogleIdTokenMessage>(
        NativeToWebMessageType.GOOGLE_ID_TOKEN,
        ({ payload }) => {
          if (payload) {
            handleGoogleUpgrade(payload.token);
            unsubscribe();
          }
        },
      );
    }
  };

  // 개발 환경에서 Google 로그인 직접 처리
  const handleDirectGoogleLogin = (credentialResponse: { credential?: string }) => {
    setIsUpgrading(true);
    if (credentialResponse.credential) {
      handleGoogleUpgrade(credentialResponse.credential);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="text-4xl mb-4">{isDifferentAccountMode ? '🔄' : '🎮→👤'}</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {isDifferentAccountMode ? t('auth.loginWithDifferentAccount') : t('auth.upgradeAccount')}
            </h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              {isDifferentAccountMode ? t('auth.waitingForInteraction') : t('auth.upgradeToSave')}
            </p>

            <div className="space-y-3">
              {/* 개발 환경에서는 GoogleLogin 컴포넌트 사용 */}
              {process.env.NODE_ENV === 'development' ? (
                <div className="flex flex-col items-center gap-3">
                  {isUpgrading || successMsg ? (
                    <motion.button
                      disabled
                      className="w-full bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed
                               text-white font-semibold py-3 px-6 rounded-xl shadow-lg
                               flex items-center justify-center gap-3"
                    >
                      {successMsg ? (
                        <>
                          <span>✅</span>
                          {t('auth.migrationSuccess')}
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 flex-shrink-0 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('auth.loggingIn')}
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleDirectGoogleLogin}
                      onError={() => {
                        console.error('Google login failed');
                        setErrorMsg(isDifferentAccountMode ? t('auth.loginFailed') : t('auth.migrationFailed'));
                        setTimeout(() => setErrorMsg(null), 3000);
                        setIsUpgrading(false);
                      }}
                      theme="filled_blue"
                      size="large"
                      text="signin_with"
                    />
                  )}
                  <p className="text-slate-400 text-xs text-center">개발 환경에서만 표시됩니다</p>
                </div>
              ) : (
                /* 프로덕션 환경에서는 네이티브 브릿지 사용 */
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoginRequest}
                  disabled={isUpgrading || !!successMsg}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                           disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                           text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200
                           flex items-center justify-center gap-3"
                >
                  {successMsg ? (
                    <>
                      <span>✅</span>
                      {successMsg}
                    </>
                  ) : isUpgrading ? (
                    <>
                      <div className="w-4 h-4 flex-shrink-0 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('auth.waitingForInteraction')}
                    </>
                  ) : (
                    <>
                      <span>{isDifferentAccountMode ? '🔄' : '🔗'}</span>
                      {isDifferentAccountMode ? t('auth.loginWithGoogle') : t('auth.loginWithGoogle')}
                    </>
                  )}
                </motion.button>
              )}

              {/* <button onClick={onClose} className="w-full text-slate-400 hover:text-white py-2 transition-colors">
                {t('modal.cancel')}
              </button> */}
            </div>

            {/* 에러 메시지 */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm"
              >
                <div className="whitespace-pre-line text-center">{errorMsg}</div>
              </motion.div>
            )}

            {/* 성공 메시지 */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <span>✅</span>
                {successMsg}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

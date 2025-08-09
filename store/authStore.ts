import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isGuest: boolean;
  deviceId: string | null;
  userType: 'guest' | 'user' | null;
  setTokens: (accessToken: string, refreshToken: string, isGuest?: boolean, deviceId?: string) => void;
  setGuestTokens: (accessToken: string, refreshToken: string, deviceId: string) => void;
  clearTokens: () => Promise<void>;
  generateDeviceId: () => string;
  validateTokens: () => boolean;
}

const storage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
      // 1. 먼저 Cookie에서 읽기 시도 (미들웨어와 일관성 보장)
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1];

      if (cookieValue) {
        const decodedValue = decodeURIComponent(cookieValue);
        console.log('🍪 Cookie getItem (primary):', name, '→', decodedValue ? 'found' : 'null');
        return decodedValue;
      }

      // 2. Cookie에 없으면 localStorage에서 fallback
      const localStorageValue = localStorage.getItem(name);
      if (localStorageValue) {
        console.log('🏪 localStorage getItem (fallback):', name, '→', 'found');
        // localStorage에서 찾았으면 Cookie에도 동기화
        document.cookie = `${name}=${encodeURIComponent(localStorageValue)}; path=/; max-age=31536000`;
        return localStorageValue;
      }

      console.log('❌ Storage getItem: not found in Cookie or localStorage:', name);
      return null;
    } catch (error) {
      console.warn('⚠️ Storage getItem error:', error);
      return null;
    }
  },

  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      // 1. 먼저 Cookie에 저장 (primary)
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax; Secure`;

      // 2. localStorage에도 백업 저장
      localStorage.setItem(name, value);

      console.log('✅ Storage setItem (Cookie primary + localStorage backup):', name);
    } catch (error) {
      console.warn('⚠️ Storage setItem error:', error);
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      // 1. Cookie 먼저 제거 (primary)
      document.cookie = `${name}=; path=/; max-age=0`;

      // 2. localStorage에서도 제거
      localStorage.removeItem(name);

      console.log('🗑️ Storage removeItem (Cookie + localStorage):', name);
    } catch (error) {
      console.warn('⚠️ Storage removeItem error:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      isGuest: false,
      deviceId: null,
      userType: null,

      setTokens: (accessToken, refreshToken, isGuest = false, deviceId) => {
        const userType = isGuest ? 'guest' : 'user';
        console.log(`🔐 setTokens - type: ${userType}, deviceId: ${deviceId || 'none'}`);
        set({
          accessToken,
          refreshToken,
          isGuest,
          userType,
          deviceId: isGuest ? deviceId || get().deviceId : null,
        });
      },

      setGuestTokens: (accessToken, refreshToken, deviceId) => {
        console.log(`🎮 setGuestTokens - deviceId: ${deviceId}`);
        set({
          accessToken,
          refreshToken,
          isGuest: true,
          userType: 'guest',
          deviceId,
        });
      },
      generateDeviceId: () => {
        const existingDeviceId = get().deviceId;
        if (existingDeviceId) {
          console.log('📱 Using existing deviceId:', existingDeviceId);
          return existingDeviceId;
        }

        const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🆕 Generated new deviceId:', newDeviceId);
        set({ deviceId: newDeviceId });
        return newDeviceId;
      },

      validateTokens: () => {
        const state = get();
        const hasValidPair = !!(state.accessToken && state.refreshToken);
        const hasValidType = ['guest', 'user'].includes(state.userType || '');
        const isValid = hasValidPair && hasValidType;

        console.log(
          `🔍 validateTokens: ${isValid ? '✅ valid' : '❌ invalid'} (type: ${state.userType}, tokens: ${hasValidPair})`,
        );
        return isValid;
      },

      clearTokens: () => {
        return new Promise<void>((resolve) => {
          // 로그아웃 시 모든 상태 초기화
          const currentState = get();
          console.log(`🗑️ Clearing tokens for ${currentState.userType} (deviceId: ${currentState.deviceId})`);

          // 상태 완전 초기화
          set({
            accessToken: null,
            refreshToken: null,
            isGuest: false,
            deviceId: null,
            userType: null,
          });

          // Cookie 우선 정리 후 localStorage 정리 (추가 안전장치)
          if (typeof window !== 'undefined') {
            try {
              // 1. Cookie 먼저 제거 (미들웨어가 즉시 인식하도록)
              document.cookie = 'auth-storage=; path=/; max-age=0';

              // 2. localStorage 제거
              localStorage.removeItem('auth-storage');

              console.log('🧹 추가 스토리지 정리 완료 (Cookie 우선)');

              // 상태 변경 완료를 보장하기 위해 다음 틱에서 resolve
              setTimeout(() => {
                console.log('✅ 토큰 정리 완료');
                resolve();
              }, 100);
            } catch (error) {
              console.warn('⚠️ 스토리지 정리 중 오류:', error);
              resolve();
            }
          } else {
            resolve();
          }
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);

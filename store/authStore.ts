import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isGuest: boolean;
  deviceId: string | null;
  setTokens: (accessToken: string, refreshToken: string, isGuest?: boolean) => void;
  setGuestTokens: (accessToken: string, refreshToken: string, deviceId: string) => void;
  clearTokens: () => void;
  generateDeviceId: () => string;
}

const storage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const result = localStorage.getItem(name);
      console.log('🏪 localStorage getItem:', name, '→', result);
      return result;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
      // 미들웨어를 위해 Cookie에도 동시에 저장
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
      console.log('🏪 localStorage + Cookie setItem:', name);
    } catch {
      // localStorage 사용 불가 시 무시
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
      // Cookie도 함께 제거
      document.cookie = `${name}=; path=/; max-age=0`;
      console.log('🏪 localStorage + Cookie removeItem:', name);
    } catch {
      // localStorage 사용 불가 시 무시
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
      setTokens: (accessToken, refreshToken, isGuest = false) => set({ accessToken, refreshToken, isGuest }),
      setGuestTokens: (accessToken, refreshToken, deviceId) =>
        set({ accessToken, refreshToken, isGuest: true, deviceId }),
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
      clearTokens: () => {
        // 로그아웃 시 deviceId도 함께 초기화하여 새로운 게스트 세션 시작
        const currentState = get();
        console.log('🗑️ Clearing tokens and deviceId for fresh start:', currentState.deviceId);
        set({
          accessToken: null,
          refreshToken: null,
          isGuest: false,
          deviceId: null, // deviceId도 함께 초기화
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);

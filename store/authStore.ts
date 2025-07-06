import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

const storage = {
  getItem: (name: string): string | null => {
    const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
  },
  setItem: (name: string, value: string): void => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
  },
  removeItem: (name: string): void => {
    document.cookie = `${name}=; path=/; max-age=0`;
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearTokens: () => {
        set({ accessToken: null, refreshToken: null });
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-storage=; path=/; max-age=0';
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);

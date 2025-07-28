'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

import { useAuthStore } from '@/store/authStore';
import { initializeLottieAnimations } from '@/utils/lottie-preloader';

// JWT payload 파싱 함수
function parseJwt(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// 토큰 상태 마이그레이션 함수
function migrateTokenState() {
  const { accessToken, refreshToken, clearTokens } = useAuthStore.getState();

  // 토큰이 없으면 마이그레이션 불필요
  if (!accessToken && !refreshToken) return true;

  console.log('[TokenMigration] Starting token state migration...');

  // 1. 토큰 형식 검증
  if (accessToken && !parseJwt(accessToken)) {
    console.log('[TokenMigration] Invalid access token format detected, clearing...');
    clearTokens();
    return false;
  }

  if (refreshToken && !parseJwt(refreshToken)) {
    console.log('[TokenMigration] Invalid refresh token format detected, clearing...');
    clearTokens();
    return false;
  }

  // 2. 만료된 토큰 검증
  if (accessToken && refreshToken) {
    const accessPayload = parseJwt(accessToken);
    const refreshPayload = parseJwt(refreshToken);
    const now = Math.floor(Date.now() / 1000);

    // 두 토큰 모두 만료된 경우
    if (accessPayload?.exp && refreshPayload?.exp && accessPayload.exp < now && refreshPayload.exp < now) {
      console.log('[TokenMigration] Both tokens expired, clearing...');
      clearTokens();
      return false;
    }

    // refresh token만 만료된 경우
    if (refreshPayload?.exp && refreshPayload.exp < now) {
      console.log('[TokenMigration] Refresh token expired, clearing...');
      clearTokens();
      return false;
    }
  }

  // 3. 불완전한 토큰 상태 검증
  if ((accessToken && !refreshToken) || (!accessToken && refreshToken)) {
    console.log('[TokenMigration] Incomplete token state detected, clearing...');
    clearTokens();
    return false;
  }

  console.log('[TokenMigration] Token state migration completed successfully');
  return true;
}

interface GlobalPreloadContextType {
  assetsLoaded: boolean;
  fontsLoaded: boolean;
  allLoaded: boolean;
  loadProgress: number;
  tokenMigrated: boolean;
}

const GlobalPreloadContext = createContext<GlobalPreloadContextType>({
  assetsLoaded: false,
  fontsLoaded: false,
  allLoaded: false,
  loadProgress: 0,
  tokenMigrated: false,
});

export const useGlobalPreloader = () => {
  const context = useContext(GlobalPreloadContext);
  if (!context) {
    throw new Error('useGlobalPreloader must be used within GlobalPreloadProvider');
  }
  return context;
};

interface GlobalPreloadProviderProps {
  children: ReactNode;
}

export function GlobalPreloadProvider({ children }: GlobalPreloadProviderProps) {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [tokenMigrated, setTokenMigrated] = useState(false);
  const [lottieLoaded, setLottieLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // 토큰 마이그레이션 실행
  useEffect(() => {
    const migrationResult = migrateTokenState();
    setTokenMigrated(migrationResult);
    console.log('[GlobalPreloadProvider] Token migration completed:', migrationResult);
  }, []);

  // 폰트 로딩
  const loadFonts = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && 'fonts' in document) {
        const fontPromises = [
          document.fonts.load('400 16px "PixelMplus10"'),
          document.fonts.load('700 16px "PixelMplus10"'),
          document.fonts.load('400 16px "PixelMplus12"'),
          document.fonts.load('700 16px "PixelMplus12"'),
        ];

        await Promise.all(fontPromises);
        setFontsLoaded(true);
        console.log('[GlobalPreloadProvider] Fonts loaded successfully');
      } else {
        setFontsLoaded(true);
      }
    } catch (error) {
      console.warn('[GlobalPreloadProvider] Font loading failed:', error);
      setFontsLoaded(true); // 폰트 로딩 실패해도 진행
    }
  }, []);

  // Lottie 애니메이션 로딩
  const loadLottieAnimations = useCallback(async () => {
    try {
      await initializeLottieAnimations();
      setLottieLoaded(true);
      console.log('[GlobalPreloadProvider] Lottie animations loaded successfully');
    } catch (error) {
      console.warn('[GlobalPreloadProvider] Lottie loading failed:', error);
      setLottieLoaded(true); // 로딩 실패해도 진행
    }
  }, []);

  // 중요 에셋 로딩
  const loadAssets = useCallback(async () => {
    try {
      const assetUrls = ['/icons/logo.png', '/banners/loading-banner.png', '/sounds/effect/button.mp3'];

      const promises = assetUrls.map((url) => {
        if (url.endsWith('.mp3')) {
          return new Promise((resolve) => {
            const audio = new Audio(url);
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', resolve, { once: true });
            audio.load();
          });
        } else {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = url;
          });
        }
      });

      await Promise.all(promises);
      setAssetsLoaded(true);
      console.log('[GlobalPreloadProvider] Assets loaded successfully');
    } catch (error) {
      console.warn('[GlobalPreloadProvider] Asset loading failed:', error);
      setAssetsLoaded(true); // 에셋 로딩 실패해도 진행
    }
  }, []);

  // 로딩 진행률 계산
  useEffect(() => {
    const completed = [tokenMigrated, fontsLoaded, assetsLoaded, lottieLoaded].filter(Boolean).length;
    const total = 4;
    setLoadProgress((completed / total) * 100);
  }, [tokenMigrated, fontsLoaded, assetsLoaded, lottieLoaded]);

  // 초기 로딩 시작
  useEffect(() => {
    loadFonts();
    loadAssets();
    loadLottieAnimations();
  }, [loadFonts, loadAssets, loadLottieAnimations]);

  const allLoaded = tokenMigrated && fontsLoaded && assetsLoaded && lottieLoaded;

  return (
    <GlobalPreloadContext.Provider
      value={{
        assetsLoaded,
        fontsLoaded,
        allLoaded,
        loadProgress,
        tokenMigrated,
      }}
    >
      {children}
    </GlobalPreloadContext.Provider>
  );
}

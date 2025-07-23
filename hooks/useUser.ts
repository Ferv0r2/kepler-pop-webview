import { useQuery } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';

import { getUserInfo, getDropletStatus } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';

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

// 토큰 유효성 검사 및 마이그레이션
function useTokenMigration() {
  const { accessToken, refreshToken, clearTokens } = useAuthStore();
  const migrationChecked = useRef(false);

  useEffect(() => {
    if (migrationChecked.current) return;
    migrationChecked.current = true;

    // 토큰이 없으면 검사할 필요 없음
    if (!accessToken && !refreshToken) return;

    console.log('[TokenMigration] Checking token validity...');

    // 1. 토큰 형식 검증
    if (accessToken && !parseJwt(accessToken)) {
      console.log('[TokenMigration] Invalid access token format, clearing...');
      clearTokens();
      return;
    }

    if (refreshToken && !parseJwt(refreshToken)) {
      console.log('[TokenMigration] Invalid refresh token format, clearing...');
      clearTokens();
      return;
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
        return;
      }

      // refresh token만 만료된 경우
      if (refreshPayload?.exp && refreshPayload.exp < now) {
        console.log('[TokenMigration] Refresh token expired, clearing...');
        clearTokens();
        return;
      }
    }

    // 3. 불완전한 토큰 상태 검증
    if ((accessToken && !refreshToken) || (!accessToken && refreshToken)) {
      console.log('[TokenMigration] Incomplete token state, clearing...');
      clearTokens();
      return;
    }

    console.log('[TokenMigration] Token validation completed successfully');
  }, [accessToken, refreshToken, clearTokens]);
}

// 토큰 자동 갱신 훅
function useTokenRefresh() {
  const { accessToken, refreshToken, setTokens, clearTokens } = useAuthStore();
  const refreshInProgress = useRef(false);

  const refreshTokenIfNeeded = useCallback(async () => {
    if (!accessToken || !refreshToken || refreshInProgress.current) return;

    const payload = parseJwt(accessToken);
    if (!payload?.exp) return;

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // 토큰이 10분 내에 만료될 예정이면 갱신
    if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
      console.log('[useTokenRefresh] Token expires soon, refreshing...');
      refreshInProgress.current = true;

      try {
        // 무한 루프 방지를 위해 FetchAPI 대신 직접 fetch 사용
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const newData = await response.json();
          setTokens(newData.accessToken, newData.refreshToken ?? refreshToken);
          console.log('[useTokenRefresh] Token refreshed successfully');
        } else {
          console.log('[useTokenRefresh] Token refresh failed:', response.status);
          // 401이나 403인 경우 토큰 무효화 및 로그아웃
          if (response.status === 401 || response.status === 403) {
            console.log('[useTokenRefresh] Invalid refresh token, clearing auth');
            clearTokens();
            const currentLocale = window.location.pathname.split('/')[1] || 'en';
            window.location.href = `/${currentLocale}/auth`;
          }
        }
      } catch (error) {
        console.error('[useTokenRefresh] Failed to refresh token:', error);
        // 네트워크 오류 등의 경우 갱신 실패로만 처리하고 로그아웃하지 않음
      } finally {
        refreshInProgress.current = false;
      }
    }
  }, [accessToken, refreshToken, setTokens, clearTokens]);

  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    // 5분마다 토큰 상태 확인
    const interval = setInterval(refreshTokenIfNeeded, 5 * 60 * 1000);

    // 페이지 포커스 시에도 확인
    const handleFocus = () => refreshTokenIfNeeded();
    window.addEventListener('focus', handleFocus);

    // 초기 확인
    refreshTokenIfNeeded();

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshTokenIfNeeded]);
}

export function useUser() {
  const { accessToken } = useAuthStore();

  // 토큰 마이그레이션 실행 (기존 유저 대응)
  useTokenMigration();

  // 토큰 자동 갱신 활성화
  useTokenRefresh();

  return useQuery({
    queryKey: ['user'],
    queryFn: getUserInfo,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDropletStatus() {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['droplet-status'],
    queryFn: getDropletStatus,
    enabled: !!accessToken,
    staleTime: 1000 * 30, // 30초마다 갱신
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
  });
}

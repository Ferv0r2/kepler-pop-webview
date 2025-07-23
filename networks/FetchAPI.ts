import { useAuthStore } from '@/store/authStore';
import { NetworkError } from '@/utils/NetworkError';

class FetchAPI {
  private static instance: FetchAPI;
  private baseUrl: string;
  private refreshAttempts: Map<string, number> = new Map();

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public static getInstance() {
    if (!FetchAPI.instance) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error('NEXT_PUBLIC_API_URL is not defined!');
      FetchAPI.instance = new FetchAPI(apiUrl);
    }
    return FetchAPI.instance;
  }

  public async request(path: string, options: RequestInit = {}) {
    const { accessToken, refreshToken, setTokens, clearTokens } = useAuthStore.getState();

    // 토큰 무결성 사전 검사
    if (accessToken && refreshToken) {
      const refreshKey = `${path}:${Date.now()}`;
      const attempts = this.refreshAttempts.get(refreshKey) || 0;

      // 동일 요청에서 3번 이상 재시도 방지
      if (attempts >= 3) {
        console.log('[FetchAPI] Too many refresh attempts, clearing auth');
        clearTokens();
        const currentLocale = window.location.pathname.split('/')[1] || 'en';
        window.location.href = `/${currentLocale}/auth`;
        throw new NetworkError(401, 'Authentication failed after multiple attempts', undefined);
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    // 토큰 갱신 요청 자체는 재귀 호출하지 않음 (무한 루프 방지)
    if (path === '/auth/refresh') {
      return response;
    }

    if (response.status === 401 && refreshToken) {
      try {
        console.log('[FetchAPI] Access token expired, attempting refresh...');

        // 재시도 카운트 증가
        const refreshKey = `${path}:${Math.floor(Date.now() / 60000)}`; // 1분 윈도우
        const attempts = this.refreshAttempts.get(refreshKey) || 0;
        this.refreshAttempts.set(refreshKey, attempts + 1);

        const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          console.log('[FetchAPI] Refresh token failed:', refreshResponse.status);

          // 429 (Too Many Requests)인 경우 잠시 대기 후 재시도
          if (refreshResponse.status === 429) {
            console.log('[FetchAPI] Rate limited, will retry later');
            throw new NetworkError(429, 'Too many refresh attempts', undefined);
          }

          // 403, 401 또는 다른 오류인 경우에만 로그아웃 처리
          if (refreshResponse.status === 403 || refreshResponse.status === 401 || refreshResponse.status === 400) {
            console.log('[FetchAPI] Refresh token invalid, clearing auth and redirecting');
            clearTokens();
            // 재시도 카운트 정리
            this.refreshAttempts.clear();
            const currentLocale = window.location.pathname.split('/')[1] || 'en';
            window.location.href = `/${currentLocale}/auth`;
          }

          let errorData: unknown = undefined;
          try {
            errorData = await refreshResponse.clone().json();
          } catch {}

          throw new NetworkError(
            refreshResponse.status,
            this.getErrorMessage(errorData, 'Failed to refresh token'),
            errorData,
          );
        }

        const newData = await refreshResponse.json();
        console.log('[FetchAPI] Token refreshed successfully');
        setTokens(newData.accessToken, newData.refreshToken ?? refreshToken);

        // 성공 시 재시도 카운트 리셋
        this.refreshAttempts.delete(refreshKey);

        // 새로운 토큰으로 원래 요청 재시도
        const retryResponse = await fetch(`${this.baseUrl}${path}`, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${newData.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        return retryResponse;
      } catch (error) {
        console.error('[FetchAPI] Token refresh error:', error);
        // 네트워크 오류 등의 경우에는 원래 401 응답 반환
        if (error instanceof NetworkError && error.status !== 403 && error.status !== 401 && error.status !== 400) {
          return response;
        }
        throw error;
      }
    }

    return response;
  }

  public get(path: string) {
    return this.request(path, { method: 'GET' });
  }

  public post<TRequestBody = unknown>(path: string, body: TRequestBody) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public put<TRequestBody = unknown>(path: string, body: TRequestBody) {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public delete(path: string) {
    return this.request(path, { method: 'DELETE' });
  }

  private getErrorMessage(data: unknown, fallback: string): string {
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message?: string }).message === 'string'
    ) {
      return (data as { message: string }).message;
    }
    return fallback;
  }
}

export const api = FetchAPI.getInstance();

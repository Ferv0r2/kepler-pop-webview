import { useAuthStore } from '@/store/authStore';
import { NetworkError } from '@/utils/NetworkError';

class FetchAPI {
  private static instance: FetchAPI;
  private baseUrl: string;

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

  private async request(path: string, options: RequestInit = {}) {
    const { accessToken, refreshToken, setTokens, clearTokens } = useAuthStore.getState();

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 && refreshToken) {
      const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        let errorData: unknown = undefined;
        try {
          errorData = await refreshResponse.clone().json();
        } catch {}
        clearTokens();
        const currentLocale = window.location.pathname.split('/')[1];
        window.location.href = `/${currentLocale}`;
        throw new NetworkError(
          refreshResponse.status,
          this.getErrorMessage(errorData, 'Failed to refresh token'),
          errorData,
        );
      }

      const newData = await refreshResponse.json();
      setTokens(newData.accessToken, newData.refreshToken ?? refreshToken);

      const retryResponse = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newData.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return retryResponse;
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

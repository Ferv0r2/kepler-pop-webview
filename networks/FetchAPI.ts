import { useAuthStore } from '@/store/authStore';

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
        console.error('Failed to refresh token');
        clearTokens();
        window.location.href = '/auth';
        throw new Error('Logged out');
      }

      const newData = await refreshResponse.json();
      setTokens(newData.accessToken, refreshToken);

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
}

export const api = FetchAPI.getInstance();

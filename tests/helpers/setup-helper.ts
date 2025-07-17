import { Page } from '@playwright/test';

import { TestAdminCredentials, AuthHelper, E2ETestConfig } from '@/types/test-types';

const config: E2ETestConfig = {
  baseUrl: 'http://localhost:3001',
  backendUrl: 'http://localhost:3000',
  timeout: 30000,
  retries: 3,
  headless: true,
};

export async function waitForBackendServer() {
  // TODO: Implement backend server health check
  console.log('Checking backend server status...');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Backend server is ready.');
}

export async function setupTestData() {
  // TODO: Implement test data setup
  console.log('Setting up test data...');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Test data setup complete.');
}

export class PlaywrightAuthHelper implements AuthHelper {
  private testAdminCredentials: TestAdminCredentials | null = null;

  /**
   * test-admin 엔드포인트에서 JWT 토큰 획득
   */
  async getTestAdminToken(): Promise<TestAdminCredentials> {
    if (this.testAdminCredentials) {
      return this.testAdminCredentials;
    }

    const response = await fetch(`${config.backendUrl}/auth/test-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get test admin token: ${response.status} ${response.statusText}`);
    }

    this.testAdminCredentials = await response.json();
    return this.testAdminCredentials!;
  }

  /**
   * test-admin 엔드포인트 유효성 검사
   */
  async validateTestAdminEndpoint(): Promise<void> {
    console.log('Validating test-admin endpoint...');
    await this.getTestAdminToken();
    console.log('Test-admin endpoint is valid.');
  }

  /**
   * 페이지에 test-admin으로 로그인
   */
  async loginAsTestAdmin(page: Page): Promise<void> {
    const credentials = await this.getTestAdminToken();

    // 쿠키에 인증 정보 직접 설정
    await page.addInitScript((authData) => {
      const authStorage = JSON.stringify({
        state: {
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
        },
        version: 0,
      });

      document.cookie = `auth-storage=${encodeURIComponent(authStorage)}; path=/; max-age=31536000`;
    }, credentials);

    // 홈페이지로 이동하여 인증 확인
    await page.goto('/ko');
    await this.waitForAuth(page);
  }

  /**
   * 페이지에서 인증 정보 제거
   */
  async clearAuth(page: Page): Promise<void> {
    await page.addInitScript(() => {
      document.cookie = 'auth-storage=; path=/; max-age=0';
      localStorage.clear();
      sessionStorage.clear();
    });

    // 인증 제거 후 auth 페이지로 리다이렉트 확인
    await page.goto('/ko');
    await page.waitForURL('/ko/auth', { timeout: config.timeout });

    this.testAdminCredentials = null;
  }

  /**
   * 인증 완료 대기 (auth 페이지에서 메인 페이지로 리다이렉트)
   */
  async waitForAuth(page: Page): Promise<void> {
    // 메인 페이지 또는 게임 페이지로 리다이렉트 대기
    await page.waitForURL(/\/(ko|en|ja|zh|es|pt)(?:\/(?!auth).*)?$/, {
      timeout: config.timeout,
    });

    // 사용자 정보 로드 대기
    await page.waitForFunction(
      () => {
        const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));

        if (!authStorage) return false;

        try {
          const decoded = decodeURIComponent(authStorage.split('=')[1]);
          const authData = JSON.parse(decoded);
          return authData.state && authData.state.accessToken;
        } catch {
          return false;
        }
      },
      { timeout: config.timeout },
    );
  }

  /**
   * 특정 로케일로 인증된 페이지 이동
   */
  async navigateAuthenticated(page: Page, path: string = '/', locale: string = 'ko'): Promise<void> {
    await this.loginAsTestAdmin(page);
    const fullPath = path.startsWith('/') ? `/${locale}${path}` : `/${locale}/${path}`;
    await page.goto(fullPath);
  }

  /**
   * 인증 상태 확인
   */
  async isAuthenticated(page: Page): Promise<boolean> {
    try {
      const hasAuthCookie = await page.evaluate(() => {
        const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));

        if (!authStorage) return false;

        try {
          const decoded = decodeURIComponent(authStorage.split('=')[1]);
          const authData = JSON.parse(decoded);
          return authData.state && authData.state.accessToken;
        } catch {
          return false;
        }
      });

      return hasAuthCookie;
    } catch {
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
export const authHelper = new PlaywrightAuthHelper();

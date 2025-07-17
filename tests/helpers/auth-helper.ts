import { Page } from '@playwright/test';

export const authHelper = {
  /**
   * test-admin으로 로그인하여 인증된 상태로 설정
   */
  async loginAsTestAdmin(page: Page) {
    // test-admin 엔드포인트 호출로 토큰 획득
    const response = await page.request.post('http://localhost:3000/auth/test-admin');
    const credentials = await response.json();

    if (!credentials.accessToken || !credentials.refreshToken) {
      throw new Error('test-admin 로그인 실패: 토큰을 받을 수 없습니다');
    }

    // 브라우저에 인증 정보 설정
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
  },

  /**
   * 인증 완료 대기 (auth 페이지에서 메인 페이지로 리다이렉트)
   */
  async waitForAuth(page: Page) {
    // 메인 페이지로 리다이렉트 대기 (auth 페이지가 아닌 곳)
    await page.waitForURL(/\/(ko|en|ja|zh|es|pt)(?:\/(?!auth).*)?$/, {
      timeout: 10000,
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
      { timeout: 10000 },
    );
  },

  /**
   * 인증 정보 제거
   */
  async clearAuth(page: Page) {
    await page.addInitScript(() => {
      document.cookie = 'auth-storage=; path=/; max-age=0';
      localStorage.clear();
      sessionStorage.clear();
    });

    // 인증 제거 후 auth 페이지로 리다이렉트 확인
    await page.goto('/ko');
    await page.waitForURL('/ko/auth', { timeout: 10000 });
  },

  /**
   * 인증 상태 확인
   */
  async isAuthenticated(page: Page): Promise<boolean> {
    try {
      return await page.evaluate(() => {
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
    } catch {
      return false;
    }
  },
};

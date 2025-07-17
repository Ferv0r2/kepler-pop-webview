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

    // 인증 정보를 쿠키로 설정하는 초기화 스크립트
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

    // 직접 쿠키 설정으로 인증 상태 보장
    await page.context().addCookies([
      {
        name: 'auth-storage',
        value: encodeURIComponent(
          JSON.stringify({
            state: {
              accessToken: credentials.accessToken,
              refreshToken: credentials.refreshToken,
            },
            version: 0,
          }),
        ),
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // 홈페이지로 이동하여 인증 확인
    await page.goto('/ko');
    await this.waitForAuth(page);
  },

  /**
   * 인증 완료 대기 (auth 페이지에서 메인 페이지로 리다이렉트)
   */
  async waitForAuth(page: Page) {
    // 현재 URL이 auth 페이지인 경우 페이지 새로고침
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      await page.reload({ waitUntil: 'networkidle' });
    }

    // 인증 정보가 있는지 먼저 확인
    const hasAuth = await page.evaluate(() => {
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

    if (!hasAuth) {
      throw new Error('인증 정보가 제대로 설정되지 않았습니다');
    }

    // auth 페이지가 아닌 곳으로 이동될 때까지 대기 (더 관대한 조건)
    try {
      await page.waitForURL(/\/(ko|en|ja|zh|es|pt)(?:\/(?!auth).*)?$/, {
        timeout: 15000,
      });
    } catch (error) {
      // 타임아웃이 발생하면 현재 URL 확인하고 auth가 아니면 통과
      const finalUrl = page.url();
      if (!finalUrl.includes('/auth')) {
        console.log(`URL 대기 타임아웃이지만 auth 페이지가 아님: ${finalUrl}`);
        return;
      }
      throw error;
    }
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
    await page.waitForURL(/\/(ko|en|ja|zh|es|pt)\/auth$/, { timeout: 10000 });
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
          return !!(authData.state && authData.state.accessToken);
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  },
};

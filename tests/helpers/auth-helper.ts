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
    await page.goto('/');
    await this.waitForAuth(page);
  },

  /**
   * 인증 완료 대기 (auth 페이지에서 메인 페이지로 리다이렉트)
   * 모바일 WebView 환경에 최적화된 대기 로직
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

    // 모바일 WebView에서 미들웨어 처리를 위한 충분한 대기
    await page.waitForTimeout(2000);

    // auth 페이지가 아닌 곳으로 이동될 때까지 대기 (더 관대한 조건)
    try {
      await page.waitForURL(/\/(ko|en|ja|zh|es|pt)(?:\/(?!auth).*)?$/, {
        timeout: 20000, // 모바일 환경 고려하여 타임아웃 증가
      });
    } catch (timeoutError) {
      // 타임아웃이 발생하면 현재 URL 확인하고 auth가 아니면 통과
      const finalUrl = page.url();
      if (!finalUrl.includes('/auth')) {
        console.log(`URL 대기 타임아웃이지만 auth 페이지가 아님: ${finalUrl}`);
        return;
      }
      throw timeoutError;
    }

    // 모바일 WebView에서 안정적인 페이지 로딩을 위한 추가 대기
    await this.mobileWaitForStableLoad(page);
  },

  /**
   * 인증 정보 제거
   */
  async clearAuth(page: Page) {
    // 직접 쿠키 제거
    await page.context().clearCookies();

    await page.addInitScript(() => {
      document.cookie = 'auth-storage=; path=/; max-age=0';
      localStorage.clear();
      sessionStorage.clear();
    });

    // 인증 제거 후 auth 페이지로 리다이렉트 확인
    await page.goto('/ko');

    // auth 페이지로 리다이렉트될 때까지 대기 (더 관대한 타임아웃)
    try {
      await page.waitForURL(/\/(ko|en|ja|zh|es|pt)\/auth$/, { timeout: 15000 });
    } catch {
      // 타임아웃이 발생해도 현재 페이지가 auth 관련이면 통과
      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        console.log(`Auth 페이지 리다이렉트 성공 (타임아웃이지만 auth 페이지): ${currentUrl}`);
        return;
      }
      throw new Error(`Auth 페이지로 리다이렉트되지 않음: ${currentUrl}`);
    }
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

  /**
   * 게임 페이지에서 나타날 수 있는 모든 모달들을 닫습니다
   */
  async closeGameModals(page: Page): Promise<void> {
    // 먼저 페이지가 안정화될 때까지 대기
    await page.waitForTimeout(2000);

    try {
      // 1. 튜토리얼 모달 닫기 (가장 우선순위)
      const tutorialModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'tutorial.title' });
      if (await tutorialModal.isVisible({ timeout: 3000 })) {
        console.log('튜토리얼 모달 발견됨');

        // X 버튼 클릭 시도
        const tutorialCloseButton = tutorialModal
          .locator('button')
          .filter({ has: page.locator('svg') })
          .first();
        if (await tutorialCloseButton.isVisible({ timeout: 2000 })) {
          await this.mobileTab(page, 'button:has(svg)');
          await page.waitForTimeout(1000);
          console.log('튜토리얼 모달 X 버튼으로 닫음');
        } else {
          // "시작하기" 버튼 클릭으로 튜토리얼 완료
          const startPlayingButton = tutorialModal.locator('button').filter({ hasText: /시작|start|playing/i });
          if (await startPlayingButton.isVisible({ timeout: 2000 })) {
            await this.mobileTab(page, 'button:has-text("시작"), button:has-text("start"), button:has-text("playing")');
            await page.waitForTimeout(1000);
            console.log('튜토리얼 모달 시작하기 버튼으로 닫음');
          }
        }
      }
    } catch {
      console.log('튜토리얼 모달 처리 중 오류 (정상적일 수 있음)');
    }

    try {
      // 2. 보상 모달 닫기
      const rewardModal = page.locator('.fixed.inset-0').filter({ hasText: /reward|보상/i });
      if (await rewardModal.isVisible({ timeout: 2000 })) {
        console.log('보상 모달 발견됨');

        // 첫 번째 보상 선택
        const rewardItems = rewardModal
          .locator('button, [role="button"]')
          .filter({ hasText: /gem|droplet|젬|물방울/i });
        if (await rewardItems.first().isVisible({ timeout: 1000 })) {
          await this.mobileTab(page, 'button:has-text("gem"), button:has-text("droplet")');
          await page.waitForTimeout(1000);
          console.log('보상 모달 보상 선택으로 닫음');
        }
      }
    } catch {
      console.log('보상 모달 처리 중 오류 (정상적일 수 있음)');
    }

    try {
      // 3. 일반적인 X 버튼으로 모든 모달 닫기
      const closeButtons = page
        .locator('button')
        .filter({ has: page.locator('svg') })
        .filter({ hasText: '' });
      const closeButtonCount = await closeButtons.count();
      for (let i = 0; i < Math.min(closeButtonCount, 3); i++) {
        // 최대 3개까지만 처리
        const button = closeButtons.nth(i);
        if (await button.isVisible({ timeout: 1000 })) {
          await this.mobileTab(page, `button >> nth=${i}`);
          await page.waitForTimeout(500);
          console.log(`일반 닫기 버튼 ${i + 1} 클릭됨`);
        }
      }
    } catch {
      console.log('일반 모달 닫기 중 오류 (정상적일 수 있음)');
    }

    try {
      // 4. 모달 배경 클릭으로 닫기 (최후 수단)
      const modalBackdrops = page.locator('.fixed.inset-0').filter({ hasText: '' });
      const backdropCount = await modalBackdrops.count();
      if (backdropCount > 0) {
        const backdrop = modalBackdrops.first();
        if (await backdrop.isVisible({ timeout: 1000 })) {
          // 모달 배경의 가장자리 클릭 (모달 내용이 아닌)
          await backdrop.click({ position: { x: 50, y: 50 }, force: true });
          await page.waitForTimeout(500);
          console.log('모달 배경 클릭으로 닫음');
        }
      }
    } catch {
      console.log('배경 클릭 처리 중 오류 (정상적일 수 있음)');
    }

    // 모든 모달 처리 후 안정화 대기
    await page.waitForTimeout(2000);
    console.log('모든 모달 처리 완료');
  },

  /**
   * 튜토리얼을 완료 상태로 설정합니다 (localStorage 및 실시간 설정)
   */
  async skipTutorial(page: Page): Promise<void> {
    // 페이지 로드 전 초기화 스크립트로 설정
    await page.addInitScript(() => {
      const gameSettings = {
        hasSeenTutorial: true,
        tileSwapMode: 'drag',
      };
      localStorage.setItem('game-settings', JSON.stringify(gameSettings));

      // 전역 객체에도 설정하여 React 컴포넌트에서 즉시 인식
      (window as Window & { __testSkipTutorial?: boolean }).__testSkipTutorial = true;
    });

    // 페이지 로드 후에도 한 번 더 설정
    await page.evaluate(() => {
      const gameSettings = {
        hasSeenTutorial: true,
        tileSwapMode: 'drag',
      };
      localStorage.setItem('game-settings', JSON.stringify(gameSettings));

      // React 상태도 업데이트하도록 이벤트 발생
      window.dispatchEvent(new CustomEvent('tutorialSkipped', { detail: { hasSeenTutorial: true } }));
    });

    console.log('튜토리얼 스킵 설정 완료');
  },

  /**
   * 모바일 WebView 최적화된 터치 이벤트 헬퍼 함수들
   */

  /**
   * 모바일에 적합한 터치 탭 수행
   */
  async mobileTab(page: Page, selector: string, options?: { timeout?: number }) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: options?.timeout || 10000 });

    // 모바일 터치 시뮬레이션
    await element.click({
      force: true, // 오버레이 무시
      timeout: options?.timeout || 10000,
    });

    // 모바일 반응 시간 대기
    await page.waitForTimeout(500);
  },

  /**
   * 스와이프 제스처 시뮬레이션 (터치 기반)
   */
  async mobileSwipe(page: Page, startSelector: string, endSelector: string, options?: { timeout?: number }) {
    const startElement = page.locator(startSelector);
    const endElement = page.locator(endSelector);

    await startElement.waitFor({ state: 'visible', timeout: options?.timeout || 10000 });
    await endElement.waitFor({ state: 'visible', timeout: options?.timeout || 10000 });

    // 터치 기반 드래그 앤 드롭
    await startElement.dragTo(endElement, {
      force: true,
      timeout: options?.timeout || 10000,
    });

    // 모바일 제스처 완료 대기
    await page.waitForTimeout(800);
  },

  /**
   * 롱 프레스 시뮬레이션
   */
  async mobileLongPress(page: Page, selector: string, options?: { timeout?: number; duration?: number }) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: options?.timeout || 10000 });

    // 롱 프레스 시뮬레이션 (마우스 다운 -> 대기 -> 마우스 업)
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(options?.duration || 800); // 기본 800ms 롱 프레스
      await page.mouse.up();
    }

    await page.waitForTimeout(300);
  },

  /**
   * 모바일 환경에 최적화된 대기시간 설정
   */
  async mobileWaitForStableLoad(page: Page, options?: { timeout?: number }) {
    try {
      // 모바일 네트워크 고려한 안정적 로딩 대기
      await page.waitForLoadState('networkidle', { timeout: options?.timeout || 15000 });
    } catch {
      console.log('NetworkIdle 대기 타임아웃, DOM 로딩 완료만 확인');
      // networkidle이 실패하면 최소한 DOM 로딩은 확인
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    }

    // 모바일 렌더링 완료 대기 (단축)
    await page.waitForTimeout(800);

    try {
      // JavaScript 실행 완료 대기 (타임아웃 추가)
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 });
    } catch {
      console.log('Document readyState 대기 타임아웃, 계속 진행');
    }
  },

  /**
   * 모바일 스크롤 헬퍼
   */
  async mobileScroll(page: Page, direction: 'up' | 'down' | 'left' | 'right', distance: number = 300) {
    const viewport = page.viewportSize();
    if (!viewport) return;

    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    const startX = centerX;
    const startY = centerY;
    let endX = centerX;
    let endY = centerY;

    switch (direction) {
      case 'up':
        endY = centerY - distance;
        break;
      case 'down':
        endY = centerY + distance;
        break;
      case 'left':
        endX = centerX - distance;
        break;
      case 'right':
        endX = centerX + distance;
        break;
    }

    // 터치 스크롤 시뮬레이션
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();

    // 스크롤 완료 대기
    await page.waitForTimeout(500);
  },
};

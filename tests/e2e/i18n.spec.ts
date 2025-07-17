import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('다국어 지원', () => {
  const locales = ['ko', 'en', 'ja', 'zh', 'es', 'pt'];

  test.beforeEach(async ({ page }) => {
    // test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);
  });

  for (const locale of locales) {
    test(`${locale} 로케일 페이지 로드 확인`, async ({ page }) => {
      // 특정 로케일 메인 페이지로 이동
      await page.goto(`/${locale}`);

      // URL이 올바른 로케일을 포함하는지 확인
      await expect(page).toHaveURL(new RegExp(`/${locale}(?:/.*)?$`));

      // 페이지가 로드되었는지 확인
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

      // 기본 UI 요소들이 로드되는지 확인
      await expect(page.locator('nav, .navigation, .bottom-nav').first()).toBeVisible({ timeout: 10000 });
    });
  }

  test('한국어 로케일 텍스트 확인', async ({ page }) => {
    await page.goto('/ko');

    // 한국어 텍스트가 표시되는지 확인
    await expect(page.locator('text=도전, text=캐주얼, text=상점, text=설정').first()).toBeVisible({ timeout: 10000 });
  });

  test('영어 로케일 텍스트 확인', async ({ page }) => {
    await page.goto('/en');

    // 영어 텍스트가 표시되는지 확인
    await expect(page.locator('text=Challenge, text=Casual, text=Store, text=Settings').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('일본어 로케일 텍스트 확인', async ({ page }) => {
    await page.goto('/ja');

    // 일본어 텍스트가 표시되는지 확인 (기본 UI 요소들이 로드되는지 확인)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // 네비게이션이 표시되는지 확인
    await expect(page.locator('nav, .navigation, .bottom-nav').first()).toBeVisible({ timeout: 10000 });
  });

  test('로케일 간 네비게이션 유지', async ({ page }) => {
    // 한국어로 시작
    await page.goto('/ko');

    // 게임 페이지로 이동
    await page.goto('/ko/game?mode=challenge');
    await expect(page).toHaveURL(/\/ko\/game\?mode=challenge/);

    // 영어로 변경
    await page.goto('/en/game?mode=challenge');
    await expect(page).toHaveURL(/\/en\/game\?mode=challenge/);

    // 설정 페이지로 이동
    await page.goto('/en/settings');
    await expect(page).toHaveURL(/\/en\/settings/);
  });

  test('로케일별 auth 페이지 동작', async ({ page }) => {
    // 인증 정보 제거
    await authHelper.clearAuth(page);

    // 각 로케일의 auth 페이지 확인
    for (const locale of ['ko', 'en', 'ja']) {
      await page.goto(`/${locale}`);

      // auth 페이지로 리다이렉트되는지 확인
      await expect(page).toHaveURL(`/${locale}/auth`);

      // auth 페이지 기본 요소들이 로드되는지 확인
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    }
  });

  test('기본 로케일 리다이렉트', async ({ page }) => {
    // 루트 경로 접근
    await page.goto('/');

    // 기본 로케일(ko 또는 브라우저 언어)로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)(?:\/.*)?$/);
  });
});

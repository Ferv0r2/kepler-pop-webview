import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('인증 플로우', () => {
  test('test-admin 자동 로그인 성공', async ({ page }) => {
    // test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);

    // 메인 페이지에 있는지 확인
    await expect(page).toHaveURL(/\/ko(?:\/.*)?$/);

    // 인증 상태 확인
    const isAuth = await authHelper.isAuthenticated(page);
    expect(isAuth).toBe(true);

    // 사용자 정보가 표시되는지 확인 (gem, droplet 정보)
    await expect(page.locator('[data-testid="user-gem"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="user-droplet"]')).toBeVisible({ timeout: 10000 });
  });

  test('인증 없이 protected 페이지 접근 시 auth로 리다이렉트', async ({ page }) => {
    // 인증 정보 없이 메인 페이지 접근
    await page.goto('/ko');

    // auth 페이지로 리다이렉트되는지 확인 (로케일은 유연하게)
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/auth$/);

    // 로그인 안내 텍스트 확인
    await expect(page.locator('text=로그인, text=Login, text=ログイン').first()).toBeVisible();
  });

  test('로그아웃 후 auth 페이지로 리다이렉트', async ({ page }) => {
    // test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);

    // 인증된 상태 확인
    expect(await authHelper.isAuthenticated(page)).toBe(true);

    // 인증 정보 제거 (로그아웃)
    await authHelper.clearAuth(page);

    // auth 페이지로 리다이렉트되는지 확인 (로케일은 유연하게)
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/auth$/);

    // 인증 상태가 제거되었는지 확인
    expect(await authHelper.isAuthenticated(page)).toBe(false);
  });
});

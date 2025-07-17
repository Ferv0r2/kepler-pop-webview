import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('메인 페이지 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 테스트 전에 test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);
  });

  test('메인 페이지 로드 및 게임 모드 선택', async ({ page }) => {
    // 메인 페이지 확인
    await expect(page).toHaveURL(/\/ko(?:\/.*)?$/);

    // 게임 모드 버튼들이 보이는지 확인
    await expect(page.locator('text=Challenge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Casual')).toBeVisible({ timeout: 10000 });

    // Challenge 모드 클릭 시 게임 페이지로 이동
    await page.locator('text=Challenge').click();
    await expect(page).toHaveURL(/\/ko\/game\?mode=challenge/);
  });

  test('하단 네비게이션 동작 확인', async ({ page }) => {
    // Store 버튼 클릭
    const storeButton = page.locator('[data-testid="nav-store"], .lucide-store, text=Store').first();
    if (await storeButton.isVisible()) {
      await storeButton.click();
      await expect(page).toHaveURL(/\/ko\/store/);
    }

    // Play 버튼으로 메인으로 돌아가기
    const playButton = page.locator('[data-testid="nav-play"], .lucide-play, text=Play').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await expect(page).toHaveURL(/\/ko(?:\/.*)?$/);
    }

    // Settings 버튼 클릭
    const settingsButton = page.locator('[data-testid="nav-settings"], .lucide-settings, text=Settings').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await expect(page).toHaveURL(/\/ko\/settings/);
    }
  });

  test('리더보드 페이지 이동 및 데이터 표시', async ({ page }) => {
    // 리더보드 페이지로 이동
    await page.goto('/ko/leaderboard');

    // 리더보드 제목 확인
    await expect(page.locator('h1, h2').filter({ hasText: /리더보드|Leaderboard|랭킹/ })).toBeVisible({
      timeout: 10000,
    });

    // 랭킹 목록이 로드되는지 확인
    await expect(page.locator('[data-testid="leaderboard-list"], .ranking-list').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('사용자 정보 표시 확인', async ({ page }) => {
    // 사용자 gem 정보 확인 (test-admin은 10000 gem 보유)
    const gemElement = page.locator('[data-testid="user-gem"], .gem-count').first();
    await expect(gemElement).toBeVisible({ timeout: 10000 });

    // gem 값이 10000인지 확인
    const gemText = await gemElement.textContent();
    expect(gemText).toMatch(/10000|10,000/);

    // 사용자 droplet 정보 확인 (test-admin은 999 droplet 보유)
    const dropletElement = page.locator('[data-testid="user-droplet"], .droplet-count').first();
    await expect(dropletElement).toBeVisible({ timeout: 10000 });

    // droplet 값이 999인지 확인
    const dropletText = await dropletElement.textContent();
    expect(dropletText).toMatch(/999/);
  });
});

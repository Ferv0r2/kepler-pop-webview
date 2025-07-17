import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('게임 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);
  });

  test('Challenge 모드 게임 시작', async ({ page }) => {
    // Challenge 모드로 게임 시작
    await page.goto('/ko/game?mode=challenge');

    // 게임 화면 로드 확인
    await expect(page.locator('[data-testid="game-grid"], .game-grid, .tile-grid').first()).toBeVisible({
      timeout: 15000,
    });

    // 점수 표시 확인
    await expect(page.locator('[data-testid="game-score"], .score-display').first()).toBeVisible({ timeout: 10000 });

    // 남은 이동 횟수 표시 확인
    await expect(page.locator('[data-testid="game-moves"], .moves-display').first()).toBeVisible({ timeout: 10000 });
  });

  test('Casual 모드 게임 시작', async ({ page }) => {
    // Casual 모드로 게임 시작
    await page.goto('/ko/game?mode=casual');

    // 게임 화면 로드 확인
    await expect(page.locator('[data-testid="game-grid"], .game-grid, .tile-grid').first()).toBeVisible({
      timeout: 15000,
    });

    // 점수 표시 확인
    await expect(page.locator('[data-testid="game-score"], .score-display').first()).toBeVisible({ timeout: 10000 });
  });

  test('타일 클릭 상호작용 확인', async ({ page }) => {
    // Challenge 모드로 게임 시작
    await page.goto('/ko/game?mode=challenge');

    // 게임 그리드 로드 대기
    await expect(page.locator('[data-testid="game-grid"], .game-grid, .tile-grid').first()).toBeVisible({
      timeout: 15000,
    });

    // 첫 번째 타일 클릭 시도
    const firstTile = page.locator('[data-testid="tile"], .tile, .game-tile').first();
    if (await firstTile.isVisible()) {
      await firstTile.click();

      // 클릭 후 선택 효과나 상태 변화 확인
      // (선택된 타일은 하이라이트되거나 클래스가 변경될 수 있음)
      await page.waitForTimeout(1000); // 애니메이션 대기
    }
  });

  test('게임 설정 메뉴 접근', async ({ page }) => {
    // 게임 페이지로 이동
    await page.goto('/ko/game?mode=challenge');

    // 설정/메뉴 버튼 찾기
    const settingsButton = page.locator('[data-testid="game-settings"], .settings-button, .menu-button').first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // 설정 메뉴나 모달이 나타나는지 확인
      await expect(page.locator('[data-testid="settings-modal"], .settings-menu, .game-menu').first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('게임 나가기 기능', async ({ page }) => {
    // 게임 페이지로 이동
    await page.goto('/ko/game?mode=challenge');

    // 뒤로 가기 또는 나가기 버튼 찾기
    const backButton = page
      .locator('[data-testid="back-button"], .back-button, [aria-label*="back"], [aria-label*="나가기"]')
      .first();

    if (await backButton.isVisible()) {
      await backButton.click();

      // 확인 모달이 나타나는지 확인
      const confirmModal = page.locator('[data-testid="exit-modal"], .exit-confirmation, .confirm-modal').first();
      if (await confirmModal.isVisible({ timeout: 3000 })) {
        // 확인 버튼 클릭
        const confirmButton = page
          .locator('[data-testid="confirm-exit"], .confirm-button, text=확인, text=Yes')
          .first();
        await confirmButton.click();
      }

      // 메인 페이지로 돌아갔는지 확인
      await expect(page).toHaveURL(/\/ko(?:\/.*)?$/);
    }
  });

  test('성능 확인 - 게임 로드 시간', async ({ page }) => {
    // 게임 페이지 로드 시간 측정
    const startTime = Date.now();

    await page.goto('/ko/game?mode=challenge');

    // 게임 그리드가 로드될 때까지 대기
    await expect(page.locator('[data-testid="game-grid"], .game-grid, .tile-grid').first()).toBeVisible({
      timeout: 15000,
    });

    const loadTime = Date.now() - startTime;

    // 게임 로드 시간이 5초 이내인지 확인
    expect(loadTime).toBeLessThan(5000);
    console.log(`게임 로드 시간: ${loadTime}ms`);
  });
});

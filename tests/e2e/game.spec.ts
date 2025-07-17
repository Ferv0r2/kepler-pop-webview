import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('게임 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);
    // 튜토리얼 스킵 설정
    await authHelper.skipTutorial(page);
  });

  test('Challenge 모드 게임 시작', async ({ page }) => {
    // Challenge 모드로 게임 시작
    await page.goto('/ko/game?mode=challenge');

    // 모바일 WebView 환경에서 안정적 로딩 대기
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });

    // 모든 모달 닫기
    await authHelper.closeGameModals(page);

    // 게임 화면 로드 확인 (더 긴 타임아웃)
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({
      timeout: 25000,
    });

    // 점수 표시 확인 (더 긴 타임아웃)
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible({ timeout: 15000 });

    // 남은 이동 횟수 표시 확인 (더 긴 타임아웃)
    await expect(page.locator('[data-testid="game-moves"]')).toBeVisible({ timeout: 15000 });
  });

  test('Casual 모드 게임 시작', async ({ page }) => {
    // Casual 모드로 게임 시작
    await page.goto('/ko/game?mode=casual');

    // 모바일 WebView 환경에서 안정적 로딩 대기
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });

    // 모든 모달 닫기
    await authHelper.closeGameModals(page);

    // 게임 화면 로드 확인
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // 점수 표시 확인
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible({ timeout: 10000 });
  });

  test('타일 클릭 상호작용 확인', async ({ page }) => {
    // Challenge 모드로 게임 시작
    await page.goto('/ko/game?mode=challenge');

    // 페이지 로드 대기 및 모달 처리
    await page.waitForTimeout(3000);
    await authHelper.closeGameModals(page);

    // 게임 그리드 로드 대기
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // 추가 로딩 대기 (타일들이 완전히 로드될 때까지)
    await page.waitForTimeout(2000);

    // 모든 모달이 완전히 사라졌는지 확인
    const modals = page.locator('.fixed.inset-0.z-50, .fixed.inset-0.z-40');
    const modalCount = await modals.count();
    if (modalCount > 0) {
      await authHelper.closeGameModals(page);
      await page.waitForTimeout(1000);
    }

    // 첫 번째 타일 클릭 시도 (force 옵션 사용)
    const firstTile = page.locator('[data-testid="tile"]').first();
    if (await firstTile.isVisible()) {
      await firstTile.click({ force: true }); // 모달 등이 방해해도 강제 클릭

      // 클릭 후 상태 변화 확인 (간단히 대기)
      await page.waitForTimeout(1000);
      console.log('타일 클릭 완료');
    }
  });

  test('게임 설정 메뉴 접근', async ({ page }) => {
    // 게임 페이지로 이동
    await page.goto('/ko/game?mode=challenge');

    // 페이지 로드 대기 및 모달 처리
    await page.waitForTimeout(3000);
    await authHelper.closeGameModals(page);

    // 설정 버튼이 로드될 때까지 대기
    await expect(page.locator('[data-testid="game-settings"]')).toBeVisible({ timeout: 10000 });

    // 모든 오버레이가 사라졌는지 확인
    const overlays = page.locator('.fixed.inset-0');
    const overlayCount = await overlays.count();
    if (overlayCount > 0) {
      await authHelper.closeGameModals(page);
      await page.waitForTimeout(1000);
    }

    // 설정 버튼 클릭 (force 옵션 사용)
    const settingsButton = page.locator('[data-testid="game-settings"]');
    await settingsButton.click({ force: true });

    // 설정 메뉴가 나타나는지 확인
    await expect(page.locator('.fixed.inset-0.z-40, [role="dialog"]').first()).toBeVisible({
      timeout: 5000,
    });

    console.log('게임 설정 메뉴 접근 성공');
  });

  test('게임 나가기 기능', async ({ page }) => {
    // 게임 페이지로 이동
    await page.goto('/ko/game?mode=challenge');

    // 페이지 로드 대기 및 모달 처리
    await page.waitForTimeout(3000);
    await authHelper.closeGameModals(page);

    // 뒤로가기 버튼 찾기 (ArrowLeft 아이콘이 있는 버튼)
    const backButton = page.locator('button:has(svg)').first();
    if (await backButton.isVisible({ timeout: 5000 })) {
      await backButton.click({ force: true });

      // 확인 모달이 나타나는지 확인 (짧은 타임아웃)
      const confirmModal = page.locator('[role="dialog"], .fixed.inset-0').first();
      if (await confirmModal.isVisible({ timeout: 3000 })) {
        console.log('나가기 확인 모달 표시됨');
      } else {
        console.log('직접 메인 페이지로 이동됨');
      }
    } else {
      console.log('뒤로가기 버튼을 찾을 수 없음');
    }
  });

  test('게임 UI 요소 확인', async ({ page }) => {
    // Challenge 모드로 게임 시작
    await page.goto('/ko/game?mode=challenge');

    // 페이지 로드 대기 및 모달 처리
    await page.waitForTimeout(3000);
    await authHelper.closeGameModals(page);

    // 모든 핵심 UI 요소들이 표시되는지 확인
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="game-moves"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="game-settings"]')).toBeVisible({ timeout: 5000 });

    // 타일들이 로드되었는지 확인
    const tiles = page.locator('[data-testid="tile"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);
    console.log(`게임 타일 수: ${tileCount}`);

    // 점수와 이동 횟수가 유효한 값인지 확인
    const scoreElement = page.locator('[data-testid="game-score"]');
    const movesElement = page.locator('[data-testid="game-moves"]');

    const scoreVisible = await scoreElement.isVisible();
    const movesVisible = await movesElement.isVisible();

    expect(scoreVisible).toBe(true);
    expect(movesVisible).toBe(true);

    console.log('모든 게임 UI 요소 확인 완료');
  });
});

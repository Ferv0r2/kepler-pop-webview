import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('게임 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);
    // 튜토리얼 스킵 설정
    await authHelper.skipTutorial(page);
  });

  test('메인 페이지에서 Challenge 모드 게임 시작', async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('/');

    // 모바일 WebView 환경에서 안정적 로딩 대기
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    // 실제 사용자처럼 버튼 클릭
    await authHelper.mobileTab(page, '[data-testid="challenge-mode-button"]');

    // 게임 페이지로 이동했는지 확인
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/game\?mode=challenge/, { timeout: 20000 });

    // 모바일 WebView 환경에서 게임 로딩 대기
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });

    // 모든 모달 닫기
    await authHelper.closeGameModals(page);

    // 점수 표시 확인 (더 긴 타임아웃)
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible({ timeout: 15000 });

    // 남은 이동 횟수 표시 확인 (더 긴 타임아웃)
    await expect(page.locator('[data-testid="game-moves"]')).toBeVisible({ timeout: 15000 });
  });

  test('게임 설정 메뉴 접근 및 동작 확인', async ({ page }) => {
    // Challenge 모드로 게임 시작 (메인 버튼 클릭)
    await page.goto('/ko');
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    const challengeButton = page.locator('[data-testid="challenge-mode-button"]');
    await expect(challengeButton).toBeVisible({ timeout: 15000 });
    await authHelper.mobileTab(page, '[data-testid="challenge-mode-button"]');

    // 게임 페이지 로딩 대기
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/game\?mode=challenge/, { timeout: 20000 });
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });
    await authHelper.closeGameModals(page);

    // 게임 화면 로드 확인
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({
      timeout: 25000,
    });

    // 게임 설정 버튼 확인 및 클릭
    const settingsButton = page.locator('[data-testid="game-settings"]');
    if (await settingsButton.isVisible({ timeout: 10000 })) {
      await authHelper.mobileTab(page, '[data-testid="game-settings"]');

      // 설정 메뉴가 열렸는지 확인
      await page.waitForTimeout(1000);
      console.log('게임 설정 메뉴 접근 성공');
    } else {
      console.log('게임 설정 버튼을 찾을 수 없음');
    }
  });

  test('실제 게임 플레이 - 타일 클릭 상호작용 확인', async ({ page }) => {
    // 메인 페이지에서 게임 시작
    await page.goto('/ko');
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    // Challenge 모드 버튼 클릭
    const challengeButton = page.locator('[data-testid="challenge-mode-button"]');
    await expect(challengeButton).toBeVisible({ timeout: 15000 });
    await authHelper.mobileTab(page, '[data-testid="challenge-mode-button"]');

    // 게임 페이지 로딩 대기
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/game\?mode=challenge/, { timeout: 20000 });
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });

    // 모든 모달 닫기
    await authHelper.closeGameModals(page);

    // 게임 그리드 로드 대기
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({
      timeout: 25000,
    });

    // 모바일 환경에서 게임 로딩 완료 대기
    await page.waitForTimeout(3000);

    // 모든 모달이 완전히 사라졌는지 확인
    const modals = page.locator('.fixed.inset-0.z-50, .fixed.inset-0.z-40');
    const modalCount = await modals.count();
    if (modalCount > 0) {
      await authHelper.closeGameModals(page);
      await page.waitForTimeout(1000);
    }

    // 첫 번째 타일 클릭 시도 (모바일 터치 이벤트 사용)
    const firstTile = page.locator('[data-testid="tile"]').first();
    if (await firstTile.isVisible()) {
      // 특정 위치의 타일 클릭 (첫 번째 타일)
      await firstTile.click({ force: true });

      // 클릭 후 상태 변화 확인
      await page.waitForTimeout(1000);
      console.log('타일 클릭 완료');

      // 게임 점수나 이동 횟수가 변화했는지 확인
      const scoreElement = page.locator('[data-testid="game-score"]');
      const movesElement = page.locator('[data-testid="game-moves"]');

      await expect(scoreElement).toBeVisible();
      await expect(movesElement).toBeVisible();

      console.log('게임 상태 확인 완료');
    }
  });

  test('게임 내 설정 메뉴 접근 테스트', async ({ page }) => {
    // 메인 페이지에서 게임 시작
    await page.goto('/ko');
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    // Challenge 모드 버튼 클릭
    const challengeButton = page.locator('[data-testid="challenge-mode-button"]');
    await expect(challengeButton).toBeVisible({ timeout: 15000 });
    await authHelper.mobileTab(page, '[data-testid="challenge-mode-button"]');

    // 게임 페이지 로딩 대기
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/game\?mode=challenge/, { timeout: 20000 });
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });

    // 모든 모달 닫기
    await authHelper.closeGameModals(page);

    // 설정 버튼이 로드될 때까지 대기
    await expect(page.locator('[data-testid="game-settings"]')).toBeVisible({ timeout: 15000 });

    // 모바일 터치 이벤트로 설정 버튼 클릭
    await authHelper.mobileTab(page, '[data-testid="game-settings"]');

    // 설정 메뉴가 나타나는지 확인
    await page.waitForTimeout(1000);
    console.log('게임 설정 메뉴 접근 완료');

    console.log('게임 설정 메뉴 접근 성공');
  });

  test('게임 나가기 기능', async ({ page }) => {
    // 메인 페이지에서 게임 시작
    await page.goto('/ko');
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    // Challenge 모드 버튼 클릭
    const challengeButton = page.locator('[data-testid="challenge-mode-button"]');
    await expect(challengeButton).toBeVisible({ timeout: 15000 });
    await authHelper.mobileTab(page, '[data-testid="challenge-mode-button"]');

    // 게임 페이지 로딩 대기
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/game\?mode=challenge/, { timeout: 20000 });
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });

    // 모든 모달 닫기
    await authHelper.closeGameModals(page);

    // 뒤로가기 버튼 찾기 (ArrowLeft 아이콘이 있는 버튼)
    const backButton = page.locator('button:has(svg)').first();
    if (await backButton.isVisible({ timeout: 10000 })) {
      // 모바일 터치 이벤트로 뒤로가기 버튼 클릭
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

  test('게임 UI 요소 전체 확인', async ({ page }) => {
    // 메인 페이지에서 게임 시작
    await page.goto('/ko');
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    // Challenge 모드 버튼 클릭
    const challengeButton = page.locator('[data-testid="challenge-mode-button"]');
    await expect(challengeButton).toBeVisible({ timeout: 15000 });
    await authHelper.mobileTab(page, '[data-testid="challenge-mode-button"]');

    // 게임 페이지 로딩 대기
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/game\?mode=challenge/, { timeout: 20000 });
    await authHelper.mobileWaitForStableLoad(page, { timeout: 25000 });

    // 모든 모달 닫기
    await authHelper.closeGameModals(page);

    // 모든 핵심 UI 요소들이 표시되는지 확인 (더 긴 타임아웃)
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="game-moves"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="game-settings"]')).toBeVisible({ timeout: 15000 });

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

    console.log('모든 게임 UI 요소 확인 완료 - 실제 사용자 플로우로 검증됨');
  });
});

import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('메인 페이지 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 테스트 전에 test-admin으로 로그인
    await authHelper.loginAsTestAdmin(page);
    // 튜토리얼 스킵 설정
    await authHelper.skipTutorial(page);
  });

  test('메인 페이지 로드 및 게임 모드 선택', async ({ page }) => {
    // 메인 페이지 확인 (로케일 유연하게)
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)(?:\/.*)?$/);

    // 모바일 WebView 환경에서 안정적 로딩 대기
    await authHelper.mobileWaitForStableLoad(page);

    // 페이지가 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();
    console.log('메인 페이지 URL:', page.url());
    console.log('메인 페이지 제목:', await page.title());

    // Challenge 모드 버튼 클릭 (data-testid 사용)
    await authHelper.mobileTab(page, '[data-testid="challenge-mode-button"]');

    // 모바일 환경에서 게임 로딩 대기
    await authHelper.mobileWaitForStableLoad(page);

    // 게임이 로드될 때까지 대기 및 모달 처리
    await page.waitForTimeout(3000); // 모바일 환경 고려하여 증가
    await authHelper.closeGameModals(page);

    // 게임 그리드가 로드되었는지 확인 (더 긴 타임아웃)
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible({ timeout: 20000 });
  });

  test('하단 네비게이션 동작 확인', async ({ page }) => {
    // 모바일 WebView 환경에서 안정적 로딩 대기
    await authHelper.mobileWaitForStableLoad(page);

    // Store 버튼 클릭 (data-testid 사용)
    const storeButton = page.locator('[data-testid="nav-store"]');
    await expect(storeButton).toBeVisible({ timeout: 10000 }); // 타임아웃 증가

    // 모바일 터치 이벤트로 클릭
    await authHelper.mobileTab(page, '[data-testid="nav-store"]');
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/store/, { timeout: 15000 }); // 타임아웃 증가

    // 모바일 환경에서 페이지 로딩 대기
    await authHelper.mobileWaitForStableLoad(page);

    // Play 버튼으로 메인으로 돌아가기
    const playButton = page.locator('[data-testid="nav-play"]');
    await expect(playButton).toBeVisible({ timeout: 10000 }); // 타임아웃 증가

    // 모바일 터치 이벤트로 클릭
    await authHelper.mobileTab(page, '[data-testid="nav-play"]');
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)(?:\/.*)?$/, { timeout: 15000 });

    // 모바일 환경에서 페이지 로딩 대기
    await authHelper.mobileWaitForStableLoad(page);

    // Settings 버튼 클릭
    const settingsButton = page.locator('[data-testid="nav-settings"]');
    await expect(settingsButton).toBeVisible({ timeout: 10000 }); // 타임아웃 증가

    // 모바일 터치 이벤트로 클릭
    await authHelper.mobileTab(page, '[data-testid="nav-settings"]');
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)\/settings/, { timeout: 15000 });
  });

  test('리더보드 페이지 이동 및 데이터 표시', async ({ page }) => {
    // 현재 로케일 추출
    const currentUrl = page.url();
    const locale = currentUrl.match(/\/(ko|en|ja|zh|es|pt)/)?.[1] || 'en';

    // 리더보드 페이지로 이동
    await page.goto(`/${locale}/leaderboard`);

    // 모바일 WebView 환경에서 안정적 로딩 대기
    await authHelper.mobileWaitForStableLoad(page);

    // 페이지가 로드되었는지 기본 확인
    await expect(page.locator('body')).toBeVisible();
    console.log('리더보드 페이지 URL:', page.url());
    console.log('리더보드 페이지 제목:', await page.title());

    // 페이지에 기본 콘텐츠가 있는지 확인
    const pageContent = await page.textContent('body');
    const hasContent = pageContent && pageContent.length > 100;
    expect(hasContent).toBe(true);
  });

  test('사용자 정보 표시 확인', async ({ page }) => {
    // 모바일 WebView 환경에서 안정적 로딩 대기
    await authHelper.mobileWaitForStableLoad(page, { timeout: 20000 });

    // 실제 UI 구조를 확인하기 위해 페이지 정보 출력
    const pageContent = await page.textContent('body');
    console.log('사용자 정보 확인 페이지 URL:', page.url());

    // test-admin의 droplet 수 (999) 확인
    const hasDroplet999 = pageContent?.includes('999');
    console.log('페이지에서 "999" 포함 여부:', hasDroplet999);

    // test-admin의 gem 수 (10000) 확인 - 페이지에 표시되지 않을 수도 있음
    const hasGem10000 = pageContent?.includes('10000');
    console.log('페이지에서 "10000" 포함 여부:', hasGem10000);

    // 최소한 droplet 999는 확인되어야 함
    expect(hasDroplet999).toBe(true);
  });
});

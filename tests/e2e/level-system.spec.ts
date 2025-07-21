import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('레벨 시스템 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 테스트 전에 인증된 상태로 설정
    await authHelper.loginAsTestAdmin(page);
    await authHelper.waitForAuth(page);
  });

  test('메인 화면에 레벨 정보 표시 확인', async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('/');
    await authHelper.mobileWaitForStableLoad(page);

    // TopNavigation 영역 확인
    const topNav = page.locator('header').first();
    await expect(topNav).toBeVisible();

    // 레벨 숫자 표시 확인 (아바타 오른쪽 하단)
    const levelBadge = page.locator('.absolute.-bottom-1.-right-1').filter({ hasText: /^\d+$/ });
    await expect(levelBadge).toBeVisible();

    // 레벨 진행바 확인 (compact 모드)
    const levelProgressBar = page.locator('[data-testid="level-progress-bar"]');
    await expect(levelProgressBar).toBeVisible();

    console.log('레벨 정보 UI 표시 확인 완료');
  });

  test('게임 플레이 후 경험치 획득 확인', async ({ page }) => {
    // API로 직접 경험치 업데이트 테스트
    const response = await page.request.post('http://localhost:3000/level/update-exp', {
      headers: {
        Authorization: await page.evaluate(() => {
          const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
          if (!authStorage) return '';
          try {
            const decoded = decodeURIComponent(authStorage.split('=')[1]);
            const authData = JSON.parse(decoded);
            return `Bearer ${authData.state.accessToken}`;
          } catch {
            return '';
          }
        }),
        'Content-Type': 'application/json',
      },
      data: {
        score: 1000,
        mode: 'casual',
      },
    });

    expect(response.status()).toBe(200 || 201);
    const result = await response.json();

    // 경험치 획득 확인
    expect(result.expGained).toBeGreaterThan(0);
    expect(result.totalExp).toBeGreaterThan(0);

    // 페이지 새로고침하여 UI 업데이트 확인
    await page.reload();
    await authHelper.mobileWaitForStableLoad(page);

    // 레벨 정보가 업데이트되었는지 확인
    const levelProgressBar = page.locator('[data-testid="level-progress-bar"]');
    await expect(levelProgressBar).toBeVisible();

    console.log('경험치 획득 및 UI 업데이트 확인 완료');
  });

  test('레벨 정보 API 연동 확인', async ({ page }) => {
    // 레벨 정보 조회 API 테스트
    const response = await page.request.get('http://localhost:3000/level/info', {
      headers: {
        Authorization: await page.evaluate(() => {
          const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
          if (!authStorage) return '';
          try {
            const decoded = decodeURIComponent(authStorage.split('=')[1]);
            const authData = JSON.parse(decoded);
            return `Bearer ${authData.state.accessToken}`;
          } catch {
            return '';
          }
        }),
      },
    });

    expect(response.status()).toBe(200);
    const levelInfo = await response.json();

    // 필수 필드 확인
    expect(levelInfo).toHaveProperty('currentLevel');
    expect(levelInfo).toHaveProperty('currentExp');
    expect(levelInfo).toHaveProperty('expRequiredForNext');
    expect(levelInfo).toHaveProperty('skillPoints');
    expect(levelInfo).toHaveProperty('levelProgress');

    // 데이터 타입 확인
    expect(typeof levelInfo.currentLevel).toBe('number');
    expect(typeof levelInfo.currentExp).toBe('number');
    expect(typeof levelInfo.expRequiredForNext).toBe('number');
    expect(typeof levelInfo.skillPoints).toBe('number');
    expect(typeof levelInfo.levelProgress).toBe('number');

    // 논리적 데이터 검증
    expect(levelInfo.currentLevel).toBeGreaterThanOrEqual(1);
    expect(levelInfo.currentExp).toBeGreaterThanOrEqual(0);
    expect(levelInfo.expRequiredForNext).toBeGreaterThan(0);
    expect(levelInfo.skillPoints).toBeGreaterThanOrEqual(0);
    expect(levelInfo.levelProgress).toBeGreaterThanOrEqual(0);
    expect(levelInfo.levelProgress).toBeLessThanOrEqual(1);

    console.log('레벨 정보 API 연동 확인 완료:', levelInfo);
  });

  test('레벨업 시나리오 E2E 테스트', async ({ page }) => {
    // 현재 레벨 정보 조회
    const initialResponse = await page.request.get('http://localhost:3000/level/info', {
      headers: {
        Authorization: await page.evaluate(() => {
          const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
          if (!authStorage) return '';
          try {
            const decoded = decodeURIComponent(authStorage.split('=')[1]);
            const authData = JSON.parse(decoded);
            return `Bearer ${authData.state.accessToken}`;
          } catch {
            return '';
          }
        }),
      },
    });

    const initialLevel = await initialResponse.json();
    const currentLevel = initialLevel.currentLevel;

    // 레벨업을 위한 대량 경험치 획득 (10000점 게임)
    const expResponse = await page.request.post('http://localhost:3000/level/update-exp', {
      headers: {
        Authorization: await page.evaluate(() => {
          const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
          if (!authStorage) return '';
          try {
            const decoded = decodeURIComponent(authStorage.split('=')[1]);
            const authData = JSON.parse(decoded);
            return `Bearer ${authData.state.accessToken}`;
          } catch {
            return '';
          }
        }),
        'Content-Type': 'application/json',
      },
      data: {
        score: 10000,
        mode: 'challenge',
      },
    });

    const expResult = await expResponse.json();

    // 레벨업 확인
    if (expResult.leveledUp) {
      expect(expResult.newSkillPoints).toBeGreaterThan(0);

      // UI에서 레벨업 효과 확인 (페이지 새로고침 후)
      await page.reload();
      await authHelper.mobileWaitForStableLoad(page);

      // 새로운 레벨이 표시되는지 확인
      const newLevelResponse = await page.request.get('http://localhost:3000/level/info', {
        headers: {
          Authorization: await page.evaluate(() => {
            const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
            if (!authStorage) return '';
            try {
              const decoded = decodeURIComponent(authStorage.split('=')[1]);
              const authData = JSON.parse(decoded);
              return `Bearer ${authData.state.accessToken}`;
            } catch {
              return '';
            }
          }),
        },
      });

      const newLevel = await newLevelResponse.json();
      expect(newLevel.currentLevel).toBeGreaterThan(currentLevel);
      expect(newLevel.skillPoints).toBeGreaterThan(initialLevel.skillPoints);

      console.log(`레벨업 성공: ${currentLevel} → ${newLevel.currentLevel}`);
    } else {
      console.log('레벨업 조건 미달, 경험치만 획득됨');
    }
  });

  test('에러 케이스 처리 확인', async ({ page }) => {
    // 잘못된 게임 모드로 경험치 업데이트 시도
    const invalidResponse = await page.request.post('http://localhost:3000/level/update-exp', {
      headers: {
        Authorization: await page.evaluate(() => {
          const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
          if (!authStorage) return '';
          try {
            const decoded = decodeURIComponent(authStorage.split('=')[1]);
            const authData = JSON.parse(decoded);
            return `Bearer ${authData.state.accessToken}`;
          } catch {
            return '';
          }
        }),
        'Content-Type': 'application/json',
      },
      data: {
        score: 1000,
        mode: 'invalid_mode',
      },
    });

    // 400 에러 확인
    expect(invalidResponse.status()).toBe(400);

    // 음수 점수 테스트
    const negativeResponse = await page.request.post('http://localhost:3000/level/update-exp', {
      headers: {
        Authorization: await page.evaluate(() => {
          const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
          if (!authStorage) return '';
          try {
            const decoded = decodeURIComponent(authStorage.split('=')[1]);
            const authData = JSON.parse(decoded);
            return `Bearer ${authData.state.accessToken}`;
          } catch {
            return '';
          }
        }),
        'Content-Type': 'application/json',
      },
      data: {
        score: -1000,
        mode: 'casual',
      },
    });

    // 400 에러 확인 (음수 점수는 거부되어야 함)
    expect(negativeResponse.status()).toBe(400);

    console.log('에러 케이스 처리 확인 완료');
  });
});

import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('레벨 시스템 & 테크 트리 통합 플로우 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 테스트 전에 인증된 상태로 설정
    await authHelper.loginAsTestAdmin(page);
    await authHelper.waitForAuth(page);
  });

  test('전체 게임 플로우: 게임 플레이 → 경험치 → 레벨업 → 테크 트리 → 게임 강화', async ({ page }) => {
    console.log('=== 전체 통합 플로우 테스트 시작 ===');

    // 1. 초기 상태 확인
    await page.goto('/');
    await authHelper.mobileWaitForStableLoad(page);

    // 초기 레벨 정보 조회
    const initialLevelResponse = await page.request.get('http://localhost:3000/level/info', {
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

    const initialLevel = await initialLevelResponse.json();
    console.log('초기 레벨 상태:', initialLevel);

    // 2. 게임 플레이 시뮬레이션 (점수 획득)
    console.log('=== Step 1: 게임 플레이 시뮬레이션 ===');

    const gameScore = 5000; // 5000점 게임
    const expUpdateResponse = await page.request.post('http://localhost:3000/level/update-exp', {
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
        score: gameScore,
        mode: 'casual',
      },
    });

    expect([200, 201]).toContain(expUpdateResponse.status());
    const expResult = await expUpdateResponse.json();

    expect(expResult.expGained).toBe(gameScore * 0.1); // 점수의 10%
    expect(expResult.totalExp).toBeGreaterThan(initialLevel.currentExp);

    console.log('경험치 획득 결과:', expResult);

    // 3. 레벨업 확인 및 스킬포인트 획득
    console.log('=== Step 2: 레벨업 및 스킬포인트 확인 ===');

    if (expResult.leveledUp) {
      expect(expResult.newSkillPoints).toBeGreaterThan(0);
      console.log(`레벨업 성공! 새 레벨: ${expResult.currentLevel}, 획득 스킬포인트: ${expResult.newSkillPoints}`);
    } else {
      console.log('레벨업 조건 미달, 경험치만 획득됨');
    }

    // UI에서 레벨 정보 업데이트 확인
    await page.reload();
    await authHelper.mobileWaitForStableLoad(page);

    // TopNavigation에서 레벨 표시 확인
    const levelBadge = page.locator('.absolute.-bottom-1.-right-1').filter({ hasText: /^\d+$/ });
    await expect(levelBadge).toBeVisible();

    const levelProgressBar = page.locator('[data-testid="level-progress-bar"]');
    await expect(levelProgressBar).toBeVisible();

    console.log('UI에서 레벨 정보 업데이트 확인 완료');

    // 4. 테크 트리 접근 및 구매
    console.log('=== Step 3: 테크 트리 노드 구매 ===');

    // 테크 트리 페이지로 이동
    const techTreeNavButton = page.locator('[data-testid="nav-tech-tree"]');
    await expect(techTreeNavButton).toBeVisible();
    await authHelper.mobileTab(page, '[data-testid="nav-tech-tree"]');
    await authHelper.mobileWaitForStableLoad(page);

    // 사용자 정보 조회 (젬과 스킬포인트 확인)
    const userResponse = await page.request.get('http://localhost:3000/users/me', {
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

    const userInfo = await userResponse.json();
    console.log(`현재 자원 - 젬: ${userInfo.gem}, 스킬포인트: ${userInfo.skillPoints}`);

    // 구매 가능한 테크 노드 찾기
    const nodesResponse = await page.request.get('http://localhost:3000/tech-tree/nodes', {
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

    const nodes = await nodesResponse.json();
    expect(nodes.length).toBeGreaterThan(0);

    // 가장 저렴한 노드 찾기 (구매 가능한)
    interface TechNode {
      id: string;
      name: string;
      baseCost: number;
    }
    const affordableNode = nodes.find((node: TechNode) => node.baseCost <= userInfo.gem);

    if (affordableNode && userInfo.skillPoints > 0) {
      console.log(`구매할 노드: ${affordableNode.name} (비용: ${affordableNode.baseCost} 젬)`);

      const purchaseResponse = await page.request.post('http://localhost:3000/tech-tree/purchase', {
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
          nodeId: affordableNode.id,
        },
      });

      if (purchaseResponse.status() === 200) {
        const purchaseResult = await purchaseResponse.json();
        expect(purchaseResult.success).toBe(true);
        console.log(`테크 노드 구매 성공: ${affordableNode.name} (레벨 ${purchaseResult.newLevel})`);

        // UI에서 구매 반영 확인
        await page.reload();
        await authHelper.mobileWaitForStableLoad(page);

        const purchasedNode = page.locator(`[data-testid="tech-node-${affordableNode.id}"]`);
        if (await purchasedNode.isVisible({ timeout: 3000 })) {
          console.log('UI에서 구매 노드 활성화 확인 완료');
        }
      } else {
        console.log('테크 노드 구매 실패 (조건 미달)');
      }
    } else {
      console.log('구매 가능한 테크 노드 없음 (자원 부족)');
    }

    // 5. 게임 강화 효과 확인
    console.log('=== Step 4: 게임 강화 효과 확인 ===');

    const enhancementsResponse = await page.request.get('http://localhost:3000/tech-tree/enhancements', {
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

    expect(enhancementsResponse.status()).toBe(200);
    const enhancements = await enhancementsResponse.json();

    console.log('현재 게임 강화 효과:', enhancements);

    // 강화 효과가 0 이상인지 확인
    expect(enhancements.extraMoves).toBeGreaterThanOrEqual(0);
    expect(enhancements.comboBonus).toBeGreaterThanOrEqual(0);
    expect(enhancements.artifactChance).toBeGreaterThanOrEqual(0);
    expect(enhancements.shuffleCostReduction).toBeGreaterThanOrEqual(0);
    expect(enhancements.itemEfficiency).toBeGreaterThanOrEqual(0);

    // 6. 최종 상태 확인
    console.log('=== Step 5: 최종 상태 확인 ===');

    const finalLevelResponse = await page.request.get('http://localhost:3000/level/info', {
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

    const finalLevel = await finalLevelResponse.json();

    // 최종 상태가 초기 상태보다 발전되었는지 확인
    expect(finalLevel.totalExp).toBeGreaterThan(initialLevel.currentExp);

    console.log('최종 레벨 상태:', finalLevel);
    console.log('=== 전체 통합 플로우 테스트 완료 ===');
  });

  test('UI 네비게이션 통합 테스트', async ({ page }) => {
    console.log('=== UI 네비게이션 통합 테스트 시작 ===');

    // 메인 페이지에서 시작
    await page.goto('/');
    await authHelper.mobileWaitForStableLoad(page);

    // 1. TopNavigation 레벨 정보 확인
    const topNav = page.locator('header').first();
    await expect(topNav).toBeVisible();

    const levelBadge = page.locator('.absolute.-bottom-1.-right-1').filter({ hasText: /^\d+$/ });
    await expect(levelBadge).toBeVisible();

    console.log('TopNavigation 레벨 정보 표시 확인');

    // 2. BottomNavigation 테크 트리 메뉴 확인
    const techTreeNavButton = page.locator('[data-testid="nav-tech-tree"]');
    await expect(techTreeNavButton).toBeVisible();

    // 테크 트리 페이지로 이동
    await authHelper.mobileTab(page, '[data-testid="nav-tech-tree"]');
    await authHelper.mobileWaitForStableLoad(page);

    // URL 변경 확인
    await expect(page).toHaveURL(/\/tech-tree$/);

    console.log('테크 트리 페이지 네비게이션 확인');

    // 3. 테크 트리 페이지에서 메인으로 돌아가기
    const playNavButton = page.locator('[data-testid="nav-play"]');
    await expect(playNavButton).toBeVisible();

    await authHelper.mobileTab(page, '[data-testid="nav-play"]');
    await authHelper.mobileWaitForStableLoad(page);

    // 메인 페이지로 돌아왔는지 확인
    await expect(page).toHaveURL(/\/(ko|en|ja|zh|es|pt)$/);

    console.log('메인 페이지로 돌아가기 확인');

    // 4. 각 페이지에서 TopNavigation 일관성 확인
    const pages = ['store', 'settings'];
    for (const targetPage of pages) {
      const navButton = page.locator(`[data-testid="nav-${targetPage}"]`);
      if (await navButton.isVisible({ timeout: 2000 })) {
        await authHelper.mobileTab(page, `[data-testid="nav-${targetPage}"]`);
        await authHelper.mobileWaitForStableLoad(page);

        // 각 페이지에서도 TopNavigation 확인
        const pageTopNav = page.locator('header').first();
        await expect(pageTopNav).toBeVisible();

        const pageLevelBadge = page.locator('.absolute.-bottom-1.-right-1').filter({ hasText: /^\d+$/ });
        await expect(pageLevelBadge).toBeVisible();

        console.log(`${targetPage} 페이지에서 TopNavigation 일관성 확인`);
      }
    }

    console.log('=== UI 네비게이션 통합 테스트 완료 ===');
  });

  test('API 연동 안정성 테스트', async ({ page }) => {
    console.log('=== API 연동 안정성 테스트 시작 ===');

    // 동시 API 호출 테스트
    const authHeader = await page.evaluate(() => {
      const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
      if (!authStorage) return '';
      try {
        const decoded = decodeURIComponent(authStorage.split('=')[1]);
        const authData = JSON.parse(decoded);
        return `Bearer ${authData.state.accessToken}`;
      } catch {
        return '';
      }
    });

    // 여러 API를 동시에 호출
    const promises = [
      page.request.get('http://localhost:3000/level/info', {
        headers: { Authorization: authHeader },
      }),
      page.request.get('http://localhost:3000/tech-tree/nodes', {
        headers: { Authorization: authHeader },
      }),
      page.request.get('http://localhost:3000/tech-tree/my-tree', {
        headers: { Authorization: authHeader },
      }),
      page.request.get('http://localhost:3000/tech-tree/enhancements', {
        headers: { Authorization: authHeader },
      }),
    ];

    const responses = await Promise.all(promises);

    // 모든 응답이 성공적인지 확인
    responses.forEach((response, index) => {
      expect(response.status()).toBe(200);
      console.log(`API ${index + 1} 동시 호출 성공`);
    });

    // 연속 API 호출 테스트 (부하 테스트)
    for (let i = 0; i < 5; i++) {
      const response = await page.request.get('http://localhost:3000/level/info', {
        headers: { Authorization: authHeader },
      });
      expect(response.status()).toBe(200);
    }

    console.log('연속 API 호출 안정성 확인');

    // 타임아웃 테스트 (빠른 응답 확인)
    const start = Date.now();
    const quickResponse = await page.request.get('http://localhost:3000/level/info', {
      headers: { Authorization: authHeader },
    });
    const duration = Date.now() - start;

    expect(quickResponse.status()).toBe(200);
    expect(duration).toBeLessThan(5000); // 5초 이내 응답

    console.log(`API 응답 시간: ${duration}ms`);
    console.log('=== API 연동 안정성 테스트 완료 ===');
  });

  test('에러 복구 및 예외 처리 테스트', async ({ page }) => {
    console.log('=== 에러 복구 및 예외 처리 테스트 시작 ===');

    const authHeader = await page.evaluate(() => {
      const authStorage = document.cookie.split('; ').find((row) => row.startsWith('auth-storage='));
      if (!authStorage) return '';
      try {
        const decoded = decodeURIComponent(authStorage.split('=')[1]);
        const authData = JSON.parse(decoded);
        return `Bearer ${authData.state.accessToken}`;
      } catch {
        return '';
      }
    });

    // 1. 잘못된 데이터로 API 호출
    const invalidRequests = [
      // 잘못된 게임 모드
      page.request.post('http://localhost:3000/level/update-exp', {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        data: { score: 1000, mode: 'invalid_mode' },
      }),
      // 음수 점수
      page.request.post('http://localhost:3000/level/update-exp', {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        data: { score: -1000, mode: 'casual' },
      }),
      // 존재하지 않는 테크 노드
      page.request.post('http://localhost:3000/tech-tree/purchase', {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        data: { nodeId: 'non-existent-node' },
      }),
    ];

    for (const request of invalidRequests) {
      const response = await request;
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
      console.log(`에러 케이스 응답: ${response.status()}`);
    }

    // 2. 네트워크 오류 시뮬레이션 (잘못된 엔드포인트)
    const networkErrorResponse = await page.request.get('http://localhost:3000/non-existent-endpoint', {
      headers: { Authorization: authHeader },
    });
    expect(networkErrorResponse.status()).toBe(404);

    // 3. 인증 오류 테스트
    const unauthResponse = await page.request.get('http://localhost:3000/level/info');
    expect(unauthResponse.status()).toBe(401);

    // 4. UI에서 에러 상황 처리 확인
    await page.goto('/tech-tree');
    await authHelper.mobileWaitForStableLoad(page);

    // 페이지가 에러 없이 로드되는지 확인
    const techTreeView = page.locator('[data-testid="tech-tree-view"]');
    await expect(techTreeView).toBeVisible();

    console.log('UI 에러 처리 확인 완료');
    console.log('=== 에러 복구 및 예외 처리 테스트 완료 ===');
  });
});

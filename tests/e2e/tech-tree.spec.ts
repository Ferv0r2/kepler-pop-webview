import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('테크 트리 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 테스트 전에 인증된 상태로 설정
    await authHelper.loginAsTestAdmin(page);
    await authHelper.waitForAuth(page);
  });

  test('테크 트리 페이지 접근 및 렌더링 확인', async ({ page }) => {
    // 메인 페이지에서 테크 트리 메뉴 클릭
    await page.goto('/');
    await authHelper.mobileWaitForStableLoad(page);

    // 하단 네비게이션에서 테크 트리 메뉴 찾기
    const techTreeNavButton = page.locator('[data-testid="nav-tech-tree"]');
    await expect(techTreeNavButton).toBeVisible();

    // 테크 트리 페이지로 이동
    await authHelper.mobileTab(page, '[data-testid="nav-tech-tree"]');
    await authHelper.mobileWaitForStableLoad(page);

    // URL 확인
    await expect(page).toHaveURL(/\/tech-tree$/);

    // 테크 트리 메인 컴포넌트 확인
    const techTreeView = page.locator('[data-testid="tech-tree-view"]');
    await expect(techTreeView).toBeVisible();

    // 기본 UI 요소들 확인
    const techTreeTitle = page.locator('h1').filter({ hasText: /tech.*tree|테크.*트리/i });
    await expect(techTreeTitle).toBeVisible();

    console.log('테크 트리 페이지 렌더링 확인 완료');
  });

  test('테크 트리 노드 목록 로딩 확인', async ({ page }) => {
    // 테크 트리 페이지로 직접 이동
    await page.goto('/tech-tree');
    await authHelper.mobileWaitForStableLoad(page);

    // API로 테크 트리 노드 목록 조회
    const response = await page.request.get('http://localhost:3000/tech-tree/nodes', {
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
    const nodes = await response.json();

    // 테크 트리 노드가 배열이고 비어있지 않은지 확인
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);

    // 첫 번째 노드의 구조 확인
    const firstNode = nodes[0];
    expect(firstNode).toHaveProperty('id');
    expect(firstNode).toHaveProperty('name');
    expect(firstNode).toHaveProperty('description');
    expect(firstNode).toHaveProperty('category');
    expect(firstNode).toHaveProperty('tier');
    expect(firstNode).toHaveProperty('maxLevel');
    expect(firstNode).toHaveProperty('baseCost');

    // UI에서 테크 트리 노드들이 표시되는지 확인
    const techTreeGrid = page.locator('[data-testid="tech-tree-grid"]');
    await expect(techTreeGrid).toBeVisible();

    // 최소 하나의 테크 노드 카드가 표시되는지 확인
    const techNodeCards = page.locator('[data-testid^="tech-node-"]');
    await expect(techNodeCards.first()).toBeVisible();

    console.log(`테크 트리 노드 ${nodes.length}개 로딩 확인 완료`);
  });

  test('테크 트리 카테고리 필터 기능 확인', async ({ page }) => {
    await page.goto('/tech-tree');
    await authHelper.mobileWaitForStableLoad(page);

    // 카테고리 필터 버튼들 확인
    const categoryFilters = page.locator('[data-testid="category-filter"]');
    await expect(categoryFilters.first()).toBeVisible();

    // 각 카테고리 버튼 클릭 테스트
    const categories = ['movement', 'items', 'shuffle', 'combo', 'artifacts'];

    for (const category of categories) {
      const categoryButton = page.locator(`[data-testid="category-${category}"]`);
      if (await categoryButton.isVisible({ timeout: 2000 })) {
        await authHelper.mobileTab(page, `[data-testid="category-${category}"]`);
        await page.waitForTimeout(500);

        // 필터가 적용되었는지 확인 (활성 상태)
        await expect(categoryButton).toHaveClass(/active|selected|bg-purple/);

        console.log(`카테고리 필터 ${category} 작동 확인`);
      }
    }

    // 전체 보기로 돌아가기
    const allCategoryButton = page.locator('[data-testid="category-all"]');
    if (await allCategoryButton.isVisible({ timeout: 2000 })) {
      await authHelper.mobileTab(page, '[data-testid="category-all"]');
      await page.waitForTimeout(500);
    }

    console.log('테크 트리 카테고리 필터 기능 확인 완료');
  });

  test('사용자 테크 트리 상태 조회 확인', async ({ page }) => {
    // 사용자 테크 트리 상태 API 테스트
    const response = await page.request.get('http://localhost:3000/tech-tree/my-tree', {
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
    const userTechTree = await response.json();

    // 사용자 테크 트리가 배열인지 확인
    expect(Array.isArray(userTechTree)).toBe(true);

    // 구매한 노드가 있다면 구조 확인
    if (userTechTree.length > 0) {
      const firstNode = userTechTree[0];
      expect(firstNode).toHaveProperty('nodeId');
      expect(firstNode).toHaveProperty('currentLevel');
      expect(firstNode).toHaveProperty('maxLevel');
      expect(firstNode).toHaveProperty('nextCost');
      expect(firstNode).toHaveProperty('canUpgrade');
      expect(firstNode).toHaveProperty('totalEffect');

      console.log(`사용자 테크 트리: ${userTechTree.length}개 노드 보유`);
    } else {
      console.log('사용자 테크 트리: 아직 구매한 노드 없음');
    }
  });

  test('테크 노드 구매 프로세스 E2E 테스트', async ({ page }) => {
    // 먼저 사용자의 젬과 스킬포인트 확인
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
    const initialGems = userInfo.gem;
    const initialSkillPoints = userInfo.skillPoints;

    console.log(`초기 젬: ${initialGems}, 스킬포인트: ${initialSkillPoints}`);

    // 충분한 자원이 없다면 테스트 스킵
    if (initialGems < 100 || initialSkillPoints < 1) {
      console.log('구매 테스트를 위한 자원 부족, 테스트 스킵');
      return;
    }

    // 첫 번째 테크 노드 시도 (보통 movement-1이나 비슷한 기본 노드)
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
    if (nodes.length === 0) {
      console.log('테크 노드가 없어서 구매 테스트 스킵');
      return;
    }

    // 첫 번째 노드로 구매 시도
    const targetNode = nodes[0];
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
        nodeId: targetNode.id,
      },
    });

    // 구매 결과 확인
    if (purchaseResponse.status() === 200) {
      const purchaseResult = await purchaseResponse.json();

      expect(purchaseResult).toHaveProperty('success');
      expect(purchaseResult).toHaveProperty('newLevel');
      expect(purchaseResult).toHaveProperty('cost');
      expect(purchaseResult).toHaveProperty('remainingGems');

      expect(purchaseResult.success).toBe(true);
      expect(purchaseResult.newLevel).toBeGreaterThan(0);
      expect(purchaseResult.remainingGems).toBeLessThan(initialGems);

      console.log(`테크 노드 구매 성공: ${targetNode.name} (레벨 ${purchaseResult.newLevel})`);

      // UI에서 구매 반영 확인
      await page.goto('/tech-tree');
      await authHelper.mobileWaitForStableLoad(page);

      // 구매한 노드가 활성화되었는지 확인
      const purchasedNode = page.locator(`[data-testid="tech-node-${targetNode.id}"]`);
      if (await purchasedNode.isVisible({ timeout: 3000 })) {
        // 구매된 노드는 다른 스타일(예: 활성화됨)을 가져야 함
        await expect(purchasedNode).not.toHaveClass(/opacity-50|disabled/);
        console.log('UI에서 구매 노드 활성화 확인 완료');
      }
    } else if (purchaseResponse.status() === 400) {
      console.log('구매 조건 미달 (자원 부족 또는 선행 조건 미충족)');
    } else {
      throw new Error(`예상치 못한 구매 응답: ${purchaseResponse.status()}`);
    }
  });

  test('게임 강화 효과 조회 확인', async ({ page }) => {
    // 게임 강화 효과 API 테스트
    const response = await page.request.get('http://localhost:3000/tech-tree/enhancements', {
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
    const enhancements = await response.json();

    // 강화 효과 구조 확인
    expect(enhancements).toHaveProperty('extraMoves');
    expect(enhancements).toHaveProperty('comboBonus');
    expect(enhancements).toHaveProperty('artifactChance');
    expect(enhancements).toHaveProperty('shuffleCostReduction');
    expect(enhancements).toHaveProperty('itemEfficiency');

    // 데이터 타입 확인
    expect(typeof enhancements.extraMoves).toBe('number');
    expect(typeof enhancements.comboBonus).toBe('number');
    expect(typeof enhancements.artifactChance).toBe('number');
    expect(typeof enhancements.shuffleCostReduction).toBe('number');
    expect(typeof enhancements.itemEfficiency).toBe('number');

    // 논리적 범위 확인
    expect(enhancements.extraMoves).toBeGreaterThanOrEqual(0);
    expect(enhancements.comboBonus).toBeGreaterThanOrEqual(0);
    expect(enhancements.artifactChance).toBeGreaterThanOrEqual(0);
    expect(enhancements.shuffleCostReduction).toBeGreaterThanOrEqual(0);
    expect(enhancements.itemEfficiency).toBeGreaterThanOrEqual(0);

    console.log('게임 강화 효과 확인 완료:', enhancements);
  });

  test('테크 트리 에러 케이스 처리 확인', async ({ page }) => {
    // 존재하지 않는 노드 구매 시도
    const invalidResponse = await page.request.post('http://localhost:3000/tech-tree/purchase', {
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
        nodeId: 'non-existent-node-id',
      },
    });

    // 404 또는 400 에러 확인
    expect([400, 404]).toContain(invalidResponse.status());

    // 잘못된 UUID 형식 테스트
    const invalidUuidResponse = await page.request.post('http://localhost:3000/tech-tree/purchase', {
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
        nodeId: 'invalid-uuid-format',
      },
    });

    // 400 에러 확인
    expect(invalidUuidResponse.status()).toBe(400);

    console.log('테크 트리 에러 케이스 처리 확인 완료');
  });

  test('테크 트리 UI 인터랙션 종합 테스트', async ({ page }) => {
    await page.goto('/tech-tree');
    await authHelper.mobileWaitForStableLoad(page);

    // 테크 노드 카드 클릭 테스트
    const techNodeCards = page.locator('[data-testid^="tech-node-"]');
    const firstCard = techNodeCards.first();

    if (await firstCard.isVisible({ timeout: 3000 })) {
      // 노드 카드 클릭
      await authHelper.mobileTab(page, '[data-testid^="tech-node-"]');
      await page.waitForTimeout(1000);

      // 노드 상세 정보 모달이 나타나는지 확인 (있다면)
      const nodeModal = page.locator('.fixed.inset-0').filter({ hasText: /upgrade|구매|purchase/i });
      if (await nodeModal.isVisible({ timeout: 2000 })) {
        console.log('노드 상세 모달 표시 확인');

        // 모달 닫기
        const closeButton = nodeModal.locator('button').filter({ hasText: /close|닫기|×/i });
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await authHelper.mobileTab(page, 'button:has-text("close"), button:has-text("닫기"), button:has-text("×")');
        } else {
          // 배경 클릭으로 모달 닫기
          await nodeModal.click({ position: { x: 50, y: 50 } });
        }
        await page.waitForTimeout(500);
      }

      console.log('테크 노드 카드 인터랙션 확인 완료');
    }

    // 스크롤 테스트 (긴 테크 트리 목록)
    await authHelper.mobileScroll(page, 'down', 200);
    await page.waitForTimeout(500);
    await authHelper.mobileScroll(page, 'up', 200);
    await page.waitForTimeout(500);

    console.log('테크 트리 UI 인터랙션 종합 테스트 완료');
  });
});

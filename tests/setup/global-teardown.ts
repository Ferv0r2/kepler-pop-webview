// tests/setup/global-teardown.ts

async function globalTeardown() {
  console.log('🧹 E2E 테스트 Global Teardown 시작...');

  // 테스트 완료 후 정리 작업
  console.log('✅ Global Teardown 완료');
}

export default globalTeardown;

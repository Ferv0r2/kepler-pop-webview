// tests/setup/global-teardown.ts

async function globalTeardown() {
  // 테스트 완료 후 환경 정리
  console.log('Cleaning up the environment after tests...');
}

export default globalTeardown;

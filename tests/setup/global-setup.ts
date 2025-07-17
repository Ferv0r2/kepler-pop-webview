// tests/setup/global-setup.ts

// Global setup for E2E tests

async function globalSetup() {
  console.log('🚀 E2E 테스트 Global Setup 시작...');

  // 백엔드 서버 상태 확인
  await waitForBackendServer();

  // test-admin 엔드포인트 검증
  await validateTestAdminEndpoint();

  console.log('✅ Global Setup 완료');
}

async function waitForBackendServer() {
  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch('http://localhost:3000/');
      if (response.ok) {
        console.log('✅ 백엔드 서버 연결 확인');
        return;
      }
    } catch {
      console.log(`⏳ 백엔드 서버 대기 중... (${retries + 1}/${maxRetries})`);
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('❌ 백엔드 서버에 연결할 수 없습니다');
}

async function validateTestAdminEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/auth/test-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken && data.user) {
        console.log('✅ test-admin 엔드포인트 검증 완료');
        return;
      }
    }

    throw new Error('test-admin 응답 형식이 올바르지 않습니다');
  } catch (error) {
    throw new Error(`❌ test-admin 엔드포인트 검증 실패: ${error}`);
  }
}

export default globalSetup;

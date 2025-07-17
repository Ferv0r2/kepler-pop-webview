// tests/setup/global-setup.ts

import { waitForBackendServer, setupTestData, authHelper } from '../helpers/setup-helper';

async function globalSetup() {
  // 백엔드 서버 상태 확인
  await waitForBackendServer();

  // test-admin 계정 사전 생성 및 검증
  await authHelper.validateTestAdminEndpoint();

  // 테스트 데이터 초기화
  await setupTestData();
}

export default globalSetup;

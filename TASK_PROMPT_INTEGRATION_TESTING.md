# 🔗 **Integration Claude - E2E 테스트 통합 및 CI/CD 구성 작업 지시서**

> **역할**: Integration Claude - 테스트 환경 통합 및 자동화 전문가  
> **작업 범위**: E2E 테스트 실행 환경 구성 및 CI/CD 파이프라인 통합
> **기술 스택**: Playwright, GitHub Actions, Docker (선택사항)

---

## 📋 **작업 개요**

Kepler Pop E2E 테스트의 안정적인 실행 환경을 구성하고, CI/CD 파이프라인에 통합하여 자동화된 품질 검증 시스템을 구축합니다.

### **이미 구성된 환경**

- ✅ Playwright 설치 및 설정 완료
- ✅ test-admin 인증 시스템 구현
- ✅ E2E 테스트 시나리오 (Frontend Claude 담당)
- ✅ 로컬 개발 환경 설정

---

## 🎯 **구현할 통합 작업**

### **1. 테스트 환경 안정화**

```
파일: tests/setup/global-setup.ts, global-teardown.ts
작업:
- 테스트 시작 전 백엔드 서버 상태 확인
- test-admin 계정 생성 및 검증
- 데이터베이스 초기화 (필요 시)
- 테스트 완료 후 환경 정리
```

### **2. CI/CD 파이프라인 구성**

```
파일: .github/workflows/e2e-tests.yml
작업:
- GitHub Actions E2E 테스트 워크플로우
- 다중 브라우저 매트릭스 테스트
- 테스트 결과 아티팩트 저장
- 실패 시 스크린샷/비디오 업로드
```

### **3. Docker 컨테이너 환경 (선택사항)**

```
파일: docker/e2e/Dockerfile, docker-compose.e2e.yml
작업:
- 격리된 E2E 테스트 환경 구성
- 백엔드/프론트엔드 서비스 오케스트레이션
- 일관된 테스트 환경 보장
```

### **4. 테스트 리포팅 개선**

```
파일: tests/utils/reporter.ts
작업:
- 커스텀 테스트 리포터 구현
- Slack/Discord 알림 통합 (선택사항)
- 테스트 커버리지 리포트 생성
```

### **5. 성능 모니터링 통합**

```
파일: tests/utils/performance.ts
작업:
- 페이지 로드 시간 측정
- Core Web Vitals 수집
- 성능 회귀 감지 임계값 설정
```

---

## 🏗️ **구현 가이드라인**

### **Global Setup 구성**

```typescript
// tests/setup/global-setup.ts
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // 백엔드 서버 상태 확인
  await waitForBackendServer();

  // test-admin 계정 사전 생성 및 검증
  await validateTestAdminEndpoint();

  // 테스트 데이터 초기화
  await setupTestData();
}

export default globalSetup;
```

### **GitHub Actions 워크플로우**

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: |
          cd kepler-pop-backend && pnpm install
          cd ../kepler-pop-webview && pnpm install

      - name: Start services
        run: |
          cd kepler-pop-backend && pnpm run start:dev &
          cd kepler-pop-webview && pnpm run build && pnpm run start &

      - name: Run E2E tests
        run: |
          cd kepler-pop-webview
          pnpm run playwright:install --with-deps
          pnpm run test:e2e --project=${{ matrix.browser }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: kepler-pop-webview/playwright-report/
```

### **환경 변수 관리**

```bash
# .env.test (테스트 전용 환경변수)
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/kepler_pop_test
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
TEST_TIMEOUT=30000
```

---

## 🔄 **마이크로 커밋 전략 (필수)**

### **커밋 분할 원칙**

- **구성별 분할**: Global Setup → CI/CD → Docker → 리포팅
- **환경별 분할**: 로컬 → CI → 프로덕션 설정
- **의미있는 단위**: 각 커밋은 독립적으로 검증 가능

### **커밋 예시**

```bash
# Step 1: Global Setup 구현
git add tests/setup/global-setup.ts
git commit -m "feat: E2E 테스트 Global Setup 환경 구성"

# Step 2: CI/CD 워크플로우 추가
git add .github/workflows/e2e-tests.yml
git commit -m "feat: GitHub Actions E2E 테스트 워크플로우 추가"

# Step 3: 환경변수 설정
git add .env.test
git commit -m "feat: E2E 테스트용 환경변수 설정 추가"
```

---

## 🧪 **통합 테스트 검증**

### **로컬 환경 검증**

```bash
# 1. 전체 E2E 테스트 실행
cd /Volumes/Drive/myGit/kepler-combine/kepler-pop-webview
pnpm run test:e2e

# 2. 브라우저별 테스트
pnpm run test:e2e --project=chromium
pnpm run test:e2e --project=firefox
pnpm run test:e2e --project=webkit

# 3. 성능 테스트 포함
pnpm run test:e2e --grep="performance"

# 4. CI 환경 시뮬레이션
CI=true pnpm run test:e2e
```

### **CI/CD 검증 체크리스트**

- [ ] GitHub Actions 워크플로우 정상 실행
- [ ] 다중 브라우저 매트릭스 테스트 성공
- [ ] 실패 시 아티팩트 업로드 확인
- [ ] 테스트 리포트 생성 및 접근 가능
- [ ] 성능 메트릭 수집 정상 동작

---

## 📊 **모니터링 및 알림 설정**

### **성능 임계값 설정**

```typescript
// tests/utils/performance-thresholds.ts
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000, // 3초 이내
  firstContentfulPaint: 1500, // 1.5초 이내
  largestContentfulPaint: 2500, // 2.5초 이내
  cumulativeLayoutShift: 0.1, // 0.1 이내
};
```

### **테스트 결과 알림 (선택사항)**

```typescript
// tests/utils/notifications.ts
export async function sendTestResults(results: TestResults) {
  if (results.failed > 0) {
    await sendSlackAlert(results);
  }
}
```

---

## 🚀 **배포 전 최종 검증**

### **통합 검증 스크립트**

```bash
#!/bin/bash
# scripts/validate-e2e.sh

echo "🚀 E2E 테스트 통합 환경 검증 시작..."

# 1. 의존성 설치 확인
echo "📦 의존성 설치 확인..."
cd kepler-pop-backend && pnpm install --frozen-lockfile
cd ../kepler-pop-webview && pnpm install --frozen-lockfile

# 2. 백엔드 서비스 시작
echo "🔧 백엔드 서비스 시작..."
cd kepler-pop-backend && pnpm run start:dev &
BACKEND_PID=$!

# 3. 프론트엔드 빌드 및 시작
echo "🎨 프론트엔드 빌드 및 시작..."
cd kepler-pop-webview && pnpm run build && pnpm run start &
FRONTEND_PID=$!

# 4. 서비스 준비 대기
echo "⏳ 서비스 준비 대기..."
sleep 30

# 5. E2E 테스트 실행
echo "🧪 E2E 테스트 실행..."
pnpm run test:e2e

# 6. 정리
echo "🧹 프로세스 정리..."
kill $BACKEND_PID $FRONTEND_PID

echo "✅ E2E 테스트 통합 환경 검증 완료!"
```

---

## 🧹 **작업 완료 후 정리 (필수)**

### **정리 대상**

- 현재 TASK_PROMPT.md 파일 제거
- 임시 설정 파일 및 테스트 데이터 정리
- 미사용 Docker 이미지 정리 (해당 시)

### **정리 명령어**

```bash
# 작업 완료 후 실행
rm TASK_PROMPT_INTEGRATION_TESTING.md
find . -name "*.log" -type f -delete
find . -name "*.tmp" -type f -delete
git add -A
git commit -m "chore: E2E 테스트 통합 작업 완료 후 임시 파일 정리"
```

---

## ⚠️ **주의사항**

### **DO (반드시 할 것)**

- 테스트 환경 격리 보장
- CI/CD 실패 시 명확한 에러 메시지 제공
- 성능 회귀 감지 시스템 구축
- 테스트 아티팩트 적절한 보존 기간 설정
- 마이크로 커밋 전략 엄격히 준수

### **DON'T (하지 말 것)**

- 프로덕션 환경에서 테스트 실행 금지
- 중요한 환경변수 하드코딩 금지
- 테스트 간 상태 의존성 생성 금지
- 불필요한 외부 의존성 추가 금지
- 커밋 메시지에 "Claude" 언급 금지

---

**시작 명령어**: 이 파일을 읽고 E2E 테스트 통합 환경 구성을 시작하세요!

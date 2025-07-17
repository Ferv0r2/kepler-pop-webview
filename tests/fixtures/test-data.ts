import { GameTestData, UserFlowTest, E2ETestPage } from '@/types/test-types';

/**
 * E2E 테스트용 테스트 데이터 정의
 */

export const TEST_ADMIN_USER = {
  email: 'admin@test.com',
  nickname: 'admin',
  name: 'admin',
  expectedGem: 10000,
  expectedDroplet: 999,
  isSubscribed: true,
  level: 1,
  exp: 0,
} as const;

export const GAME_TEST_DATA: Record<string, GameTestData> = {
  casual: {
    mode: 'casual',
    expectedMoves: 30,
    minScore: 100,
  },
  challenge: {
    mode: 'challenge',
    expectedMoves: 20,
    minScore: 500,
  },
} as const;

export const E2E_PAGES: E2ETestPage = {
  auth: '/ko/auth',
  main: '/ko',
  game: '/ko/game',
  leaderboard: '/ko/leaderboard',
  store: '/ko/store',
  settings: '/ko/settings',
} as const;

export const USER_FLOW_TESTS: UserFlowTest[] = [
  {
    name: '신규 사용자 온보딩',
    description: 'test-admin으로 로그인 후 첫 게임 플레이까지의 플로우',
    steps: [
      'test-admin으로 자동 로그인',
      '메인 페이지 사용자 정보 확인',
      'Challenge 모드 게임 시작',
      '최소 3번의 타일 매칭 수행',
      '게임 종료 및 점수 확인',
    ],
    expectedOutcome: '게임 점수가 500점 이상 기록됨',
  },
  {
    name: '다국어 지원 검증',
    description: '여러 로케일에서 페이지 정상 로드 확인',
    steps: [
      '한국어(/ko) 페이지 접근',
      '영어(/en) 페이지 접근',
      '일본어(/ja) 페이지 접근',
      '각 페이지의 네비게이션 텍스트 확인',
    ],
    expectedOutcome: '모든 로케일에서 적절한 언어로 표시됨',
  },
  {
    name: '스토어 아이템 구매',
    description: 'test-admin의 충분한 gem으로 아이템 구매 테스트',
    steps: [
      '스토어 페이지 이동',
      '구매 가능한 아이템 목록 확인',
      '아이템 선택 및 구매 확인 모달',
      '구매 완료 후 gem 차감 확인',
    ],
    expectedOutcome: 'gem이 올바르게 차감되고 아이템이 인벤토리에 추가됨',
  },
  {
    name: '리더보드 조회',
    description: '리더보드 페이지 기능 검증',
    steps: ['리더보드 페이지 이동', '전체 랭킹 목록 로드 확인', '내 순위 정보 표시 확인', '기간별 필터 동작 확인'],
    expectedOutcome: '리더보드 데이터가 올바르게 표시됨',
  },
  {
    name: '모바일 반응형 테스트',
    description: '모바일 뷰포트에서의 UI/UX 검증',
    steps: [
      '모바일 뷰포트로 화면 크기 조정',
      '메인 페이지 레이아웃 확인',
      '게임 화면 터치 인터랙션 확인',
      '하단 네비게이션 동작 확인',
    ],
    expectedOutcome: '모바일 환경에서 모든 기능이 정상 동작함',
  },
] as const;

export const PERFORMANCE_EXPECTATIONS = {
  pageLoadTime: 3000, // 3초 이내
  firstContentfulPaint: 1500, // 1.5초 이내
  largestContentfulPaint: 2500, // 2.5초 이내
  timeToInteractive: 4000, // 4초 이내
  cumulativeLayoutShift: 0.1, // 0.1 이내
} as const;

export const BROWSER_SUPPORT = ['chromium', 'firefox', 'webkit'] as const;

export const MOBILE_DEVICES = ['iPhone 12', 'Pixel 5', 'iPad Pro'] as const;

export const LOCALES = ['ko', 'en', 'ja', 'zh', 'es', 'pt'] as const;

/**
 * 테스트 시나리오별 타임아웃 설정
 */
export const TEST_TIMEOUTS = {
  auth: 10000, // 인증 관련 10초
  navigation: 5000, // 페이지 이동 5초
  gamePlay: 15000, // 게임 플레이 15초
  apiCall: 8000, // API 호출 8초
  pageLoad: 6000, // 페이지 로드 6초
} as const;

/**
 * 에러 메시지 패턴
 */
export const ERROR_PATTERNS = {
  authRequired: /auth|login|unauthorized/i,
  networkError: /network|fetch|connection/i,
  validationError: /validation|invalid|required/i,
  serverError: /server|internal|500/i,
} as const;

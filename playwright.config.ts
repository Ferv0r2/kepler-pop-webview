import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile WebView 서비스를 위한 Playwright 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  globalSetup: require.resolve('./tests/setup/global-setup'),
  globalTeardown: require.resolve('./tests/setup/global-teardown'),
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* 모바일 WebView 최적화 설정 */
    hasTouch: true, // 터치 이벤트 지원
    isMobile: true, // 모바일 환경으로 설정

    /* 모바일 네트워크 조건 시뮬레이션 */
    launchOptions: {
      slowMo: 100, // 모바일 환경의 느린 반응 시뮬레이션
    },
  },

  /* 모바일 기기에 특화된 프로젝트 설정 */
  projects: [
    {
      name: 'Mobile Chrome Android',
      use: {
        ...devices['Pixel 5'],
        /* WebView 특화 설정 */
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 wv', // WebView UserAgent
      },
    },

    {
      name: 'Mobile Safari iOS',
      use: {
        ...devices['iPhone 12'],
        /* iOS WebView 특화 설정 */
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', // iOS WebView UserAgent
      },
    },

    {
      name: 'Mobile Chrome Small',
      use: {
        ...devices['Galaxy S5'],
        /* 소형 모바일 기기 테스트 */
      },
    },

    // 태블릿 테스트 (필요시)
    // {
    //   name: 'iPad',
    //   use: { ...devices['iPad Pro'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'pnpm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2분
    },
    {
      command: 'cd ../kepler-pop-backend && pnpm run start:dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2분
    },
  ],
});

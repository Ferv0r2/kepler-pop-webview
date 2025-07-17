/**
 * e2e 테스트 관련 타입 정의
 */

export interface TestAdminCredentials {
  email: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    name: string;
    gem: number;
    droplet: number;
    isSubscribed: boolean;
    level: number;
    exp: number;
    locale: string;
  };
}

export interface E2ETestConfig {
  baseUrl: string;
  backendUrl: string;
  timeout: number;
  retries: number;
  headless: boolean;
}

export interface AuthHelper {
  getTestAdminToken(): Promise<TestAdminCredentials>;
  loginAsTestAdmin(page: unknown): Promise<void>;
  clearAuth(page: unknown): Promise<void>;
  waitForAuth(page: unknown): Promise<void>;
}

export interface GameTestData {
  mode: 'casual' | 'challenge';
  expectedMoves: number;
  minScore: number;
}

export interface UserFlowTest {
  name: string;
  description: string;
  steps: string[];
  expectedOutcome: string;
}

export interface E2ETestPage {
  auth: string;
  main: string;
  game: string;
  leaderboard: string;
  store: string;
  settings: string;
}

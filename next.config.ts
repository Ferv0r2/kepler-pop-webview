import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    // 프로덕션 빌드에서 콘솔 로그 제거
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // 페이지 전환 최적화
    optimizeCss: true,
  },
};

export default withNextIntl(nextConfig);

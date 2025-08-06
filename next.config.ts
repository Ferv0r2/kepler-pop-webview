import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* 모바일 WebView 최적화 설정 */

  // 프로덕션 최적화
  compiler: {
    // 프로덕션 빌드에서 콘솔 로그 제거
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 모바일 성능 최적화
  experimental: {
    // 메모리 사용량 최적화
    optimizePackageImports: ['react', 'react-dom'],
  },

  // 이미지 최적화 (모바일 대역폭 고려)
  images: {
    // WebView에서 안전한 이미지 최적화
    formats: ['image/webp', 'image/avif'],
    // 모바일 기기에 맞는 이미지 크기
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 캐시 최적화
    minimumCacheTTL: 31536000, // 1년
    // 프리로딩된 이미지에 대한 우선순위 설정
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 번들 크기 최적화
  webpack: (config, { dev, isServer }) => {
    // 프로덕션에서 번들 크기 최적화
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // 트리쉐이킹 최적화
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },

  // 압축 최적화
  compress: true,

  // 정적 파일 최적화
  trailingSlash: false,

  // WebView 호환성 최적화
  poweredByHeader: false, // 불필요한 헤더 제거

  // 모바일 네트워크 고려한 타임아웃
  staticPageGenerationTimeout: 60,
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'fervorlab-pi',
  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});

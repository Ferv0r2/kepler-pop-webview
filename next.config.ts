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

  // 출력 최적화 (standalone은 특수한 배포 환경에서만 사용)
  // output: 'standalone', // 필요시에만 활성화

  // 압축 최적화
  compress: true,

  // 정적 파일 최적화
  trailingSlash: false,

  // WebView 호환성 최적화
  poweredByHeader: false, // 불필요한 헤더 제거

  // 모바일 네트워크 고려한 타임아웃
  staticPageGenerationTimeout: 60,
};

export default withNextIntl(nextConfig);

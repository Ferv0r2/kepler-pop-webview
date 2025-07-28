// Lottie 기반 confetti 헬퍼 함수들

// 글로벌 Lottie confetti 트리거 함수 타입
declare global {
  interface Window {
    addLottieConfetti?: (position: { x: number; y: number }, size?: 'small' | 'medium' | 'large') => void;
  }
}

// 성능 최적화된 Lottie confetti 트리거
export const createOptimizedParticles = (x: number, y: number, color: string) => {
  // 색상에 따라 크기를 다르게 설정 (간접적인 색상 효과)
  const colorSizeMap = {
    rose: 'small',
    cyan: 'medium',
    emerald: 'medium',
    amber: 'small',
    violet: 'large',
    fuchsia: 'medium',
  } as const;

  const size = colorSizeMap[color as keyof typeof colorSizeMap] || 'medium';

  // requestAnimationFrame을 사용하여 메인 스레드 블로킹 방지
  requestAnimationFrame(() => {
    if (window.addLottieConfetti) {
      window.addLottieConfetti({ x, y }, size);
    }
  });
};

// 게임 오버용 특별한 confetti (다중 위치에서 트리거)
export const createGameOverConfetti = () => {
  // 여러 단계로 나누어 confetti 실행
  const stages = [
    { delay: 0, position: { x: 0.2, y: 0.5 }, size: 'medium' as const },
    { delay: 300, position: { x: 0.8, y: 0.5 }, size: 'medium' as const },
    { delay: 600, position: { x: 0.5, y: 0.3 }, size: 'large' as const },
  ];

  stages.forEach(({ delay, position, size }) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (window.addLottieConfetti) {
          window.addLottieConfetti(position, size);
        }
      });
    }, delay);
  });
};

// 기존 함수는 호환성을 위해 유지 (내부적으로 Lottie 사용)
export const createParticles = (x: number, y: number, color: string) => {
  // 기존 함수와 동일하게 동작하도록 createOptimizedParticles 호출
  createOptimizedParticles(x, y, color);
};

// Framer Motion 애니메이션 variants (기존 유지)
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export const swapVariant = {
  initial: { x: 0, y: -50, opacity: 0 },
  animate: { x: 0, y: 0, opacity: 1 },
  transition: { x: { duration: 0.2, type: 'tween' }, y: { duration: 0.2, type: 'tween' }, opacity: { duration: 0.2 } },
};

export const fallVariant = {
  initial: { y: -50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { y: { duration: 0.3, type: 'spring', stiffness: 200, damping: 15 }, opacity: { duration: 0.3 } },
};

import confetti from 'canvas-confetti';

// 성능 최적화된 confetti 설정
const OPTIMIZED_CONFETTI_CONFIG = {
  particleCount: 50, // 기본값보다 줄임
  spread: 70,
  ticks: 150, // 애니메이션 지속 시간 단축
  gravity: 0.8,
  scalar: 1,
  shapes: ['circle'], // 사각형 제거로 렌더링 부담 감소
  disableForReducedMotion: true,
};

// 배치 처리된 confetti
export const createOptimizedParticles = (x: number, y: number, color: string) => {
  const colors = {
    rose: '#f43f5e',
    cyan: '#06b6d4',
    emerald: '#10b981',
    amber: '#f59e0b',
    violet: '#8b5cf6',
    fuchsia: '#d946ef',
  };

  const particleColor = colors[color as keyof typeof colors] || '#f43f5e';

  // requestAnimationFrame을 사용하여 메인 스레드 블로킹 방지
  requestAnimationFrame(() => {
    confetti({
      ...OPTIMIZED_CONFETTI_CONFIG,
      origin: { x, y },
      colors: [particleColor, '#ffffff'],
      shapes: ['circle'],
    });
  });
};

// 게임 오버용 특별한 confetti (더 많은 파티클)
export const createGameOverConfetti = () => {
  // 여러 단계로 나누어 confetti 실행
  const stages = [
    { delay: 0, config: { particleCount: 30, spread: 90, origin: { x: 0.2, y: 0.5 } } },
    { delay: 100, config: { particleCount: 30, spread: 90, origin: { x: 0.8, y: 0.5 } } },
    { delay: 200, config: { particleCount: 40, spread: 160, origin: { x: 0.5, y: 0.5 } } },
  ];

  stages.forEach(({ delay, config }) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        confetti({
          ...OPTIMIZED_CONFETTI_CONFIG,
          ...config,
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#87CEEB'],
          shapes: ['circle'],
        });
      });
    }, delay);
  });
};

// 기존 함수는 호환성을 위해 유지
export const createParticles = (x: number, y: number, color: string) => {
  const colors = {
    rose: '#f43f5e',
    cyan: '#06b6d4',
    emerald: '#10b981',
    amber: '#f59e0b',
    violet: '#8b5cf6',
    fuchsia: '#d946ef',
  };

  const particleColor = colors[color as keyof typeof colors] || '#f43f5e';

  confetti({
    particleCount: 30,
    spread: 60,
    origin: { x, y },
    colors: [particleColor, '#ffffff'],
    ticks: 200,
    gravity: 0.8,
    scalar: 1.2,
    shapes: ['circle', 'square'],
    disableForReducedMotion: true,
  });
};

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

import confetti from 'canvas-confetti';

// 파티클 효과 생성 함수
export const createParticles = (x: number, y: number, color: string) => {
  confetti({
    particleCount: 30,
    spread: 80,
    origin: { x, y },
    colors: [color],
    disableForReducedMotion: true,
    gravity: 0.8,
    scalar: 0.8,
    shapes: ['circle', 'square'],
    zIndex: 100,
  });
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

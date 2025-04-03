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

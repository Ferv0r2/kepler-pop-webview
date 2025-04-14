import confetti from 'canvas-confetti';

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

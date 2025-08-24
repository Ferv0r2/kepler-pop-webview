import type { TileType, TierType } from '@/types/game-types';

export const tileConfig: Record<
  TileType,
  {
    color: Record<TierType, string>;
    bgColor: Record<TierType, string>;
    images: Record<TierType, string>; // 등급별 이미지로 변경
  }
> = {
  1: {
    color: {
      1: 'text-red-500',
      2: 'text-red-600',
      3: 'text-red-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-red-400 to-red-600',
      2: 'bg-gradient-to-br from-red-600 to-red-800',
      3: 'bg-gradient-to-br from-red-800 to-red-900',
    },
    images: {
      1: '/plants/tulip-tile-1.png',
      2: '/plants/tulip-tile-2.png',
      3: '/plants/tulip-tile-3.png',
    },
  },
  2: {
    color: {
      1: 'text-cyan-500',
      2: 'text-cyan-600',
      3: 'text-cyan-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
      2: 'bg-gradient-to-br from-cyan-600 to-cyan-800',
      3: 'bg-gradient-to-br from-cyan-800 to-cyan-900',
    },
    images: {
      1: '/plants/crystal-cactus-tile-1.png',
      2: '/plants/crystal-cactus-tile-2.png',
      3: '/plants/crystal-cactus-tile-3.png',
    },
  },
  3: {
    color: {
      1: 'text-emerald-500',
      2: 'text-emerald-600',
      3: 'text-emerald-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      2: 'bg-gradient-to-br from-emerald-600 to-emerald-800',
      3: 'bg-gradient-to-br from-emerald-800 to-emerald-900',
    },
    images: {
      1: '/plants/sprout-tile-1.png',
      2: '/plants/sprout-tile-2.png',
      3: '/plants/sprout-tile-3.png',
    },
  },
  4: {
    color: {
      1: 'text-amber-500',
      2: 'text-amber-600',
      3: 'text-amber-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-amber-400 to-amber-600',
      2: 'bg-gradient-to-br from-amber-600 to-amber-800',
      3: 'bg-gradient-to-br from-amber-800 to-amber-900',
    },
    images: {
      1: '/plants/sunflower-tile-1.png',
      2: '/plants/sunflower-tile-2.png',
      3: '/plants/sunflower-tile-3.png',
    },
  },
  5: {
    color: {
      1: 'text-violet-500',
      2: 'text-violet-600',
      3: 'text-violet-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-violet-400 to-violet-600',
      2: 'bg-gradient-to-br from-violet-600 to-violet-800',
      3: 'bg-gradient-to-br from-violet-800 to-violet-900',
    },
    images: {
      1: '/plants/mushroom-tile-1.png',
      2: '/plants/mushroom-tile-2.png',
      3: '/plants/mushroom-tile-3.png',
    },
  },
};

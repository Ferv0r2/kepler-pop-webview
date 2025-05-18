import { Heart, Zap, Sparkles, Star, Diamond, Gem } from 'lucide-react';
import { ElementType } from 'react';

import type { ItemType, TierType } from '@/types/game-types';

export const tileConfig: Record<
  ItemType,
  {
    color: Record<TierType, string>;
    bgColor: Record<TierType, string>;
    icon: Record<TierType, ElementType>;
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
    icon: {
      1: Heart,
      2: Heart,
      3: Heart,
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
    icon: {
      1: Zap,
      2: Zap,
      3: Zap,
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
    icon: {
      1: Sparkles,
      2: Sparkles,
      3: Sparkles,
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
    icon: {
      1: Star,
      2: Star,
      3: Star,
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
    icon: {
      1: Diamond,
      2: Diamond,
      3: Diamond,
    },
  },
  6: {
    color: {
      1: 'text-fuchsia-500',
      2: 'text-fuchsia-600',
      3: 'text-fuchsia-700',
    },
    bgColor: {
      1: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600',
      2: 'bg-gradient-to-br from-fuchsia-600 to-fuchsia-800',
      3: 'bg-gradient-to-br from-fuchsia-800 to-fuchsia-900',
    },
    icon: {
      1: Gem,
      2: Gem,
      3: Gem,
    },
  },
};

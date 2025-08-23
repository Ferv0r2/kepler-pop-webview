import { motion } from 'framer-motion';
import { Star, Flame, Shield } from 'lucide-react';
import Image from 'next/image';
import React, { memo, useMemo, useRef, useCallback } from 'react';

import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GridItem } from '@/types/game-types';

interface TileComponentProps {
  item: GridItem;
  rowIndex: number;
  colIndex: number;
  isSelected: boolean;
  isDragged: boolean;
  showHint: boolean;
  isShuffling: boolean;
  onTileClick?: () => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onMouseUp?: () => void;
  onTouchStart?: () => void;
  onTouchMove?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: () => void;
  tileRef?: (el: HTMLDivElement | null) => void;
}

// 상수 캐시
const ANIMATION_SCALE_SELECTED = 1.1;
const ANIMATION_SCALE_NORMAL = 1;
const HOVER_SCALE = 1.05;
const TAP_SCALE = 0.95;

const ANIMATION_VARIANTS = Object.freeze({
  refill: Object.freeze({
    scale: 0.8,
    opacity: 0,
    y: -100,
    transition: Object.freeze({
      duration: 0,
    }),
  }),
  refillComplete: Object.freeze({
    scale: 1,
    opacity: 1,
    y: 0,
    transition: Object.freeze({
      duration: 0.4,
      ease: 'easeOut',
      delay: 0.1,
    }),
  }),
  matched: Object.freeze({
    scale: 0,
    opacity: 0,
    y: 20,
    transition: Object.freeze({
      duration: 0.3,
      ease: 'easeIn',
    }),
  }),
  normal: Object.freeze({
    scale: ANIMATION_SCALE_NORMAL,
    opacity: 1,
    y: 0,
    transition: Object.freeze({
      duration: 0.2,
      ease: 'easeOut',
    }),
  }),
  selected: Object.freeze({
    scale: ANIMATION_SCALE_SELECTED,
    opacity: 1,
    y: 0,
    transition: Object.freeze({
      duration: 0.15,
      ease: 'easeOut',
    }),
  }),
  dragged: Object.freeze({
    scale: ANIMATION_SCALE_SELECTED,
    opacity: 1,
    y: 0,
    transition: Object.freeze({
      duration: 0.1,
      ease: 'easeOut',
    }),
  }),
});

// 스타일 캐시 - 식물 이미지에 맞게 조정
const BASE_CLASSES = Object.freeze([
  'w-10 h-10 sm:w-12 sm:h-12 rounded-xl',
  'cursor-pointer',
  'flex items-center justify-center',
  'transition-all duration-200',
  'relative overflow-hidden',
  'touch-none',
  'border border-slate-200',
  'bg-gradient-to-br from-white to-slate-50',
]);

const GRADIENT_STYLE = Object.freeze({
  className: 'absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20',
});

// GPU 가속을 위한 스타일
const GPU_ACCELERATED_STYLE = Object.freeze({
  transform: 'translateZ(0)',
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden' as const,
});

export const TileComponent = memo<TileComponentProps>(
  ({
    item,
    rowIndex,
    colIndex,
    isSelected,
    isDragged,
    showHint,
    isShuffling,
    onTileClick,
    onMouseDown,
    onMouseEnter,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    tileRef,
  }) => {
    // 이전 값들을 캐시하여 불필요한 재계산 방지
    const prevItemRef = useRef(item);

    // 타일 설정 캐시 (타입과 티어가 변경될 때만 재계산)
    const { tileImage, tileBgColor } = useMemo(() => {
      if (prevItemRef.current.type === item.type && prevItemRef.current.tier === item.tier) {
        return {
          tileImage: tileConfig[prevItemRef.current.type].image,
          tileBgColor: 'bg-slate-50', // 식물 이미지에 맞는 밝은 배경
        };
      }

      prevItemRef.current = item;
      return {
        tileImage: tileConfig[item.type].image,
        tileBgColor: 'bg-slate-50', // 식물 이미지에 맞는 밝은 배경
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.type, item.tier]);

    // CSS 클래스 최적화
    const cssClasses = useMemo(() => {
      const classes = [...BASE_CLASSES];

      // Tier에 따른 추가 스타일
      if (item.tier === 2) {
        classes.push('ring-2 ring-amber-400');
      } else if (item.tier === 3) {
        classes.push('ring-2 ring-pink-400');
      }

      if (isSelected) {
        classes.push('ring-4 ring-white shadow-[0_0_15px_rgba(255,255,255,0.7)]');
      } else if (isDragged) {
        classes.push('ring-4 ring-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.7)]');
      } else {
        classes.push('shadow-md hover:shadow-lg');
      }

      if (showHint) {
        classes.push('animate-pulse ring-2 ring-yellow-300');
      }

      return classes.join(' ');
    }, [isSelected, isDragged, showHint, item.tier]);

    // 애니메이션 속성 최적화
    const animateProps = useMemo(() => {
      if (isShuffling) {
        return {
          scale: 1,
          opacity: 1,
          y: 0,
          transition: { duration: 0 },
        };
      }
      if (item.isMatched) return ANIMATION_VARIANTS.matched;
      if (isSelected) return ANIMATION_VARIANTS.selected;
      if (isDragged) return ANIMATION_VARIANTS.dragged;
      return ANIMATION_VARIANTS.normal;
    }, [isShuffling, item.isMatched, isSelected, isDragged]);

    // 이벤트 핸들러 최적화
    const optimizedHandlers = useMemo(
      () => ({
        onClick: onTileClick,
        onMouseDown,
        onMouseEnter,
        onMouseUp,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
      }),
      [onTileClick, onMouseDown, onMouseEnter, onMouseUp, onTouchStart, onTouchMove, onTouchEnd],
    );

    // 최적화된 ref 콜백
    const optimizedTileRef = useCallback(
      (el: HTMLDivElement | null) => {
        if (tileRef) tileRef(el);
      },
      [tileRef],
    );

    return (
      <motion.div
        key={item.id}
        layout={isShuffling ? 'preserve-aspect' : true}
        initial={ANIMATION_VARIANTS.refill}
        animate={animateProps}
        className={cssClasses}
        style={GPU_ACCELERATED_STYLE}
        data-testid="tile"
        data-row={rowIndex}
        data-col={colIndex}
        whileHover={{ scale: HOVER_SCALE }}
        whileTap={{ scale: TAP_SCALE }}
        ref={optimizedTileRef}
        {...optimizedHandlers}
      >
        <div {...GRADIENT_STYLE} />

        {/* Tier 2 효과 - 조건부 렌더링 최적화 */}
        {item.tier === 2 && <TierTwoEffects />}

        {/* Tier 3 효과 - 조건부 렌더링 최적화 */}
        {item.tier === 3 && <TierThreeEffects />}

        {/* 식물 이미지 렌더링 */}
        <PlantImageRenderer image={tileImage} isSelected={isSelected} alt={`Plant type ${item.type}`} />
      </motion.div>
    );
  },
);

const TierTwoEffects = memo(() => (
  <>
    <div className={`absolute inset-0 rounded-xl border-2 border-yellow-400 opacity-70 animate-pulse`} />
    <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center">
      <Star className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_3px_rgba(253,224,71,0.7)]" />
    </div>
  </>
));

const TierThreeEffects = memo(() => (
  <>
    <div className="absolute inset-0 rounded-xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
    <div
      className={`absolute inset-0 rounded-xl border border-white/30 shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] animate-pulse`}
    />
    <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center">
      <Flame className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.9)]" />
    </div>
    <div className="absolute -bottom-1 -left-1 w-5 h-5 flex items-center justify-center">
      <Shield className="w-5 h-5 text-purple-300 drop-shadow-[0_0_5px_rgba(216,180,254,0.9)]" />
    </div>
  </>
));

interface PlantImageRendererProps {
  image: string;
  isSelected: boolean;
  alt: string;
}

const PlantImageRenderer = memo<PlantImageRendererProps>(({ image, isSelected, alt }) => (
  <motion.div
    animate={{
      scale: isSelected ? [1, 1.1, 1] : 1,
      rotate: isSelected ? [0, -5, 5, 0] : 0,
    }}
    transition={{
      duration: 0.6,
      type: 'spring',
      repeat: isSelected ? Number.POSITIVE_INFINITY : 0,
      repeatDelay: 0.5,
    }}
    className="relative z-10 flex items-center justify-center w-full h-full"
  >
    <Image
      src={image}
      alt={alt}
      width={48}
      height={48}
      className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-lg object-contain"
      priority
    />
  </motion.div>
));

// 컴포넌트 displayName 설정
TileComponent.displayName = 'TileComponent';
TierTwoEffects.displayName = 'TierTwoEffects';
TierThreeEffects.displayName = 'TierThreeEffects';
PlantImageRenderer.displayName = 'PlantImageRenderer';

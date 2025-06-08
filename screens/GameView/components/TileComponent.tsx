import { motion } from 'framer-motion';
import React, { memo, createElement, useMemo, useRef, useCallback } from 'react';

import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GridItem } from '@/types/game-types';

interface TileComponentProps {
  item: GridItem;
  rowIndex: number;
  colIndex: number;
  isSelected: boolean;
  isDragged: boolean;
  showHint: boolean;
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

// 최적화된 애니메이션 변형 (불변 객체)
const OPTIMIZED_VARIANTS = Object.freeze({
  fall: Object.freeze({
    initial: Object.freeze({ opacity: 1, y: 0 }),
    animate: Object.freeze({ opacity: 0, y: 50 }),
    transition: Object.freeze({ duration: 0.2, ease: 'easeIn' }),
  }),
  swap: Object.freeze({
    initial: Object.freeze({ scale: 1 }),
    animate: Object.freeze({ scale: 1 }),
    transition: Object.freeze({ duration: 0.15, ease: 'easeOut' }),
  }),
});

// 스타일 캐시
const BASE_CLASSES = Object.freeze([
  'w-10 h-10 sm:w-12 sm:h-12 rounded-xl',
  'cursor-pointer',
  'flex items-center justify-center',
  'transition-shadow duration-200',
  'relative overflow-hidden',
  'touch-none',
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
    const prevIsSelectedRef = useRef(isSelected);

    // 타일 설정 캐시 (타입과 티어가 변경될 때만 재계산)
    const { tileIcon, tileBgColor } = useMemo(() => {
      if (prevItemRef.current.type === item.type && prevItemRef.current.tier === item.tier) {
        return {
          tileIcon: tileConfig[prevItemRef.current.type].icon[prevItemRef.current.tier],
          tileBgColor: tileConfig[prevItemRef.current.type].bgColor[prevItemRef.current.tier],
        };
      }

      prevItemRef.current = item;
      return {
        tileIcon: tileConfig[item.type].icon[item.tier],
        tileBgColor: tileConfig[item.type].bgColor[item.tier],
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.type, item.tier]);

    // 스케일 최적화
    const scale = useMemo(() => {
      if (item.isMatched) return 0;
      if (isSelected || isDragged) return ANIMATION_SCALE_SELECTED;
      return ANIMATION_SCALE_NORMAL;
    }, [item.isMatched, isSelected, isDragged]);

    // 회전 최적화 (선택 상태가 변경될 때만 재계산)
    const rotation = useMemo(() => {
      if (prevIsSelectedRef.current === isSelected) {
        return isSelected ? [0, 5, 0, -5, 0] : 0;
      }
      prevIsSelectedRef.current = isSelected;
      return isSelected ? [0, 5, 0, -5, 0] : 0;
    }, [isSelected]);

    // CSS 클래스 최적화
    const cssClasses = useMemo(() => {
      const classes = [...BASE_CLASSES, tileBgColor];

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
    }, [tileBgColor, isSelected, isDragged, showHint]);

    // 애니메이션 속성 최적화
    const animateProps = useMemo(() => {
      const variant = item.isMatched ? OPTIMIZED_VARIANTS.fall : OPTIMIZED_VARIANTS.swap;
      return {
        ...variant.animate,
        scale,
        rotate: rotation,
      };
    }, [item.isMatched, scale, rotation]);

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
        layout
        initial={item.isMatched ? OPTIMIZED_VARIANTS.fall.initial : OPTIMIZED_VARIANTS.swap.initial}
        animate={animateProps}
        transition={item.isMatched ? OPTIMIZED_VARIANTS.fall.transition : OPTIMIZED_VARIANTS.swap.transition}
        className={cssClasses}
        style={GPU_ACCELERATED_STYLE}
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

        {/* 아이콘 렌더링 최적화 */}
        <IconRenderer icon={tileIcon} isSelected={isSelected} />
      </motion.div>
    );
  },
);

const TierTwoEffects = memo(() => (
  <>
    <div className="absolute inset-0 rounded-xl border-2 border-yellow-400 opacity-70 animate-pulse" />
    <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_3px_rgba(253,224,71,0.7)]"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  </>
));

const TierThreeEffects = memo(() => (
  <>
    <div className="absolute inset-0 rounded-xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
    <div className="absolute inset-0 rounded-xl border border-white/30 shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] animate-pulse" />
    <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.9)]"
      >
        <path
          fillRule="evenodd"
          d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
          clipRule="evenodd"
        />
        <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
      </svg>
    </div>
    <div className="absolute -bottom-1 -left-1 w-5 h-5 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5 text-purple-300 drop-shadow-[0_0_5px_rgba(216,180,254,0.9)] animate-pulse"
      >
        <path
          fillRule="evenodd"
          d="M11.484 2.17a.75.75 0 011.032 0 11.209 11.209 0 007.877 3.08.75.75 0 01.722.515 12.74 12.74 0 01.635 3.985c0 5.942-4.064 10.933-9.563 12.348a.749.749 0 01-.374 0C6.314 20.683 2.25 15.692 2.25 9.75c0-1.39.223-2.73.635-3.985a.75.75 0 01.722-.516l.143.001c2.996 0 5.718-1.17 7.734-3.08zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zM12 15a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008a.75.75 0 00-.75-.75H12z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  </>
));

interface IconRendererProps {
  icon: React.ElementType;
  isSelected: boolean;
}

const IconRenderer = memo<IconRendererProps>(({ icon, isSelected }) => (
  <motion.div
    animate={{ rotate: isSelected ? 360 : 0 }}
    transition={{
      duration: 1,
      type: 'tween',
      repeat: isSelected ? Number.POSITIVE_INFINITY : 0,
    }}
    className="relative z-10"
  >
    {createElement(icon, {
      className: 'w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md',
      strokeWidth: 2.5,
    } as Record<string, unknown>)}
  </motion.div>
));

// 컴포넌트 displayName 설정
TileComponent.displayName = 'TileComponent';
TierTwoEffects.displayName = 'TierTwoEffects';
TierThreeEffects.displayName = 'TierThreeEffects';
IconRenderer.displayName = 'IconRenderer';

// 커스텀 비교 함수로 불필요한 리렌더링 방지
export const areEqual = (prevProps: TileComponentProps, nextProps: TileComponentProps): boolean => {
  // 가장 중요한 props만 빠르게 비교
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.isMatched === nextProps.item.isMatched &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragged === nextProps.isDragged &&
    prevProps.showHint === nextProps.showHint &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.item.tier === nextProps.item.tier
  );
};

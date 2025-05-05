import { AnimatePresence } from 'framer-motion';

import type { GameItemType } from '@/types/game-types';
import { ShovelAnimation, MoleAnimation, BombAnimation } from '@/utils/item-animations';

interface ItemAnimationProps {
  itemType: GameItemType | null;
  row: number;
  col: number;
  direction?: 'row' | 'col';
  left?: number;
  top?: number;
  onComplete: () => void;
}

export const ItemAnimationManager = ({
  itemType,
  row,
  col,
  direction = 'row',
  left,
  top,
  onComplete,
}: ItemAnimationProps) => {
  return (
    <AnimatePresence mode="wait">
      {itemType === 'shovel' && (
        <ShovelAnimation key="shovel-animation" row={row} col={col} left={left} top={top} onComplete={onComplete} />
      )}

      {itemType === 'mole' && (
        <MoleAnimation
          key="mole-animation"
          row={row}
          col={col}
          direction={direction}
          left={left}
          top={top}
          onComplete={onComplete}
        />
      )}

      {itemType === 'bomb' && (
        <BombAnimation key="bomb-animation" row={row} col={col} left={left} top={top} onComplete={onComplete} />
      )}
    </AnimatePresence>
  );
};

'use client';

import { Suspense } from 'react';

import { GameBoard } from '@/components/logic/GameBoard';

export default function GameScreen() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameBoard />
    </Suspense>
  );
}

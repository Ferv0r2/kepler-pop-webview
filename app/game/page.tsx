'use client';

import { Suspense } from 'react';

import { GameView } from '@/screens/GameView';
import { LoadingView } from '@/screens/LoadingView';

export default function GameScreen() {
  return (
    <Suspense fallback={<LoadingView />}>
      <GameView />
    </Suspense>
  );
}

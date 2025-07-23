// Web Worker for heavy game computations

import type { GridItem } from '@/types/game-types';
import { findMatches, findPossibleMoves } from '@/utils/performance-helper';

export interface WorkerMessage {
  type: 'FIND_MATCHES' | 'FIND_POSSIBLE_MOVES' | 'CALCULATE_SCORE' | 'PROCESS_GRID';
  payload: {
    grid?: GridItem[][];
    matchCount?: number;
    combo?: number;
    streak?: number;
  };
  id: string;
}

export interface WorkerResponse {
  type: string;
  payload: unknown;
  id: string;
  error?: string;
}

// 점수 계산 (최적화된 버전)
const calculateScore = (matchCount: number, combo: number, streak: number): number => {
  const baseScore = 100;
  const comboMultiplier = Math.max(1, combo * 0.5);
  const streakMultiplier = Math.max(1, streak * 0.3);

  return Math.floor(matchCount * baseScore * comboMultiplier * streakMultiplier);
};

// Worker 메시지 핸들러
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    let result: unknown;

    switch (type) {
      case 'FIND_MATCHES':
        if (!payload.grid) throw new Error('Grid is required for FIND_MATCHES');
        result = findMatches(payload.grid);
        break;

      case 'FIND_POSSIBLE_MOVES':
        if (!payload.grid) throw new Error('Grid is required for FIND_POSSIBLE_MOVES');
        // 반환 형식을 맞추기 위해 변환
        const moves = findPossibleMoves(payload.grid);
        result = moves.map((move) => ({
          row1: move.from.row,
          col1: move.from.col,
          row2: move.to.row,
          col2: move.to.col,
        }));
        break;

      case 'CALCULATE_SCORE':
        if (payload.matchCount === undefined || payload.combo === undefined || payload.streak === undefined) {
          throw new Error('matchCount, combo, and streak are required for CALCULATE_SCORE');
        }
        result = calculateScore(payload.matchCount, payload.combo, payload.streak);
        break;

      case 'PROCESS_GRID':
        if (!payload.grid) throw new Error('Grid is required for PROCESS_GRID');
        result = structuredClone(payload.grid);
        break;

      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }

    const response: WorkerResponse = {
      type,
      payload: result,
      id,
    };

    self.postMessage(response);
  } catch (error) {
    const errorResponse: WorkerResponse = {
      type,
      payload: null,
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(errorResponse);
  }
};

export {};

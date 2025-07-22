import { useCallback } from 'react';

import type { GridItem, GameState } from '@/types/game-types';

// 타이머 관리자 클래스
export class TimerManager {
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();

  setTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  };

  setInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  };

  clearTimeout = (timer: NodeJS.Timeout): void => {
    clearTimeout(timer);
    this.timers.delete(timer);
  };

  clearInterval = (interval: NodeJS.Timeout): void => {
    clearInterval(interval);
    this.intervals.delete(interval);
  };

  cleanup = (): void => {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.intervals.forEach((interval) => clearInterval(interval));
    this.timers.clear();
    this.intervals.clear();
  };

  getActiveCount = (): number => {
    return this.timers.size + this.intervals.size;
  };
}

// 메모리 사용량 모니터링
export const useMemoryMonitor = () => {
  const checkMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (
        performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
      ).memory;
      const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

      const percentage = (used / limit) * 100;

      if (percentage > 80) {
        console.warn(`⚠️ 메모리 사용량 높음: ${used}MB / ${limit}MB (${percentage.toFixed(1)}%)`);

        // 가비지 컬렉션 제안
        if (percentage > 90) {
          console.error('🚨 메모리 임계치 초과! 가비지 컬렉션 필요');
          // 강제 가비지 컬렉션 (개발 환경에서만)
          if (process.env.NODE_ENV === 'development' && 'gc' in window) {
            (window as { gc: () => void }).gc();
          }
        }
      }

      return { used, total, limit, percentage };
    }
    return null;
  }, []);

  return { checkMemory };
};

// 최적화된 그리드 복사 함수
export const shallowCopyGrid = (grid: GridItem[][]): GridItem[][] => {
  return grid.map((row) => row.map((item) => ({ ...item })));
};

// 선택적 그리드 업데이트 (메모리 효율적)
export const updateGridSelective = (
  grid: GridItem[][],
  updates: Array<{ row: number; col: number; changes: Partial<GridItem> }>,
): GridItem[][] => {
  // 변경이 필요한 행만 복사
  const updatedRows = new Set(updates.map((u) => u.row));
  const newGrid = grid.map((row, rowIndex) => {
    if (!updatedRows.has(rowIndex)) {
      return row; // 변경되지 않은 행은 그대로 참조
    }

    // 변경이 필요한 행만 새로 생성
    return row.map((item, colIndex) => {
      const update = updates.find((u) => u.row === rowIndex && u.col === colIndex);
      return update ? { ...item, ...update.changes } : item;
    });
  });

  return newGrid;
};

// GameState 관리를 위한 reducer
export interface GameStateAction {
  type:
    | 'UPDATE_SCORE'
    | 'UPDATE_MOVES'
    | 'UPDATE_COMBO'
    | 'UPDATE_TURN'
    | 'SET_SWAPPING'
    | 'SET_CHECKING'
    | 'SET_GAME_OVER'
    | 'SET_PROCESSING'
    | 'RESET';
  payload?: Partial<GameState>;
}

export const gameStateReducer = (state: GameState, action: GameStateAction): GameState => {
  switch (action.type) {
    case 'UPDATE_SCORE':
      return { ...state, score: action.payload?.score ?? state.score };
    case 'UPDATE_MOVES':
      return { ...state, moves: action.payload?.moves ?? state.moves };
    case 'UPDATE_COMBO':
      return { ...state, combo: action.payload?.combo ?? state.combo };
    case 'UPDATE_TURN':
      return { ...state, turn: action.payload?.turn ?? state.turn };
    case 'SET_SWAPPING':
      return { ...state, isSwapping: action.payload?.isSwapping ?? false };
    case 'SET_CHECKING':
      return { ...state, isChecking: action.payload?.isChecking ?? false };
    case 'SET_GAME_OVER':
      return { ...state, isGameOver: action.payload?.isGameOver ?? false };
    case 'SET_PROCESSING':
      return { ...state, isProcessingMatches: action.payload?.isProcessingMatches ?? false };
    case 'RESET':
      return action.payload as GameState;
    default:
      return state;
  }
};

// UI 상태 관리를 위한 reducer
export interface UIState {
  showScorePopup: { score: number; x: number; y: number } | null;
  showBackConfirmation: boolean;
  showSettingsMenu: boolean;
  showHint: boolean;
  showTutorial: boolean;
  tutorialStep: number;
  showShuffleToast: boolean;
  showRestartConfirmation: boolean;
  showEnergyModal: boolean;
  showReviveOptions: boolean;
  isReviveAdLoading: boolean;
  showShuffleConfirmation: boolean;
  showShuffleButton: boolean;
  isShuffling: boolean;
  showBonusMovesAnimation: number;
  isLoading: boolean;
  longPressItem: string | null;
}

export interface UIStateAction {
  type: keyof UIState | 'RESET_ALL' | 'BATCH_UPDATE';
  payload?: Partial<UIState>;
}

export const uiStateReducer = (state: UIState, action: UIStateAction): UIState => {
  switch (action.type) {
    case 'RESET_ALL':
      return {
        showScorePopup: null,
        showBackConfirmation: false,
        showSettingsMenu: false,
        showHint: false,
        showTutorial: false,
        tutorialStep: 1,
        showShuffleToast: false,
        showRestartConfirmation: false,
        showEnergyModal: false,
        showReviveOptions: false,
        isReviveAdLoading: false,
        showShuffleConfirmation: false,
        showShuffleButton: false,
        isShuffling: false,
        showBonusMovesAnimation: 0,
        isLoading: false,
        longPressItem: null,
      };
    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };
    default:
      return { ...state, [action.type]: action.payload?.[action.type] };
  }
};

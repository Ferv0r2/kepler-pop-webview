import { useCallback, useEffect, useRef, useState } from 'react';

import type { GridItem } from '@/types/game-types';

import type { WorkerMessage, WorkerResponse } from '../workers/game-worker';

interface UseGameWorkerOptions {
  enabled?: boolean;
  fallbackTimeout?: number;
}

interface WorkerTask {
  id: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  startTime: number;
}

export const useGameWorker = (options: UseGameWorkerOptions = {}) => {
  const { enabled = true, fallbackTimeout = 5000 } = options;
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, WorkerTask>>(new Map());
  const [isWorkerAvailable, setIsWorkerAvailable] = useState(false);
  const [workerMetrics, setWorkerMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageTime: 0,
  });

  // Worker 초기화
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    try {
      // Web Worker 생성
      const worker = new Worker(new URL('../workers/game-worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { payload, id, error } = event.data;
        const task = tasksRef.current.get(id);

        if (!task) return;

        // 타이머 정리
        clearTimeout(task.timeout);
        tasksRef.current.delete(id);

        // 메트릭 업데이트
        const executionTime = performance.now() - task.startTime;
        setWorkerMetrics((prev) => ({
          totalTasks: prev.totalTasks,
          completedTasks: error ? prev.completedTasks : prev.completedTasks + 1,
          failedTasks: error ? prev.failedTasks + 1 : prev.failedTasks,
          averageTime: (prev.averageTime * prev.completedTasks + executionTime) / (prev.completedTasks + 1),
        }));

        if (error) {
          task.reject(new Error(error));
        } else {
          task.resolve(payload);
        }
      };

      worker.onerror = (error) => {
        console.error('[GameWorker] Worker error:', error);
        setIsWorkerAvailable(false);
      };

      workerRef.current = worker;
      setIsWorkerAvailable(true);

      if (process.env.NODE_ENV === 'development') {
        console.log('[GameWorker] Worker initialized successfully');
      }
    } catch (error) {
      console.error('[GameWorker] Failed to initialize worker:', error);
      setIsWorkerAvailable(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      // 남은 작업들 정리
      tasksRef.current.forEach((task) => {
        clearTimeout(task.timeout);
        task.reject(new Error('Worker terminated'));
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      tasksRef.current.clear();

      setIsWorkerAvailable(false);
    };
  }, [enabled]);

  // Worker 작업 실행
  const executeWorkerTask = useCallback(
    <T>(message: Omit<WorkerMessage, 'id'>): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!isWorkerAvailable || !workerRef.current) {
          reject(new Error('Worker not available'));
          return;
        }

        const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();

        // 타임아웃 설정
        const timeout = setTimeout(() => {
          tasksRef.current.delete(id);
          setWorkerMetrics((prev) => ({
            ...prev,
            failedTasks: prev.failedTasks + 1,
          }));
          reject(new Error('Worker task timeout'));
        }, fallbackTimeout);

        // 작업 등록
        tasksRef.current.set(id, {
          id,
          resolve: resolve as (value: unknown) => void,
          reject,
          timeout,
          startTime,
        });

        // 메트릭 업데이트
        setWorkerMetrics((prev) => ({
          ...prev,
          totalTasks: prev.totalTasks + 1,
        }));

        // Worker에 메시지 전송
        const workerMessage: WorkerMessage = { ...message, id };
        workerRef.current.postMessage(workerMessage);
      });
    },
    [isWorkerAvailable, fallbackTimeout],
  );

  // 매치 찾기 (Worker 사용)
  const findMatches = useCallback(
    async (grid: GridItem[][]): Promise<Array<{ row: number; col: number }>> => {
      if (!isWorkerAvailable) {
        throw new Error('Worker not available for match finding');
      }

      return executeWorkerTask<Array<{ row: number; col: number }>>({
        type: 'FIND_MATCHES',
        payload: { grid },
      });
    },
    [executeWorkerTask, isWorkerAvailable],
  );

  // 가능한 이동 찾기 (Worker 사용)
  const findPossibleMoves = useCallback(
    async (grid: GridItem[][]): Promise<Array<{ row1: number; col1: number; row2: number; col2: number }>> => {
      if (!isWorkerAvailable) {
        throw new Error('Worker not available for move finding');
      }

      return executeWorkerTask<Array<{ row1: number; col1: number; row2: number; col2: number }>>({
        type: 'FIND_POSSIBLE_MOVES',
        payload: { grid },
      });
    },
    [executeWorkerTask, isWorkerAvailable],
  );

  // 점수 계산 (Worker 사용)
  const calculateScore = useCallback(
    async (matchCount: number, combo: number, streak: number): Promise<number> => {
      if (!isWorkerAvailable) {
        throw new Error('Worker not available for score calculation');
      }

      return executeWorkerTask<number>({
        type: 'CALCULATE_SCORE',
        payload: { matchCount, combo, streak },
      });
    },
    [executeWorkerTask, isWorkerAvailable],
  );

  // 그리드 처리 (Worker 사용)
  const processGrid = useCallback(
    async (grid: GridItem[][]): Promise<GridItem[][]> => {
      if (!isWorkerAvailable) {
        throw new Error('Worker not available for grid processing');
      }

      return executeWorkerTask<GridItem[][]>({
        type: 'PROCESS_GRID',
        payload: { grid },
      });
    },
    [executeWorkerTask, isWorkerAvailable],
  );

  // Worker 상태 확인
  const getWorkerStatus = useCallback(() => {
    return {
      isAvailable: isWorkerAvailable,
      pendingTasks: tasksRef.current.size,
      metrics: workerMetrics,
    };
  }, [isWorkerAvailable, workerMetrics]);

  // Worker 리셋
  const resetWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    tasksRef.current.forEach((task) => {
      clearTimeout(task.timeout);
      task.reject(new Error('Worker reset'));
    });
    tasksRef.current.clear();

    setWorkerMetrics({
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTime: 0,
    });
  }, []);

  return {
    // Worker 함수들
    findMatches,
    findPossibleMoves,
    calculateScore,
    processGrid,

    // Worker 상태 및 제어
    isWorkerAvailable,
    getWorkerStatus,
    resetWorker,

    // 메트릭
    workerMetrics,
  };
};

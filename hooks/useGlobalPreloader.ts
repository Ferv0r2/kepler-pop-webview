'use client';

import { useEffect, useState } from 'react';

import { startAdvancedPreloading, getPreloadingState } from '@/utils/advanced-preloader';

interface PreloadingState {
  isLoading: boolean;
  progress: number;
  loadedCount: number;
  totalCount: number;
  isComplete: boolean;
}

/**
 * 전역 이미지 프리로딩을 관리하는 훅
 */
export const useGlobalPreloader = () => {
  const [state, setState] = useState<PreloadingState>({
    isLoading: false,
    progress: 0,
    loadedCount: 0,
    totalCount: 0,
    isComplete: false,
  });

  useEffect(() => {
    const startPreloading = async () => {
      // 이미 로드된 경우 스킵
      if (typeof window !== 'undefined') {
        const isAlreadyLoaded = sessionStorage.getItem('advancedImagesLoaded') === 'true';
        if (isAlreadyLoaded) {
          setState({
            isLoading: false,
            progress: 100,
            loadedCount: parseInt(sessionStorage.getItem('loadedImagesCount') || '0'),
            totalCount: parseInt(sessionStorage.getItem('loadedImagesCount') || '0'),
            isComplete: true,
          });
          console.log('✅ 이미지가 이미 프리로드되어 있습니다.');
          return;
        }
      }

      console.log('🚀 전역 이미지 프리로딩 시작...');
      setState((prev) => ({ ...prev, isLoading: true, isComplete: false }));

      try {
        await startAdvancedPreloading((progress) => {
          const currentState = getPreloadingState();
          setState({
            isLoading: true,
            progress,
            loadedCount: currentState.loadedCount,
            totalCount: currentState.totalImages,
            isComplete: false,
          });
        });

        const finalState = getPreloadingState();
        setState({
          isLoading: false,
          progress: 100,
          loadedCount: finalState.loadedCount,
          totalCount: finalState.totalImages,
          isComplete: true,
        });

        console.log('🎉 전역 이미지 프리로딩 완료!');
      } catch (error) {
        console.error('전역 이미지 프리로딩 실패:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isComplete: true,
        }));
      }
    };

    // 컴포넌트 마운트 후 즉시 시작
    void startPreloading();
  }, []);

  return state;
};

/**
 * 웹뷰 환경에서 이미지 프리로딩을 강제로 시작하는 함수
 */
export const forceImagePreloading = async (): Promise<void> => {
  console.log('🔄 강제 이미지 프리로딩 시작...');

  try {
    await startAdvancedPreloading();
    console.log('✅ 강제 이미지 프리로딩 완료!');
  } catch (error) {
    console.error('❌ 강제 이미지 프리로딩 실패:', error);
  }
};

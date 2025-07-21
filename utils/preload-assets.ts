// 모든 이미지와 음성 파일을 미리 로드하는 유틸리티

import { startAdvancedPreloading, preloadAllImagesAdvanced } from './advanced-preloader';
import { getAllImagePaths } from './image-collector';

// 이미지 파일 목록 (호환성을 위해 유지)
const IMAGE_ASSETS = getAllImagePaths();

// 음성 파일 목록
const SOUND_ASSETS = [
  '/sounds/effect/reward.wav',
  '/sounds/effect/match.mp3',
  '/sounds/effect/game-over.wav',
  '/sounds/effect/button.mp3',
  '/sounds/effect/artifact.wav',
];

/**
 * 이미지 파일을 미리 로드합니다. (고급 프리로딩 시스템 사용)
 */
export const preloadImages = async (): Promise<void> => {
  try {
    await startAdvancedPreloading();
    console.log('모든 이미지 파일이 미리 로드되었습니다. (고급 시스템)');
  } catch (error) {
    console.warn('고급 이미지 미리 로드 중 오류 발생:', error);

    // 폴백: 기존 방식으로 로드
    const imagePromises = IMAGE_ASSETS.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`이미지 로드 실패: ${src}`);
          resolve(); // 실패해도 계속 진행
        };
        img.src = src;
      });
    });

    try {
      await Promise.all(imagePromises);
      console.log('모든 이미지 파일이 미리 로드되었습니다. (폴백 방식)');
    } catch (fallbackError) {
      console.warn('폴백 이미지 미리 로드 중 오류 발생:', fallbackError);
    }
  }
};

/**
 * 음성 파일을 미리 로드합니다.
 */
export const preloadSounds = async (): Promise<void> => {
  const audioPromises = SOUND_ASSETS.map((src) => {
    return new Promise<void>((resolve) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve();
      audio.onerror = () => {
        console.warn(`음성 파일 로드 실패: ${src}`);
        resolve(); // 실패해도 계속 진행
      };
      audio.src = src;
      audio.load();
    });
  });

  try {
    await Promise.all(audioPromises);
    console.log('모든 음성 파일이 미리 로드되었습니다.');
  } catch (error) {
    console.warn('음성 파일 미리 로드 중 오류 발생:', error);
  }
};

/**
 * 모든 에셋(이미지, 음성)을 미리 로드합니다.
 */
export const preloadAllAssets = async (): Promise<void> => {
  console.log('에셋 미리 로드 시작...');

  try {
    // 이미지와 음성을 병렬로 로드
    await Promise.all([preloadImages(), preloadSounds()]);

    console.log('모든 에셋이 성공적으로 미리 로드되었습니다.');
  } catch (error) {
    console.warn('에셋 미리 로드 중 오류 발생:', error);
  }
};

/**
 * 로딩 진행률을 추적하는 함수 (고급 프리로딩 시스템 사용)
 */
export const preloadAssetsWithProgress = async (onProgress?: (progress: number) => void): Promise<void> => {
  try {
    // 이미지는 고급 시스템으로 로드 (진행률 포함)
    await preloadAllImagesAdvanced((imageProgress) => {
      // 이미지 로딩이 전체의 80%를 차지하도록 설정
      const weightedProgress = (imageProgress * 80) / 100;
      onProgress?.(weightedProgress);
    });

    // 음성 파일 로드 (나머지 20%)
    const totalSounds = SOUND_ASSETS.length;
    let loadedSounds = 0;

    const updateSoundProgress = () => {
      loadedSounds++;
      const soundProgress = (loadedSounds / totalSounds) * 20; // 나머지 20%
      const totalProgress = 80 + soundProgress; // 이미지 80% + 음성 20%
      onProgress?.(totalProgress);
    };

    const audioPromises = SOUND_ASSETS.map((src) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
          updateSoundProgress();
          resolve();
        };
        audio.onerror = () => {
          console.warn(`음성 파일 로드 실패: ${src}`);
          updateSoundProgress();
          resolve();
        };
        audio.src = src;
        audio.load();
      });
    });

    await Promise.all(audioPromises);
    console.log('모든 에셋이 성공적으로 미리 로드되었습니다. (고급 시스템)');
  } catch (error) {
    console.warn('고급 에셋 미리 로드 중 오류 발생:', error);

    // 폴백: 기존 방식
    const totalAssets = IMAGE_ASSETS.length + SOUND_ASSETS.length;
    let loadedAssets = 0;

    const updateProgress = () => {
      loadedAssets++;
      const progress = (loadedAssets / totalAssets) * 100;
      onProgress?.(progress);
    };

    // 이미지 로드
    const imagePromises = IMAGE_ASSETS.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          updateProgress();
          resolve();
        };
        img.onerror = () => {
          console.warn(`이미지 로드 실패: ${src}`);
          updateProgress();
          resolve();
        };
        img.src = src;
      });
    });

    // 음성 로드
    const audioPromises = SOUND_ASSETS.map((src) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
          updateProgress();
          resolve();
        };
        audio.onerror = () => {
          console.warn(`음성 파일 로드 실패: ${src}`);
          updateProgress();
          resolve();
        };
        audio.src = src;
        audio.load();
      });
    });

    try {
      await Promise.all([...imagePromises, ...audioPromises]);
      console.log('모든 에셋이 성공적으로 미리 로드되었습니다. (폴백 방식)');
    } catch (fallbackError) {
      console.warn('폴백 에셋 미리 로드 중 오류 발생:', fallbackError);
    }
  }
};

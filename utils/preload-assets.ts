// 모든 이미지와 음성 파일을 미리 로드하는 유틸리티

// 이미지 파일 목록
const IMAGE_ASSETS = [
  // Icons
  '/icons/watering-can.png',
  '/icons/water-tanks.png',
  '/icons/treasure-pile.png',
  '/icons/treasure-chest.png',
  '/icons/dice.png',
  '/icons/trophy.png',
  '/icons/gem.png',
  '/icons/map.png',
  '/icons/droplet.png',
  '/icons/shovel.png',
  '/icons/mole.png',
  '/icons/logo.png',
  '/icons/bomb.png',

  // Plants
  '/plants/tulip.png',
  '/plants/sunflower.png',
  '/plants/sprout.png',
  '/plants/mushroom.png',
  '/plants/crystal-cactus.png',

  // Banners
  '/banners/loading-banner.png',
];

// 음성 파일 목록
const SOUND_ASSETS = [
  '/sounds/effect/reward.wav',
  '/sounds/effect/match.mp3',
  '/sounds/effect/game-over.wav',
  '/sounds/effect/button.mp3',
  '/sounds/effect/artifact.wav',
];

/**
 * 이미지 파일을 미리 로드합니다.
 */
export const preloadImages = async (): Promise<void> => {
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
    console.log('모든 이미지 파일이 미리 로드되었습니다.');
  } catch (error) {
    console.warn('이미지 미리 로드 중 오류 발생:', error);
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
 * 로딩 진행률을 추적하는 함수
 */
export const preloadAssetsWithProgress = async (onProgress?: (progress: number) => void): Promise<void> => {
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
    console.log('모든 에셋이 성공적으로 미리 로드되었습니다.');
  } catch (error) {
    console.warn('에셋 미리 로드 중 오류 발생:', error);
  }
};

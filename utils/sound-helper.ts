/**
 * 효과음 재생을 위한 헬퍼 유틸리티
 */

// 효과음 타입 정의
export type SoundType = 'match' | 'combo' | 'item' | 'shuffle' | 'gameOver' | 'button';

// 효과음 설정 인터페이스
export interface SoundSettings {
  volume: number;
  enabled: boolean;
}

// 기본 효과음 설정
const defaultSettings: SoundSettings = {
  volume: 0.7,
  enabled: true,
};

// 효과음 파일 경로 매핑
const SOUND_PATHS: Record<SoundType, string> = {
  match: '/sounds/effect/match.mp3',
  combo: '/sounds/effect/match.mp3',
  item: '/sounds/effect/match.mp3',
  shuffle: '/sounds/effect/match.mp3',
  gameOver: '/sounds/effect/game-over.wav',
  button: '/sounds/effect/button.mp3',
};

// 효과음 인스턴스 캐시
const audioCache = new Map<string, HTMLAudioElement>();

// 로딩 상태 추적
let isPreloading = false;
let preloadPromise: Promise<void> | null = null;

/**
 * 모든 효과음을 미리 로드합니다.
 */
export const preloadAllSounds = async (): Promise<void> => {
  if (isPreloading && preloadPromise) {
    return preloadPromise;
  }

  if (audioCache.size === Object.keys(SOUND_PATHS).length) {
    // 이미 모든 효과음이 로드된 경우
    console.log('모든 효과음이 이미 로드되어 있습니다.');
    return Promise.resolve();
  }

  isPreloading = true;
  console.log('효과음 병렬 로드 시작...');

  preloadPromise = new Promise<void>((resolve, reject) => {
    const soundTypes = Object.keys(SOUND_PATHS) as SoundType[];
    let loadedCount = 0;
    let hasError = false;
    const startTime = Date.now();

    const checkComplete = () => {
      loadedCount++;
      console.log(`효과음 로드 진행: ${loadedCount}/${soundTypes.length}`);

      if (loadedCount === soundTypes.length) {
        const loadTime = Date.now() - startTime;
        isPreloading = false;

        if (hasError) {
          console.warn(`효과음 로드 완료 (일부 실패) - 소요시간: ${loadTime}ms`);
          reject(new Error('일부 효과음 로드에 실패했습니다.'));
        } else {
          console.log(`모든 효과음 로드 완료 - 소요시간: ${loadTime}ms`);
          resolve();
        }
      }
    };

    // 모든 효과음을 병렬로 로드
    const loadPromises = soundTypes.map((soundType) => {
      return new Promise<void>((resolveSound) => {
        console.log(`효과음 로드 시작: ${soundType} (${SOUND_PATHS[soundType]})`);

        const audio = new Audio(SOUND_PATHS[soundType]);
        audio.preload = 'auto';

        audio.addEventListener(
          'canplaythrough',
          () => {
            audioCache.set(soundType, audio);
            console.log(`✅ 효과음 로드 완료: ${soundType}`);
            resolveSound();
            checkComplete();
          },
          { once: true },
        );

        audio.addEventListener(
          'error',
          (error) => {
            console.warn(`❌ 효과음 로드 실패: ${soundType}`, error);
            hasError = true;
            resolveSound();
            checkComplete();
          },
          { once: true },
        );

        // 타임아웃 설정 (3초로 단축)
        setTimeout(() => {
          if (!audioCache.has(soundType)) {
            console.warn(`⏰ 효과음 로드 타임아웃: ${soundType}`);
            hasError = true;
            resolveSound();
            checkComplete();
          }
        }, 3000);
      });
    });

    // 모든 로드 프로미스를 병렬로 실행
    Promise.all(loadPromises).catch((error) => {
      console.error('효과음 로드 중 오류:', error);
      hasError = true;
    });
  });

  return preloadPromise;
};

/**
 * 특정 효과음을 미리 로드합니다.
 */
export const preloadSound = async (soundType: SoundType): Promise<void> => {
  if (audioCache.has(soundType)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(SOUND_PATHS[soundType]);
    audio.preload = 'auto';

    audio.addEventListener(
      'canplaythrough',
      () => {
        audioCache.set(soundType, audio);
        resolve();
      },
      { once: true },
    );

    audio.addEventListener(
      'error',
      () => {
        console.warn(`효과음 로드 실패: ${soundType}`);
        reject(new Error(`효과음 로드 실패: ${soundType}`));
      },
      { once: true },
    );

    // 타임아웃 설정 (5초)
    setTimeout(() => {
      if (!audioCache.has(soundType)) {
        console.warn(`효과음 로드 타임아웃: ${soundType}`);
        reject(new Error(`효과음 로드 타임아웃: ${soundType}`));
      }
    }, 5000);
  });
};

/**
 * 효과음 인스턴스를 가져오거나 생성합니다.
 */
const getAudioInstance = (soundType: SoundType): HTMLAudioElement => {
  const cacheKey = soundType;

  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  // 캐시에 없으면 즉시 생성 (미리 로드되지 않은 경우)
  const audio = new Audio(SOUND_PATHS[soundType]);
  audio.preload = 'auto';
  audioCache.set(cacheKey, audio);

  return audio;
};

/**
 * 효과음을 재생합니다.
 */
export const playSound = (soundType: SoundType, settings: SoundSettings = defaultSettings): void => {
  if (!settings.enabled) return;

  try {
    const audio = getAudioInstance(soundType);

    // 볼륨 설정
    audio.volume = Math.max(0, Math.min(1, settings.volume));

    // 현재 재생 중이면 처음부터 다시 재생
    audio.currentTime = 0;

    // 재생 시도
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('효과음 재생 실패:', error);
      });
    }
  } catch (error) {
    console.warn('효과음 재생 중 오류 발생:', error);
  }
};

/**
 * 매치 효과음을 재생합니다.
 */
export const playMatchSound = (settings: SoundSettings = defaultSettings): void => {
  playSound('match', settings);
};

/**
 * 콤보 효과음을 재생합니다.
 */
export const playComboSound = (settings: SoundSettings = defaultSettings): void => {
  playSound('combo', settings);
};

/**
 * 아이템 효과음을 재생합니다.
 */
export const playItemSound = (settings: SoundSettings = defaultSettings): void => {
  playSound('item', settings);
};

/**
 * 셔플 효과음을 재생합니다.
 */
export const playShuffleSound = (settings: SoundSettings = defaultSettings): void => {
  playSound('shuffle', settings);
};

/**
 * 게임 오버 효과음을 재생합니다.
 */
export const playGameOverSound = (settings: SoundSettings = defaultSettings): void => {
  playSound('gameOver', settings);
};

/**
 * 버튼 클릭 효과음을 재생합니다.
 */
export const playButtonSound = (settings: SoundSettings = defaultSettings): void => {
  playSound('button', settings);
};

/**
 * 모든 효과음을 정지합니다.
 */
export const stopAllSounds = (): void => {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
};

/**
 * 효과음 캐시를 정리합니다.
 */
export const clearSoundCache = (): void => {
  stopAllSounds();
  audioCache.clear();
  isPreloading = false;
  preloadPromise = null;
};

/**
 * 효과음 설정을 로컬 스토리지에서 가져옵니다.
 */
export const getSoundSettings = (): SoundSettings => {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem('soundSettings');
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('효과음 설정 로드 실패:', error);
  }

  return defaultSettings;
};

/**
 * 효과음 설정을 로컬 스토리지에 저장합니다.
 */
export const saveSoundSettings = (settings: SoundSettings): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
  } catch (error) {
    console.warn('효과음 설정 저장 실패:', error);
  }
};

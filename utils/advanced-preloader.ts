// 웹뷰 환경에 최적화된 고급 이미지 프리로딩 시스템

import { getAllImagePaths, getImagesByPriority } from './image-collector';

// 프리로딩 상태 관리
interface PreloadState {
  isLoading: boolean;
  loadedImages: Set<string>;
  failedImages: Set<string>;
  totalImages: number;
  loadedCount: number;
  progress: number;
}

// 프리로딩 옵션
interface PreloadOptions {
  enableCache: boolean;
  retryAttempts: number;
  timeout: number;
  concurrent: number;
  enableServiceWorker: boolean;
}

// 기본 옵션
const DEFAULT_OPTIONS: PreloadOptions = {
  enableCache: true,
  retryAttempts: 2,
  timeout: 10000, // 10초
  concurrent: 6, // 동시 로딩 수
  enableServiceWorker: false, // 추후 구현
};

class AdvancedImagePreloader {
  private state: PreloadState;
  private options: PreloadOptions;
  private loadingQueue: string[] = [];
  private activeLoads: Map<string, Promise<void>> = new Map();
  private progressCallbacks: ((progress: number) => void)[] = [];
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(options: Partial<PreloadOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.state = {
      isLoading: false,
      loadedImages: new Set(),
      failedImages: new Set(),
      totalImages: 0,
      loadedCount: 0,
      progress: 0,
    };

    // 브라우저 캐시 최적화
    this.optimizeBrowserCache();
  }

  /**
   * 브라우저 캐시를 최적화합니다
   */
  private optimizeBrowserCache() {
    if (typeof window === 'undefined') return;

    // 캐시 제어 헤더 최적화를 위한 meta 태그 추가
    const metaCacheControl = document.createElement('meta');
    metaCacheControl.httpEquiv = 'Cache-Control';
    metaCacheControl.content = 'public, max-age=31536000'; // 1년
    document.head.appendChild(metaCacheControl);

    // 이미지 캐시 힌트 추가
    const linkPreload = document.createElement('link');
    linkPreload.rel = 'prefetch';
    linkPreload.as = 'image';
    document.head.appendChild(linkPreload);
  }

  /**
   * 진행률 콜백을 등록합니다
   */
  onProgress(callback: (progress: number) => void) {
    this.progressCallbacks.push(callback);
  }

  /**
   * 진행률을 업데이트합니다
   */
  private updateProgress() {
    this.state.progress = (this.state.loadedCount / this.state.totalImages) * 100;
    this.progressCallbacks.forEach((callback) => callback(this.state.progress));
  }

  /**
   * 단일 이미지를 로드합니다
   */
  private async loadSingleImage(src: string, retries = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 로드된 이미지는 스킵
      if (this.state.loadedImages.has(src)) {
        resolve();
        return;
      }

      // 캐시에서 확인
      if (this.imageCache.has(src)) {
        this.state.loadedImages.add(src);
        this.state.loadedCount++;
        this.updateProgress();
        resolve();
        return;
      }

      const img = new Image();

      // 크로스 오리진 설정
      img.crossOrigin = 'anonymous';

      // 캐시 최적화
      if (this.options.enableCache) {
        img.loading = 'eager';
      }

      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        if (retries < this.options.retryAttempts) {
          console.warn(`이미지 로드 타임아웃, 재시도: ${src} (${retries + 1}/${this.options.retryAttempts})`);
          this.loadSingleImage(src, retries + 1)
            .then(resolve)
            .catch(reject);
        } else {
          console.error(`이미지 로드 최종 실패: ${src}`);
          this.state.failedImages.add(src);
          this.state.loadedCount++;
          this.updateProgress();
          reject(new Error(`Image load timeout: ${src}`));
        }
      }, this.options.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        this.imageCache.set(src, img);
        this.state.loadedImages.add(src);
        this.state.loadedCount++;
        this.updateProgress();

        console.log(`✅ 이미지 로드 완료: ${src} (${this.state.loadedCount}/${this.state.totalImages})`);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        if (retries < this.options.retryAttempts) {
          console.warn(`이미지 로드 실패, 재시도: ${src} (${retries + 1}/${this.options.retryAttempts})`);
          setTimeout(
            () => {
              this.loadSingleImage(src, retries + 1)
                .then(resolve)
                .catch(reject);
            },
            1000 * (retries + 1),
          ); // 지수 백오프
        } else {
          console.error(`이미지 로드 최종 실패: ${src}`);
          this.state.failedImages.add(src);
          this.state.loadedCount++;
          this.updateProgress();
          reject(new Error(`Image load failed: ${src}`));
        }
      };

      // 이미지 로드 시작
      img.src = src;
    });
  }

  /**
   * 동시 로딩 제한과 함께 이미지들을 로드합니다
   */
  private async loadImagesBatch(imagePaths: string[]): Promise<void> {
    const chunks = [];
    for (let i = 0; i < imagePaths.length; i += this.options.concurrent) {
      chunks.push(imagePaths.slice(i, i + this.options.concurrent));
    }

    for (const chunk of chunks) {
      const promises = chunk.map((src) => {
        if (!this.activeLoads.has(src)) {
          const promise = this.loadSingleImage(src);
          this.activeLoads.set(src, promise);
          return promise;
        }
        return this.activeLoads.get(src)!;
      });

      // 청크 단위로 병렬 로딩
      await Promise.allSettled(promises);

      // 완료된 로딩 제거
      chunk.forEach((src) => this.activeLoads.delete(src));
    }
  }

  /**
   * 우선순위별로 이미지를 프리로드합니다
   */
  async preloadByPriority(): Promise<void> {
    if (this.state.isLoading) {
      console.log('이미 프리로딩 중입니다.');
      return;
    }

    console.log('🚀 우선순위별 이미지 프리로딩 시작...');
    this.state.isLoading = true;

    const imagesByPriority = getImagesByPriority();
    const allImages = [
      ...imagesByPriority.critical,
      ...imagesByPriority.high,
      ...imagesByPriority.normal,
      ...imagesByPriority.low,
    ];

    this.state.totalImages = allImages.length;
    this.state.loadedCount = 0;
    this.state.progress = 0;

    try {
      // 1단계: 중요한 이미지들 먼저 로드
      console.log('📦 중요 이미지 로딩 중...');
      await this.loadImagesBatch(imagesByPriority.critical);

      // 2단계: 높은 우선순위 이미지들
      console.log('📦 높은 우선순위 이미지 로딩 중...');
      await this.loadImagesBatch(imagesByPriority.high);

      // 3단계: 보통 우선순위 이미지들
      console.log('📦 보통 우선순위 이미지 로딩 중...');
      await this.loadImagesBatch(imagesByPriority.normal);

      // 4단계: 낮은 우선순위 이미지들
      console.log('📦 낮은 우선순위 이미지 로딩 중...');
      await this.loadImagesBatch(imagesByPriority.low);

      console.log('🎉 모든 이미지 프리로딩 완료!');
      console.log(`✅ 성공: ${this.state.loadedImages.size}개`);
      console.log(`❌ 실패: ${this.state.failedImages.size}개`);

      // 로딩 완료 플래그 설정
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('advancedImagesLoaded', 'true');
        sessionStorage.setItem('loadedImagesCount', String(this.state.loadedImages.size));
      }
    } catch (error) {
      console.error('이미지 프리로딩 중 오류:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * 모든 이미지를 한번에 프리로드합니다
   */
  async preloadAll(): Promise<void> {
    if (this.state.isLoading) {
      console.log('이미 프리로딩 중입니다.');
      return;
    }

    // 이미 로드된 경우 스킵
    if (typeof window !== 'undefined' && sessionStorage.getItem('advancedImagesLoaded') === 'true') {
      console.log('이미지가 이미 프리로드되어 있습니다.');
      return;
    }

    console.log('🚀 전체 이미지 프리로딩 시작...');
    this.state.isLoading = true;

    const allImages = getAllImagePaths();
    this.state.totalImages = allImages.length;
    this.state.loadedCount = 0;
    this.state.progress = 0;

    try {
      await this.loadImagesBatch(allImages);

      console.log('🎉 모든 이미지 프리로딩 완료!');
      console.log(`✅ 성공: ${this.state.loadedImages.size}개`);
      console.log(`❌ 실패: ${this.state.failedImages.size}개`);

      // 로딩 완료 플래그 설정
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('advancedImagesLoaded', 'true');
        sessionStorage.setItem('loadedImagesCount', String(this.state.loadedImages.size));
      }
    } catch (error) {
      console.error('이미지 프리로딩 중 오류:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * 특정 이미지가 로드되었는지 확인합니다
   */
  isImageLoaded(src: string): boolean {
    return this.state.loadedImages.has(src);
  }

  /**
   * 현재 프리로딩 상태를 반환합니다
   */
  getState(): PreloadState {
    return { ...this.state };
  }

  /**
   * 캐시된 이미지를 반환합니다
   */
  getCachedImage(src: string): HTMLImageElement | undefined {
    return this.imageCache.get(src);
  }

  /**
   * 캐시를 정리합니다
   */
  clearCache() {
    this.imageCache.clear();
    this.state.loadedImages.clear();
    this.state.failedImages.clear();

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('advancedImagesLoaded');
      sessionStorage.removeItem('loadedImagesCount');
    }
  }
}

// 싱글톤 인스턴스
let preloaderInstance: AdvancedImagePreloader | null = null;

/**
 * 고급 이미지 프리로더 인스턴스를 가져옵니다
 */
export const getAdvancedPreloader = (): AdvancedImagePreloader => {
  if (!preloaderInstance) {
    preloaderInstance = new AdvancedImagePreloader();
  }
  return preloaderInstance;
};

/**
 * 우선순위별 이미지 프리로딩을 시작합니다
 */
export const startAdvancedPreloading = async (onProgress?: (progress: number) => void): Promise<void> => {
  const preloader = getAdvancedPreloader();

  if (onProgress) {
    preloader.onProgress(onProgress);
  }

  await preloader.preloadByPriority();
};

/**
 * 모든 이미지를 한번에 프리로드합니다
 */
export const preloadAllImagesAdvanced = async (onProgress?: (progress: number) => void): Promise<void> => {
  const preloader = getAdvancedPreloader();

  if (onProgress) {
    preloader.onProgress(onProgress);
  }

  await preloader.preloadAll();
};

/**
 * 특정 이미지가 로드되었는지 확인합니다
 */
export const isImagePreloaded = (src: string): boolean => {
  return getAdvancedPreloader().isImageLoaded(src);
};

/**
 * 프리로딩 상태를 가져옵니다
 */
export const getPreloadingState = (): PreloadState => {
  return getAdvancedPreloader().getState();
};

// Lottie 애니메이션 데이터 전역 관리
class LottiePreloader {
  private animationCache = new Map<string, unknown>();
  private loadingPromises = new Map<string, Promise<unknown>>();

  async preloadAnimation(name: string, path: string): Promise<unknown> {
    // 이미 캐시된 경우 바로 반환
    if (this.animationCache.has(name)) {
      return this.animationCache.get(name);
    }

    // 이미 로딩 중인 경우 해당 Promise 반환
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    // 새로운 로딩 시작
    const loadingPromise = this.loadAnimationData(path);
    this.loadingPromises.set(name, loadingPromise);

    try {
      const data = await loadingPromise;
      this.animationCache.set(name, data);
      this.loadingPromises.delete(name);
      return data;
    } catch (error) {
      this.loadingPromises.delete(name);
      throw error;
    }
  }

  private async loadAnimationData(path: string): Promise<unknown> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load animation: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load Lottie animation:', error);
      throw error;
    }
  }

  getAnimation(name: string): unknown | null {
    return this.animationCache.get(name) || null;
  }

  isLoaded(name: string): boolean {
    return this.animationCache.has(name);
  }

  preloadAll(): Promise<void> {
    // 필요한 모든 애니메이션을 미리 로드
    const animations = [
      { name: 'confetti', path: '/animations/confetti.json' },
      // 나중에 추가 애니메이션들...
    ];

    return Promise.all(
      animations.map(({ name, path }) =>
        this.preloadAnimation(name, path).catch((error) => {
          console.warn(`Failed to preload ${name}:`, error);
        }),
      ),
    ).then(() => {});
  }
}

// 싱글톤 인스턴스
export const lottiePreloader = new LottiePreloader();

// 앱 시작 시 호출할 초기화 함수
export const initializeLottieAnimations = () => {
  return lottiePreloader.preloadAll();
};

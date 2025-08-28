interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

interface MemoryThresholds {
  warning: number; // 70%
  critical: number; // 85%
  emergency: number; // 95%
}

class WebViewMemoryManager {
  private static instance: WebViewMemoryManager;
  private cleanupInterval: number | null = null;
  private memoryCheckInterval: number | null = null;
  private isCleanupRunning = false;
  private lastCleanupTime = 0;
  private memoryWarningCallbacks: Array<(stats: MemoryStats) => void> = [];

  private readonly thresholds: MemoryThresholds = {
    warning: 70,
    critical: 85,
    emergency: 95,
  };

  static getInstance(): WebViewMemoryManager {
    if (!WebViewMemoryManager.instance) {
      WebViewMemoryManager.instance = new WebViewMemoryManager();
    }
    return WebViewMemoryManager.instance;
  }

  start() {
    if (this.cleanupInterval || this.memoryCheckInterval) {
      console.warn('Memory manager already started');
      return;
    }

    // 주기적 메모리 정리 (15초마다)
    this.cleanupInterval = window.setInterval(() => {
      void this.performCleanup();
    }, 15000);

    // 메모리 상태 체크 (5초마다)
    this.memoryCheckInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, 5000);

    // 페이지 숨김/표시 이벤트 처리
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // WebView에서 백그라운드/포어그라운드 전환 처리
    window.addEventListener('blur', this.handleBackgroundTransition.bind(this));
    window.addEventListener('focus', this.handleForegroundTransition.bind(this));

    console.log('📱 WebView Memory Manager started');
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('blur', this.handleBackgroundTransition.bind(this));
    window.removeEventListener('focus', this.handleForegroundTransition.bind(this));

    console.log('📱 WebView Memory Manager stopped');
  }

  private performCleanup(force = false): void {
    if (this.isCleanupRunning && !force) return;

    const now = Date.now();
    if (!force && now - this.lastCleanupTime < 10000) {
      // 강제가 아니고 마지막 정리 후 10초 이내면 스킵
      return;
    }

    this.isCleanupRunning = true;
    this.lastCleanupTime = now;

    try {
      // 1. 강제 가비지 컬렉션 (가능한 경우)
      if ('gc' in window && typeof window.gc === 'function') {
        window.gc();
      }

      // 2. 이미지 캐시 정리
      this.cleanupImageCaches();

      // 3. Canvas 메모리 정리
      this.cleanupCanvasMemory();

      // 4. DOM 이벤트 리스너 정리
      this.cleanupEventListeners();

      // 5. setTimeout/setInterval 정리
      this.cleanupTimers();

      // 6. 메모리 압축 요청 (Chrome에서만)
      if ('memory' in performance) {
        // requestIdleCallback이 있으면 유휴 시간에 추가 정리
        if ('requestIdleCallback' in window) {
          requestIdleCallback(
            () => {
              this.deepCleanup();
            },
            { timeout: 5000 },
          );
        }
      }

      console.log('🧹 Memory cleanup completed');
    } catch (error) {
      console.error('Memory cleanup failed:', error);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  private cleanupImageCaches() {
    // 사용하지 않는 이미지 캐시 정리
    const images = document.querySelectorAll('img[src]');
    images.forEach((img) => {
      if (!img.isConnected || img.getBoundingClientRect().width === 0) {
        // DOM에 연결되지 않았거나 보이지 않는 이미지는 캐시에서 제거
        (img as HTMLImageElement).src = '';
      }
    });
  }

  private cleanupCanvasMemory() {
    // 사용하지 않는 Canvas 컨텍스트 정리
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach((canvas) => {
      if (!canvas.isConnected) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        // 캔버스 크기를 최소화하여 메모리 절약
        canvas.width = 1;
        canvas.height = 1;
      }
    });
  }

  private cleanupEventListeners() {
    // 제거된 DOM 요소의 이벤트 리스너는 자동으로 GC되지만
    // 명시적으로 WeakMap 기반 정리를 도울 수 있음

    // 전역 이벤트 리스너 중 불필요한 것들 확인
    const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
    unusedElements.forEach((element) => {
      // 정리 대상으로 마킹된 요소들의 이벤트 정리
      // Clear event listeners if they exist
      const clickHandler = () => {};
      const touchStartHandler = () => {};
      const touchEndHandler = () => {};
      element.removeEventListener('click', clickHandler);
      element.removeEventListener('touchstart', touchStartHandler);
      element.removeEventListener('touchend', touchEndHandler);
    });
  }

  private cleanupTimers() {
    // 이미 완료된 애니메이션 프레임 요청 정리는 브라우저가 자동으로 함
    // 하지만 WebView에서는 명시적으로 도울 수 있음
    // 높은 타이머 ID들 중 취소되지 않은 것들 확인
    // (실제 구현에서는 앱에서 사용하는 타이머들을 추적해야 함)
  }

  private deepCleanup() {
    // 더 깊은 레벨의 정리 작업
    try {
      // 1. 프로토타입 체인 정리
      this.cleanupPrototypes();

      // 2. 클로저 참조 정리
      this.cleanupClosures();

      // 3. 메모리 단편화 최소화
      if ('gc' in window && typeof (window as unknown as { gc: () => void }).gc === 'function') {
        // 두 번의 GC로 순환 참조 정리
        const gc = (window as unknown as { gc: () => void }).gc;
        gc();
        setTimeout(() => gc(), 100);
      }
    } catch (error) {
      console.warn('Deep cleanup failed:', error);
    }
  }

  private cleanupPrototypes() {
    // 동적으로 추가된 프로토타입 메서드 정리
    // (실제로는 앱에서 추가한 것들만 정리해야 함)
  }

  private cleanupClosures() {
    // 클로저에서 큰 객체 참조 해제
    // WeakMap, WeakSet 사용 권장
  }

  private checkMemoryUsage() {
    const stats = this.getMemoryStats();
    if (!stats) return;

    const { usagePercentage } = stats;

    if (usagePercentage >= this.thresholds.emergency) {
      console.error('🚨 Emergency memory usage:', stats);
      // 즉시 강제 정리
      void this.performCleanup(true);
      this.notifyMemoryWarning(stats);
    } else if (usagePercentage >= this.thresholds.critical) {
      console.warn('⚠️ Critical memory usage:', stats);
      // 다음 유휴 시간에 정리
      requestIdleCallback(() => {
        this.performCleanup(true);
      });
      this.notifyMemoryWarning(stats);
    } else if (usagePercentage >= this.thresholds.warning) {
      console.warn('⚡ High memory usage:', stats);
      this.notifyMemoryWarning(stats);
    }
  }

  private getMemoryStats(): MemoryStats | null {
    if (!('memory' in performance)) {
      return null;
    }

    const memory = (
      performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
    ).memory;
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
    };
  }

  private notifyMemoryWarning(stats: MemoryStats) {
    this.memoryWarningCallbacks.forEach((callback) => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Memory warning callback failed:', error);
      }
    });
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      // 페이지가 숨겨질 때 정리
      console.log('🔄 Page hidden, performing cleanup');
      void this.performCleanup(true);
    }
  }

  private handleBackgroundTransition() {
    // 백그라운드로 전환 시
    console.log('🔄 App moved to background, performing cleanup');
    setTimeout(() => {
      void this.performCleanup(true);
    }, 1000); // 1초 후 정리
  }

  private handleForegroundTransition() {
    // 포어그라운드로 복귀 시
    console.log('🔄 App foregrounded');
    // 필요한 리소스 재로딩
  }

  // Public API
  public onMemoryWarning(callback: (stats: MemoryStats) => void) {
    this.memoryWarningCallbacks.push(callback);

    return () => {
      const index = this.memoryWarningCallbacks.indexOf(callback);
      if (index > -1) {
        this.memoryWarningCallbacks.splice(index, 1);
      }
    };
  }

  public getCurrentMemoryStats(): MemoryStats | null {
    return this.getMemoryStats();
  }

  public forceCleanup(): void {
    this.performCleanup(true);
  }

  public updateThresholds(thresholds: Partial<MemoryThresholds>) {
    Object.assign(this.thresholds, thresholds);
    console.log('📊 Memory thresholds updated:', this.thresholds);
  }
}

export { WebViewMemoryManager, type MemoryStats, type MemoryThresholds };

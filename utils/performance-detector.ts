interface DeviceCapability {
  tier: 'low' | 'mid' | 'high';
  ram: number;
  gpu: string;
  isWebView: boolean;
  isMobile: boolean;
}

interface PerformanceSettings {
  targetFPS: number;
  maxDPR: number;
  enableAntiAliasing: boolean;
  particleCount: number;
  renderThreshold: number;
  enableComplexAnimations: boolean;
  enableScreenEffects: boolean;
}

class PerformanceDetector {
  private static instance: PerformanceDetector;
  private capability: DeviceCapability | null = null;

  static getInstance(): PerformanceDetector {
    if (!PerformanceDetector.instance) {
      PerformanceDetector.instance = new PerformanceDetector();
    }
    return PerformanceDetector.instance;
  }

  detectCapability(): DeviceCapability {
    if (this.capability) return this.capability;

    const isWebView = this.detectWebView();
    const isMobile = this.detectMobile();
    const ram = this.detectRAM();
    const gpu = this.detectGPU();

    let tier: DeviceCapability['tier'] = 'mid';

    // 기기 등급 판정
    if (isWebView) {
      // WebView 환경에서는 보수적으로 판정
      if (ram < 3 || this.isLowEndDevice()) {
        tier = 'low';
      } else if (ram >= 6 && this.isHighEndDevice()) {
        tier = 'high';
      }
    } else {
      // 일반 브라우저 환경
      if (ram < 2) {
        tier = 'low';
      } else if (ram >= 8 && this.isHighEndDevice()) {
        tier = 'high';
      }
    }

    this.capability = { tier, ram, gpu, isWebView, isMobile };
    console.log('📊 Device Capability Detected:', this.capability);

    return this.capability;
  }

  private detectWebView(): boolean {
    const userAgent = navigator.userAgent;

    // React Native WebView 감지
    if (userAgent.includes('ReactNative')) return true;

    // Android WebView 감지
    if (userAgent.includes('wv') && userAgent.includes('Android')) return true;

    // iOS WebView 감지
    if (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/.test(userAgent)) return true;

    // 추가적인 WebView 환경 감지
    if (!window.chrome && userAgent.includes('Chrome')) return true;

    return false;
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private detectRAM(): number {
    // navigator.deviceMemory API 사용 (지원되는 브라우저에서)
    if ('deviceMemory' in navigator) {
      return (navigator as unknown as { deviceMemory: number }).deviceMemory;
    }

    // Fallback: Performance API를 통한 추정
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { jsHeapSizeLimit: number } }).memory;
      // JSHeapSizeLimit을 기반으로 대략적인 RAM 추정 (GB 단위)
      return Math.round(memory.jsHeapSizeLimit / (1024 * 1024 * 1024));
    }

    // 최후 수단: User Agent 기반 추정
    return this.estimateRAMFromUserAgent();
  }

  private estimateRAMFromUserAgent(): number {
    const userAgent = navigator.userAgent;

    // 고사양 기기들
    if (/iPhone1[2-5]|iPad/.test(userAgent)) return 6;
    if (/iPhone1[0-1]/.test(userAgent)) return 4;
    if (/iPhone[6-9]/.test(userAgent)) return 2;

    // Android 기기들 (매우 대략적)
    if (/Android.*SM-G99|SM-N99/.test(userAgent)) return 8; // 갤럭시 플래그십
    if (/Android.*SM-G|SM-N/.test(userAgent)) return 4; // 갤럭시 중급형

    return 3; // 기본값
  }

  private detectGPU(): string {
    try {
      const canvas = document.createElement('canvas');
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;

      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer: unknown = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return (renderer as string) || 'Unknown';
        }
      }
    } catch (error) {
      console.warn('GPU detection failed:', error);
    }

    return 'Unknown';
  }

  private isLowEndDevice(): boolean {
    // CPU 코어 수 확인
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;

    // 연결 속도 확인 (느린 네트워크 = 저사양 가능성)
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection: { effectiveType: string } }).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return true;
    }

    return false;
  }

  private isHighEndDevice(): boolean {
    // CPU 코어 수 확인
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 8) return true;

    // 고해상도 디스플레이
    if (window.devicePixelRatio >= 3) return true;

    return false;
  }

  getOptimalSettings(capability: DeviceCapability): PerformanceSettings {
    const { tier, isWebView } = capability;

    switch (tier) {
      case 'low':
        return {
          targetFPS: isWebView ? 30 : 45,
          maxDPR: 1.0,
          enableAntiAliasing: false,
          particleCount: 3,
          renderThreshold: 150,
          enableComplexAnimations: false,
          enableScreenEffects: false,
        };

      case 'high':
        return {
          targetFPS: isWebView ? 60 : 120,
          maxDPR: isWebView ? 2.0 : 3.0,
          enableAntiAliasing: true,
          particleCount: 10,
          renderThreshold: 16,
          enableComplexAnimations: true,
          enableScreenEffects: true,
        };

      default: // mid
        return {
          targetFPS: 60,
          maxDPR: 1.5,
          enableAntiAliasing: isWebView ? false : true,
          particleCount: 5,
          renderThreshold: 100,
          enableComplexAnimations: false,
          enableScreenEffects: true,
        };
    }
  }
}

export { PerformanceDetector, type DeviceCapability, type PerformanceSettings };

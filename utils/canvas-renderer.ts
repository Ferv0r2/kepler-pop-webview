import { GRID_SIZE } from '@/screens/GameView/constants/game-config';
import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GridItem, TileType, TierType } from '@/types/game-types';

import { PerformanceDetector, type PerformanceSettings } from './performance-detector';
import { WebViewMemoryManager, type MemoryStats } from './webview-memory-manager';

interface TileAnimation {
  tileId: string;
  startTime: number;
  duration: number;
  type:
    | 'swap'
    | 'match'
    | 'drop'
    | 'appear'
    | 'hint'
    | 'select'
    | 'upgrade'
    | 'freeze'
    | 'chaos'
    | 'crystal_convert'
    | 'time_distort'
    | 'floating_text';
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  fromScale?: number;
  toScale?: number;
  fromOpacity?: number;
  toOpacity?: number;
  rotation?: number;
  color?: string;
  glowIntensity?: number;
  onComplete?: () => void;
  text?: string;
}

interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class CanvasGameRenderer {
  // 상수 정의
  private static readonly MAX_BORDER_WIDTH = 4;
  private static readonly BORDER_BUFFER = CanvasGameRenderer.MAX_BORDER_WIDTH * 2;
  private static readonly TILE_GAP = 4;

  private static readonly ANIMATION_DURATION_NORMAL = 250;
  private static readonly ANIMATION_DURATION_SLOW = 350;

  // 성능 설정
  private performanceSettings: PerformanceSettings;
  private performanceDetector: PerformanceDetector;
  private memoryManager: WebViewMemoryManager;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize: number = 0;
  private gridStartX: number = 0;
  private gridStartY: number = 0;
  private animations: Map<string, TileAnimation> = new Map();
  private particles: ParticleEffect[] = [];
  private iconCache: Map<string, HTMLImageElement> = new Map();
  private gradientCache: Map<string, CanvasGradient> = new Map();
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private selectedTile: { row: number; col: number } | null = null;
  private hintTiles: Set<string> = new Set();
  private draggedTile: { row: number; col: number } | null = null;
  private grid: GridItem[][] = [];
  private selectedItemType: string | null = null;
  private hoveredTile: { row: number; col: number } | null = null;
  private isLoading: boolean = true;
  private loadingProgress: number = 0;

  private frozenTiles: Set<string> = new Set();
  private screenEffects: {
    type: 'time_distort' | 'chaos' | 'freeze' | null;
    intensity: number;
    duration: number;
    startTime: number;
  } = {
    type: null,
    intensity: 0,
    duration: 0,
    startTime: 0,
  };

  // Item effect overlays
  setSelectedItem(itemType: string | null): void {
    this.selectedItemType = itemType;
  }

  setHoveredTile(row: number | null, col: number | null): void {
    this.hoveredTile = row !== null && col !== null ? { row, col } : null;
  }

  // 로딩 상태 확인
  public isAssetsLoaded(): boolean {
    return !this.isLoading;
  }

  // 로딩 진행률 가져오기
  public getLoadingProgress(): number {
    return this.loadingProgress;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
    })!;

    this.performanceDetector = PerformanceDetector.getInstance();
    this.memoryManager = WebViewMemoryManager.getInstance();

    // 기본 중급 설정으로 초기화
    this.performanceSettings = {
      targetFPS: 60,
      maxDPR: 1.5,
      enableAntiAliasing: false,
      particleCount: 5,
      renderThreshold: 100,
      enableComplexAnimations: false,
      enableScreenEffects: true,
    };

    // 메모리 관리자 시작
    this.memoryManager.start();
    this.memoryManager.onMemoryWarning(this.handleMemoryWarning.bind(this));

    this.setupCanvas();
    void this.initializePerformanceSettings();
    void this.preloadAssets();
  }

  private initializePerformanceSettings() {
    try {
      const capability = this.performanceDetector.detectCapability();
      this.performanceSettings = this.performanceDetector.getOptimalSettings(capability);

      console.log('🎮 Performance Settings Applied:', this.performanceSettings);

      // 설정 적용을 위해 캔버스 재설정
      this.setupCanvas();
    } catch (error) {
      console.warn('⚠️ Failed to detect performance, using default settings:', error);
    }
  }

  private setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.performanceSettings.maxDPR);
    const rect = this.canvas.getBoundingClientRect();

    // 캔버스 크기 설정 전에 컨텍스트 리셋
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // 컨텍스트가 리셋되므로 다시 스케일 적용
    this.ctx.scale(dpr, dpr);

    this.ctx.imageSmoothingEnabled = this.performanceSettings.enableAntiAliasing;
    if (this.performanceSettings.enableAntiAliasing) {
      this.ctx.imageSmoothingQuality = 'high';
    }

    // 캔버스 스타일 설정
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // 그리드 크기 계산 - border 두께 고려
    const padding = 8; // 여백 제거
    const availableWidth = rect.width - padding * 2 - CanvasGameRenderer.BORDER_BUFFER;
    const availableHeight = rect.height - padding * 2 - CanvasGameRenderer.BORDER_BUFFER;

    const totalGapWidth = (GRID_SIZE - 1) * CanvasGameRenderer.TILE_GAP;
    const totalGapHeight = (GRID_SIZE - 1) * CanvasGameRenderer.TILE_GAP;

    this.tileSize = Math.min(
      (availableWidth - totalGapWidth) / GRID_SIZE,
      (availableHeight - totalGapHeight) / GRID_SIZE,
    );

    // 그리드를 캔버스 전체에 맞춤 - border buffer 고려
    this.gridStartX = padding + CanvasGameRenderer.MAX_BORDER_WIDTH / 2;
    this.gridStartY = padding + CanvasGameRenderer.MAX_BORDER_WIDTH / 2;

    this.ctx.imageSmoothingEnabled = this.performanceSettings.enableAntiAliasing;
  }

  private async preloadAssets() {
    this.isLoading = true;
    this.loadingProgress = 0;

    // GlobalPreloadProvider가 이미 기본 에셋을 로드했으므로
    // 여기서는 게임에 필요한 타일 이미지만 fallback으로 생성
    const tileTypes = [1, 2, 3, 4, 5] as TileType[];
    const totalImages = tileTypes.length * 3; // 5 types * 3 tiers
    let loadedImages = 0;

    const imagePromises: Promise<void>[] = [];

    tileTypes.forEach((tileType) => {
      for (let tier = 1; tier <= 3; tier++) {
        const tierType = tier as TierType;
        const key = `${tileType}-${tierType}`;

        const imagePromise = new Promise<void>((resolve) => {
          try {
            const imagePath = tileConfig[tileType].images[tierType];
            const img = new Image();

            // 이미지 로드 성공시 캐시에 저장
            img.onload = () => {
              this.iconCache.set(key, img);
              loadedImages++;
              this.loadingProgress = (loadedImages / totalImages) * 100;
              resolve();
            };

            // 실패시 fallback 사용
            img.onerror = () => {
              const fallbackImg = this.createFallbackImage(tileType);
              this.iconCache.set(key, fallbackImg);
              loadedImages++;
              this.loadingProgress = (loadedImages / totalImages) * 100;
              resolve();
            };

            img.src = imagePath;
          } catch (error) {
            console.error('Failed to load tile image:', error);
            const fallbackImg = this.createFallbackImage(tileType);
            this.iconCache.set(key, fallbackImg);
            loadedImages++;
            this.loadingProgress = (loadedImages / totalImages) * 100;
            resolve();
          }
        });

        imagePromises.push(imagePromise);
      }
    });

    // 모든 이미지 로드 완료 대기
    await Promise.all(imagePromises);

    // 로딩 완료 처리
    this.isLoading = false;
    this.loadingProgress = 100;
  }

  private createFallbackImage(tileType: TileType): HTMLImageElement {
    // Canvas로 기본 색상 사각형 이미지 생성
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // 타일 타입에 따른 색상
    const colors: Record<number, string> = {
      1: '#f87171', // red-400
      2: '#22d3ee', // cyan-400
      3: '#34d399', // emerald-400
      4: '#fbbf24', // amber-400
      5: '#a78bfa', // violet-400
    };

    ctx.fillStyle = colors[tileType] || '#6b7280';
    ctx.fillRect(0, 0, 64, 64);

    // 아이콘 그리기
    ctx.fillStyle = 'white';
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tileType.toString(), 32, 32);

    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  private drawFallbackText(ctx: CanvasRenderingContext2D, tileType: TileType, x: number, y: number, size: number) {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
    ctx.font = `${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P${tileType}`, x + size / 2, y + size / 2);
  }

  private drawLoadingScreen(ctx: CanvasRenderingContext2D) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // 로딩 스피너 그리기
    const spinnerRadius = 30;
    const spinnerThickness = 4;
    const time = performance.now() * 0.003;

    ctx.save();
    ctx.translate(centerX, centerY);

    // 로딩 텍스트
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading...', 0, -spinnerRadius - 20);

    // 진행률 표시
    const progressText = `${Math.round(this.loadingProgress)}%`;
    ctx.fillText(progressText, 0, spinnerRadius + 20);

    // 스피너 원호 그리기
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = spinnerThickness;
    ctx.beginPath();
    ctx.arc(0, 0, spinnerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 회전하는 스피너
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = spinnerThickness;
    ctx.beginPath();
    ctx.arc(0, 0, spinnerRadius, time, time + Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }

  public updateGrid(grid: GridItem[][]) {
    this.grid = grid;
  }

  public setSelectedTile(row: number | null, col: number | null) {
    this.selectedTile = row !== null && col !== null ? { row, col } : null;
  }

  public setDraggedTile(row: number | null, col: number | null) {
    this.draggedTile = row !== null && col !== null ? { row, col } : null;
  }

  public setHintTiles(tiles: { row: number; col: number }[]) {
    this.hintTiles.clear();
    tiles.forEach((tile) => {
      this.hintTiles.add(`${tile.row}-${tile.col}`);
    });
  }

  public setShuffling(shuffling: boolean) {
    if (shuffling) {
      this.grid.forEach((row) => {
        row.forEach((tile) => {
          this.addAnimation(tile.id, 'appear', {
            duration: 1000,
            rotation: 360,
          });
        });
      });
    }
  }

  public addAnimation(tileId: string, type: TileAnimation['type'], options: Partial<TileAnimation> = {}) {
    const animation: TileAnimation = {
      tileId,
      type,
      startTime: performance.now(),
      duration: options.duration || CanvasGameRenderer.ANIMATION_DURATION_NORMAL,
      ...options,
    };

    this.animations.set(tileId, animation);
  }

  public addParticle(x: number, y: number, color: string) {
    const tileWithGap = this.tileSize + CanvasGameRenderer.TILE_GAP;

    for (let i = 0; i < this.performanceSettings.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / this.performanceSettings.particleCount;
      const speed = 2 + Math.random() * 3;

      this.particles.push({
        x: x * tileWithGap + this.gridStartX + this.tileSize / 2,
        y: y * tileWithGap + this.gridStartY + this.tileSize / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 3,
      });
    }
  }

  private updateAnimations(deltaTime: number) {
    // 애니메이션 업데이트
    if (this.animations.size > 0) {
      const now = performance.now();
      const completedAnimations: TileAnimation[] = [];

      for (const [id, animation] of this.animations) {
        const elapsed = now - animation.startTime;
        if (elapsed >= animation.duration) {
          completedAnimations.push(animation);
          this.animations.delete(id);
        }
      }

      // 완료된 애니메이션의 콜백 실행
      completedAnimations.forEach((animation) => {
        if (animation.onComplete) {
          animation.onComplete();
        }
      });
    }

    // 파티클 업데이트
    if (this.particles.length > 0) {
      this.particles = this.particles.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // 중력
        particle.life -= deltaTime / 1000;
        return particle.life > 0;
      });
    }
  }

  private drawTile(tile: GridItem, x: number, y: number, scale: number = 1, opacity: number = 1, rotation: number = 0) {
    const ctx = this.ctx;

    ctx.save();

    // 변환 적용
    ctx.globalAlpha = opacity;
    ctx.translate(x + this.tileSize / 2, y + this.tileSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-this.tileSize / 2, -this.tileSize / 2);

    // 식물 이미지에 맞는 배경 - 밝고 깔끔한 스타일
    const borderRadius = Math.min(this.tileSize * 0.1, 8);

    // 기본 배경 (밝은 색상)
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.beginPath();
    ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
    ctx.fill();

    // 민간한 그라디언트 오버레이
    const overlayGradient = ctx.createLinearGradient(0, 0, this.tileSize, this.tileSize);
    overlayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    overlayGradient.addColorStop(1, 'rgba(241, 245, 249, 0.6)'); // slate-100
    ctx.fillStyle = overlayGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
    ctx.fill();

    // 테두리 제거 (하얀 선이 보이지 않도록)
    // ctx.strokeStyle = '#e2e8f0'; // slate-200
    // ctx.lineWidth = 1;
    // ctx.beginPath();
    // ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
    // ctx.stroke();

    // 그림자 효과 제거 (이미지와 충돌하지 않도록)
    // ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    // ctx.shadowBlur = 8;
    // ctx.shadowOffsetY = 2;

    // Tier 효과 - 식물 타일에 맞게 단순화
    if (tile.tier === 1) {
      // 1등급: 기본 회색 테두리
      ctx.strokeStyle = '#d1d5db'; // gray-300
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
      ctx.stroke();
    } else if (tile.tier === 2) {
      // 2등급: 황금색 테두리와 반짝거림
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
      ctx.stroke();

      // 반짝거리는 효과
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(2, 2, this.tileSize - 4, this.tileSize - 4, borderRadius - 2);
      ctx.stroke();
      ctx.restore();
    } else if (tile.tier === 3) {
      // 3등급: 무지개 색 테두리와 강한 반짝거림
      const rainbow = ctx.createLinearGradient(0, 0, this.tileSize, this.tileSize);
      rainbow.addColorStop(0, '#ec4899'); // pink-500
      rainbow.addColorStop(0.25, '#8b5cf6'); // violet-500
      rainbow.addColorStop(0.5, '#06b6d4'); // cyan-500
      rainbow.addColorStop(0.75, '#10b981'); // emerald-500
      rainbow.addColorStop(1, '#f59e0b'); // amber-500

      ctx.strokeStyle = rainbow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
      ctx.stroke();

      // 강한 반짝거리는 효과
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 1)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(3, 3, this.tileSize - 6, this.tileSize - 6, borderRadius - 3);
      ctx.stroke();
      ctx.restore();
    }

    // 식물 이미지 그리기
    const iconKey = `${tile.type}-${tile.tier}`;
    const icon = this.iconCache.get(iconKey);
    if (icon && icon.complete && icon.naturalWidth > 0) {
      ctx.save();

      // 타일 영역을 클리핑하여 이미지가 바깥으로 빠져나오지 않도록 함
      ctx.beginPath();
      ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
      ctx.clip();

      // 식물 이미지는 그림자를 선늤게 적용
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;

      // 식물 이미지를 타일 전체에 맞게 그리기 (여백 없음)
      const iconSize = this.tileSize;
      const iconX = 0;
      const iconY = 0;

      // 이미지 품질 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      try {
        // 이미지 비율을 유지하면서 타일 안에 맞추기 (contain 방식)
        const imageAspectRatio = icon.naturalWidth / icon.naturalHeight;
        const tileAspectRatio = 1; // 정사각형 타일

        let drawWidth, drawHeight, drawX, drawY;

        if (imageAspectRatio > tileAspectRatio) {
          // 이미지가 가로로 긴 경우 - 가로를 타일 크기에 맞추고 세로를 비례 조정
          drawWidth = iconSize;
          drawHeight = iconSize / imageAspectRatio;
          drawX = iconX;
          drawY = iconY + (iconSize - drawHeight) / 2;
        } else {
          // 이미지가 세로로 길거나 정사각형인 경우 - 세로를 타일 크기에 맞추고 가로를 비례 조정
          drawHeight = iconSize;
          drawWidth = iconSize * imageAspectRatio;
          drawX = iconX + (iconSize - drawWidth) / 2;
          drawY = iconY;
        }

        // 이미지가 타일 경계를 절대 벗어나지 않도록 클램핑
        drawX = Math.max(iconX, Math.min(drawX, iconX + iconSize - drawWidth));
        drawY = Math.max(iconY, Math.min(drawY, iconY + iconSize - drawHeight));
        drawWidth = Math.min(drawWidth, iconSize);
        drawHeight = Math.min(drawHeight, iconSize);

        // 정수로 반올림하여 서브픽셀 렌더링 방지 (성능 향상)
        ctx.drawImage(icon, Math.round(drawX), Math.round(drawY), Math.round(drawWidth), Math.round(drawHeight));
      } catch (error) {
        console.warn('Failed to draw plant image:', error);
        // 대체 텍스트 그리기
        this.drawFallbackText(ctx, tile.type, iconX, iconY, iconSize);
      }
      ctx.restore();
    } else {
      // 이미지가 없거나 로드되지 않은 경우 대체 표시
      ctx.save();

      // 타일 영역을 클리핑
      ctx.beginPath();
      ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
      ctx.clip();

      const iconSize = this.tileSize;
      const iconX = 0;
      const iconY = 0;
      this.drawFallbackText(ctx, tile.type, iconX, iconY, iconSize);
      ctx.restore();
    }

    ctx.restore();
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public render() {
    if (!this.ctx) return;

    if (this.grid.length === 0) {
      return;
    }

    const ctx = this.ctx;
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    const hasChanges =
      this.animations.size > 0 || this.particles.length > 0 || this.isLoading || this.lastFrameTime === 0;

    if (!hasChanges && deltaTime < this.performanceSettings.renderThreshold) {
      return;
    }

    this.lastFrameTime = now;

    // 배경 클리어 (투명하게)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 로딩 중일 때는 로딩 화면만 표시
    if (this.isLoading) {
      this.drawLoadingScreen(ctx);
      return;
    }

    // 그리드가 없으면 렌더링하지 않음
    if (!this.grid.length) return;

    // 애니메이션 업데이트
    this.updateAnimations(deltaTime);

    // 그리드 그리기
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = this.grid[row]?.[col];
        if (!tile) continue;

        let x = this.gridStartX + col * (this.tileSize + CanvasGameRenderer.TILE_GAP);
        let y = this.gridStartY + row * (this.tileSize + CanvasGameRenderer.TILE_GAP);
        let scale = 1;
        let opacity = 1;
        let rotation = 0;

        // 애니메이션 적용
        const animation = this.animations.get(tile.id);
        if (animation) {
          const progress = Math.min((now - animation.startTime) / animation.duration, 1);

          const eased = animation.type === 'upgrade' ? this.easeInOutCubic(progress) : this.easeInOut(progress);

          switch (animation.type) {
            case 'swap':
              if (animation.fromX !== undefined && animation.toX !== undefined) {
                x = animation.fromX + (animation.toX - animation.fromX) * eased;
              }
              if (animation.fromY !== undefined && animation.toY !== undefined) {
                y = animation.fromY + (animation.toY - animation.fromY) * eased;
              }
              break;

            case 'match':
              scale = 1 - eased * 0.5;
              opacity = 1 - eased;
              rotation = eased * 180;
              break;

            case 'drop':
              if (animation.fromY !== undefined && animation.toY !== undefined) {
                y = animation.fromY + (animation.toY - animation.fromY) * eased;
              }
              break;

            case 'appear':
              scale = eased;
              opacity = eased;
              rotation = animation.rotation ? (1 - eased) * animation.rotation : 0;
              break;

            case 'hint':
              scale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
              break;

            case 'select':
              scale = 1.1;
              break;
            case 'upgrade':
              // 티어 업그레이드 애니메이션: 부드러운 펄스 효과
              if (progress < 0.5) {
                // 처음 절반: 커지면서 페이드 아웃
                scale = 1 + progress * 2 * 0.3; // 1.0 → 1.3
                opacity = 1 - progress * 2 * 0.3; // 1.0 → 0.7
              } else {
                // 나머지 절반: 다시 작아지면서 페이드 인
                scale = 1.3 - (progress - 0.5) * 2 * 0.3; // 1.3 → 1.0
                opacity = 0.7 + (progress - 0.5) * 2 * 0.3; // 0.7 → 1.0
              }
              // 부드러운 회전
              rotation = Math.sin(progress * Math.PI * 2) * 5;
              break;

            case 'freeze':
              // 얼음 효과: 푸른빛 글로우와 약간의 투명도
              if (animation.color) {
                ctx.save();
                ctx.shadowColor = animation.color;
                ctx.shadowBlur = (animation.glowIntensity || 10) * Math.sin(progress * Math.PI * 4);
                ctx.restore();
              }
              opacity = 0.8;
              break;

            case 'chaos':
              // 카오스 효과: 랜덤한 떨림과 색상 변화
              x += (Math.random() - 0.5) * 4;
              y += (Math.random() - 0.5) * 4;
              rotation = (Math.random() - 0.5) * 10;
              break;

            case 'crystal_convert':
              // 크리스탈 변환 효과: 무지개 글로우
              scale = 1 + Math.sin(progress * Math.PI * 6) * 0.1;
              if (animation.color) {
                ctx.save();
                ctx.shadowColor = animation.color;
                ctx.shadowBlur = 20;
                ctx.restore();
              }
              break;

            case 'time_distort': {
              const waveOffset = Math.sin(progress * Math.PI * 8) * 2;
              x += waveOffset;
              scale = 1 + Math.sin(progress * Math.PI * 4) * 0.05;
              break;
            }

            case 'floating_text': {
              if (animation.fromX !== undefined && animation.toX !== undefined) {
                x = animation.fromX + (animation.toX - animation.fromX) * eased;
              }
              if (animation.fromY !== undefined && animation.toY !== undefined) {
                y = animation.fromY + (animation.toY - animation.fromY) * eased;
              }
              if (animation.fromOpacity !== undefined && animation.toOpacity !== undefined) {
                opacity = animation.fromOpacity + (animation.toOpacity - animation.fromOpacity) * eased;
              }
              break;
            }
          }
        }

        // 매칭된 타일은 그리지 않음
        if (tile.isMatched && !animation) continue;

        // 특수 효과
        const tileKey = `${row}-${col}`;

        // 얼어있는 타일 효과
        if (this.frozenTiles.has(tileKey)) {
          ctx.save();
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.roundRect(x - 1, y - 1, this.tileSize + 2, this.tileSize + 2, 12);
          ctx.stroke();
          ctx.restore();
        }
        if (this.selectedTile?.row === row && this.selectedTile?.col === col) {
          scale = 1.1;
          // 선택 효과
          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.roundRect(x - 2, y - 2, this.tileSize, this.tileSize, 14);
          ctx.stroke();
          ctx.restore();
        }

        if (this.draggedTile?.row === row && this.draggedTile?.col === col) {
          scale = 1.1;
          // 드래그 효과
          ctx.save();
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.roundRect(x - 2, y - 2, this.tileSize, this.tileSize, 14);
          ctx.stroke();
          ctx.restore();
        }

        // 타일 그리기 (floating text가 아닌 경우만)
        if (animation?.type !== 'floating_text') {
          this.drawTile(tile, x, y, scale, opacity, rotation);
        }

        // 힌트 효과 - 타일 위에 그리기
        if (this.hintTiles.has(tileKey)) {
          this.drawHintEffect(ctx, x, y, now);
        }
      }
    }

    // 아이템 효과 오버레이 그리기
    this.drawItemEffectOverlay();

    // 화면 효과 그리기
    this.drawScreenEffects(ctx, now);

    // floating text 렌더링
    this.renderFloatingTexts(ctx, now);

    // 파티클 그리기
    ctx.save();
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public startRenderLoop() {
    const targetFPS = this.performanceSettings.targetFPS;
    const frameTime = 1000 / targetFPS;
    let lastTime = 0;
    // let frameCount = 0;
    // let fpsTime = 0;

    const loop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      // FPS 계산 (개발용, 필요시 주석 해제)
      // frameCount++;
      // if (currentTime - fpsTime >= 1000) {
      //   // console.log(`FPS: ${frameCount}`);
      //   frameCount = 0;
      //   fpsTime = currentTime;
      // }

      const currentFrameTime = frameTime;

      if (deltaTime >= currentFrameTime) {
        this.render();
        lastTime = currentTime - (deltaTime % currentFrameTime);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stopRenderLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getTileFromPosition(clientX: number, clientY: number): { row: number; col: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const tileWithGap = this.tileSize + CanvasGameRenderer.TILE_GAP;

    const col = Math.floor((x - this.gridStartX) / tileWithGap);
    const row = Math.floor((y - this.gridStartY) / tileWithGap);

    // 클릭이 타일 영역 내부인지 확인 (간격 영역 제외)
    const tileX = this.gridStartX + col * tileWithGap;
    const tileY = this.gridStartY + row * tileWithGap;

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      // 실제 타일 영역 내부인지 확인
      if (x >= tileX && x <= tileX + this.tileSize && y >= tileY && y <= tileY + this.tileSize) {
        return { row, col };
      }
    }

    return null;
  }

  public handleSwapAnimation(row1: number, col1: number, row2: number, col2: number, tile1Id: string, tile2Id: string) {
    const tileWithGap = this.tileSize + CanvasGameRenderer.TILE_GAP;

    const x1 = this.gridStartX + col1 * tileWithGap;
    const y1 = this.gridStartY + row1 * tileWithGap;
    const x2 = this.gridStartX + col2 * tileWithGap;
    const y2 = this.gridStartY + row2 * tileWithGap;

    this.addAnimation(tile1Id, 'swap', {
      fromX: x1,
      fromY: y1,
      toX: x2,
      toY: y2,
      duration: CanvasGameRenderer.ANIMATION_DURATION_NORMAL,
    });

    this.addAnimation(tile2Id, 'swap', {
      fromX: x2,
      fromY: y2,
      toX: x1,
      toY: y1,
      duration: CanvasGameRenderer.ANIMATION_DURATION_NORMAL,
    });
  }

  public handleFailedSwapAnimation(
    row1: number,
    col1: number,
    row2: number,
    col2: number,
    tile1Id: string,
    tile2Id: string,
    onComplete: () => void,
  ) {
    const tileWithGap = this.tileSize + CanvasGameRenderer.TILE_GAP;

    const x1 = this.gridStartX + col1 * tileWithGap;
    const y1 = this.gridStartY + row1 * tileWithGap;
    const x2 = this.gridStartX + col2 * tileWithGap;
    const y2 = this.gridStartY + row2 * tileWithGap;

    // 1단계: A→B 스왑
    this.addAnimation(tile1Id, 'swap', {
      fromX: x1,
      fromY: y1,
      toX: x2,
      toY: y2,
      duration: CanvasGameRenderer.ANIMATION_DURATION_NORMAL,
      onComplete: () => {
        // 2단계: B→A 복귀 애니메이션
        this.addAnimation(tile1Id, 'swap', {
          fromX: x2,
          fromY: y2,
          toX: x1,
          toY: y1,
          duration: CanvasGameRenderer.ANIMATION_DURATION_NORMAL,
          onComplete,
        });

        this.addAnimation(tile2Id, 'swap', {
          fromX: x1,
          fromY: y1,
          toX: x2,
          toY: y2,
          duration: CanvasGameRenderer.ANIMATION_DURATION_NORMAL,
        });
      },
    });

    this.addAnimation(tile2Id, 'swap', {
      fromX: x2,
      fromY: y2,
      toX: x1,
      toY: y1,
      duration: CanvasGameRenderer.ANIMATION_DURATION_NORMAL,
    });
  }

  public handleMatchAnimation(tiles: { row: number; col: number; id: string }[]) {
    tiles.forEach((tile) => {
      this.addAnimation(tile.id, 'match', {
        duration: CanvasGameRenderer.ANIMATION_DURATION_SLOW,
      });

      // 성능 설정에 따른 파티클 효과
      if (this.performanceSettings.enableComplexAnimations || tiles.length > 3) {
        // 3개 이상 매치 시에는 항상 파티클 표시 (중요한 피드백)
        this.addParticle(tile.col, tile.row, '#ffd700');
      }
    });
  }

  public handleDropAnimation(tiles: { id: string; fromRow: number; toRow: number; col: number }[]) {
    const tileWithGap = this.tileSize + CanvasGameRenderer.TILE_GAP;

    tiles.forEach((tile) => {
      const fromY = this.gridStartY + tile.fromRow * tileWithGap;
      const toY = this.gridStartY + tile.toRow * tileWithGap;

      this.addAnimation(tile.id, 'drop', {
        fromY,
        toY,
        duration: CanvasGameRenderer.ANIMATION_DURATION_SLOW,
      });
    });
  }

  public handleNewTileAnimation(tiles: { id: string; row: number; col: number }[]) {
    tiles.forEach((tile) => {
      this.addAnimation(tile.id, 'appear', {
        duration: CanvasGameRenderer.ANIMATION_DURATION_SLOW,
      });
    });
  }

  public handleTierUpgradeAnimation(tiles: { id: string; row: number; col: number }[]) {
    tiles.forEach((tile) => {
      this.addAnimation(tile.id, 'upgrade', {
        duration: CanvasGameRenderer.ANIMATION_DURATION_SLOW,
      });

      // 성능 설정에 따른 파티클 효과
      if (this.performanceSettings.enableComplexAnimations) {
        this.addParticle(tile.col, tile.row, '#ffd700');
      }
    });
  }

  public resize() {
    // 현재 애니메이션과 상태 백업
    const currentAnimations = new Map(this.animations);
    const currentParticles = [...this.particles];
    const currentHintTiles = new Set(this.hintTiles);
    const currentSelectedTile = this.selectedTile;
    const currentDraggedTile = this.draggedTile;
    const currentSelectedItemType = this.selectedItemType;
    const currentHoveredTile = this.hoveredTile;

    // 그라디언트 캐시 클리어 (크기 변경시 재생성 필요)
    this.gradientCache.clear();

    // 캔버스 재설정
    this.setupCanvas();

    // 상태 복원
    this.animations = currentAnimations;
    this.particles = currentParticles;
    this.hintTiles = currentHintTiles;
    this.selectedTile = currentSelectedTile;
    this.draggedTile = currentDraggedTile;
    this.selectedItemType = currentSelectedItemType;
    this.hoveredTile = currentHoveredTile;
  }

  private drawHintEffect(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
    const pulse = Math.sin(now * 0.005) * 0.5 + 0.5; // 좀 더 느린 효과

    ctx.save();

    // 바깥 글로우 효과
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 15 + pulse * 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 두꺼운 테두리
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3 + pulse * 2;
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    ctx.beginPath();
    ctx.roundRect(x - 3, y - 3, this.tileSize + 6, this.tileSize + 6, 15);
    ctx.stroke();

    // 내부 반짝거리는 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = pulse * 0.8;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 10);
    ctx.stroke();

    // 추가 반짝 효과 - 모서리에 작은 빛
    for (let i = 0; i < 4; i++) {
      const angle = (now * 0.001 + i * Math.PI * 0.5) % (Math.PI * 2);
      const sparkleX = x + this.tileSize / 2 + Math.cos(angle) * (this.tileSize / 2 + 5);
      const sparkleY = y + this.tileSize / 2 + Math.sin(angle) * (this.tileSize / 2 + 5);

      ctx.fillStyle = '#fde047';
      ctx.globalAlpha = pulse * 0.6;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 2 + pulse * 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D, now: number) {
    for (const [, animation] of this.animations) {
      if (animation.type !== 'floating_text') continue;

      const elapsed = now - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      const eased = this.easeInOut(progress);

      if (
        animation.fromX !== undefined &&
        animation.toX !== undefined &&
        animation.fromY !== undefined &&
        animation.toY !== undefined &&
        animation.text &&
        animation.color
      ) {
        const x = animation.fromX + (animation.toX - animation.fromX) * eased;
        const y = animation.fromY + (animation.toY - animation.fromY) * eased;

        let opacity = 1;
        if (animation.fromOpacity !== undefined && animation.toOpacity !== undefined) {
          opacity = animation.fromOpacity + (animation.toOpacity - animation.fromOpacity) * eased;
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = animation.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 텍스트 외곽선으로 가독성 향상
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(animation.text, x, y);
        ctx.fillText(animation.text, x, y);

        ctx.restore();
      }
    }
  }

  private drawItemEffectOverlay() {
    if (!this.selectedItemType || !this.hoveredTile) return;

    const ctx = this.ctx;
    const { row, col } = this.hoveredTile;
    const x = this.gridStartX + col * (this.tileSize + CanvasGameRenderer.TILE_GAP);
    const y = this.gridStartY + row * (this.tileSize + CanvasGameRenderer.TILE_GAP);

    ctx.save();

    switch (this.selectedItemType) {
      case 'shovel':
        // 단일 타일 하이라이트 (빨간색)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, this.tileSize, this.tileSize, 12);
        ctx.fill();
        ctx.stroke();
        break;

      case 'mole':
        // 행/열 하이라이트 (파란색)
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        // 행 하이라이트
        ctx.beginPath();
        ctx.roundRect(
          this.gridStartX,
          y,
          GRID_SIZE * (this.tileSize + CanvasGameRenderer.TILE_GAP) - CanvasGameRenderer.TILE_GAP,
          this.tileSize,
          12,
        );
        ctx.fill();
        ctx.stroke();

        // 열 하이라이트
        ctx.beginPath();
        ctx.roundRect(
          x,
          this.gridStartY,
          this.tileSize,
          GRID_SIZE * (this.tileSize + CanvasGameRenderer.TILE_GAP) - CanvasGameRenderer.TILE_GAP,
          12,
        );
        ctx.fill();
        ctx.stroke();
        break;

      case 'bomb':
        // 3x3 영역 하이라이트 (주황색)
        ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const targetRow = row + dr;
            const targetCol = col + dc;

            if (targetRow >= 0 && targetRow < GRID_SIZE && targetCol >= 0 && targetCol < GRID_SIZE) {
              const targetX = this.gridStartX + targetCol * (this.tileSize + CanvasGameRenderer.TILE_GAP);
              const targetY = this.gridStartY + targetRow * (this.tileSize + CanvasGameRenderer.TILE_GAP);

              ctx.beginPath();
              ctx.roundRect(targetX, targetY, this.tileSize, this.tileSize, 12);
              ctx.fill();
              ctx.stroke();
            }
          }
        }
        break;
    }

    ctx.restore();
  }

  private drawScreenEffects(ctx: CanvasRenderingContext2D, now: number) {
    if (this.screenEffects.type === null || !this.performanceSettings.enableScreenEffects) return;

    const elapsed = now - this.screenEffects.startTime;
    const progress = Math.min(elapsed / this.screenEffects.duration, 1);
    const intensity = this.screenEffects.intensity * (1 - progress);

    ctx.save();

    switch (this.screenEffects.type) {
      case 'time_distort': {
        const wavePattern = ctx.createRadialGradient(
          this.canvas.width / 2,
          this.canvas.height / 2,
          0,
          this.canvas.width / 2,
          this.canvas.height / 2,
          Math.max(this.canvas.width, this.canvas.height),
        );
        wavePattern.addColorStop(0, `rgba(59, 130, 246, ${intensity * 0.3})`);
        wavePattern.addColorStop(0.5, `rgba(147, 197, 253, ${intensity * 0.1})`);
        wavePattern.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = wavePattern;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;
      }

      case 'chaos': {
        ctx.globalAlpha = intensity * 0.4;
        ctx.fillStyle = '#ef4444';

        // 랜덤한 번개 효과
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = Math.random() * 100 + 50;

          const lightning = ctx.createRadialGradient(x, y, 0, x, y, size);
          lightning.addColorStop(0, '#fca5a5');
          lightning.addColorStop(1, 'transparent');

          ctx.fillStyle = lightning;
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
        break;
      }

      case 'freeze': {
        ctx.globalAlpha = intensity * 0.2;
        ctx.fillStyle = '#bfdbfe';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 얼음 결정 효과
        ctx.globalAlpha = intensity * 0.5;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;

        for (let i = 0; i < 20; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = Math.random() * 20 + 5;

          // 눈송이 모양
          ctx.beginPath();
          ctx.moveTo(x - size, y);
          ctx.lineTo(x + size, y);
          ctx.moveTo(x, y - size);
          ctx.lineTo(x, y + size);
          ctx.moveTo(x - size * 0.7, y - size * 0.7);
          ctx.lineTo(x + size * 0.7, y + size * 0.7);
          ctx.moveTo(x + size * 0.7, y - size * 0.7);
          ctx.lineTo(x - size * 0.7, y + size * 0.7);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }

  // 새로운 유물 시각 효과 제어 메서드들
  public setFrozenTiles(tiles: { row: number; col: number }[]) {
    this.frozenTiles.clear();
    tiles.forEach((tile) => {
      this.frozenTiles.add(`${tile.row}-${tile.col}`);
    });
  }

  public activateTimeDistortion(duration: number = 3000) {
    this.screenEffects = {
      type: 'time_distort',
      intensity: 1,
      duration,
      startTime: performance.now(),
    };

    setTimeout(() => {
      this.screenEffects.type = null;
    }, duration);
  }

  public showChaosEffect(intensity: number = 0.5, duration: number = 2000) {
    this.screenEffects = {
      type: 'chaos',
      intensity,
      duration,
      startTime: performance.now(),
    };

    setTimeout(() => {
      this.screenEffects.type = null;
    }, duration);
  }

  public activateFreezeEffect(duration: number = 1500) {
    this.screenEffects = {
      type: 'freeze',
      intensity: 0.8,
      duration,
      startTime: performance.now(),
    };

    setTimeout(() => {
      this.screenEffects.type = null;
    }, duration);
  }

  // 필수 사용자 피드백 애니메이션 트리거
  public triggerMatchFeedback(tiles: { row: number; col: number; id: string }[]) {
    // 매치 피드백은 성능과 관계없이 항상 표시 (사용자 경험에 필수)
    tiles.forEach((tile) => {
      // 간단한 시각적 피드백을 Canvas에 직접 그리기
      this.addAnimation(tile.id, 'match', {
        duration: 200, // 빠른 피드백
      });

      // 중요한 매치(4개 이상)에만 파티클 효과
      if (tiles.length >= 4) {
        this.addParticle(tile.col, tile.row, '#ffd700');
      }
    });
  }

  public triggerScoreFeedback(row: number, col: number, score: number) {
    // Canvas에 직접 점수 텍스트 그리기 (DOM 애니메이션 대신)
    this.drawFloatingText(col, row, `+${score}`, '#4ade80', 800);
  }

  private drawFloatingText(col: number, row: number, text: string, color: string, duration: number) {
    const tileWithGap = this.tileSize + CanvasGameRenderer.TILE_GAP;
    const x = col * tileWithGap + this.gridStartX + this.tileSize / 2;
    const y = row * tileWithGap + this.gridStartY + this.tileSize / 2;

    const animation = {
      tileId: `text-${col}-${row}-${Date.now()}`,
      type: 'floating_text' as const,
      startTime: performance.now(),
      duration,
      fromX: x,
      fromY: y,
      toX: x,
      toY: y - 40,
      text,
      color,
      fromOpacity: 1,
      toOpacity: 0,
    };

    this.animations.set(animation.tileId, animation);
  }

  // 성능 설정 업데이트 메서드
  public updatePerformanceSettings(settings: Partial<PerformanceSettings>) {
    this.performanceSettings = { ...this.performanceSettings, ...settings };
    console.log('🎮 Performance Settings Updated:', this.performanceSettings);

    // 캔버스 재설정 (DPR, 안티앨리어싱 변경 시 필요)
    if (settings.maxDPR !== undefined || settings.enableAntiAliasing !== undefined) {
      this.setupCanvas();
    }
  }

  public getPerformanceSettings(): PerformanceSettings {
    return { ...this.performanceSettings };
  }

  private handleMemoryWarning(stats: MemoryStats) {
    console.warn('⚠️ Memory warning in Canvas Renderer:', stats);

    // 메모리 사용량에 따른 적응형 대응
    if (stats.usagePercentage >= 85) {
      // 위험 수준: 즉시 대응
      this.emergencyMemoryCleanup();
    } else if (stats.usagePercentage >= 70) {
      // 경고 수준: 점진적 대응
      this.performMemoryOptimization();
    }
  }

  private emergencyMemoryCleanup() {
    console.log('🚨 Emergency memory cleanup');

    // 1. 모든 애니메이션 즉시 정지
    this.animations.clear();
    this.particles = [];

    // 2. 아이콘 캐시 절반 정리
    let cacheCount = 0;
    const maxCacheSize = Math.floor(this.iconCache.size / 2);
    for (const [key] of this.iconCache) {
      if (cacheCount >= maxCacheSize) break;
      this.iconCache.delete(key);
      cacheCount++;
    }

    // 3. 그라디언트 캐시 완전 정리
    this.gradientCache.clear();

    // 4. 성능 설정 하향 조정
    this.updatePerformanceSettings({
      targetFPS: Math.max(30, this.performanceSettings.targetFPS - 15),
      particleCount: Math.max(1, Math.floor(this.performanceSettings.particleCount / 2)),
      enableComplexAnimations: false,
      enableScreenEffects: false,
      renderThreshold: Math.max(150, this.performanceSettings.renderThreshold + 50),
    });
  }

  private performMemoryOptimization() {
    console.log('⚡ Memory optimization');

    // 1. 오래된 애니메이션 정리
    const now = performance.now();
    for (const [id, animation] of this.animations) {
      if (now - animation.startTime > animation.duration * 2) {
        this.animations.delete(id);
      }
    }

    // 2. 파티클 수 제한
    if (this.particles.length > 20) {
      this.particles = this.particles.slice(0, 20);
    }

    // 3. 성능 설정 미세 조정
    if (this.performanceSettings.targetFPS > 45) {
      this.updatePerformanceSettings({
        targetFPS: this.performanceSettings.targetFPS - 10,
        particleCount: Math.max(3, this.performanceSettings.particleCount - 1),
        renderThreshold: this.performanceSettings.renderThreshold + 25,
      });
    }
  }

  public cleanupUnusedAssets() {
    // 수동으로 호출 가능한 에셋 정리
    const unusedKeys: string[] = [];

    // 현재 그리드에서 사용되지 않는 아이콘 찾기
    const usedTileTypes = new Set<string>();
    for (const row of this.grid) {
      for (const tile of row) {
        usedTileTypes.add(`${tile.type}-${tile.tier}`);
      }
    }

    // 사용되지 않는 아이콘 캐시 제거
    for (const [key] of this.iconCache) {
      if (!usedTileTypes.has(key)) {
        unusedKeys.push(key);
      }
    }

    unusedKeys.forEach((key) => this.iconCache.delete(key));

    if (unusedKeys.length > 0) {
      console.log(`🧹 Cleaned up ${unusedKeys.length} unused assets`);
    }
  }

  public destroy() {
    this.stopRenderLoop();
    this.memoryManager.stop();
    this.animations.clear();
    this.particles = [];
    this.iconCache.clear();
    this.gradientCache.clear();
    this.frozenTiles.clear();
  }
}

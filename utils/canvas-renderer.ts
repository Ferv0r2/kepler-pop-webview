import { GRID_SIZE } from '@/screens/GameView/constants/game-config';
import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GridItem, TileType, TierType } from '@/types/game-types';

interface TileAnimation {
  tileId: string;
  startTime: number;
  duration: number;
  type: 'swap' | 'match' | 'drop' | 'appear' | 'hint' | 'select' | 'upgrade';
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  fromScale?: number;
  toScale?: number;
  fromOpacity?: number;
  toOpacity?: number;
  rotation?: number;
  onComplete?: () => void;
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
  private static readonly MAX_BORDER_WIDTH = 4; // tier 3의 최대 border 두께
  private static readonly BORDER_BUFFER = CanvasGameRenderer.MAX_BORDER_WIDTH * 2; // 양쪽 border 고려
  private static readonly TILE_GAP = 4; // 타일 간격

  // 애니메이션 타이밍 상수
  private static readonly ANIMATION_DURATION_FAST = 150; // 빠른 애니메이션 (swap 시작)
  private static readonly ANIMATION_DURATION_NORMAL = 250; // 일반 애니메이션 (swap 완료)
  private static readonly ANIMATION_DURATION_SLOW = 350; // 느린 애니메이션 (match, drop, appear, upgrade)

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

    this.setupCanvas();
    void this.preloadAssets();
  }

  private setupCanvas() {
    // 고해상도 디스플레이 대응 (성능을 위해 DPR 제한)
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // 최대 2배로 제한
    const rect = this.canvas.getBoundingClientRect();

    // 캔버스 크기 설정 전에 컨텍스트 리셋
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // 컨텍스트가 리셋되므로 다시 스케일 적용
    this.ctx.scale(dpr, dpr);

    // 안티앨리어싱 설정 (성능 최적화)
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'low'; // 성능 향상을 위해 low로 설정

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

    // 안티앨리어싱 설정 (성능 최적화)
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'low'; // 성능 향상을 위해 low로 설정
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

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
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

    // 변경사항이 없으면 렌더링 스킵
    const hasChanges =
      this.animations.size > 0 || this.particles.length > 0 || this.isLoading || this.lastFrameTime === 0;

    if (!hasChanges && deltaTime < 50) {
      return; // 변경사항이 없고 50ms 이내면 스킵
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
          }
        }

        // 매칭된 타일은 그리지 않음
        if (tile.isMatched && !animation) continue;

        // 특수 효과
        const tileKey = `${row}-${col}`;
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

        // 타일 그리기
        this.drawTile(tile, x, y, scale, opacity, rotation);

        // 힌트 효과 - 타일 위에 그리기
        if (this.hintTiles.has(tileKey)) {
          this.drawHintEffect(ctx, x, y, now);
        }
      }
    }

    // 아이템 효과 오버레이 그리기
    this.drawItemEffectOverlay();

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
    const targetFPS = 60; // 60fps로 증가하여 더 부드러운 애니메이션
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

      // 적응형 렌더링: 애니메이션이 있을 때는 60fps, 없을 때는 30fps
      const hasAnimations = this.animations.size > 0 || this.particles.length > 0 || this.isLoading;
      const currentFrameTime = hasAnimations ? frameTime : frameTime * 2;

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

      // 파티클 효과 추가
      this.addParticle(tile.col, tile.row, '#ffd700');
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
        duration: CanvasGameRenderer.ANIMATION_DURATION_SLOW, // 400ms로 부드러운 전환
      });

      // 파티클 효과 추가 (황금색 반짝임)
      this.addParticle(tile.col, tile.row, '#ffd700');
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

  public destroy() {
    this.stopRenderLoop();
    this.animations.clear();
    this.particles = [];
    this.iconCache.clear();
    this.gradientCache.clear();
  }
}

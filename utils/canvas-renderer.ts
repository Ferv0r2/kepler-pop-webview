import { tileConfig } from '@/screens/GameView/constants/tile-config';
import type { GridItem, TileType } from '@/types/game-types';
import { GRID_SIZE } from '@/screens/GameView/constants/game-config';

interface TileAnimation {
  tileId: string;
  startTime: number;
  duration: number;
  type: 'swap' | 'match' | 'drop' | 'appear' | 'hint' | 'select';
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  fromScale?: number;
  toScale?: number;
  fromOpacity?: number;
  toOpacity?: number;
  rotation?: number;
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

  // Item effect overlays
  setSelectedItem(itemType: string | null): void {
    this.selectedItemType = itemType;
  }

  setHoveredTile(row: number | null, col: number | null): void {
    this.hoveredTile = row !== null && col !== null ? { row, col } : null;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    })!;

    this.setupCanvas();
    this.preloadAssets();
  }

  private setupCanvas() {
    // 고해상도 디스플레이 대응
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);

    // 캔버스 스타일 설정
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // 그리드 크기 계산 - 타일을 여백 없이 꽉 채움
    const padding = 8;
    const gap = 0; // 간격 제거
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    const totalGapWidth = (GRID_SIZE - 1) * gap;
    const totalGapHeight = (GRID_SIZE - 1) * gap;

    this.tileSize = Math.min(
      (availableWidth - totalGapWidth) / GRID_SIZE,
      (availableHeight - totalGapHeight) / GRID_SIZE,
    );

    const gridWidth = this.tileSize * GRID_SIZE + totalGapWidth;
    const gridHeight = this.tileSize * GRID_SIZE + totalGapHeight;

    this.gridStartX = (rect.width - gridWidth) / 2;
    this.gridStartY = (rect.height - gridHeight) / 2;

    // 안티앨리어싱 설정
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private async preloadAssets() {
    // 식물 이미지 로드
    const tileTypes = [1, 2, 3, 4, 5] as TileType[];
    console.log('🌱 Loading plant images...');

    const loadPromises = tileTypes.map(async (tileType) => {
      const imagePath = tileConfig[tileType].image;
      const img = new Image();

      try {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            console.log(`✓ Loaded: ${imagePath}`);
            resolve();
          };
          img.onerror = (error) => {
            console.error(`✗ Failed to load: ${imagePath}`, error);
            reject(error);
          };
          img.src = imagePath;
        });

        // 성공적으로 로드된 경우만 캐시에 저장
        for (let tier = 1; tier <= 3; tier++) {
          const key = `${tileType}-${tier}`;
          this.iconCache.set(key, img);
        }
      } catch (error) {
        // 에러 발생 시 기본 이미지나 대체 이미지 사용
        console.warn(`Using fallback for tile type ${tileType}`);
        // 기본 색상 사각형으로 대체
        const fallbackImg = this.createFallbackImage(tileType);
        for (let tier = 1; tier <= 3; tier++) {
          const key = `${tileType}-${tier}`;
          this.iconCache.set(key, fallbackImg);
        }
      }
    });

    await Promise.allSettled(loadPromises);
    console.log('🌱 Plant image loading complete!');
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
    this.isShuffling = shuffling;
    if (shuffling) {
      this.grid.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
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
      duration: options.duration || 300,
      ...options,
    };

    this.animations.set(tileId, animation);
  }

  public addParticle(x: number, y: number, color: string) {
    const gap = 5;
    const tileWithGap = this.tileSize + gap;

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
    const now = performance.now();

    // 애니메이션 업데이트
    for (const [id, animation] of this.animations) {
      const elapsed = now - animation.startTime;
      if (elapsed >= animation.duration) {
        this.animations.delete(id);
      }
    }

    // 파티클 업데이트
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // 중력
      particle.life -= deltaTime / 1000;
      return particle.life > 0;
    });
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
    const borderRadius = Math.min(this.tileSize * 0.2, 16);

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

    // 민간한 테두리
    ctx.strokeStyle = '#e2e8f0'; // slate-200
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.tileSize, this.tileSize, borderRadius);
    ctx.stroke();

    // 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    // Tier 효과 - 식물 타일에 맞게 단순화
    if (tile.tier === 2) {
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
      // 식물 이미지는 그림자를 선늤게 적용
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;

      // 식물 이미지를 타일 전체를 채우도록 (100%)
      const iconSize = this.tileSize;
      const iconX = 0;
      const iconY = 0;

      // 이미지 품질 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      try {
        ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
      } catch (error) {
        console.warn('Failed to draw plant image:', error);
        // 대체 텍스트 그리기
        this.drawFallbackText(ctx, tile.type, iconX, iconY, iconSize);
      }
      ctx.restore();
    } else {
      // 이미지가 없거나 로드되지 않은 경우 대체 표시
      ctx.save();
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

  public render() {
    if (!this.ctx || !this.grid.length) return;

    const ctx = this.ctx;
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // 배경 클리어 (투명하게)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 애니메이션 업데이트
    this.updateAnimations(deltaTime);

    // 그리드 그리기
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = this.grid[row]?.[col];
        if (!tile) continue;

        const gap = 0;
        let x = this.gridStartX + col * (this.tileSize + gap);
        let y = this.gridStartY + row * (this.tileSize + gap);
        let scale = 1;
        let opacity = 1;
        let rotation = 0;

        // 애니메이션 적용
        const animation = this.animations.get(tile.id);
        if (animation) {
          const progress = Math.min((now - animation.startTime) / animation.duration, 1);
          const eased = this.easeInOut(progress);

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

        if (this.hintTiles.has(tileKey)) {
          // 힌트 효과
          const pulse = Math.sin(now * 0.003) * 0.5 + 0.5;
          ctx.save();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.roundRect(x - 1, y - 1, this.tileSize - 2, this.tileSize - 2, 12);
          ctx.stroke();
          ctx.restore();
        }

        // 타일 그리기
        this.drawTile(tile, x, y, scale, opacity, rotation);
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
    const loop = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
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

    const gap = 5;
    const tileWithGap = this.tileSize + gap;

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
    const gap = 5;
    const tileWithGap = this.tileSize + gap;

    const x1 = this.gridStartX + col1 * tileWithGap;
    const y1 = this.gridStartY + row1 * tileWithGap;
    const x2 = this.gridStartX + col2 * tileWithGap;
    const y2 = this.gridStartY + row2 * tileWithGap;

    this.addAnimation(tile1Id, 'swap', {
      fromX: x1,
      fromY: y1,
      toX: x2,
      toY: y2,
      duration: 200,
    });

    this.addAnimation(tile2Id, 'swap', {
      fromX: x2,
      fromY: y2,
      toX: x1,
      toY: y1,
      duration: 200,
    });
  }

  public handleMatchAnimation(tiles: { row: number; col: number; id: string }[]) {
    tiles.forEach((tile) => {
      this.addAnimation(tile.id, 'match', {
        duration: 300,
      });

      // 파티클 효과 추가
      this.addParticle(tile.col, tile.row, '#ffd700');
    });
  }

  public handleDropAnimation(tiles: { id: string; fromRow: number; toRow: number; col: number }[]) {
    const gap = 5;
    const tileWithGap = this.tileSize + gap;

    tiles.forEach((tile) => {
      const fromY = this.gridStartY + tile.fromRow * tileWithGap;
      const toY = this.gridStartY + tile.toRow * tileWithGap;

      this.addAnimation(tile.id, 'drop', {
        fromY,
        toY,
        duration: 400,
      });
    });
  }

  public handleNewTileAnimation(tiles: { id: string; row: number; col: number }[]) {
    tiles.forEach((tile) => {
      this.addAnimation(tile.id, 'appear', {
        duration: 300,
      });
    });
  }

  public resize() {
    this.setupCanvas();
  }

  private drawItemEffectOverlay() {
    if (!this.selectedItemType || !this.hoveredTile) return;

    const ctx = this.ctx;
    const { row, col } = this.hoveredTile;
    const gap = 0;
    const x = this.gridStartX + col * (this.tileSize + gap);
    const y = this.gridStartY + row * (this.tileSize + gap);

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
        ctx.roundRect(this.gridStartX, y, GRID_SIZE * (this.tileSize + gap) - gap, this.tileSize, 12);
        ctx.fill();
        ctx.stroke();

        // 열 하이라이트
        ctx.beginPath();
        ctx.roundRect(x, this.gridStartY, this.tileSize, GRID_SIZE * (this.tileSize + gap) - gap, 12);
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
              const targetX = this.gridStartX + targetCol * (this.tileSize + gap);
              const targetY = this.gridStartY + targetRow * (this.tileSize + gap);

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

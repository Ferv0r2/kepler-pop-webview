// 프로젝트 내 모든 이미지 경로를 자동으로 수집하는 유틸리티

// 정적 아이콘 이미지
const ICON_IMAGES = [
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
];

// 식물/캐릭터 이미지
const PLANT_IMAGES = [
  '/plants/tulip.png',
  '/plants/sunflower.png',
  '/plants/sprout.png',
  '/plants/mushroom.png',
  '/plants/crystal-cactus.png',
];

// 배너/UI 이미지
const BANNER_IMAGES = ['/banners/loading-banner.png'];

// SVG 아이콘들
const SVG_IMAGES = ['/file.svg', '/globe.svg', '/next.svg', '/vercel.svg', '/window.svg'];

// 캐릭터 이미지 (characters 폴더)
const CHARACTER_IMAGES: string[] = [
  // 캐릭터 이미지들이 있다면 여기에 추가
];

/**
 * 모든 이미지 경로를 반환합니다
 */
export const getAllImagePaths = (): string[] => {
  return [...ICON_IMAGES, ...PLANT_IMAGES, ...BANNER_IMAGES, ...SVG_IMAGES, ...CHARACTER_IMAGES];
};

/**
 * 중요도별로 이미지를 분류합니다
 */
export const getImagesByPriority = () => {
  return {
    // 최고 우선순위 - 즉시 로드되어야 할 이미지들
    critical: [
      '/icons/logo.png',
      '/icons/map.png',
      '/icons/droplet.png',
      '/icons/gem.png',
      '/plants/sprout.png', // 기본 프로필 이미지
      '/banners/loading-banner.png',
    ],
    // 높은 우선순위 - 게임에서 자주 사용되는 이미지들
    high: [
      '/icons/trophy.png',
      '/icons/dice.png',
      '/icons/bomb.png',
      '/icons/shovel.png',
      '/icons/mole.png',
      '/plants/tulip.png',
      '/plants/sunflower.png',
      '/plants/mushroom.png',
      '/plants/crystal-cactus.png',
    ],
    // 보통 우선순위 - 필요할 때 로드되는 이미지들
    normal: [
      '/icons/watering-can.png',
      '/icons/water-tanks.png',
      '/icons/treasure-pile.png',
      '/icons/treasure-chest.png',
    ],
    // 낮은 우선순위 - 나중에 로드되어도 되는 이미지들
    low: [...SVG_IMAGES, ...CHARACTER_IMAGES],
  };
};

/**
 * 게임 내에서 사용되는 모든 이미지를 반환합니다
 */
export const getGameImages = (): string[] => {
  return [...ICON_IMAGES, ...PLANT_IMAGES];
};

/**
 * UI에서 사용되는 이미지를 반환합니다
 */
export const getUIImages = (): string[] => {
  return [...BANNER_IMAGES, ...SVG_IMAGES];
};

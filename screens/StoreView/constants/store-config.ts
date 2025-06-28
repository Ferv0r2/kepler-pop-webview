export interface StoreItem {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'droplet' | 'gems';
  amount: number;
  price?: number; // 보석 구매용 (원화)
  gemCost?: number; // 에너지 구매용 (보석)
  productId?: string; // 인앱 결제용 상품 ID
  badge?: string; // 인기, 한정, 최고가치 등
  originalPrice?: number; // 할인 전 가격
  discount?: number; // 할인율
}

export const STORE_ITEMS: StoreItem[] = [
  // 물방울 패키지 (보석으로 구매)
  {
    id: 'droplet_small',
    name: '이슬 패키지',
    description: '게임을 플레이하기 위한 에너지입니다',
    type: 'droplet',
    image: '/icons/droplet.png',
    amount: 20,
    gemCost: 10,
  },
  {
    id: 'droplet_medium',
    name: '물뿌리개 패키지',
    description: '게임을 플레이하기 위한 에너지입니다',
    type: 'droplet',
    image: '/icons/watering-can.png',
    amount: 50,
    gemCost: 20,
    badge: '인기',
  },
  {
    id: 'droplet_large',
    name: '물탱크 패키지',
    description: '게임을 플레이하기 위한 에너지입니다',
    type: 'droplet',
    image: '/icons/water-tanks.png',
    amount: 100,
    gemCost: 30,
    badge: '최고가치',
  },

  // 보석 패키지 (인앱 결제)
  {
    id: 'gems_small',
    name: '보석 패키지',
    description: '게임 내 프리미엄 화폐입니다',
    type: 'gems',
    image: '/icons/gem.png',
    amount: 50,
    price: 2000,
  },
  {
    id: 'gems_medium',
    name: '보물상자 패키지',
    description: '게임 내 프리미엄 화폐입니다',
    type: 'gems',
    image: '/icons/treasure-chest.png',
    amount: 150,
    price: 5000,
    badge: '인기',
    originalPrice: 6000,
    discount: 17,
  },
  {
    id: 'gems_large',
    name: '보물더미 패키지',
    description: '게임 내 프리미엄 화폐입니다',
    type: 'gems',
    image: '/icons/treasure-pile.png',
    amount: 400,
    price: 10000,
    badge: '최고가치',
    originalPrice: 16000,
    discount: 38,
  },
];

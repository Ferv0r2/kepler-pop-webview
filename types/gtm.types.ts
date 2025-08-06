// GTM 이벤트 타입 정의
export interface BaseGTMEvent {
  event: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, unknown>;
}

// 게임 관련 이벤트
export interface GameEvent extends BaseGTMEvent {
  event: 'game_start' | 'game_end' | 'level_up' | 'achievement_unlock';
  game_mode?: 'casual' | 'challenge';
  score?: number;
  level?: number;
  moves_used?: number;
  game_duration?: number; // 초 단위
  timestamp?: string;
  user_agent?: string;
  page_url?: string;
  page_title?: string;
}

// 구매 관련 이벤트
export interface PurchaseEvent extends BaseGTMEvent {
  event: 'purchase' | 'purchase_attempt' | 'purchase_fail';
  currency: string;
  value: number;
  transaction_id?: string;
  item_name?: string;
  item_category?: string;
  payment_type?: 'gem' | 'iap';
}

// 사용자 인터랙션 이벤트
export interface UserInteractionEvent extends BaseGTMEvent {
  event: 'button_click' | 'page_view' | 'login' | 'logout';
  button_name?: string;
  page_title?: string;
  section?: string;
  login_method?: 'google';
}

// 가챠 관련 이벤트
export interface GachaEvent extends BaseGTMEvent {
  event: 'gacha_open' | 'gacha_reward';
  box_type?: string;
  reward_type?: 'common' | 'rare' | 'epic' | 'legendary';
  tech_points_gained?: number;
}

// 메인 GTM 이벤트 유니온 타입
export type GTMEvent = GameEvent | PurchaseEvent | UserInteractionEvent | GachaEvent;

// DataLayer 타입
declare global {
  interface Window {
    dataLayer: GTMEvent[];
  }
}

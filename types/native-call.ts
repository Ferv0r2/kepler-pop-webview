export interface NavigatorWithStandalone {
  standalone?: boolean;
}

// Base message interfaces
export interface BaseWebViewMessage<T = unknown> {
  type: string;
  payload?: T;
}

// Messages from Web to Native
export interface WebToNativeMessage<T = unknown> extends BaseWebViewMessage<T> {
  type: WebToNativeMessageType;
}

export enum WebToNativeMessageType {
  WEB_APP_READY = 'WEB_APP_READY',

  // Router handler
  BACK_ACTION = 'BACK_ACTION',
  EXIT_ACTION = 'EXIT_ACTION',

  // Game handler
  UPDATE_ENERGY = 'UPDATE_ENERGY',
  SHOW_AD = 'SHOW_AD',
  MAKE_PURCHASE = 'MAKE_PURCHASE',
  GET_USER_INFO = 'GET_USER_INFO',
}

// Messages from Native to Web
export interface NativeToWebMessage<T = unknown> extends BaseWebViewMessage<T> {
  type: NativeToWebMessageType;
}

export enum NativeToWebMessageType {
  // Router handler
  NAVIGATE_STATE = 'NAVIGATE_STATE',

  SET_USER_INFO = 'SET_USER_INFO',
  AD_RESULT = 'AD_RESULT',
  PURCHASE_RESULT = 'PURCHASE_RESULT',
}

// Web to Native message payloads
export type BackActionPayload = void;
export type ExitActionPayload = void;

export interface WebAppReadyPayload {
  timestamp: string;
}

export interface UpdateEnergyPayload {
  change: number;
  newValue: number;
}

export interface ShowAdPayload {
  reason: 'energy_refill' | 'reward' | 'purchase';
}

export interface MakePurchasePayload {
  productId: string;
  quantity: number;
}

// Native to Web message payloads
export interface NavigateStatePayload {
  canGoBack: boolean;
}

export interface SetUserInfoPayload {
  name: string;
  energy: number;
  gems: number;
  level: number;
}

export interface AdResultPayload {
  success: boolean;
  reason: string;
}

export interface PurchaseResultPayload {
  success: boolean;
  productId: string;
  transaction: {
    id: string;
  };
}

// Typed message interfaces
export type WebAppReadyMessage = WebToNativeMessage<WebAppReadyPayload>;
export type UpdateEnergyMessage = WebToNativeMessage<UpdateEnergyPayload>;
export type ShowAdMessage = WebToNativeMessage<ShowAdPayload>;
export type MakePurchaseMessage = WebToNativeMessage<MakePurchasePayload>;
export type GetUserInfoMessage = WebToNativeMessage<void>;

export type SetUserInfoMessage = NativeToWebMessage<SetUserInfoPayload>;
export type AdResultMessage = NativeToWebMessage<AdResultPayload>;
export type PurchaseResultMessage = NativeToWebMessage<PurchaseResultPayload>;

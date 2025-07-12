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

  NEED_TO_LOGIN = 'NEED_TO_LOGIN',

  // Router handler
  BACK_ACTION = 'BACK_ACTION',
  EXIT_ACTION = 'EXIT_ACTION',

  // Energy control
  ENERGY_CHANGE = 'ENERGY_CHANGE',

  // In-app purchase
  IN_APP_PURCHASE = 'IN_APP_PURCHASE',
}

// Messages from Native to Web
export interface NativeToWebMessage<T = unknown> extends BaseWebViewMessage<T> {
  type: NativeToWebMessageType;
}

export enum NativeToWebMessageType {
  // Router handler
  CAN_BACK_STATE = 'CAN_BACK_STATE',

  RESUME_ACTION = 'RESUME_ACTION',

  GOOGLE_ID_TOKEN = 'GOOGLE_ID_TOKEN',
  APPLE_ID_TOKEN = 'APPLE_ID_TOKEN',

  ENERGY_CHANGE = 'ENERGY_CHANGE',

  // In-app purchase
  PURCHASE_RESULT = 'PURCHASE_RESULT',

  NATIVE_ERROR = 'NATIVE_ERROR',
  // Wildcard for all message types
  ALL = '*',
}

// Web to Native message payloads
export type BackActionPayload = void;
export type ExitActionPayload = void;

export interface WebAppReadyPayload {
  timestamp: string;
}

export interface InAppPurchasePayload {
  productId: string;
}

// Native to Web message payloads
export interface NavigateStatePayload {
  canGoBack: boolean;
}

export interface GoogleIdTokenPayload {
  token: string;
}

export interface AppleIdTokenPayload {
  token: string;
}

export interface NativeErrorPayload {
  message: string;
  stack?: string;
}

export interface EnergyUpdatePayload {
  status: 'success' | 'failed';
  amount: number;
  reason?: string; // optional: 광고, 구매 등
}

export interface GemUpdatePayload {
  status: 'success' | 'failed';
  amount: number;
  reason?: string; // optional: 광고, 구매 등
}

export interface PurchaseResultPayload {
  status: 'success' | 'failed' | 'cancelled';
  productId: string;
  amount?: number;
  error?: string;
}

// Typed message interfaces
export type WebAppReadyMessage = WebToNativeMessage<WebAppReadyPayload>;
export type GoogleIdTokenMessage = NativeToWebMessage<GoogleIdTokenPayload>;
export type AppleIdTokenMessage = NativeToWebMessage<AppleIdTokenPayload>;
export type GemUpdateMessage = WebToNativeMessage<GemUpdatePayload>;
export type InAppPurchaseMessage = WebToNativeMessage<InAppPurchasePayload>;
export type PurchaseResultMessage = NativeToWebMessage<PurchaseResultPayload>;

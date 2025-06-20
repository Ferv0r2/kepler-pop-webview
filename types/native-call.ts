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

  ENERGY_CHANGE = 'ENERGY_CHANGE',

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

// Native to Web message payloads
export interface NavigateStatePayload {
  canGoBack: boolean;
}

export interface GoogleIdTokenPayload {
  token: string;
}

export interface NativeErrorPayload {
  message: string;
  stack?: string;
}

export interface EnergyChangePayload {
  status: 'success' | 'failed';
  amount: number;
  reason?: string; // optional: 광고, 구매 등
}

// Typed message interfaces
export type WebAppReadyMessage = WebToNativeMessage<WebAppReadyPayload>;
export type GoogleIdTokenMessage = NativeToWebMessage<GoogleIdTokenPayload>;

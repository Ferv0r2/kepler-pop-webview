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
}

// Messages from Native to Web
export interface NativeToWebMessage<T = unknown> extends BaseWebViewMessage<T> {
  type: NativeToWebMessageType;
}

export enum NativeToWebMessageType {
  // Router handler
  CAN_BACK_STATE = 'CAN_BACK_STATE',

  GOOGLE_ID_TOKEN = 'GOOGLE_ID_TOKEN',
  AD_RESULT = 'AD_RESULT',
  PURCHASE_RESULT = 'PURCHASE_RESULT',

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

// Typed message interfaces
export type WebAppReadyMessage = WebToNativeMessage<WebAppReadyPayload>;
export type GoogleIdTokenMessage = NativeToWebMessage<GoogleIdTokenPayload>;

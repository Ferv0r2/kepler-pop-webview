/**
 * Types for WebView Bridge communication
 */

// Base message interfaces
export interface BaseWebViewMessage {
  type: string;
  payload?: any;
}

// Message types from Web to React Native
export enum WebToNativeMessageType {
  WEB_APP_READY = 'WEB_APP_READY',
  UPDATE_ENERGY = 'UPDATE_ENERGY',
  SHOW_AD = 'SHOW_AD',
  MAKE_PURCHASE = 'MAKE_PURCHASE',
  GET_USER_INFO = 'GET_USER_INFO',
}

// Message types from React Native to Web
export enum NativeToWebMessageType {
  SET_USER_INFO = 'SET_USER_INFO',
  AD_RESULT = 'AD_RESULT',
  PURCHASE_RESULT = 'PURCHASE_RESULT',
}

// Web to Native message payloads
export interface WebAppReadyPayload {
  timestamp: string;
}

export interface UpdateEnergyPayload {
  change: number;
  newValue: number;
}

export interface ShowAdPayload {
  reason: string;
}

export interface MakePurchasePayload {
  productId: string;
  quantity: number;
}

// Native to Web message payloads
export interface SetUserInfoPayload {
  name?: string;
  energy?: number;
  gameMoney?: number;
  gems?: number;
  level?: number;
  isAdFree?: boolean;
  isSubscribed?: boolean;
}

export interface AdResultPayload {
  success: boolean;
  reason: string;
  error?: string;
}

export interface PurchaseResultPayload {
  success: boolean;
  productId: string;
  quantity?: number;
  transaction?: {
    id: string;
    date?: string;
  };
  error?: string;
}

// Typed message interfaces from Web to React Native
export interface WebAppReadyMessage extends BaseWebViewMessage {
  type: WebToNativeMessageType.WEB_APP_READY;
  payload: WebAppReadyPayload;
}

export interface UpdateEnergyMessage extends BaseWebViewMessage {
  type: WebToNativeMessageType.UPDATE_ENERGY;
  payload: UpdateEnergyPayload;
}

export interface ShowAdMessage extends BaseWebViewMessage {
  type: WebToNativeMessageType.SHOW_AD;
  payload: ShowAdPayload;
}

export interface MakePurchaseMessage extends BaseWebViewMessage {
  type: WebToNativeMessageType.MAKE_PURCHASE;
  payload: MakePurchasePayload;
}

export interface GetUserInfoMessage extends BaseWebViewMessage {
  type: WebToNativeMessageType.GET_USER_INFO;
}

// Typed message interfaces from React Native to Web
export interface SetUserInfoMessage extends BaseWebViewMessage {
  type: NativeToWebMessageType.SET_USER_INFO;
  payload: SetUserInfoPayload;
}

export interface AdResultMessage extends BaseWebViewMessage {
  type: NativeToWebMessageType.AD_RESULT;
  payload: AdResultPayload;
}

export interface PurchaseResultMessage extends BaseWebViewMessage {
  type: NativeToWebMessageType.PURCHASE_RESULT;
  payload: PurchaseResultPayload;
}

// Union types for all possible messages
export type WebToNativeMessage =
  | WebAppReadyMessage
  | UpdateEnergyMessage
  | ShowAdMessage
  | MakePurchaseMessage
  | GetUserInfoMessage;

export type NativeToWebMessage = SetUserInfoMessage | AdResultMessage | PurchaseResultMessage;

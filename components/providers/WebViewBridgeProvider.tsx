'use client';

import React, { createContext, ReactNode, useContext, useEffect } from 'react';

import { useWebViewBridge } from '@/hooks/useWebViewBridge';
import type { NativeToWebMessage, WebToNativeMessage } from '@/types/native-call';
import { NativeToWebMessageType } from '@/types/native-call';

// Define context type
interface WebViewBridgeContextType {
  isInWebView: boolean;
  lastReceivedMessage: NativeToWebMessage | null;
  sendMessage: <T extends WebToNativeMessage>(message: T) => void;
  addMessageHandler: <T extends NativeToWebMessage>(
    type: NativeToWebMessageType,
    handler: (message: T) => void,
  ) => () => void;
}

// Create context with default values
const WebViewBridgeContext = createContext<WebViewBridgeContextType>({
  isInWebView: false,
  lastReceivedMessage: null,
  sendMessage: () => {},
  addMessageHandler: () => () => {},
});

interface WebViewBridgeProviderProps {
  children: ReactNode;
}

/**
 * Provider component for WebView bridge functionality
 * Wrap your application or component tree with this provider to enable WebView communication
 */
export function WebViewBridgeProvider({ children }: WebViewBridgeProviderProps) {
  const bridge = useWebViewBridge();

  // NATIVE_ERROR 메시지 전역 처리
  useEffect(() => {
    const unsubscribe = bridge.addMessageHandler<NativeToWebMessage<import('@/types/native-call').NativeErrorPayload>>(
      NativeToWebMessageType.NATIVE_ERROR,
      (msg) => {
        const payload = msg.payload as import('@/types/native-call').NativeErrorPayload;
        console.error('[ERROR]', payload?.message, payload?.stack);
        // TODO: 전역 알림, Sentry 등 원하는 처리 추가
      },
    );
    return unsubscribe;
  }, [bridge]);

  return <WebViewBridgeContext.Provider value={bridge}>{children}</WebViewBridgeContext.Provider>;
}

/**
 * Hook to use the WebView bridge context
 * Use this in components that need to communicate with React Native WebView
 */
export function useWebViewBridgeContext() {
  const context = useContext(WebViewBridgeContext);

  if (context === undefined) {
    throw new Error('useWebViewBridgeContext must be used within a WebViewBridgeProvider');
  }

  return context;
}

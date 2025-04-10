'use client';

import { useCallback, useEffect, useState } from 'react';
import { webViewBridge } from '@/utils/webview-bridge';
import type { NativeToWebMessage, WebToNativeMessage, WebToNativeMessageType } from '@/types/WebViewTypes';

/**
 * React hook for using the WebView bridge in components
 */
export function useWebViewBridge() {
  const [isInWebView, setIsInWebView] = useState<boolean>(false);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<NativeToWebMessage | null>(null);

  useEffect(() => {
    // Check if running in WebView on mount (client-side only)
    setIsInWebView(webViewBridge.isRunningInWebView());

    // Setup message listener
    const unsubscribe = webViewBridge.addMessageListener((message) => {
      setLastReceivedMessage(message);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Send a message to the React Native WebView
   */
  const sendMessage = useCallback((type: string, payload?: any) => {
    const message: WebToNativeMessage = { type, payload } as WebToNativeMessage;
    webViewBridge.postMessage(message);
  }, []);

  /**
   * Add a custom message handler for specific message types
   */
  const addMessageHandler = useCallback((type: string, handler: (payload: any) => void) => {
    const unsubscribe = webViewBridge.addMessageListener((message) => {
      if (message.type === type || type === '*') {
        handler(message.payload);
      }
    });

    return unsubscribe;
  }, []);

  return {
    isInWebView,
    lastReceivedMessage,
    sendMessage,
    addMessageHandler,
  };
}

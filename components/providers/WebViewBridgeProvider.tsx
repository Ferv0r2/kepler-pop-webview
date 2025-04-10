'use client';

import React, { createContext, ReactNode, useContext } from 'react';
import { useWebViewBridge } from '@/hooks/useWebViewBridge';
import type { NativeToWebMessage } from '@/types/WebViewTypes';

// Define context type
interface WebViewBridgeContextType {
  isInWebView: boolean;
  lastReceivedMessage: NativeToWebMessage | null;
  sendMessage: (type: string, payload?: any) => void;
  addMessageHandler: (type: string, handler: (payload: any) => void) => () => void;
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

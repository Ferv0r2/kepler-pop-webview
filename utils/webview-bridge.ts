'use client';

/**
 * WebViewBridge: Utility for handling bi-directional communication between
 * React Native WebView and this web application
 */

import type { NativeToWebMessage, NavigatorWithStandalone, WebToNativeMessage } from '@/types/native-call';

class WebViewBridge {
  private static instance: WebViewBridge;
  private messageHandlers: Map<string, Set<(message: NativeToWebMessage) => void>> = new Map();

  private constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', (event: MessageEvent) => {
      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        this.handleIncomingMessage(message as NativeToWebMessage);
      } catch (error) {
        console.error('Error handling incoming message:', error);
      }
    });
  }

  private handleIncomingMessage(message: NativeToWebMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for type ${message.type}:`, error);
        }
      });
    }
  }

  public static getInstance(): WebViewBridge {
    if (!WebViewBridge.instance) {
      WebViewBridge.instance = new WebViewBridge();
    }
    return WebViewBridge.instance;
  }

  public addMessageListener(type: string, callback: (message: NativeToWebMessage) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(callback);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  public postMessage<T extends WebToNativeMessage>(message: T): void {
    if (!this.isRunningInWebView()) {
      console.warn('Not running in WebView, message not sent:', message);
      return;
    }

    try {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error sending message to React Native:', error);
    }
  }

  public isRunningInWebView(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipod|ipad/.test(userAgent);
    const isStandalone = (navigator as NavigatorWithStandalone).standalone;

    return /wv/.test(userAgent) || (isIOS && !isStandalone) || typeof window.ReactNativeWebView !== 'undefined';
  }
}

export const webViewBridge = WebViewBridge.getInstance();

// Re-export types for convenience
export type { WebToNativeMessage, NativeToWebMessage };

// Helper hooks will be added in a separate file

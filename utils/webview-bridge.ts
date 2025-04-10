'use client';

/**
 * WebViewBridge: Utility for handling bi-directional communication between
 * React Native WebView and this web application
 */

import type { WebToNativeMessage, NativeToWebMessage } from '@/types/WebViewTypes';

class WebViewBridge {
  private static instance: WebViewBridge;
  private isInWebView: boolean = false;

  constructor() {
    // Check if running in a WebView environment
    this.isInWebView = this.detectWebView();
  }

  /**
   * Detect if the application is running in a WebView
   */
  private detectWebView(): boolean {
    if (typeof window === 'undefined') return false;

    // Various ways to detect if running in WebView
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      // Android WebView
      /wv/.test(userAgent) ||
      // Check for mobile device that's not standalone (iOS WebView indicator)
      (/iphone|ipod|ipad/.test(userAgent) && !(window as any).navigator.standalone) ||
      // General approach - check for ReactNativeWebView global object
      typeof (window as any).ReactNativeWebView !== 'undefined'
    );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WebViewBridge {
    if (!WebViewBridge.instance) {
      WebViewBridge.instance = new WebViewBridge();
    }
    return WebViewBridge.instance;
  }

  /**
   * Send message to React Native WebView
   */
  public postMessage(message: WebToNativeMessage): void {
    if (!this.isInWebView) {
      console.warn('Not running in WebView, message not sent:', message);
      return;
    }

    try {
      // Send message to React Native
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error sending message to React Native:', error);
    }
  }

  /**
   * Add message event listener to receive messages from React Native
   */
  public addMessageListener(callback: (message: NativeToWebMessage) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        callback(message as NativeToWebMessage);
      } catch (error) {
        console.error('Error parsing message from React Native:', error);
      }
    };

    window.addEventListener('message', handleMessage);

    // Return cleanup function
    return () => window.removeEventListener('message', handleMessage);
  }

  /**
   * Check if application is running in a WebView
   */
  public isRunningInWebView(): boolean {
    return this.isInWebView;
  }
}

// Export singleton instance
export const webViewBridge = WebViewBridge.getInstance();

// Re-export types for convenience
export type { WebToNativeMessage, NativeToWebMessage };

// Helper hooks will be added in a separate file

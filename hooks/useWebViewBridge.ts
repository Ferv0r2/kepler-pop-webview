import { useCallback, useEffect, useState, useMemo } from 'react';

import type { NativeToWebMessage, WebToNativeMessage, NativeToWebMessageType } from '@/types/native-call';
import { webViewBridge } from '@/utils/webview-bridge';

export const useWebViewBridge = () => {
  const [lastReceivedMessage, setLastReceivedMessage] = useState<NativeToWebMessage | null>(null);
  const [isInWebView, setIsInWebView] = useState(false);

  // WebView 상태 감지
  useEffect(() => {
    setIsInWebView(webViewBridge.isRunningInWebView());
  }, []);

  // 메시지 전송 함수
  const sendMessage = useCallback(<T extends WebToNativeMessage>(message: T) => {
    webViewBridge.postMessage(message);
  }, []);

  // 메시지 핸들러 등록 함수
  const addMessageHandler = useCallback(
    <T extends NativeToWebMessage>(type: NativeToWebMessageType, handler: (message: T) => void) => {
      return webViewBridge.addMessageListener(type, (message) => {
        setLastReceivedMessage(message);
        handler(message as T);
      });
    },
    [],
  );

  // 메모이제이션된 값 반환
  return useMemo(
    () => ({
      isInWebView,
      lastReceivedMessage,
      sendMessage,
      addMessageHandler,
    }),
    [isInWebView, lastReceivedMessage, sendMessage, addMessageHandler],
  );
};

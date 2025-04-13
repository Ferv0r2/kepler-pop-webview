import { useEffect } from 'react';

import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { WebToNativeMessageType, NativeToWebMessageType } from '@/types/native-call';
import { eventBus } from '@/utils/event-bus';

/**
 * @description (AOS) 하드웨어의 뒤로 가기 버튼 이벤트를 처리하는 훅
 * @param handler 커스텀 핸들러
 */
export const useBackButton = (handler?: () => void) => {
  const { sendMessage, addMessageHandler } = useWebViewBridgeContext();

  useEffect(() => {
    const unsubscribe = addMessageHandler(NativeToWebMessageType.CAN_BACK_STATE, () => {
      eventBus.emit(WebToNativeMessageType.BACK_ACTION);
    });

    return () => {
      unsubscribe();
    };
  }, [addMessageHandler]);

  useEffect(() => {
    if (!handler) {
      // 기본 핸들러 - 뒤로 가기
      const defaultHandler = () => {
        sendMessage({ type: WebToNativeMessageType.BACK_ACTION });
      };
      const unsubscribe = eventBus.on(WebToNativeMessageType.BACK_ACTION, defaultHandler);
      return () => {
        unsubscribe();
      };
    }

    // 커스텀 핸들러
    const unsubscribe = eventBus.on(WebToNativeMessageType.BACK_ACTION, () => {
      handler();
    });

    return () => {
      unsubscribe();
    };
  }, [handler, sendMessage]);
};

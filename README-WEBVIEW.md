# WebView Bridge Documentation

This document explains how to implement bi-directional communication between React Native WebView and the Kepler Pop web application.

## Overview

The WebView Bridge enables communication between:

- React Native application (loading the web app via WebView)
- Next.js web application (running inside the WebView)

## Implementation Details

### Web Application Side (Next.js)

The web application uses a WebView bridge utility to:

1. Detect WebView environment
2. Send messages to React Native
3. Receive messages from React Native

#### Core Files

- `utils/webview-bridge.ts` - Core bridge implementation
- `hooks/useWebViewBridge.ts` - React hook
- `components/providers/WebViewBridgeProvider.tsx` - Context provider
- `types/native-call.ts` - Type definitions

#### Usage in Components

```tsx
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { WebToNativeMessageType, NativeToWebMessageType } from '@/types/native-call';

function MyComponent() {
  const { isInWebView, sendMessage, addMessageHandler } = useWebViewBridgeContext();

  // Send message
  const handleReady = () => {
    sendMessage({
      type: WebToNativeMessageType.WEB_APP_READY,
      payload: { timestamp: new Date().toISOString() },
    });
  };

  // Receive message
  useEffect(() => {
    const unsubscribe = addMessageHandler<SetUserInfoMessage>(NativeToWebMessageType.SET_USER_INFO, (message) => {
      console.log('User info:', message.payload.name);
    });

    return () => unsubscribe();
  }, [addMessageHandler]);

  if (!isInWebView) {
    return <div>Not running in WebView environment</div>;
  }

  return (
    <div>
      <button onClick={handleReady}>Send Ready Message</button>
    </div>
  );
}
```

### React Native Side

The React Native app uses `react-native-webview` to load and communicate with the web application.

#### Example Implementation

```tsx
import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';

const App = () => {
  const webviewRef = useRef(null);

  // Handle messages from web app
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'WEB_APP_READY':
          // Web app initialization complete
          sendMessageToWebView({
            type: 'SET_USER_INFO',
            payload: {
              name: 'User Name',
              energy: 10,
              gems: 200,
              level: 5,
            },
          });
          break;

        case 'UPDATE_ENERGY':
          // Energy update
          console.log('Energy update:', message.payload);
          break;

        case 'SHOW_AD':
          // Show advertisement
          showAdvertisement(message.payload.reason);
          break;

        case 'MAKE_PURCHASE':
          // Process in-app purchase
          processPurchase(message.payload.productId);
          break;
      }
    } catch (error) {
      console.error('Error parsing message from web:', error);
    }
  };

  // Send message to web app
  const sendMessageToWebView = (message) => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify(message));
    }
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: 'https://kepler-pop.wontae.net' }}
      onMessage={handleWebViewMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
};

export default App;
```

## Message Types

### Web → React Native

| Message Type    | Description              | Payload Example                               |
| --------------- | ------------------------ | --------------------------------------------- |
| `WEB_APP_READY` | Web app initialization   | `{ timestamp: "2023-10-19T12:34:56.789Z" }`   |
| `UPDATE_ENERGY` | User energy update       | `{ change: -1, newValue: 9 }`                 |
| `SHOW_AD`       | Request to show ad       | `{ reason: "energy_refill" }`                 |
| `MAKE_PURCHASE` | In-app purchase request  | `{ productId: "energy_pack_5", quantity: 1 }` |
| `GET_USER_INFO` | Request user information | `{}`                                          |

### React Native → Web

| Message Type      | Description          | Payload Example                                                                |
| ----------------- | -------------------- | ------------------------------------------------------------------------------ |
| `SET_USER_INFO`   | Set/update user info | `{ name: "User", energy: 10, gems: 100, level: 5 }`                            |
| `AD_RESULT`       | Advertisement result | `{ success: true, reason: "energy_refill" }`                                   |
| `PURCHASE_RESULT` | Purchase result      | `{ success: true, productId: "energy_pack_5", transaction: { id: "txn123" } }` |

## Testing

You can test WebView communication at the `/webview-bridge-example` page:

1. Verify WebView environment detection
2. Send test messages to React Native
3. Check incoming messages from React Native
4. Create and send custom messages

## Troubleshooting

Common issues:

1. **Message Reception Failure**
   - Verify message format (must be serializable)
   - Check WebView detection
   - Ensure JavaScript is enabled

2. **WebView Detection Failure**
   - Some browsers may not correctly identify as WebViews
   - Consider adding custom parameters when loading the web app

3. **Performance Issues**
   - Minimize message size and frequency
   - Avoid sending large payloads through the bridge

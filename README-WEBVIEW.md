# WebView Bridge Documentation

This document explains how to implement bi-directional communication between React Native WebView and the Kepler Pop web application.

## Overview

The WebView Bridge enables two-way communication between:

- React Native application that loads the web app in a WebView
- Next.js web application running inside the WebView

## Implementation Details

### Web Application Side (Next.js)

The web application uses a WebView bridge utility to:

1. Detect if it's running inside a WebView
2. Send messages to React Native
3. Listen for messages from React Native

#### Core Files

- `utils/webview-bridge.ts` - Core bridge implementation
- `hooks/useWebViewBridge.ts` - React hook for using the bridge
- `components/providers/WebViewBridgeProvider.tsx` - Context provider for app-wide access

#### Usage in Components

```tsx
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';

function MyComponent() {
  const { isInWebView, sendMessage, addMessageHandler } = useWebViewBridgeContext();

  // Send a message to React Native
  const handleSomeAction = () => {
    if (isInWebView) {
      sendMessage('ACTION_TYPE', { someData: 'value' });
    }
  };

  // Listen for messages from React Native
  useEffect(() => {
    const unsubscribe = addMessageHandler('RN_MESSAGE_TYPE', (payload) => {
      // Handle the message from React Native
      console.log('Received from RN:', payload);
    });

    return () => unsubscribe();
  }, [addMessageHandler]);

  return (
    <div>
      <p>Running in WebView: {isInWebView ? 'Yes' : 'No'}</p>
      <button onClick={handleSomeAction}>Send Message to RN</button>
    </div>
  );
}
```

### React Native Side

The React Native app uses `react-native-webview` to load the web application and communicate with it.

#### Example Implementation

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { BackHandler, Platform } from 'react-native';

const App = () => {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle messages from the web app
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Received message from web:', message);

      // Handle different message types
      switch (message.type) {
        case 'WEB_APP_READY':
          // Web app is initialized and ready
          sendMessageToWebView({
            type: 'SET_USER_INFO',
            payload: {
              name: 'User Name',
              energy: 10,
              gameMoney: 1500,
              gems: 200,
              level: 5,
            },
          });
          break;

        case 'UPDATE_ENERGY':
          // Web app is updating energy
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

  // Function to send messages to the web app
  const sendMessageToWebView = (message) => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify(message));
    }
  };

  // Example functions for handling specific actions
  const showAdvertisement = (reason) => {
    // Show ad using ad SDK
    console.log('Showing ad for reason:', reason);

    // After ad is complete, send result back to web
    setTimeout(() => {
      sendMessageToWebView({
        type: 'AD_RESULT',
        payload: { success: true, reason },
      });
    }, 1000);
  };

  const processPurchase = (productId) => {
    // Process purchase using IAP SDK
    console.log('Processing purchase for:', productId);

    // After purchase is complete, send result back to web
    setTimeout(() => {
      sendMessageToWebView({
        type: 'PURCHASE_RESULT',
        payload: {
          success: true,
          productId,
          transaction: { id: 'txn123' },
        },
      });
    }, 1000);
  };

  // Back button handler (Android)
  useEffect(() => {
    const handleBackButton = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    };

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', handleBackButton);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
      };
    }
  }, [canGoBack]);

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: 'https://kepler-pop.wontae.net' }}
      onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
      onMessage={handleWebViewMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
};

export default App;
```

## Message Types

### From Web to React Native

| Message Type    | Description                           | Payload Example                               |
| --------------- | ------------------------------------- | --------------------------------------------- |
| `WEB_APP_READY` | Notify RN that web app is initialized | `{ timestamp: "2023-10-19T12:34:56.789Z" }`   |
| `UPDATE_ENERGY` | Update user energy                    | `{ change: -1, newValue: 9 }`                 |
| `SHOW_AD`       | Request to show an advertisement      | `{ reason: "energy_refill" }`                 |
| `MAKE_PURCHASE` | Request to process an in-app purchase | `{ productId: "energy_pack_5", quantity: 1 }` |
| `GET_USER_INFO` | Request current user data             | `{}`                                          |

### From React Native to Web

| Message Type      | Description                        | Payload Example                                                                |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `SET_USER_INFO`   | Set or update user information     | `{ name: "User", energy: 10, gems: 100, level: 5 }`                            |
| `AD_RESULT`       | Result of showing an advertisement | `{ success: true, reason: "energy_refill" }`                                   |
| `PURCHASE_RESULT` | Result of a purchase transaction   | `{ success: true, productId: "energy_pack_5", transaction: { id: "txn123" } }` |

## Testing

A test page is available at `/webview-bridge-example` which demonstrates the WebView communication in a visual interface. You can:

1. See whether the app is running in a WebView
2. Send test messages to React Native
3. View incoming messages from React Native
4. Create and send custom messages

## Troubleshooting

Common issues:

1. **Messages not being received**

   - Ensure the message format is correct (must be serializable)
   - Check if the WebView is detected correctly
   - Verify that the WebView has JavaScript enabled

2. **WebView not detected**

   - Some browsers may not correctly identify as WebViews
   - Try adding a custom parameter when loading the web app to force WebView mode

3. **Performance issues**
   - Minimize the size and frequency of messages
   - Don't send large payloads through the bridge

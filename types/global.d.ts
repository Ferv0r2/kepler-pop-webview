interface Window {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
  chrome: never;
}

'use client';

import { useEffect, useState } from 'react';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { ArrowLeft, Send, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Define message type
type MessageDirection = 'sent' | 'received';

interface MessageLog {
  type: string;
  direction: MessageDirection;
  payload: any;
  timestamp: Date;
}

export default function WebViewBridgeExample() {
  const router = useRouter();
  const { isInWebView, sendMessage, addMessageHandler } = useWebViewBridgeContext();
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [customCommand, setCustomCommand] = useState('');
  const [customPayload, setCustomPayload] = useState('{}');
  const [lastResponse, setLastResponse] = useState<any>(null);

  useEffect(() => {
    // Add a message handler for any incoming messages
    const unsubscribe = addMessageHandler('*', (payload) => {
      const newMessage: MessageLog = {
        type: payload.type || 'UNKNOWN',
        direction: 'received' as MessageDirection,
        payload,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setLastResponse(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [addMessageHandler]);

  // Function to send a predefined message
  const handleSendPredefinedMessage = (type: string, payload: any = {}) => {
    sendMessage(type, payload);
    const newMessage: MessageLog = {
      type,
      direction: 'sent' as MessageDirection,
      payload,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Function to send a custom message
  const handleSendCustomMessage = () => {
    try {
      const payload = JSON.parse(customPayload);
      sendMessage(customCommand, payload);
      const newMessage: MessageLog = {
        type: customCommand,
        direction: 'sent' as MessageDirection,
        payload,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setCustomCommand('');
      setCustomPayload('{}');
    } catch (error) {
      console.error('Error parsing JSON payload:', error);
      alert('Invalid JSON payload. Please check your format.');
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isInWebView ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white text-sm">{isInWebView ? 'WebView Connected' : 'Not in WebView'}</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">WebView Bridge Example</h1>

      {/* Predefined Actions Section */}
      <div className="mb-8 bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">Predefined Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleSendPredefinedMessage('GET_USER_INFO')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Request User Info
          </Button>
          <Button
            onClick={() => handleSendPredefinedMessage('UPDATE_ENERGY', { change: -1 })}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Use Energy (-1)
          </Button>
          <Button
            onClick={() => handleSendPredefinedMessage('SHOW_AD', { reason: 'test' })}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Show Advertisement
          </Button>
          <Button
            onClick={() => handleSendPredefinedMessage('MAKE_PURCHASE', { productId: 'test_product' })}
            className="bg-green-600 hover:bg-green-700"
          >
            Test Purchase
          </Button>
        </div>
      </div>

      {/* Custom Command Section */}
      <div className="mb-8 bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">Custom Command</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="command" className="block text-sm font-medium text-gray-300 mb-1">
              Command Type
            </label>
            <input
              id="command"
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              className="w-full rounded-md bg-gray-800 border-gray-700 text-white px-3 py-2"
              placeholder="e.g. CUSTOM_ACTION"
            />
          </div>
          <div>
            <label htmlFor="payload" className="block text-sm font-medium text-gray-300 mb-1">
              JSON Payload
            </label>
            <textarea
              id="payload"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="w-full rounded-md bg-gray-800 border-gray-700 text-white px-3 py-2 h-24"
              placeholder={'{\n  "key": "value"\n}'}
            />
          </div>
          <Button
            onClick={handleSendCustomMessage}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={!customCommand.trim()}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Custom Command
          </Button>
        </div>
      </div>

      {/* Message Log */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">Message Log</h2>
        <div className="h-64 overflow-y-auto bg-gray-950 rounded-md p-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-8">No messages yet. Try sending a command.</div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 p-2 rounded ${
                msg.direction === 'sent'
                  ? 'bg-blue-900/40 border-l-2 border-blue-500'
                  : 'bg-purple-900/40 border-l-2 border-purple-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                  msg.direction === 'sent' ? 'bg-blue-500' : 'bg-purple-500'
                }`}
              >
                {msg.direction === 'sent' ? <Send size={12} /> : <Check size={12} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">{msg.type}</span>
                  <span className="text-xs text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                </div>
                <pre className="text-xs text-gray-300 mt-1 overflow-x-auto p-1">
                  {JSON.stringify(msg.payload, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Response */}
      {lastResponse && (
        <div className="mt-6 bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-3">Last Response</h2>
          <pre className="bg-gray-950 rounded-md p-3 text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

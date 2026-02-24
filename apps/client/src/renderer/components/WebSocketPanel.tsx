import React, { useState, useEffect } from 'react';
import { Item, WebSocketMessage, WebSocketMessageType } from '@holonet/shared';
import { WebSocketClient } from '../services/websocket-client';

interface WebSocketPanelProps {
  item: Item;
  onUpdate: (updates: Partial<Item>) => void;
}

export function WebSocketPanel({ item, onUpdate }: WebSocketPanelProps) {
  const [url, setUrl] = useState(item.url || '');
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageType, setMessageType] = useState<WebSocketMessageType>('text');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (wsClient) {
        wsClient.disconnect();
      }
    };
  }, [wsClient]);

  const handleConnect = async () => {
    if (!url.trim()) {
      setError('WebSocket URL is required');
      return;
    }

    setError(null);
    const client = new WebSocketClient({
      url: url.trim(),
      onOpen: () => {
        setConnected(true);
        onUpdate({ wsConnected: true });
      },
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
        onUpdate({ wsMessages: [...messages, message] });
      },
      onError: (err) => {
        setError(err.message);
        setConnected(false);
        onUpdate({ wsConnected: false });
      },
      onClose: () => {
        setConnected(false);
        onUpdate({ wsConnected: false });
      },
    });

    try {
      await client.connect();
      setWsClient(client);
      setMessages(client.getMessages());
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisconnect = () => {
    if (wsClient) {
      wsClient.disconnect();
      setWsClient(null);
      setConnected(false);
      onUpdate({ wsConnected: false });
    }
  };

  const handleSend = () => {
    if (!wsClient || !messageInput.trim()) return;

    try {
      wsClient.send(messageInput, messageType);
      setMessageInput('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const clearMessages = () => {
    if (wsClient) {
      wsClient.clearMessages();
      setMessages([]);
      onUpdate({ wsMessages: [] });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#1e1e1e]">
      {/* Connection Section */}
      <div className="p-4 border-b border-[#3e3e3e] flex-shrink-0 bg-[#252526]">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ws://localhost:8080/ws or wss://api.example.com/ws"
            className="flex-1 min-w-0 px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all disabled:opacity-50"
            disabled={connected}
          />
          {!connected ? (
            <button
              onClick={handleConnect}
              className="px-6 py-2 bg-[#0e7c0e] hover:bg-[#0f8f0f] text-white rounded text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
            >
              Connect
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-[#a1260d] hover:bg-[#c72e0f] text-white rounded text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
            >
              Disconnect
            </button>
          )}
        </div>
        {error && (
          <div className="mt-2 p-2 bg-[#3a1d1d] border border-[#a1260d] rounded text-[#f48771] text-xs">
            {error}
          </div>
        )}
        {connected && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-400">Connected</span>
            </div>
            <button
              onClick={clearMessages}
              className="text-xs px-2 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded"
            >
              Clear Messages
            </button>
          </div>
        )}
      </div>

      {/* Message Input */}
      {connected && (
        <div className="p-4 border-b border-[#3e3e3e] flex-shrink-0 bg-[#252526]">
          <div className="flex items-center gap-2 mb-2">
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as WebSocketMessageType)}
              className="px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] flex-shrink-0 hover:bg-[#464647] focus:outline-none focus:border-[#007acc] transition-all"
            >
              <option value="text">Text</option>
              <option value="json">JSON</option>
              <option value="binary">Binary</option>
            </select>
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type message to send..."
              className="flex-1 min-w-0 px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] font-mono transition-all"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!messageInput.trim()}
              className="px-6 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all hover:shadow-lg hover:scale-105 disabled:hover:scale-100"
            >
              Send
            </button>
          </div>
          <div className="text-xs text-[#858585]">Press Ctrl+Enter to send</div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 bg-[#1e1e1e]">
        <div className="space-y-2">
          {            messages.length === 0 ? (
            <div className="text-center text-[#858585] text-sm py-12">
              <div className="text-4xl mb-3 opacity-50">💬</div>
              <div>{connected ? 'No messages yet. Send a message to start.' : 'Connect to start receiving messages.'}</div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded mb-2 border transition-all ${
                  msg.direction === 'sent'
                    ? 'bg-[#1e3a5f] border-[#007acc]'
                    : 'bg-[#1e3e1e] border-[#0e7c0e]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#858585]">
                      {msg.direction === 'sent' ? '→ Sent' : '← Received'}
                    </span>
                    <span className="text-xs text-[#858585]">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-[#3c3c3c] rounded text-[#cccccc]">
                      {msg.type}
                    </span>
                  </div>
                </div>
                <pre className="text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap break-words">
                  {msg.content}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

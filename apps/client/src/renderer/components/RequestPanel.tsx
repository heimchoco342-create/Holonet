import React, { useState, useEffect } from 'react';
import { Item } from '@holonet/shared';
import { ApiClient, RequestResponse } from '../services/api';
import { TestPanel } from './TestPanel';
import { WebSocketPanel } from './WebSocketPanel';
import { GrpcPanel } from './GrpcPanel';
import { serverClient } from '../services/server';

interface RequestPanelProps {
  item: Item | null;
}

export function RequestPanel({ item }: RequestPanelProps) {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'test'>('request');

  const apiClient = new ApiClient();

  useEffect(() => {
    if (item) {
      setUrl(item.url || '');
      setMethod(item.method || 'GET');
      setHeaders((item.headers as Record<string, string>) || {});
      setBody(item.body ? JSON.stringify(item.body, null, 2) : '');
      setResponse(null);
      setError(null);
    }
  }, [item]);

  const handleUpdate = async (updates: Partial<Item>) => {
    if (!item) return;
    try {
      await serverClient.updateItem(item.id, updates);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  // Inject bridge via IPC
  useEffect(() => {
    if (window.electronAPI?.k8s) {
      apiClient.setBridge({
        processRequest: async (request: any) => {
          if (!window.electronAPI?.k8s) {
            throw new Error('Electron API not available');
          }
          return await window.electronAPI.k8s.processRequest(request);
        },
      });
    }
  }, []);

  const handleSend = async () => {
    if (!item) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let parsedBody: any = undefined;
      if (body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }
      }

      const result = await apiClient.executeRequest({
        item,
        url: url || item.url,
        method: method || item.method,
        headers,
        body: parsedBody,
      });

      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'Request failed');
      if (err.response) {
        setResponse({
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data,
          time: err.time || 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-[#858585] text-center">
          <div className="text-5xl mb-4 opacity-50">📡</div>
          <div className="text-sm">Select a request to get started</div>
        </div>
      </div>
    );
  }

  // Show protocol-specific panels
  const protocol = item.protocol || 'HTTP';

  if (protocol === 'WebSocket') {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex flex-col h-full min-w-0 overflow-hidden">
        <div className="flex border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'request'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            WebSocket
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'test'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tests
          </button>
        </div>
        {activeTab === 'test' ? (
          <TestPanel
            item={item}
            response={null}
            requestData={{
              url: url || item.url || '',
              method: 'WS',
              headers,
            }}
          />
        ) : (
          <WebSocketPanel item={item} onUpdate={handleUpdate} />
        )}
      </div>
    );
  }

  if (protocol === 'gRPC') {
    return (
      <div className="flex-1 bg-[#1e1e1e] flex flex-col h-full min-w-0 overflow-hidden">
        <div className="flex border-b border-[#3e3e3e] bg-[#252526]">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-6 py-3 text-sm font-medium relative transition-all ${
              activeTab === 'request'
                ? 'text-white'
                : 'text-[#cccccc] hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            gRPC
            {activeTab === 'request' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007acc]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-6 py-3 text-sm font-medium relative transition-all ${
              activeTab === 'test'
                ? 'text-white'
                : 'text-[#cccccc] hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            Tests
            {activeTab === 'test' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007acc]"></div>
            )}
          </button>
        </div>
        {activeTab === 'test' ? (
          <TestPanel
            item={item}
            response={null}
            requestData={{
              url: url || item.url || '',
              method: 'gRPC',
              headers,
            }}
          />
        ) : (
          <GrpcPanel item={item} onUpdate={handleUpdate} />
        )}
      </div>
    );
  }

  // HTTP Panel (default)
  return (
    <div className="flex-1 bg-[#1e1e1e] flex flex-col h-full min-w-0 overflow-hidden">
      {/* Tabs - Postman style */}
      <div className="flex border-b border-[#3e3e3e] bg-[#252526]">
        <button
          onClick={() => setActiveTab('request')}
          className={`px-6 py-3 text-sm font-medium relative transition-all ${
            activeTab === 'request'
              ? 'text-white'
              : 'text-[#cccccc] hover:text-white hover:bg-[#2a2d2e]'
          }`}
        >
          Request
          {activeTab === 'request' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007acc]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-6 py-3 text-sm font-medium relative transition-all ${
            activeTab === 'test'
              ? 'text-white'
              : 'text-[#cccccc] hover:text-white hover:bg-[#2a2d2e]'
          }`}
        >
          Tests
          {activeTab === 'test' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007acc]"></div>
          )}
        </button>
      </div>

      {activeTab === 'test' ? (
        <TestPanel
          item={item}
          response={response}
          requestData={{
            url: url || item.url || '',
            method: method || item.method || 'GET',
            headers,
            body: body ? (() => {
              try {
                return JSON.parse(body);
              } catch {
                return body;
              }
            })() : undefined,
          }}
        />
      ) : (
        <>
      {/* Request Section */}
      <div className="flex-1 flex flex-col border-b border-[#3e3e3e] min-h-0">
        <div className="p-4 border-b border-[#3e3e3e] flex-shrink-0 bg-[#252526]">
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] flex-shrink-0 hover:bg-[#464647] focus:outline-none focus:border-[#007acc] transition-all"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL or use K8s service"
              className="flex-1 min-w-0 px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-6 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all hover:shadow-lg hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          {item.k8sService && (
            <div className="mt-2 text-xs text-blue-400">
              🔗 K8s Tunnel: {item.k8sService} ({item.k8sNamespace || 'default'}:{item.k8sPort})
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 bg-[#1e1e1e]">
          <div className="space-y-4">
            {/* Headers */}
            <div>
              <button
                onClick={() => setShowHeaders(!showHeaders)}
                className="text-xs font-medium text-[#858585] uppercase tracking-wider mb-2 flex items-center gap-2 hover:text-[#cccccc] transition-colors"
              >
                <span>{showHeaders ? '▼' : '▶'}</span>
                <span>Headers</span>
              </button>
              {showHeaders && (
                <div className="bg-[#252526] border border-[#3e3e3e] rounded p-3 font-mono text-xs">
                  {Object.entries(headers).map(([key, value]) => (
                    <div key={key} className="text-[#cccccc] mb-1.5 hover:bg-[#2a2d2e] px-2 py-1 rounded">
                      <span className="text-[#4ec9b0]">{key}:</span> <span className="text-[#d4d4d4]">{value}</span>
                    </div>
                  ))}
                  {Object.keys(headers).length === 0 && (
                    <div className="text-[#858585] text-xs">No custom headers</div>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div>
                <button
                  onClick={() => setShowBody(!showBody)}
                  className="text-xs font-medium text-[#858585] uppercase tracking-wider mb-2 flex items-center gap-2 hover:text-[#cccccc] transition-colors"
                >
                  <span>{showBody ? '▼' : '▶'}</span>
                  <span>Body</span>
                </button>
                {showBody && (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-48 px-3 py-2 bg-[#252526] border border-[#3e3e3e] rounded font-mono text-xs text-[#d4d4d4] focus:outline-none focus:border-[#007acc] transition-all"
                    placeholder="Request body (JSON)"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-[#3e3e3e] flex-shrink-0 bg-[#252526]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#cccccc]">Response</h3>
            {response && (
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-[#0e7c0e] text-white'
                    : response.status >= 400
                    ? 'bg-[#a1260d] text-white'
                    : 'bg-[#ca5016] text-white'
                }`}>
                  {response.status} {response.statusText}
                </div>
                <div className="text-xs text-[#858585]">{response.time}ms</div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 bg-[#1e1e1e]">
          {error && (
            <div className="mb-4 p-3 bg-[#3a1d1d] border border-[#a1260d] rounded text-[#f48771] text-sm">
              {error}
            </div>
          )}
          {response && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-[#858585] mb-2 uppercase tracking-wider">Headers</div>
                <div className="bg-[#252526] border border-[#3e3e3e] rounded p-3 font-mono text-xs">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="text-[#cccccc] mb-1.5 hover:bg-[#2a2d2e] px-2 py-1 rounded">
                      <span className="text-[#4ec9b0]">{key}:</span> <span className="text-[#d4d4d4]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#858585] mb-2 uppercase tracking-wider">Body</div>
                <pre className="bg-[#252526] border border-[#3e3e3e] rounded p-4 font-mono text-xs text-[#d4d4d4] overflow-x-auto">
                  {typeof response.data === 'object'
                    ? JSON.stringify(response.data, null, 2)
                    : String(response.data)}
                </pre>
              </div>
            </div>
          )}
          {!response && !error && (
            <div className="text-[#858585] text-sm text-center py-12">
              <div className="text-4xl mb-3 opacity-50">📡</div>
              <div>No response yet. Click Send to execute the request.</div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

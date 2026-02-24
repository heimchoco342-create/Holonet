import React, { useState, useEffect } from 'react';
import { Item } from '@holonet/shared';
import { ApiClient, RequestResponse } from '../services/api';
import { TestPanel } from './TestPanel';

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
      <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-4">📡</div>
          <div>Select a request to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a]">
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'request'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Request
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
      <div className="flex-1 flex flex-col border-b border-[#2a2a2a]">
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white"
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
              className="flex-1 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium"
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Headers */}
            <div>
              <button
                onClick={() => setShowHeaders(!showHeaders)}
                className="text-sm font-medium text-gray-300 mb-2"
              >
                Headers {showHeaders ? '▼' : '▶'}
              </button>
              {showHeaders && (
                <div className="bg-[#1a1a1a] rounded p-3 font-mono text-xs">
                  {Object.entries(headers).map(([key, value]) => (
                    <div key={key} className="text-gray-400 mb-1">
                      <span className="text-blue-400">{key}:</span> {value}
                    </div>
                  ))}
                  {Object.keys(headers).length === 0 && (
                    <div className="text-gray-500">No custom headers</div>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div>
                <button
                  onClick={() => setShowBody(!showBody)}
                  className="text-sm font-medium text-gray-300 mb-2"
                >
                  Body {showBody ? '▼' : '▶'}
                </button>
                {showBody && (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-48 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="Request body (JSON)"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Section */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h3 className="text-sm font-medium text-white">Response</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    response.status >= 200 && response.status < 300
                      ? 'bg-green-900 text-green-300'
                      : response.status >= 400
                      ? 'bg-red-900 text-red-300'
                      : 'bg-yellow-900 text-yellow-300'
                  }`}
                >
                  {response.status} {response.statusText}
                </div>
                <div className="text-xs text-gray-400">{response.time}ms</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-300 mb-2">Headers</div>
                <div className="bg-[#1a1a1a] rounded p-3 font-mono text-xs">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="text-gray-400 mb-1">
                      <span className="text-blue-400">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-300 mb-2">Body</div>
                <pre className="bg-[#1a1a1a] rounded p-3 font-mono text-xs text-white overflow-x-auto">
                  {typeof response.data === 'object'
                    ? JSON.stringify(response.data, null, 2)
                    : String(response.data)}
                </pre>
              </div>
            </div>
          )}
          {!response && !error && (
            <div className="text-gray-500 text-sm text-center py-8">
              No response yet. Click Send to execute the request.
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

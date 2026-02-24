import React, { useState } from 'react';
import { Item } from '@holonet/shared';

interface GrpcPanelProps {
  item: Item;
  onUpdate: (updates: Partial<Item>) => void;
}

export function GrpcPanel({ item, onUpdate }: GrpcPanelProps) {
  const [url, setUrl] = useState(item.url || '');
  const [service, setService] = useState(item.grpcService || '');
  const [method, setMethod] = useState(item.grpcMethod || '');
  const [proto, setProto] = useState(item.grpcProto || '');
  const [metadata, setMetadata] = useState<Record<string, string>>(
    (item.grpcMetadata as Record<string, string>) || {}
  );
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!url.trim() || !service.trim() || !method.trim()) {
      setError('URL, Service, and Method are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // TODO: Implement gRPC client
      // For now, show a placeholder
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResponse({
        message: 'gRPC client implementation is in progress',
        note: 'This feature requires @grpc/grpc-js and proto file parsing',
      });
    } catch (err: any) {
      setError(err.message || 'gRPC request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#1e1e1e]">
      {/* Configuration Section */}
      <div className="p-4 border-b border-[#3e3e3e] space-y-4 flex-shrink-0 overflow-y-auto bg-[#252526]">
        <div>
          <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
            gRPC Server URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              onUpdate({ url: e.target.value });
            }}
            placeholder="localhost:50051"
            className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
              Service Name
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                onUpdate({ grpcService: e.target.value });
              }}
              placeholder="example.UserService"
              className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
              Method Name
            </label>
            <input
              type="text"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                onUpdate({ grpcMethod: e.target.value });
              }}
              placeholder="GetUser"
              className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
            Proto File (optional)
          </label>
          <textarea
            value={proto}
            onChange={(e) => {
              setProto(e.target.value);
              onUpdate({ grpcProto: e.target.value });
            }}
            placeholder="Paste .proto file content here or provide path..."
            className="w-full h-32 px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] font-mono transition-all"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !url.trim() || !service.trim() || !method.trim()}
          className="w-full px-6 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all hover:shadow-lg hover:scale-105 disabled:hover:scale-100"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>

      {/* Request Body */}
      <div className="p-4 border-b border-[#3e3e3e] flex-shrink-0 bg-[#252526]">
        <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-2">
          Request Body (JSON)
        </label>
        <textarea
          value={requestBody}
          onChange={(e) => setRequestBody(e.target.value)}
          placeholder='{"userId": "123"}'
          className="w-full h-32 px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] font-mono transition-all"
        />
      </div>

      {/* Response */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 bg-[#1e1e1e]">
        {error && (
          <div className="mb-4 p-3 bg-[#3a1d1d] border border-[#a1260d] rounded text-[#f48771] text-sm">
            {error}
          </div>
        )}
        {response && (
          <div>
            <div className="text-xs font-medium text-[#858585] uppercase tracking-wider mb-2">Response</div>
            <pre className="bg-[#252526] border border-[#3e3e3e] rounded p-4 font-mono text-xs text-[#d4d4d4] overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
        {!response && !error && (
          <div className="text-[#858585] text-sm text-center py-12">
            <div className="text-5xl mb-4 opacity-50">🔧</div>
            <div>gRPC support is coming soon</div>
            <div className="text-xs mt-2 text-[#858585]">
              This feature requires @grpc/grpc-js library and proto file parsing
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

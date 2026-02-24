import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Item, Protocol } from '@holonet/shared';
import { serverClient } from '../services/server';

interface CreateItemDialogProps {
  workspaceId: string;
  parentId: string | null;
  type: 'FOLDER' | 'REQUEST';
  onClose: () => void;
  onCreated: (item: Item) => void;
}

export function CreateItemDialog({
  workspaceId,
  parentId,
  type,
  onClose,
  onCreated,
}: CreateItemDialogProps) {
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<Protocol>('HTTP');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (type === 'REQUEST' && !url.trim() && protocol === 'HTTP') {
      setError('URL is required for HTTP requests');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const item = await serverClient.createItem({
        workspaceId,
        parentId,
        type,
        name: name.trim(),
        protocol: type === 'REQUEST' ? protocol : undefined,
        method: type === 'REQUEST' && protocol === 'HTTP' ? method : undefined,
        url: type === 'REQUEST' ? url.trim() : undefined,
        sortOrder: 0,
      });

      onCreated(item);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  }, [name, url, protocol, method, type, workspaceId, parentId, onCreated, onClose]);

  // Handle Enter and Esc keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!loading) {
          onClose();
        }
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter or Cmd+Enter to submit
        e.preventDefault();
        if (!loading) {
          handleCreate();
        }
      }
    };

    // Add event listener when dialog is mounted
    window.addEventListener('keydown', handleKeyDown);

    // Focus the first input
    const firstInput = dialogRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, onClose, handleCreate]);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        // Close when clicking outside the dialog
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div 
        ref={dialogRef}
        className="bg-[#252526] border border-[#3e3e3e] rounded-lg p-6 w-96 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-[#cccccc] mb-4">
          Create {type === 'FOLDER' ? 'Folder' : 'Request'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'FOLDER' ? 'Folder name' : 'Request name'}
              className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>

          {type === 'REQUEST' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
                  Protocol
                </label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as Protocol)}
                  className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc] transition-all"
                >
                  <option value="HTTP">HTTP</option>
                  <option value="WebSocket">WebSocket</option>
                  <option value="gRPC">gRPC</option>
                </select>
              </div>

              {protocol === 'HTTP' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
                      Method
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc] transition-all"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                      <option value="HEAD">HEAD</option>
                      <option value="OPTIONS">OPTIONS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
                      URL
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://api.example.com/endpoint"
                      className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) {
                          e.preventDefault();
                          handleCreate();
                        }
                      }}
                    />
                  </div>
                </>
              )}

              {protocol === 'WebSocket' && (
                <div>
                  <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
                    WebSocket URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="ws://localhost:8080/ws or wss://api.example.com/ws"
                    className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        e.preventDefault();
                        handleCreate();
                      }
                    }}
                  />
                </div>
              )}

              {protocol === 'gRPC' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#858585] uppercase tracking-wider mb-1.5">
                      gRPC Server URL
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="localhost:50051"
                      className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) {
                          e.preventDefault();
                          handleCreate();
                        }
                      }}
                    />
                  </div>
                  <div className="text-xs text-[#858585]">
                    Service and method can be configured after creation
                  </div>
                </>
              )}
            </>
          )}

          {error && (
            <div className="p-2 bg-[#3a1d1d] border border-[#a1260d] rounded text-[#f48771] text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#3c3c3c] hover:bg-[#464647] text-[#cccccc] rounded text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all hover:shadow-lg"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

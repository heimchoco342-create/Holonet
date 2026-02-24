import React, { useEffect, useState } from 'react';
import { Item, Workspace } from '@holonet/shared';
import { serverClient } from '../services/server';
import { PostmanImport } from './PostmanImport';
import { CreateItemDialog } from './CreateItemDialog';

interface CollectionTreeProps {
  workspace: Workspace;
  onSelectItem: (item: Item) => void;
  selectedId?: string;
}

export function CollectionTree({ workspace, onSelectItem, selectedId }: CollectionTreeProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [createDialog, setCreateDialog] = useState<{
    type: 'FOLDER' | 'REQUEST';
    parentId: string | null;
  } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    
    // Subscribe to real-time updates
    const unsubscribe1 = serverClient.on('item:created', (item: Item) => {
      if (item.workspaceId === workspace.id) {
        setItems((prev) => [...prev, item]);
      }
    });

    const unsubscribe2 = serverClient.on('item:updated', (item: Item) => {
      if (item.workspaceId === workspace.id) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      }
    });

    const unsubscribe3 = serverClient.on('item:deleted', ({ id }: { id: string }) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    });

    return () => {
      if (unsubscribe1) unsubscribe1();
      if (unsubscribe2) unsubscribe2();
      if (unsubscribe3) unsubscribe3();
    };
  }, [workspace.id]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await serverClient.getItems(workspace.id);
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const buildTree = (parentId: string | null = null): Item[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const renderItem = (item: Item, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const children = item.type === 'FOLDER' ? buildTree(item.id) : [];

    return (
      <div 
        key={item.id}
        className="group"
        onMouseEnter={() => setHoveredItemId(item.id)}
        onMouseLeave={() => setHoveredItemId(null)}
      >
        <div
          className={`flex items-center px-2 py-1.5 cursor-pointer transition-all ${
            selectedId === item.id 
              ? 'bg-[#37373d] text-white border-l-2 border-[#007acc]' 
              : 'hover:bg-[#2a2d2e] text-[#cccccc] border-l-2 border-transparent'
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => {
            if (item.type === 'FOLDER') {
              toggleFolder(item.id);
            } else {
              onSelectItem(item);
            }
          }}
        >
          {item.type === 'FOLDER' ? (
            <span className="text-[#858585] mr-2 text-sm">
              {isExpanded ? '📂' : '📁'}
            </span>
          ) : (
            <span className="text-xs mr-2 w-12 text-right">
              {item.protocol === 'WebSocket' ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900 text-purple-300">
                  WS
                </span>
              ) : item.protocol === 'gRPC' ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-orange-900 text-orange-300">
                  gRPC
                </span>
              ) : (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    item.method === 'GET'
                      ? 'bg-green-900 text-green-300'
                      : item.method === 'POST'
                      ? 'bg-blue-900 text-blue-300'
                      : item.method === 'PUT'
                      ? 'bg-yellow-900 text-yellow-300'
                      : item.method === 'DELETE'
                      ? 'bg-red-900 text-red-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {item.method || 'GET'}
                </span>
              )}
            </span>
          )}
          <span className="text-sm flex-1 truncate">{item.name}</span>
          {item.k8sService && (
            <span className="text-[10px] text-[#4ec9b0] ml-2" title="K8s Tunnel">
              🔗
            </span>
          )}
          {/* Postman-style hover buttons */}
          <div 
            className={`flex items-center gap-1 ml-2 transition-all duration-200 ${
              hoveredItemId === item.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCreateDialog({ type: 'REQUEST', parentId: item.id })}
              className="w-5 h-5 flex items-center justify-center text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white rounded transition-all hover:scale-110"
              title="Add Request"
            >
              +
            </button>
            <button
              onClick={() => setCreateDialog({ type: 'FOLDER', parentId: item.id })}
              className="w-5 h-5 flex items-center justify-center text-xs bg-[#5a5a5a] hover:bg-[#6a6a6a] text-white rounded transition-all hover:scale-110"
              title="Add Folder"
            >
              📁
            </button>
          </div>
        </div>
        {item.type === 'FOLDER' && isExpanded && (
          <div>
            {children.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-64 min-w-[200px] max-w-[400px] bg-[#252526] border-r border-[#3e3e3e] p-4">
        <div className="text-[#858585] text-sm">Loading...</div>
      </div>
    );
  }

  const rootItems = buildTree();

  return (
    <div className="w-64 min-w-[200px] max-w-[400px] bg-[#252526] border-r border-[#3e3e3e] flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-[#3e3e3e] bg-[#2d2d30]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#cccccc] uppercase tracking-wider truncate flex-1">{workspace.name}</h2>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setCreateDialog({ type: 'REQUEST', parentId: null })}
              className="w-6 h-6 flex items-center justify-center text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white rounded transition-all hover:scale-110"
              title="New Request"
            >
              +
            </button>
            <button
              onClick={() => setCreateDialog({ type: 'FOLDER', parentId: null })}
              className="w-6 h-6 flex items-center justify-center text-xs bg-[#5a5a5a] hover:bg-[#6a6a6a] text-white rounded transition-all hover:scale-110"
              title="New Folder"
            >
              📁
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="w-6 h-6 flex items-center justify-center text-xs bg-[#0e7c0e] hover:bg-[#0f8f0f] text-white rounded transition-all hover:scale-110"
              title="Import from Postman"
            >
              📦
            </button>
          </div>
        </div>
        {showImport && (
          <div className="mt-2">
            <PostmanImport
              workspace={workspace}
              onImportComplete={() => {
                setShowImport(false);
                loadItems();
              }}
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {rootItems.length === 0 && !showImport ? (
          <div className="p-4 text-center text-[#858585] text-sm">
            No items yet. Import from Postman or create new.
          </div>
        ) : (
          <div>
            {rootItems.map((item) => renderItem(item))}
            {/* Root level add buttons - always visible */}
            <div
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#2a2d2e] group transition-all"
              style={{ paddingLeft: '8px' }}
              onMouseEnter={() => setHoveredItemId('root')}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <span className="text-xs text-[#858585] flex-1">Add new...</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button
                  onClick={() => setCreateDialog({ type: 'REQUEST', parentId: null })}
                  className="w-5 h-5 flex items-center justify-center text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white rounded transition-all hover:scale-110"
                  title="New Request"
                >
                  +
                </button>
                <button
                  onClick={() => setCreateDialog({ type: 'FOLDER', parentId: null })}
                  className="w-5 h-5 flex items-center justify-center text-xs bg-[#5a5a5a] hover:bg-[#6a6a6a] text-white rounded transition-all hover:scale-110"
                  title="New Folder"
                >
                  📁
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {createDialog && (
        <CreateItemDialog
          workspaceId={workspace.id}
          parentId={createDialog.parentId}
          type={createDialog.type}
          onClose={() => setCreateDialog(null)}
          onCreated={(item) => {
            setItems((prev) => [...prev, item]);
            if (item.type === 'REQUEST') {
              onSelectItem(item);
            }
          }}
        />
      )}
    </div>
  );
}

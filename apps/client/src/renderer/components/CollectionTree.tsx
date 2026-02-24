import React, { useEffect, useState } from 'react';
import { Item, Workspace } from '@holonet/shared';
import { serverClient } from '../services/server';
import { PostmanImport } from './PostmanImport';

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
      <div key={item.id}>
        <div
          className={`flex items-center px-2 py-1.5 hover:bg-[#2a2a2a] cursor-pointer ${
            selectedId === item.id ? 'bg-[#2a2a2a]' : ''
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
            <span className="text-gray-400 mr-2">
              {isExpanded ? '📂' : '📁'}
            </span>
          ) : (
            <span className="text-xs mr-2 w-12 text-right">
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
            </span>
          )}
          <span className="text-sm text-white flex-1 truncate">{item.name}</span>
          {item.k8sService && (
            <span className="text-[10px] text-blue-400 ml-2" title="K8s Tunnel">
              🔗
            </span>
          )}
        </div>
        {item.type === 'FOLDER' && isExpanded && (
          <div>{children.map((child) => renderItem(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] p-4">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  const rootItems = buildTree();

  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col h-full">
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">{workspace.name}</h2>
          <button
            onClick={() => setShowImport(!showImport)}
            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
            title="Import from Postman"
          >
            📦
          </button>
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
      <div className="flex-1 overflow-y-auto">
        {rootItems.length === 0 && !showImport ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No items yet. Import from Postman or create new.
          </div>
        ) : (
          <div>{rootItems.map((item) => renderItem(item))}</div>
        )}
      </div>
    </div>
  );
}

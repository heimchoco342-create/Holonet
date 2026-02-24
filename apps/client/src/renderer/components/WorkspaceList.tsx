import React, { useEffect, useState } from 'react';
import { Workspace } from '@holonet/shared';
import { serverClient } from '../services/server';

interface WorkspaceListProps {
  onSelect: (workspace: Workspace) => void;
  selectedId?: string;
}

export function WorkspaceList({ onSelect, selectedId }: WorkspaceListProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
    
    // Subscribe to real-time updates
    const unsubscribe = serverClient.on('workspace:created', (workspace: Workspace) => {
      setWorkspaces((prev) => [...prev, workspace]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await serverClient.getWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !selectedId) {
        onSelect(data[0]);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setError(null);
    try {
      const workspace = await serverClient.createWorkspace({ name: newName });
      setWorkspaces((prev) => [...prev, workspace]);
      setNewName('');
      setShowCreate(false);
      onSelect(workspace);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create workspace';
      console.error('Failed to create workspace:', error);
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] p-4">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col h-full">
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">Workspaces</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            + New
          </button>
        </div>
        {showCreate && (
          <div className="mt-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Workspace name"
              className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {error && (
              <div className="mt-1 text-xs text-red-400">{error}</div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                  setError(null);
                }}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-xs rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => onSelect(workspace)}
            className={`w-full text-left px-4 py-2 hover:bg-[#2a2a2a] transition-colors ${
              selectedId === workspace.id ? 'bg-[#2a2a2a] border-l-2 border-blue-500' : ''
            }`}
          >
            <div className="text-sm font-medium text-white">{workspace.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {workspace.items?.length || 0} items
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

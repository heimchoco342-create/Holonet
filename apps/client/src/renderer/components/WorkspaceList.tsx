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
    return <div className="p-4 text-xs text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Create form is managed by parent or separate dialog in future refactor */}
      {/* For now, keep simple list rendering */}
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => onSelect(workspace)}
          className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
            selectedId === workspace.id 
              ? 'bg-[#37373d] text-white' 
              : 'hover:bg-[#2a2d2e] text-[#a1a1aa]'
          }`}
        >
          <span className="text-xs">📁</span>
          <span className="truncate">{workspace.name}</span>
        </button>
      ))}
      
      {/* Temporary Create Button inline */}
      <button 
        onClick={() => setShowCreate(!showCreate)}
        className="px-3 py-2 text-xs text-[#71717a] hover:text-white flex items-center gap-2 hover:bg-[#2a2d2e] transition-colors"
      >
        <span>+</span> New Workspace
      </button>

      {showCreate && (
        <div className="p-2 bg-[#252526] border-t border-[#3e3e3e]">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Name..."
            className="w-full px-2 py-1 bg-[#1e1e1e] border border-[#3e3e3e] rounded text-xs text-white focus:outline-none focus:border-blue-500 mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              Add
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 px-2 py-1 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

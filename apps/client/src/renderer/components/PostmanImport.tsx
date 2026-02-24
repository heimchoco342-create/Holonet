import React, { useRef, useState } from 'react';
import { PostmanImporter } from '../../main/importers/postman';
import { serverClient } from '../services/server';
import { Workspace } from '@holonet/shared';

interface PostmanImportProps {
  workspace: Workspace;
  onImportComplete: () => void;
}

export function PostmanImport({ workspace, onImportComplete }: PostmanImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const collection = JSON.parse(text);

      // Validate Postman collection format
      if (!collection.info || !collection.item) {
        throw new Error('Invalid Postman collection format');
      }

      // Import collection
      const { items, environments } = PostmanImporter.import(collection, workspace.id);

      // Create items in database (folders first, then requests)
      // Build a map of temp IDs to real IDs
      const folderIdMap = new Map<string, string>();
      
      // Process items in order, creating folders first
      for (const item of items) {
        if (item.type === 'FOLDER') {
          // Get temp ID from item (we added it during import)
          const tempId = (item as any).tempId;
          let parentId = item.parentId;
          
          // If parentId is a temp ID, replace it with real ID
          if (parentId && parentId.startsWith('temp-folder-')) {
            parentId = folderIdMap.get(parentId) || null;
          }
          
          // Create folder
          const created = await serverClient.createItem({ ...item, parentId });
          
          // Store mapping from temp ID to real ID
          if (tempId) {
            folderIdMap.set(tempId, created.id);
          }
        }
      }

      // Now create requests with proper parent IDs
      for (const item of items) {
        if (item.type === 'REQUEST') {
          let parentId = item.parentId;
          // If parentId is a temp ID, replace it with real ID
          if (parentId && parentId.startsWith('temp-folder-')) {
            parentId = folderIdMap.get(parentId) || null;
          }
          await serverClient.createItem({ ...item, parentId });
        }
      }

      // Create environments
      for (const env of environments) {
        await serverClient.createEnvironment({
          workspaceId: workspace.id,
          name: env.name,
          variables: env.variables,
        });
      }

      onImportComplete();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import Postman collection');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        await handleFileSelect({ target: { files: dataTransfer.files } } as any);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        disabled={importing}
      />
      <div className="text-4xl mb-4">📦</div>
      <div className="text-sm text-gray-400 mb-4">
        Drag and drop a Postman collection file here, or click to browse
      </div>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm"
      >
        {importing ? 'Importing...' : 'Select File'}
      </button>
      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

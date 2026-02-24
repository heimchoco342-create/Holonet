import React, { useState, useEffect } from 'react';
import { Workspace, Item } from '@holonet/shared';
import { WorkspaceList } from './components/WorkspaceList';
import { CollectionTree } from './components/CollectionTree';
import { RequestPanel } from './components/RequestPanel';
import { LensView } from './components/LensView';
import { serverClient } from './services/server';
import { syncK8sServicesToCollection } from './services/k8s-discovery';

function App() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [k8sServicesDiscovered, setK8sServicesDiscovered] = useState(false);
  const [activeView, setActiveView] = useState<'api' | 'lens'>('api');

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize offline mode first
        await serverClient.init();
        
        // Connect to server for real-time updates (if available)
        serverClient.connect();
        
        // Auto-discover K8s services and sync to collections
        autoDiscoverK8sServices();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initialize();
  }, []);

  const autoDiscoverK8sServices = async () => {
    try {
      // Check if electronAPI is available
      if (!window.electronAPI?.k8s) {
        console.log('Electron API not available');
        setK8sServicesDiscovered(true);
        return;
      }

      // Get K8s contexts
      const contexts = await window.electronAPI.k8s.getContexts();
      if (!contexts || contexts.length === 0) {
        console.log('No K8s contexts found');
        setK8sServicesDiscovered(true);
        return;
      }

      // Use first context or current context
      const contextName = contexts[0]?.name;
      
      // Discover services
      const services = await window.electronAPI.k8s.discoverServices(contextName);
      if (!services || services.length === 0) {
        console.log('No K8s services found');
        setK8sServicesDiscovered(true);
        return;
      }

      console.log(`Discovered ${services.length} K8s services`);

      // Get or create a workspace for K8s services
      let workspace: Workspace;
      const workspaces = await serverClient.getWorkspaces();
      const k8sWorkspace = workspaces.find((ws) => ws.name === 'K8s Services');

      if (k8sWorkspace) {
        workspace = k8sWorkspace;
      } else {
        workspace = await serverClient.createWorkspace({ name: 'K8s Services' });
      }

      // Sync services to collection
      await syncK8sServicesToCollection(workspace.id, services);
      
      setK8sServicesDiscovered(true);
      console.log('K8s services synced to collection');
    } catch (error) {
      console.error('Failed to auto-discover K8s services:', error);
      setK8sServicesDiscovered(true);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Navigation */}
      <div className="flex border-b border-[#2a2a2a]">
        <button
          onClick={() => setActiveView('api')}
          className={`px-4 py-2 text-sm font-medium ${
            activeView === 'api'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📡 API Client
        </button>
        <button
          onClick={() => setActiveView('lens')}
          className={`px-4 py-2 text-sm font-medium ${
            activeView === 'lens'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🔭 Lens (K8s)
        </button>
      </div>

      {activeView === 'lens' ? (
        <LensView />
      ) : (
        <div className="flex-1 flex">
          {/* Sidebar - Workspaces */}
          <WorkspaceList
            onSelect={setSelectedWorkspace}
            selectedId={selectedWorkspace?.id}
          />

          {/* Middle - Collection Tree */}
          {selectedWorkspace ? (
            <CollectionTree
              workspace={selectedWorkspace}
              onSelectItem={setSelectedItem}
              selectedId={selectedItem?.id}
            />
          ) : (
            <div className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] flex items-center justify-center">
              <div className="text-gray-500 text-center text-sm">
                Select a workspace
              </div>
            </div>
          )}

          {/* Main - Request Panel */}
          <RequestPanel item={selectedItem} />
        </div>
      )}
    </div>
  );
}

export default App;

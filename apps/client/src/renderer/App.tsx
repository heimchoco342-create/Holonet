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
    <div className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] flex flex-col">
      {/* Top Navigation - Postman style */}
      <div className="flex border-b border-[#3e3e3e] bg-[#252526]">
        <button
          onClick={() => setActiveView('api')}
          className={`px-6 py-3 text-sm font-medium relative transition-all ${
            activeView === 'api'
              ? 'text-white'
              : 'text-[#cccccc] hover:text-white hover:bg-[#2a2d2e]'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📡</span>
            <span>API Client</span>
          </span>
          {activeView === 'api' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007acc]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveView('lens')}
          className={`px-6 py-3 text-sm font-medium relative transition-all ${
            activeView === 'lens'
              ? 'text-white'
              : 'text-[#cccccc] hover:text-white hover:bg-[#2a2d2e]'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>🔭</span>
            <span>Lens (K8s)</span>
          </span>
          {activeView === 'lens' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007acc]"></div>
          )}
        </button>
      </div>

      {activeView === 'lens' ? (
        <LensView />
      ) : (
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Sidebar - Workspaces */}
          <div className="flex-shrink-0">
            <WorkspaceList
              onSelect={setSelectedWorkspace}
              selectedId={selectedWorkspace?.id}
            />
          </div>

          {/* Middle - Collection Tree */}
          <div className="flex-shrink-0">
            {selectedWorkspace ? (
              <CollectionTree
                workspace={selectedWorkspace}
                onSelectItem={setSelectedItem}
                selectedId={selectedItem?.id}
              />
            ) : (
              <div className="w-64 bg-[#252526] border-r border-[#3e3e3e] flex items-center justify-center h-full">
                <div className="text-[#858585] text-center text-sm">
                  Select a workspace
                </div>
              </div>
            )}
          </div>

          {/* Main - Request Panel */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <RequestPanel item={selectedItem} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

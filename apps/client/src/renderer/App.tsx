import React, { useState, useEffect } from 'react';
import { Workspace, Item } from '@holonet/shared';
import { GlobalNav } from './components/GlobalNav';
import { Sidebar } from './components/Sidebar';
import { RequestPanel } from './components/RequestPanel';
import { LensView } from './components/LensView';
import { serverClient } from './services/server';
import { syncK8sServicesToCollection } from './services/k8s-discovery';

function App() {
  const [activeView, setActiveView] = useState<'api' | 'lens'>('api');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [k8sServicesDiscovered, setK8sServicesDiscovered] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await serverClient.init();
        serverClient.connect();
        // autoDiscoverK8sServices(); // Disabled for UI skeleton phase
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    initialize();
  }, []);

  return (
    <div className="w-full h-full bg-[#18181b] text-[#e4e4e7] flex overflow-hidden font-sans">
      {/* 1. Global Navigation (Leftmost) */}
      <GlobalNav activeView={activeView} onViewChange={setActiveView} />

      {/* 2. Context Sidebar (Collections or Cluster Menu) */}
      <Sidebar 
        activeView={activeView}
        selectedWorkspace={selectedWorkspace}
        selectedItem={selectedItem}
        onSelectWorkspace={setSelectedWorkspace}
        onSelectItem={setSelectedItem}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {activeView === 'lens' ? (
          <LensView />
        ) : (
          <div className="h-full flex flex-col">
            {/* Tab Bar (Placeholder) */}
            <div className="h-9 bg-[#18181b] border-b border-[#27272a] flex items-center px-4 text-xs text-[#71717a]">
              Tabs will go here...
            </div>
            
            {/* Request Panel */}
            <div className="flex-1 overflow-hidden">
              <RequestPanel item={selectedItem} />
            </div>
          </div>
        )}
      </div>

      {/* 4. Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#007acc] text-white text-[10px] flex items-center px-3 justify-between z-50">
        <div className="flex items-center gap-4">
          <span>🟢 Holonet Online</span>
          <span>🚀 v1.0.0</span>
        </div>
        <div>
          {activeView === 'api' ? 'API Mode' : 'Cluster Mode'}
        </div>
      </div>
    </div>
  );
}

export default App;

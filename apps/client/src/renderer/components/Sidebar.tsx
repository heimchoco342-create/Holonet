import React from 'react';
import { Workspace, Item } from '@holonet/shared';
import { WorkspaceList } from './WorkspaceList';
import { CollectionTree } from './CollectionTree';
import { Database, Box, Network, Server, FileJson } from 'lucide-react';

interface SidebarProps {
  activeView: 'api' | 'lens';
  selectedWorkspace: Workspace | null;
  selectedItem: Item | null;
  onSelectWorkspace: (ws: Workspace) => void;
  onSelectItem: (item: Item) => void;
}

export function Sidebar({ 
  activeView, 
  selectedWorkspace, 
  selectedItem, 
  onSelectWorkspace, 
  onSelectItem 
}: SidebarProps) {
  
  if (activeView === 'api') {
    return (
      <div className="w-64 bg-[#1e1e1e] border-r border-[#27272a] flex flex-col h-full">
        {/* Collections Section - Prioritized at the top */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-[#27272a] flex items-center justify-between sticky top-0 bg-[#1e1e1e] z-10">
            <span className="font-semibold text-xs text-[#e4e4e7] uppercase tracking-wider flex items-center gap-2">
              <FileJson size={14} className="text-blue-500" />
              Collections
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {selectedWorkspace ? (
              <CollectionTree
                workspace={selectedWorkspace}
                onSelectItem={onSelectItem}
                selectedId={selectedItem?.id}
              />
            ) : (
              <div className="p-4 text-xs text-[#71717a] text-center">
                Select a workspace to view collections
              </div>
            )}
          </div>
        </div>

        {/* Workspaces Section - Moved to bottom */}
        <div className="border-t border-[#27272a] bg-[#18181b]">
          <div className="p-3 border-b border-[#27272a] flex items-center gap-2">
            <Server size={14} className="text-[#a1a1aa]" />
            <span className="font-medium text-xs text-[#a1a1aa] uppercase tracking-wider">
              Workspaces
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <WorkspaceList
              onSelect={onSelectWorkspace}
              selectedId={selectedWorkspace?.id}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#1e1e1e] border-r border-[#27272a] flex flex-col h-full">
      <div className="p-4 border-b border-[#27272a]">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Database size={16} className="text-emerald-500" />
          minikube
        </h2>
        <div className="text-xs text-[#71717a] mt-1">Version: v1.28.3</div>
      </div>
      
      <div className="p-2 space-y-1">
        <MenuSection title="Workloads">
          <MenuItem icon={<Box size={16} />} label="Pods" active />
          <MenuItem icon={<Box size={16} />} label="Deployments" />
          <MenuItem icon={<Box size={16} />} label="StatefulSets" />
        </MenuSection>

        <MenuSection title="Network">
          <MenuItem icon={<Network size={16} />} label="Services" />
          <MenuItem icon={<Network size={16} />} label="Ingresses" />
        </MenuSection>

        <MenuSection title="Configuration">
          <MenuItem icon={<FileJson size={16} />} label="ConfigMaps" />
          <MenuItem icon={<FileJson size={16} />} label="Secrets" />
        </MenuSection>
      </div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="px-3 mb-1 text-[10px] uppercase font-bold text-[#52525b]">{title}</div>
      {children}
    </div>
  );
}

function MenuItem({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors
      ${active ? 'bg-[#27272a] text-white' : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'}
    `}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

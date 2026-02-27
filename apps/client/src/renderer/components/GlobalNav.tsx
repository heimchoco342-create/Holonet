import React, { useState } from 'react';
import { Layers, Activity, Settings, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';
import { SettingsModal } from './SettingsModal';

interface GlobalNavProps {
  activeView: 'api' | 'lens';
  onViewChange: (view: 'api' | 'lens') => void;
}

export function GlobalNav({ activeView, onViewChange }: GlobalNavProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="w-16 bg-[#18181b] border-r border-[#27272a] flex flex-col items-center py-4 gap-4 text-[#a1a1aa]">
      <div className="mb-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          H
        </div>
      </div>

      <NavItem 
        icon={<Layers size={24} />} 
        label="API Client" 
        isActive={activeView === 'api'} 
        onClick={() => onViewChange('api')} 
      />
      
      <NavItem 
        icon={<Activity size={24} />} 
        label="Cluster Lens" 
        isActive={activeView === 'lens'} 
        onClick={() => onViewChange('lens')} 
      />

      <div className="flex-1" />

      <NavItem 
        icon={<RefreshCw size={20} />} 
        label="Sync" 
        onClick={() => {}} 
      />
      
      <NavItem 
        icon={<Settings size={20} />} 
        label="Settings" 
        onClick={() => setIsSettingsOpen(true)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative",
        isActive 
          ? "bg-[#27272a] text-white" 
          : "hover:bg-[#27272a] hover:text-white"
      )}
      title={label}
    >
      {icon}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full" />
      )}
    </button>
  );
}

import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { Box, Circle, RefreshCw, Terminal, Search, Filter } from 'lucide-react';

interface Pod {
  kind: string;
  name: string;
  namespace: string;
  status: string;
  creationTimestamp: string;
  details: {
    podIP?: string;
    nodeName?: string;
    restarts?: number;
  };
}

export function LensView() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>(['default']);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadNamespaces();
    loadPods();
  }, [selectedNamespace]);

  const loadNamespaces = async () => {
    try {
      if (window.electronAPI?.lens) {
        const ns = await window.electronAPI.lens.getNamespaces();
        setNamespaces(ns.length > 0 ? ns : ['default']);
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    }
  };

  const loadPods = async () => {
    setLoading(true);
    try {
      if (window.electronAPI?.lens) {
        const podList = await window.electronAPI.lens.getPods(selectedNamespace);
        setPods(podList);
      }
    } catch (error) {
      console.error('Failed to load pods:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPods = pods.filter(pod => 
    pod.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc]">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-[#27272a] bg-[#252526]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Box size={20} className="text-blue-400" />
            Pods
          </h2>
          
          <div className="relative">
            <select 
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="bg-[#333333] text-sm text-white border border-[#3e3e3e] rounded px-3 py-1 pr-8 outline-none focus:border-blue-500 appearance-none min-w-[150px]"
            >
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input 
              type="text" 
              placeholder="Filter..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#1e1e1e] border border-[#3e3e3e] rounded-full pl-8 pr-4 py-1 text-sm focus:outline-none focus:border-blue-500 w-48 transition-all"
            />
          </div>
          
          <button 
            onClick={loadPods} 
            className={cn(
              "p-2 rounded-md hover:bg-[#333333] transition-colors",
              loading && "animate-spin text-blue-400"
            )}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#252526] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-2 font-medium text-[#a1a1aa] border-b border-[#27272a]">Name</th>
              <th className="px-4 py-2 font-medium text-[#a1a1aa] border-b border-[#27272a]">Namespace</th>
              <th className="px-4 py-2 font-medium text-[#a1a1aa] border-b border-[#27272a]">Status</th>
              <th className="px-4 py-2 font-medium text-[#a1a1aa] border-b border-[#27272a]">Restarts</th>
              <th className="px-4 py-2 font-medium text-[#a1a1aa] border-b border-[#27272a]">Age</th>
              <th className="px-4 py-2 font-medium text-[#a1a1aa] border-b border-[#27272a]">IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredPods.map((pod) => (
              <tr key={pod.name} className="hover:bg-[#2a2d2e] border-b border-[#27272a] group transition-colors">
                <td className="px-4 py-2 font-medium text-white flex items-center gap-2">
                  <Box size={14} className="text-blue-400" />
                  {pod.name}
                </td>
                <td className="px-4 py-2 text-[#a1a1aa]">{pod.namespace}</td>
                <td className="px-4 py-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                    pod.status === 'Running' 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : pod.status === 'Pending'
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    <Circle size={6} fill="currentColor" />
                    {pod.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-[#a1a1aa]">
                  {pod.details.restarts || 0}
                </td>
                <td className="px-4 py-2 text-[#a1a1aa]">
                  {new Date(pod.creationTimestamp).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-[#a1a1aa]">
                  {pod.details.podIP || '-'}
                </td>
              </tr>
            ))}
            
            {!loading && filteredPods.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#52525b]">
                  {filter ? 'No pods found matching filter.' : 'No pods found in this namespace.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Status */}
      <div className="h-8 bg-[#007acc] text-white flex items-center px-4 text-xs justify-between">
        <div className="flex items-center gap-4">
          <span>Namespace: <strong>{selectedNamespace}</strong></span>
          <span>Count: <strong>{filteredPods.length}</strong></span>
        </div>
        <div className="flex items-center gap-2 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">
          <Terminal size={12} />
          <span>Terminal</span>
        </div>
      </div>
    </div>
  );
}

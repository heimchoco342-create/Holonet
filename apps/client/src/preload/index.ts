import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  // K8s Bridge methods
  k8s: {
    getContexts: () => ipcRenderer.invoke('k8s:get-contexts'),
    setContext: (contextName: string) => ipcRenderer.invoke('k8s:set-context', contextName),
    processRequest: (request: any) => ipcRenderer.invoke('k8s:process-request', request),
    closeTunnel: (item: any) => ipcRenderer.invoke('k8s:close-tunnel', item),
    discoverServices: (contextName?: string) => ipcRenderer.invoke('k8s:discover-services', contextName),
    discoverServicesInNamespace: (namespace: string, contextName?: string) => 
      ipcRenderer.invoke('k8s:discover-services-namespace', namespace, contextName),
  },
  
  // MCP Server methods
  mcp: {
    start: () => ipcRenderer.invoke('mcp:start'),
    stop: () => ipcRenderer.invoke('mcp:stop'),
  },
  
  // K8s Lens methods
  lens: {
    getNamespaces: (contextName?: string) => ipcRenderer.invoke('lens:get-namespaces', contextName),
    getPods: (namespace: string, contextName?: string) => ipcRenderer.invoke('lens:get-pods', namespace, contextName),
    getDeployments: (namespace: string, contextName?: string) => ipcRenderer.invoke('lens:get-deployments', namespace, contextName),
    getServices: (namespace: string, contextName?: string) => ipcRenderer.invoke('lens:get-services', namespace, contextName),
    getResourceDetails: (kind: string, name: string, namespace: string, contextName?: string) => 
      ipcRenderer.invoke('lens:get-resource-details', kind, name, namespace, contextName),
    getPodLogs: (namespace: string, podName: string, tailLines?: number, contextName?: string) => 
      ipcRenderer.invoke('lens:get-pod-logs', namespace, podName, tailLines, contextName),
  },
});

export interface ElectronAPI {
  platform: string;
  k8s: {
    getContexts: () => Promise<Array<{ name: string; cluster: string; user: string }>>;
    setContext: (contextName: string) => Promise<void>;
    processRequest: (request: any) => Promise<any>;
    closeTunnel: (item: any) => Promise<void>;
    discoverServices: (contextName?: string) => Promise<any[]>;
    discoverServicesInNamespace: (namespace: string, contextName?: string) => Promise<any[]>;
  };
  mcp: {
    start: () => Promise<{ success: boolean }>;
    stop: () => Promise<{ success: boolean }>;
  };
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  lens: {
    getNamespaces: (contextName?: string) => Promise<Array<{ name: string; status: string; createdAt?: Date }>>;
    getPods: (namespace: string, contextName?: string) => Promise<Array<{
      name: string;
      namespace: string;
      status: string;
      ready: string;
      restarts: number;
      age: string;
      node?: string;
      labels?: Record<string, string>;
    }>>;
    getDeployments: (namespace: string, contextName?: string) => Promise<Array<{
      name: string;
      namespace: string;
      ready: string;
      upToDate: number;
      available: number;
      age: string;
      labels?: Record<string, string>;
    }>>;
    getServices: (namespace: string, contextName?: string) => Promise<Array<{
      name: string;
      namespace: string;
      type: string;
      clusterIP: string;
      externalIP?: string;
      ports: string;
      age: string;
      labels?: Record<string, string>;
    }>>;
    getResourceDetails: (kind: string, name: string, namespace: string, contextName?: string) => Promise<any>;
    getPodLogs: (namespace: string, podName: string, tailLines?: number, contextName?: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

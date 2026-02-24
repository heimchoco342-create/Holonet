import React, { useState, useEffect } from 'react';

interface K8sNamespace {
  name: string;
  status: string;
}

interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
}

interface K8sDeployment {
  name: string;
  namespace: string;
  ready: string;
  upToDate: number;
  available: number;
  age: string;
}

interface K8sService {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: string;
  age: string;
}

type ResourceType = 'pods' | 'deployments' | 'services';

export function LensView() {
  const [namespaces, setNamespaces] = useState<K8sNamespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('dev'); // Hardcoded to 'dev'
  const [resourceType, setResourceType] = useState<ResourceType>('pods');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [logs, setLogs] = useState<string>('');

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      loadResources();
    }
  }, [selectedNamespace, resourceType]);

  const loadNamespaces = async () => {
    try {
      if (!window.electronAPI?.lens) return;
      const ns = await window.electronAPI.lens.getNamespaces();
      // Filter to only show 'dev' namespace
      const devNamespace = ns.find(n => n.name === 'dev');
      if (devNamespace) {
        setNamespaces([devNamespace]);
        setSelectedNamespace('dev');
      } else {
        setNamespaces([]);
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    }
  };

  const loadResources = async () => {
    if (!selectedNamespace || !window.electronAPI?.lens) return;
    
    setLoading(true);
    try {
      let data: any[] = [];
      switch (resourceType) {
        case 'pods':
          data = await window.electronAPI.lens.getPods(selectedNamespace);
          break;
        case 'deployments':
          data = await window.electronAPI.lens.getDeployments(selectedNamespace);
          break;
        case 'services':
          data = await window.electronAPI.lens.getServices(selectedNamespace);
          break;
      }
      setResources(data);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceClick = async (resource: any) => {
    setSelectedResource(resource);
    if (resourceType === 'pods') {
      try {
        const podLogs = await window.electronAPI?.lens?.getPodLogs(
          resource.namespace,
          resource.name,
          100
        );
        setLogs(podLogs || '');
      } catch (error) {
        console.error('Failed to load pod logs:', error);
        setLogs('');
      }
    } else {
      try {
        const details = await window.electronAPI?.lens?.getResourceDetails(
          resourceType === 'deployments' ? 'deployment' : 'service',
          resource.name,
          resource.namespace
        );
        setSelectedResource(details);
      } catch (error) {
        console.error('Failed to load resource details:', error);
      }
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">🔭 Lens - K8s Cluster</h2>
          <div className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white">
            dev
          </div>
          <div className="flex gap-2">
            {(['pods', 'deployments', 'services'] as ResourceType[]).map((type) => (
              <button
                key={type}
                onClick={() => setResourceType(type)}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  resourceType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={loadResources}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white hover:bg-[#2a2a2a]"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Resource List */}
        <div className="w-1/2 border-r border-[#2a2a2a] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : resources.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No resources found</div>
          ) : (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a] text-gray-400">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Status</th>
                    {resourceType === 'pods' && (
                      <>
                        <th className="text-left p-2">Ready</th>
                        <th className="text-left p-2">Restarts</th>
                      </>
                    )}
                    {resourceType === 'deployments' && (
                      <>
                        <th className="text-left p-2">Ready</th>
                        <th className="text-left p-2">Available</th>
                      </>
                    )}
                    {resourceType === 'services' && (
                      <>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Cluster IP</th>
                      </>
                    )}
                    <th className="text-left p-2">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr
                      key={resource.name}
                      onClick={() => handleResourceClick(resource)}
                      className={`border-b border-[#2a2a2a] cursor-pointer hover:bg-[#1a1a1a] ${
                        selectedResource?.name === resource.name ? 'bg-[#1a1a1a]' : ''
                      }`}
                    >
                      <td className="p-2 text-white">{resource.name}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            resource.status === 'Running' || resource.status === 'Active'
                              ? 'bg-green-900 text-green-300'
                              : resource.status === 'Pending'
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-red-900 text-red-300'
                          }`}
                        >
                          {resource.status}
                        </span>
                      </td>
                      {resourceType === 'pods' && (
                        <>
                          <td className="p-2 text-gray-300">{resource.ready}</td>
                          <td className="p-2 text-gray-300">{resource.restarts}</td>
                        </>
                      )}
                      {resourceType === 'deployments' && (
                        <>
                          <td className="p-2 text-gray-300">{resource.ready}</td>
                          <td className="p-2 text-gray-300">{resource.available}</td>
                        </>
                      )}
                      {resourceType === 'services' && (
                        <>
                          <td className="p-2 text-gray-300">{resource.type}</td>
                          <td className="p-2 text-gray-300">{resource.clusterIP}</td>
                        </>
                      )}
                      <td className="p-2 text-gray-400">{resource.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resource Details */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedResource ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedResource.name || selectedResource.metadata?.name}
              </h3>
              {resourceType === 'pods' && logs && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Logs</h4>
                  <pre className="bg-[#1a1a1a] rounded p-3 font-mono text-xs text-white overflow-x-auto max-h-96 overflow-y-auto">
                    {logs}
                  </pre>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Details</h4>
                <pre className="bg-[#1a1a1a] rounded p-3 font-mono text-xs text-white overflow-x-auto">
                  {JSON.stringify(selectedResource, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a resource to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

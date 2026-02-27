import { describe, it, expect, vi, beforeEach } from 'vitest';
import { K8sLens } from './lens';
import * as k8s from '@kubernetes/client-node';

// Mock kubernetes-client
vi.mock('@kubernetes/client-node');
vi.mock('./config', () => ({
  K8sConfigManager: vi.fn().mockImplementation(() => ({
    exists: () => true,
    loadConfig: () => new k8s.KubeConfig(),
  })),
}));

describe('K8sLens', () => {
  let lens: K8sLens;
  let mockCoreApi: any;
  let mockAppsApi: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock APIs
    mockCoreApi = {
      listNamespace: vi.fn(),
      listNamespacedPod: vi.fn(),
      listNamespacedService: vi.fn(),
    };
    
    mockAppsApi = {
      listNamespacedDeployment: vi.fn(),
    };

    // Mock KubeConfig behavior
    k8s.KubeConfig.prototype.makeApiClient = vi.fn().mockImplementation((apiType) => {
      if (apiType === k8s.CoreV1Api) return mockCoreApi;
      if (apiType === k8s.AppsV1Api) return mockAppsApi;
      return {};
    });

    k8s.KubeConfig.prototype.setCurrentContext = vi.fn();
    k8s.KubeConfig.prototype.getCurrentContext = vi.fn().mockReturnValue('minikube');

    lens = new K8sLens();
  });

  it('should initialize and load config', async () => {
    await lens.initialize('test-context');
    expect(k8s.KubeConfig.prototype.setCurrentContext).toHaveBeenCalledWith('test-context');
  });

  it('should list namespaces', async () => {
    mockCoreApi.listNamespace.mockResolvedValue({
      body: {
        items: [
          { metadata: { name: 'default' } },
          { metadata: { name: 'kube-system' } },
        ],
      },
    });

    await lens.initialize();
    const namespaces = await lens.getNamespaces();
    
    expect(namespaces).toEqual(['default', 'kube-system']);
    expect(mockCoreApi.listNamespace).toHaveBeenCalled();
  });

  it('should list pods with details', async () => {
    const mockDate = new Date('2024-01-01T00:00:00Z');
    mockCoreApi.listNamespacedPod.mockResolvedValue({
      body: {
        items: [
          {
            metadata: { 
              name: 'nginx-pod', 
              namespace: 'default',
              creationTimestamp: mockDate,
              labels: { app: 'nginx' }
            },
            status: { 
              phase: 'Running',
              podIP: '10.244.0.5',
              containerStatuses: [{ restartCount: 2 }]
            },
            spec: { nodeName: 'minikube' }
          },
        ],
      },
    });

    await lens.initialize();
    const pods = await lens.getPods('default');

    expect(pods).toHaveLength(1);
    expect(pods[0]).toEqual({
      kind: 'Pod',
      name: 'nginx-pod',
      namespace: 'default',
      status: 'Running',
      creationTimestamp: mockDate.toISOString(),
      labels: { app: 'nginx' },
      details: {
        podIP: '10.244.0.5',
        nodeName: 'minikube',
        restarts: 2,
      },
    });
    expect(mockCoreApi.listNamespacedPod).toHaveBeenCalledWith('default');
  });

  it('should handle empty pod list gracefully', async () => {
    mockCoreApi.listNamespacedPod.mockResolvedValue({ body: { items: [] } });
    
    await lens.initialize();
    const pods = await lens.getPods('default');
    
    expect(pods).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    mockCoreApi.listNamespacedPod.mockRejectedValue(new Error('API Error'));
    
    await lens.initialize();
    const pods = await lens.getPods('default');
    
    expect(pods).toEqual([]);
  });
});

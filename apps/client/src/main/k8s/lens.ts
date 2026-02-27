import * as k8s from '@kubernetes/client-node';
import { K8sConfigManager } from './config.js';

export interface LensResource {
  kind: string;
  name: string;
  namespace: string;
  status: string;
  creationTimestamp: string;
  labels?: Record<string, string>;
  details?: any; // Additional details depending on resource kind
}

export class K8sLens {
  private kc: k8s.KubeConfig;
  private configManager: K8sConfigManager;
  private currentContext: string | null = null;

  constructor() {
    this.configManager = new K8sConfigManager();
    this.kc = new k8s.KubeConfig();
  }

  async initialize(contextName?: string): Promise<void> {
    if (!this.configManager.exists()) {
      return;
    }

    this.kc = this.configManager.loadConfig();
    
    if (contextName) {
      this.kc.setCurrentContext(contextName);
      this.currentContext = contextName;
    } else {
      this.currentContext = this.kc.getCurrentContext();
    }
  }

  async getNamespaces(): Promise<string[]> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    try {
      const response = await coreApi.listNamespace();
      return response.body.items.map(ns => ns.metadata?.name || '').filter(n => n);
    } catch (error) {
      console.error('Failed to list namespaces:', error);
      return [];
    }
  }

  async getPods(namespace: string): Promise<LensResource[]> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    try {
      const response = await coreApi.listNamespacedPod(namespace);
      return response.body.items.map(pod => ({
        kind: 'Pod',
        name: pod.metadata?.name || '',
        namespace: pod.metadata?.namespace || '',
        status: pod.status?.phase || 'Unknown',
        creationTimestamp: pod.metadata?.creationTimestamp?.toISOString() || '',
        labels: pod.metadata?.labels,
        details: {
          podIP: pod.status?.podIP,
          nodeName: pod.spec?.nodeName,
          restarts: pod.status?.containerStatuses?.reduce((acc, curr) => acc + curr.restartCount, 0) || 0,
        }
      }));
    } catch (error) {
      console.error(`Failed to list pods in ${namespace}:`, error);
      return [];
    }
  }

  async getDeployments(namespace: string): Promise<LensResource[]> {
    const appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    try {
      const response = await appsApi.listNamespacedDeployment(namespace);
      return response.body.items.map(deploy => ({
        kind: 'Deployment',
        name: deploy.metadata?.name || '',
        namespace: deploy.metadata?.namespace || '',
        status: `${deploy.status?.availableReplicas || 0}/${deploy.status?.replicas || 0}`,
        creationTimestamp: deploy.metadata?.creationTimestamp?.toISOString() || '',
        labels: deploy.metadata?.labels,
        details: {
          replicas: deploy.status?.replicas,
          available: deploy.status?.availableReplicas,
          unavailable: deploy.status?.unavailableReplicas,
        }
      }));
    } catch (error) {
      console.error(`Failed to list deployments in ${namespace}:`, error);
      return [];
    }
  }

  async getServices(namespace: string): Promise<LensResource[]> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    try {
      const response = await coreApi.listNamespacedService(namespace);
      return response.body.items.map(svc => ({
        kind: 'Service',
        name: svc.metadata?.name || '',
        namespace: svc.metadata?.namespace || '',
        status: svc.spec?.type || 'ClusterIP',
        creationTimestamp: svc.metadata?.creationTimestamp?.toISOString() || '',
        labels: svc.metadata?.labels,
        details: {
          clusterIP: svc.spec?.clusterIP,
          ports: svc.spec?.ports?.map(p => `${p.port}:${p.targetPort}/${p.protocol}`).join(', '),
          selector: svc.spec?.selector,
        }
      }));
    } catch (error) {
      console.error(`Failed to list services in ${namespace}:`, error);
      return [];
    }
  }

  async getResourceDetails(kind: string, name: string, namespace: string): Promise<any> {
    try {
      if (kind === 'Pod') {
        const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
        const response = await coreApi.readNamespacedPod(name, namespace);
        return response.body;
      } else if (kind === 'Deployment') {
        const appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
        const response = await appsApi.readNamespacedDeployment(name, namespace);
        return response.body;
      } else if (kind === 'Service') {
        const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
        const response = await coreApi.readNamespacedService(name, namespace);
        return response.body;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get details for ${kind}/${name}:`, error);
      return null;
    }
  }

  async getPodLogs(namespace: string, podName: string, tailLines: number = 100): Promise<string> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    try {
      const response = await coreApi.readNamespacedPodLog(
        podName, 
        namespace, 
        undefined, 
        false, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        tailLines
      );
      return response.body;
    } catch (error) {
      console.error(`Failed to get logs for pod ${podName}:`, error);
      return `Failed to retrieve logs: ${error}`;
    }
  }
}

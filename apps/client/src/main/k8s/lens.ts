import * as k8s from '@kubernetes/client-node';
import { K8sConfigManager } from './config.js';

export interface K8sNamespace {
  name: string;
  status: string;
  createdAt?: Date;
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  ready: string; // "1/1"
  restarts: number;
  age: string;
  node?: string;
  labels?: Record<string, string>;
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  ready: string; // "3/3"
  upToDate: number;
  available: number;
  age: string;
  labels?: Record<string, string>;
}

export interface K8sService {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP?: string;
  ports: string; // "80:8080/TCP"
  age: string;
  labels?: Record<string, string>;
}

export interface K8sResourceDetails {
  kind: string;
  name: string;
  namespace: string;
  metadata: any;
  spec?: any;
  status?: any;
}

/**
 * Lens - Kubernetes Cluster Visualization
 * Similar to Lens IDE functionality
 */
export class K8sLens {
  private kc: k8s.KubeConfig;
  private configManager: K8sConfigManager;

  constructor() {
    this.configManager = new K8sConfigManager();
    this.kc = new k8s.KubeConfig();
  }

  /**
   * Initialize with context
   */
  async initialize(contextName?: string): Promise<void> {
    if (!this.configManager.exists()) {
      throw new Error('Kubeconfig not found');
    }

    this.kc = this.configManager.loadConfig();
    if (contextName) {
      this.kc.setCurrentContext(contextName);
    }
  }

  /**
   * Get all namespaces
   */
  async getNamespaces(): Promise<K8sNamespace[]> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    const response = await coreApi.listNamespace();

    return response.body.items.map((ns) => ({
      name: ns.metadata!.name!,
      status: ns.status?.phase || 'Unknown',
      createdAt: ns.metadata?.creationTimestamp,
    }));
  }

  /**
   * Get pods in namespace
   */
  async getPods(namespace: string): Promise<K8sPod[]> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    const response = await coreApi.listNamespacedPod(namespace);

    return response.body.items.map((pod) => {
      const readyContainers = pod.status?.containerStatuses?.filter(
        (cs) => cs.ready
      ).length || 0;
      const totalContainers = pod.status?.containerStatuses?.length || 0;
      const restarts = pod.status?.containerStatuses?.reduce(
        (sum, cs) => sum + (cs.restartCount || 0),
        0
      ) || 0;

      const age = this.calculateAge(pod.metadata?.creationTimestamp);

      return {
        name: pod.metadata!.name!,
        namespace: pod.metadata!.namespace!,
        status: pod.status?.phase || 'Unknown',
        ready: `${readyContainers}/${totalContainers}`,
        restarts,
        age,
        node: pod.spec?.nodeName,
        labels: pod.metadata?.labels,
      };
    });
  }

  /**
   * Get deployments in namespace
   */
  async getDeployments(namespace: string): Promise<K8sDeployment[]> {
    const appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    const response = await appsApi.listNamespacedDeployment(namespace);

    return response.body.items.map((deployment) => {
      const ready = deployment.status?.readyReplicas || 0;
      const desired = deployment.spec?.replicas || 0;
      const upToDate = deployment.status?.updatedReplicas || 0;
      const available = deployment.status?.availableReplicas || 0;
      const age = this.calculateAge(deployment.metadata?.creationTimestamp);

      return {
        name: deployment.metadata!.name!,
        namespace: deployment.metadata!.namespace!,
        ready: `${ready}/${desired}`,
        upToDate,
        available,
        age,
        labels: deployment.metadata?.labels,
      };
    });
  }

  /**
   * Get services in namespace
   */
  async getServices(namespace: string): Promise<K8sService[]> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    const response = await coreApi.listNamespacedService(namespace);

    return response.body.items.map((service) => {
      const ports = service.spec?.ports?.map(
        (p) => `${p.port}${p.targetPort ? ':' + p.targetPort : ''}/${p.protocol || 'TCP'}`
      ).join(', ') || '';
      const age = this.calculateAge(service.metadata?.creationTimestamp);

      return {
        name: service.metadata!.name!,
        namespace: service.metadata!.namespace!,
        type: service.spec?.type || 'ClusterIP',
        clusterIP: service.spec?.clusterIP || '',
        externalIP: service.status?.loadBalancer?.ingress?.[0]?.ip,
        ports,
        age,
        labels: service.metadata?.labels,
      };
    });
  }

  /**
   * Get resource details
   */
  async getResourceDetails(
    kind: string,
    name: string,
    namespace: string
  ): Promise<K8sResourceDetails> {
    let response: any;

    switch (kind.toLowerCase()) {
      case 'pod':
        const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
        response = await coreApi.readNamespacedPod(name, namespace);
        return {
          kind: 'Pod',
          name,
          namespace,
          metadata: response.body.metadata,
          spec: response.body.spec,
          status: response.body.status,
        };

      case 'deployment':
        const appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
        response = await appsApi.readNamespacedDeployment(name, namespace);
        return {
          kind: 'Deployment',
          name,
          namespace,
          metadata: response.body.metadata,
          spec: response.body.spec,
          status: response.body.status,
        };

      case 'service':
        const svcApi = this.kc.makeApiClient(k8s.CoreV1Api);
        response = await svcApi.readNamespacedService(name, namespace);
        return {
          kind: 'Service',
          name,
          namespace,
          metadata: response.body.metadata,
          spec: response.body.spec,
          status: response.body.status,
        };

      default:
        throw new Error(`Unsupported resource kind: ${kind}`);
    }
  }

  /**
   * Get pod logs
   */
  async getPodLogs(
    namespace: string,
    podName: string,
    tailLines?: number
  ): Promise<string> {
    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    const response = await coreApi.readNamespacedPodLog(
      podName,
      namespace,
      undefined, // container
      undefined, // follow
      undefined, // limitBytes
      undefined, // pretty
      undefined, // previous
      undefined, // sinceSeconds
      tailLines
    );

    return response.body;
  }

  /**
   * Calculate age from timestamp
   */
  private calculateAge(timestamp?: Date): string {
    if (!timestamp) return 'Unknown';

    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }
}

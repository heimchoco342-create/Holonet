import * as k8s from '@kubernetes/client-node';
import { K8sConfigManager } from './config.js';

export interface K8sService {
  name: string;
  namespace: string;
  ports: number[];
  labels?: Record<string, string>;
}

export class K8sServiceDiscovery {
  private kc: k8s.KubeConfig;
  private configManager: K8sConfigManager;

  constructor() {
    this.configManager = new K8sConfigManager();
    this.kc = new k8s.KubeConfig();
  }

  /**
   * Discover all services in all namespaces
   */
  async discoverAllServices(contextName?: string): Promise<K8sService[]> {
    if (!this.configManager.exists()) {
      return [];
    }

    this.kc = this.configManager.loadConfig();
    
    if (contextName) {
      this.kc.setCurrentContext(contextName);
    }

    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    const services: K8sService[] = [];

    try {
      // Get all namespaces
      const namespaces = await coreApi.listNamespace();
      
      for (const namespace of namespaces.body.items) {
        const nsName = namespace.metadata!.name!;
        
        try {
          // Get services in this namespace
          const servicesResponse = await coreApi.listNamespacedService(nsName);
          
          for (const service of servicesResponse.body.items) {
            const serviceName = service.metadata!.name!;
            const ports = service.spec!.ports?.map((p) => p.port) || [];
            
            // Only include services with ports
            if (ports.length > 0) {
              services.push({
                name: serviceName,
                namespace: nsName,
                ports,
                labels: service.metadata!.labels,
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to list services in namespace ${nsName}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to discover K8s services:', error);
    }

    return services;
  }

  /**
   * Discover services in specific namespace
   */
  async discoverServicesInNamespace(
    namespace: string,
    contextName?: string
  ): Promise<K8sService[]> {
    if (!this.configManager.exists()) {
      return [];
    }

    this.kc = this.configManager.loadConfig();
    
    if (contextName) {
      this.kc.setCurrentContext(contextName);
    }

    const coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    const services: K8sService[] = [];

    try {
      const servicesResponse = await coreApi.listNamespacedService(namespace);
      
      for (const service of servicesResponse.body.items) {
        const serviceName = service.metadata!.name!;
        const ports = service.spec!.ports?.map((p) => p.port) || [];
        
        if (ports.length > 0) {
          services.push({
            name: serviceName,
            namespace,
            ports,
            labels: service.metadata!.labels,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to discover services in namespace ${namespace}:`, error);
    }

    return services;
  }
}

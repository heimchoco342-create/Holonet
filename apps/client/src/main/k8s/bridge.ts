import { K8sTunnel, TunnelConfig } from './tunnel.js';
import { K8sConfigManager } from './config.js';
import { Item } from '@holonet/shared';

export interface BridgeRequest {
  item: Item;
  url: string;
  method: string;
  headers?: Record<string, any>;
  body?: any;
}

export interface BridgeResponse {
  url: string; // Transformed URL (localhost if tunneled)
  tunnelPort?: number;
  originalUrl: string;
}

/**
 * The Bridge - Automatically detects K8s services and creates tunnels
 */
export class K8sBridge {
  private tunnel: K8sTunnel;
  private configManager: K8sConfigManager;
  private activeTunnels: Map<string, number> = new Map();

  constructor() {
    this.tunnel = new K8sTunnel();
    this.configManager = new K8sConfigManager();
  }

  /**
   * Initialize bridge with K8s context
   */
  async initialize(contextName?: string): Promise<void> {
    if (!this.configManager.exists()) {
      console.warn('Kubeconfig not found. K8s tunneling will be disabled.');
      return;
    }

    if (contextName) {
      const kc = this.configManager.loadConfig();
      kc.setCurrentContext(contextName);
      this.tunnel.setContext(contextName);
    }
  }

  /**
   * Get available K8s contexts
   */
  getContexts() {
    if (!this.configManager.exists()) {
      return [];
    }
    return this.configManager.getContexts();
  }

  /**
   * Process request and create tunnel if needed
   */
  async processRequest(request: BridgeRequest): Promise<BridgeResponse> {
    const { item, url } = request;

    // Check if this request needs K8s tunneling
    if (!item.k8sService || !item.k8sPort) {
      return {
        url,
        originalUrl: url,
      };
    }

    const config: TunnelConfig = {
      service: item.k8sService,
      namespace: item.k8sNamespace || 'default',
      port: item.k8sPort,
    };

    try {
      // Create or get existing tunnel
      const tunnelKey = `${config.namespace}/${config.service}:${config.port}`;
      let localPort = this.activeTunnels.get(tunnelKey);

      if (!localPort) {
        localPort = await this.tunnel.createTunnel(config);
        this.activeTunnels.set(tunnelKey, localPort);
      }

      // Transform URL to use localhost tunnel
      const transformedUrl = this.transformUrl(url, localPort);

      return {
        url: transformedUrl,
        tunnelPort: localPort,
        originalUrl: url,
      };
    } catch (error) {
      console.error('Failed to create K8s tunnel:', error);
      throw error;
    }
  }

  /**
   * Transform URL to use localhost tunnel
   */
  private transformUrl(originalUrl: string, localPort: number): string {
    try {
      const url = new URL(originalUrl);
      url.hostname = 'localhost';
      url.port = localPort.toString();
      return url.toString();
    } catch {
      // If URL parsing fails, try simple replacement
      // Replace hostname with localhost and port
      return originalUrl.replace(/https?:\/\/[^\/]+/, `http://localhost:${localPort}`);
    }
  }

  /**
   * Close all active tunnels
   */
  closeAllTunnels(): void {
    for (const [key, port] of this.activeTunnels.entries()) {
      const [namespace, serviceAndPort] = key.split('/');
      const [service, portStr] = serviceAndPort.split(':');
      
      this.tunnel.closeTunnel({
        namespace,
        service,
        port: parseInt(portStr),
      });
    }
    this.activeTunnels.clear();
  }

  /**
   * Close specific tunnel
   */
  closeTunnel(item: Item): void {
    if (!item.k8sService || !item.k8sPort) return;

    const config: TunnelConfig = {
      service: item.k8sService,
      namespace: item.k8sNamespace || 'default',
      port: item.k8sPort,
    };

    this.tunnel.closeTunnel(config);
    const tunnelKey = `${config.namespace}/${config.service}:${config.port}`;
    this.activeTunnels.delete(tunnelKey);
  }
}

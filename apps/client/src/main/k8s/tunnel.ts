import * as k8s from '@kubernetes/client-node';
import * as net from 'net';

export interface TunnelConfig {
  service: string;
  namespace: string;
  port: number;
}

export class K8sTunnel {
  private kc: k8s.KubeConfig;
  private tunnels: Map<string, { port: number; stream: any }> = new Map();

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
  }

  /**
   * Get available Kubernetes contexts
   */
  getContexts(): string[] {
    return this.kc.getContexts().map((ctx) => ctx.name);
  }

  /**
   * Set active context
   */
  setContext(contextName: string): void {
    this.kc.setCurrentContext(contextName);
  }

  /**
   * Create a port forward tunnel to a Kubernetes service
   */
  async createTunnel(config: TunnelConfig): Promise<number> {
    const key = `${config.namespace}/${config.service}:${config.port}`;
    
    // Check if tunnel already exists
    if (this.tunnels.has(key)) {
      return this.tunnels.get(key)!.port;
    }

    const k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
    
    // Find pods for the service
    const pods = await k8sApi.listNamespacedPod(
      config.namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      `app=${config.service}`
    );

    if (pods.body.items.length === 0) {
      throw new Error(`No pods found for service ${config.service} in namespace ${config.namespace}`);
    }

    const podName = pods.body.items[0].metadata!.name!;
    
    // Find an available local port
    const localPort = await this.findAvailablePort();
    
    // Create port forward
    const forward = new k8s.PortForward(this.kc);
    
    // Create a local server that forwards to the pod
    const server = net.createServer((localSocket) => {
      forward.portForward(
        config.namespace,
        podName,
        [config.port],
        localSocket as any,
        localSocket as any,
        process.stderr
      ).catch((err) => {
        console.error('Port forward error:', err);
        localSocket.destroy();
      });
    });

    server.listen(localPort, '127.0.0.1', () => {
      console.log(`Port forward established: localhost:${localPort} -> ${config.namespace}/${podName}:${config.port}`);
    });

    server.on('error', (err) => {
      console.error('Port forward server error:', err);
    });

    this.tunnels.set(key, { port: localPort, stream: server });

    return localPort;
  }

  /**
   * Close a tunnel
   */
  closeTunnel(config: TunnelConfig): void {
    const key = `${config.namespace}/${config.service}:${config.port}`;
    const tunnel = this.tunnels.get(key);
    
    if (tunnel) {
      // Close the stream
      if (tunnel.stream && typeof tunnel.stream.destroy === 'function') {
        tunnel.stream.destroy();
      }
      this.tunnels.delete(key);
    }
  }

  /**
   * Find an available port
   */
  private async findAvailablePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        // server.address() returns AddressInfo | string | null
        // We need AddressInfo object with port property
        if (address && typeof address === 'object' && 'port' in address) {
          const port = address.port;
          server.close(() => {
            if (port > 0) {
              resolve(port);
            } else {
              reject(new Error('Failed to find available port: server returned port 0'));
            }
          });
        } else {
          server.close(() => {
            reject(new Error('Failed to find available port: server.address() did not return AddressInfo object'));
          });
        }
      });
      server.on('error', reject);
    });
  }
}

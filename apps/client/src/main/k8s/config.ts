import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export interface K8sContext {
  name: string;
  cluster: string;
  user: string;
  namespace?: string;
}

export class K8sConfigManager {
  private configPath: string;

  constructor() {
    const homeDir = homedir();
    this.configPath = path.join(homeDir, '.kube', 'config');
  }

  /**
   * Check if kubeconfig exists
   */
  exists(): boolean {
    return fs.existsSync(this.configPath);
  }

  /**
   * Load and parse kubeconfig
   */
  loadConfig(): k8s.KubeConfig {
    const kc = new k8s.KubeConfig();
    if (this.exists()) {
      kc.loadFromFile(this.configPath);
    }
    return kc;
  }

  /**
   * Get all available contexts
   */
  getContexts(): K8sContext[] {
    const kc = this.loadConfig();
    return kc.getContexts().map((ctx) => ({
      name: ctx.name,
      cluster: ctx.cluster || '',
      user: ctx.user || '',
      namespace: ctx.namespace,
    }));
  }

  /**
   * Get current context
   */
  getCurrentContext(): string | null {
    const kc = this.loadConfig();
    return kc.getCurrentContext() || null;
  }
}

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import log from 'electron-log';
import Store from 'electron-store';
import { K8sBridge } from './k8s/bridge.js';
// import { MCPServer } from './mcp/server.js';
import { K8sServiceDiscovery } from './k8s/discovery.js';
import { K8sLens } from './k8s/lens.js';
import { AgentClient } from './api/agent-client.js';

// Configure logging
log.initialize();
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
Object.assign(console, log.functions);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Error Handler
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  dialog.showErrorBox('Critical Error', `An uncaught error occurred:\n\n${error.message}\n\nCheck logs for details.`);
});

// Initialize electron-store
const store = new Store();

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let k8sBridge: K8sBridge | null = null;
// let mcpServer: MCPServer | null = null;
let k8sDiscovery: K8sServiceDiscovery | null = null;
let k8sLens: K8sLens | null = null;
let agentClient: AgentClient | null = null;

function createWindow() {
  // Set app icon (optional, electron-builder will handle it in production)
  let iconPath: string | undefined;
  if (process.env.NODE_ENV === 'development') {
    const devIconPath = path.join(__dirname, '../../build/icon.png');
    try {
      const fs = require('fs');
      if (fs.existsSync(devIconPath)) {
        iconPath = devIconPath;
      }
    } catch {
      // Icon file not found, use default
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    ...(iconPath && { icon: iconPath }),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
    show: false, // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // Always open dev tools in development
    mainWindow.webContents.openDevTools();
    
    // Wait a bit for Vite dev server to be ready, then try loading
    const loadDevServer = () => {
      const ports = [5173, 5174, 5175];
      const hosts = ['localhost', '127.0.0.1', '[::1]'];
      let portIndex = 0;
      let hostIndex = 0;
      
      const tryNext = () => {
        if (portIndex >= ports.length) {
          console.error('All ports failed. Waiting for Vite dev server...');
          // Retry after delay
          setTimeout(() => {
            portIndex = 0;
            hostIndex = 0;
            tryNext();
          }, 2000);
          return;
        }
        
        if (hostIndex >= hosts.length) {
          hostIndex = 0;
          portIndex++;
          setTimeout(tryNext, 500);
          return;
        }
        
        const port = ports[portIndex];
        const host = hosts[hostIndex];
        const devUrl = `http://${host}:${port}`;
        console.log(`Trying to load dev server at ${devUrl}`);
        
        // Check if server is available
        const req = http.request(
          { hostname: host === '[::1]' ? '::1' : host, port, method: 'HEAD', timeout: 1000 },
          (res) => {
            // Server is available, load it
            console.log(`Server found at ${devUrl}`);
            mainWindow?.loadURL(devUrl);
          }
        );
        
        req.on('error', () => {
          // Try next host/port
          hostIndex++;
          setTimeout(tryNext, 300);
        });
        
        req.on('timeout', () => {
          req.destroy();
          hostIndex++;
          setTimeout(tryNext, 300);
        });
        
        req.end();
      };
      
      // Start trying after a short delay
      setTimeout(tryNext, 1000);
    };
    
    loadDevServer();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  log.info('App starting...');
  
  // Initialize K8s Bridge
  k8sBridge = new K8sBridge();
  try {
    await k8sBridge.initialize();
    console.log('K8s Bridge initialized');
  } catch (error) {
    console.warn('Failed to initialize K8s Bridge:', error);
  }

  // Initialize K8s Service Discovery
  k8sDiscovery = new K8sServiceDiscovery();

  // Initialize K8s Lens
  k8sLens = new K8sLens();
  try {
    await k8sLens.initialize();
    console.log('K8s Lens initialized');
  } catch (error) {
    console.warn('Failed to initialize K8s Lens:', error);
  }

  // Initialize Agent Client
  agentClient = new AgentClient(process.env.AGENT_SERVICE_URL || 'http://localhost:3002');
  log.info('Agent Client initialized');

  // Setup IPC handlers
  setupIpcHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  /*
  // Cleanup
  if (k8sBridge) {
    k8sBridge.closeAllTunnels();
  }
  */

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // K8s Bridge IPC handlers
  ipcMain.handle('k8s:get-contexts', async () => {
    if (!k8sBridge) return [];
    return k8sBridge.getContexts();
  });

  ipcMain.handle('k8s:set-context', async (_, contextName: string) => {
    if (!k8sBridge) return;
    await k8sBridge.initialize(contextName);
  });

  ipcMain.handle('k8s:process-request', async (_, request: any) => {
    if (!k8sBridge) {
      return { url: request.url, originalUrl: request.url };
    }
    return await k8sBridge.processRequest(request);
  });

  ipcMain.handle('k8s:close-tunnel', async (_, item: any) => {
    if (!k8sBridge) return;
    k8sBridge.closeTunnel(item);
  });

  ipcMain.handle('k8s:discover-services', async (_, contextName?: string) => {
    if (!k8sDiscovery) return [];
    return await k8sDiscovery.discoverAllServices(contextName);
  });

  ipcMain.handle('k8s:discover-services-namespace', async (_, namespace: string, contextName?: string) => {
    if (!k8sDiscovery) return [];
    return await k8sDiscovery.discoverServicesInNamespace(namespace, contextName);
  });

  // K8s Lens IPC handlers
  ipcMain.handle('lens:get-namespaces', async (_, contextName?: string) => {
    if (!k8sLens) return [];
    await k8sLens.initialize(contextName);
    return await k8sLens.getNamespaces();
  });

  ipcMain.handle('lens:get-pods', async (_, namespace: string, contextName?: string) => {
    if (!k8sLens) return [];
    await k8sLens.initialize(contextName);
    return await k8sLens.getPods(namespace);
  });

  ipcMain.handle('lens:get-deployments', async (_, namespace: string, contextName?: string) => {
    if (!k8sLens) return [];
    await k8sLens.initialize(contextName);
    return await k8sLens.getDeployments(namespace);
  });

  ipcMain.handle('lens:get-services', async (_, namespace: string, contextName?: string) => {
    if (!k8sLens) return [];
    await k8sLens.initialize(contextName);
    return await k8sLens.getServices(namespace);
  });

  ipcMain.handle('lens:get-resource-details', async (_, kind: string, name: string, namespace: string, contextName?: string) => {
    if (!k8sLens) throw new Error('K8s Lens not initialized');
    await k8sLens.initialize(contextName);
    return await k8sLens.getResourceDetails(kind, name, namespace);
  });

  ipcMain.handle('lens:get-pod-logs', async (_, namespace: string, podName: string, tailLines?: number, contextName?: string) => {
    if (!k8sLens) return '';
    await k8sLens.initialize(contextName);
    return await k8sLens.getPodLogs(namespace, podName, tailLines);
  });

  // Agent Client IPC handlers
  ipcMain.handle('agent:send-task', async (_, task: string, context?: any) => {
    if (!agentClient) throw new Error('Agent client not initialized');
    return await agentClient.sendTask(task, context);
  });

  ipcMain.handle('agent:get-status', async () => {
    if (!agentClient) throw new Error('Agent client not initialized');
    return await agentClient.getStatus();
  });

  // Settings IPC handlers
  ipcMain.handle('settings:get', async (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('settings:set', async (_, key: string, value: any) => {
    store.set(key, value);
  });
}

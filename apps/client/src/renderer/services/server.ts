import axios, { AxiosInstance, AxiosError } from 'axios';
import { Workspace, Item, Environment, CreateWorkspaceDto, CreateItemDto, CreateEnvironmentDto } from '@holonet/shared';
import { io, Socket } from 'socket.io-client';
import { localStorage } from './local-storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ServerClient {
  private client: AxiosInstance;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private serverAvailable: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5초 타임아웃
    });
  }

  /**
   * Initialize offline mode and check server availability
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Initialize IndexedDB
    try {
      await localStorage.init();
      console.log('Local storage initialized');
    } catch (error) {
      console.error('Failed to initialize local storage:', error);
    }

    // Check server availability
    await this.checkServerAvailability();

    this.initialized = true;
  }

  /**
   * Check if server is available
   */
  private async checkServerAvailability(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 3000 });
      this.serverAvailable = true;
      await localStorage.updateSyncState({ serverAvailable: true, lastSyncTime: new Date() });
      console.log('Server is available');
      return true;
    } catch (error) {
      this.serverAvailable = false;
      await localStorage.updateSyncState({ serverAvailable: false });
      console.log('Server is not available, using offline mode');
      return false;
    }
  }

  /**
   * Check if server is currently available
   */
  private isServerAvailable(): boolean {
    return this.serverAvailable;
  }

  /**
   * Handle server error and fallback to local storage
   */
  private async handleServerError<T>(
    error: any,
    fallback: () => Promise<T>
  ): Promise<T> {
    if (error instanceof AxiosError) {
      // Network error or connection refused
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        this.serverAvailable = false;
        await localStorage.updateSyncState({ serverAvailable: false });
        console.warn('Server unavailable, using local storage');
        return fallback();
      }
    }
    throw error;
  }

  /**
   * Connect to Socket.io for real-time updates
   */
  connect(): void {
    if (this.socket?.connected) return;

    // Only connect if server is available
    if (!this.isServerAvailable()) {
      console.log('Skipping Socket.io connection (server unavailable)');
      return;
    }

    this.socket = io(API_BASE_URL, {
      transports: ['websocket'],
      timeout: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.serverAvailable = true;
      localStorage.updateSyncState({ serverAvailable: true });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.serverAvailable = false;
      localStorage.updateSyncState({ serverAvailable: false });
    });

    this.socket.on('connect_error', () => {
      console.log('Socket.io connection error');
      this.serverAvailable = false;
      localStorage.updateSyncState({ serverAvailable: false });
    });

    // Forward all events to registered listeners
    const events = [
      'workspace:created',
      'workspace:updated',
      'workspace:deleted',
      'item:created',
      'item:updated',
      'item:deleted',
      'environment:created',
      'environment:updated',
      'environment:deleted',
    ];

    for (const event of events) {
      this.socket.on(event, (data) => {
        const handlers = this.listeners.get(event);
        if (handlers) {
          handlers.forEach((handler) => handler(data));
        }
      });
    }
  }

  /**
   * Subscribe to real-time events
   */
  on(event: string, handler: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Workspace APIs
   */
  async getWorkspaces(): Promise<Workspace[]> {
    // If server is not available, return local workspaces immediately
    if (!this.isServerAvailable()) {
      return await localStorage.getWorkspaces();
    }

    try {
      const response = await this.client.get('/api/workspaces');
      const workspaces = response.data;

      // Save to local storage as backup (for offline mode)
      // Note: Server sync will be implemented later
      await localStorage.saveAllWorkspaces(workspaces);
      await localStorage.updateSyncState({ lastSyncTime: new Date() });

      return workspaces;
    } catch (error) {
      // Fallback to local storage if server request fails
      return await localStorage.getWorkspaces();
    }
  }

  async getWorkspace(id: string): Promise<Workspace> {
    // If server is not available, return local workspace immediately
    if (!this.isServerAvailable()) {
      const workspace = await localStorage.getWorkspace(id);
      if (!workspace) {
        throw new Error(`Workspace ${id} not found`);
      }
      return workspace;
    }

    try {
      const response = await this.client.get(`/api/workspaces/${id}`);
      const workspace = response.data;

      // Save to local storage
      await localStorage.saveWorkspace(workspace);

      return workspace;
    } catch (error) {
      // Fallback to local storage if server request fails
      const workspace = await localStorage.getWorkspace(id);
      if (!workspace) {
        throw new Error(`Workspace ${id} not found`);
      }
      return workspace;
    }
  }

  async createWorkspace(data: CreateWorkspaceDto): Promise<Workspace> {
    // If server is not available, create locally immediately
    if (!this.isServerAvailable()) {
      const workspace: Workspace = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        items: [],
        environments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await localStorage.saveWorkspace(workspace);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'create',
      //   entity: 'workspace',
      //   data: workspace,
      // });

      return workspace;
    }

    try {
      const response = await this.client.post('/api/workspaces', data);
      const workspace = response.data;

      // Save to local storage
      await localStorage.saveWorkspace(workspace);

      return workspace;
    } catch (error) {
      // Fallback to local storage if server request fails
      const workspace: Workspace = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        items: [],
        environments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await localStorage.saveWorkspace(workspace);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'create',
      //   entity: 'workspace',
      //   data: workspace,
      // });

      return workspace;
    }
  }

  async updateWorkspace(id: string, data: Partial<CreateWorkspaceDto>): Promise<Workspace> {
    // If server is not available, update locally immediately
    if (!this.isServerAvailable()) {
      const existing = await localStorage.getWorkspace(id);
      if (!existing) {
        throw new Error(`Workspace ${id} not found`);
      }

      const updated: Workspace = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      await localStorage.saveWorkspace(updated);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'update',
      //   entity: 'workspace',
      //   data: updated,
      // });

      return updated;
    }

    try {
      const response = await this.client.put(`/api/workspaces/${id}`, data);
      const workspace = response.data;

      // Update local storage
      await localStorage.saveWorkspace(workspace);

      return workspace;
    } catch (error) {
      // Fallback to local storage if server request fails
      const existing = await localStorage.getWorkspace(id);
      if (!existing) {
        throw new Error(`Workspace ${id} not found`);
      }

      const updated: Workspace = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      await localStorage.saveWorkspace(updated);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'update',
      //   entity: 'workspace',
      //   data: updated,
      // });

      return updated;
    }
  }

  async deleteWorkspace(id: string): Promise<void> {
    // If server is not available, delete locally immediately
    if (!this.isServerAvailable()) {
      await localStorage.deleteWorkspace(id);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'delete',
      //   entity: 'workspace',
      //   data: { id },
      // });
      return;
    }

    try {
      await this.client.delete(`/api/workspaces/${id}`);
      await localStorage.deleteWorkspace(id);
    } catch (error) {
      // Fallback to local storage if server request fails
      await localStorage.deleteWorkspace(id);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'delete',
      //   entity: 'workspace',
      //   data: { id },
      // });
    }
  }

  /**
   * Item APIs
   */
  async getItems(workspaceId: string): Promise<Item[]> {
    // If server is not available, return local items immediately
    if (!this.isServerAvailable()) {
      return await localStorage.getItems(workspaceId);
    }

    try {
      const response = await this.client.get(`/api/workspaces/${workspaceId}/items`);
      const items = response.data;

      // Save to local storage
      await localStorage.saveAllItems(items);

      return items;
    } catch (error) {
      // Fallback to local storage if server request fails
      return await localStorage.getItems(workspaceId);
    }
  }

  async createItem(data: CreateItemDto): Promise<Item> {
    // If server is not available, create locally immediately
    if (!this.isServerAvailable()) {
      const item: Item = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: data.workspaceId,
        parentId: data.parentId || null,
        type: data.type,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.body,
        k8sService: data.k8sService,
        k8sNamespace: data.k8sNamespace || 'default',
        k8sPort: data.k8sPort,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await localStorage.saveItem(item);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'create',
      //   entity: 'item',
      //   data: item,
      // });

      return item;
    }

    try {
      const response = await this.client.post('/api/items', data);
      const item = response.data;

      // Save to local storage
      await localStorage.saveItem(item);

      return item;
    } catch (error) {
      // Fallback to local storage if server request fails
      const item: Item = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: data.workspaceId,
        parentId: data.parentId || null,
        type: data.type,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.body,
        k8sService: data.k8sService,
        k8sNamespace: data.k8sNamespace || 'default',
        k8sPort: data.k8sPort,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await localStorage.saveItem(item);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'create',
      //   entity: 'item',
      //   data: item,
      // });

      return item;
    }
  }

  async updateItem(id: string, data: Partial<CreateItemDto>): Promise<Item> {
    // If server is not available, update locally immediately
    if (!this.isServerAvailable()) {
      const existing = await localStorage.getItem(id);
      if (!existing) {
        throw new Error(`Item ${id} not found`);
      }

      const updated: Item = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      await localStorage.saveItem(updated);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'update',
      //   entity: 'item',
      //   data: updated,
      // });

      return updated;
    }

    try {
      const response = await this.client.put(`/api/items/${id}`, data);
      const item = response.data;

      // Update local storage
      await localStorage.saveItem(item);

      return item;
    } catch (error) {
      // Fallback to local storage if server request fails
      const existing = await localStorage.getItem(id);
      if (!existing) {
        throw new Error(`Item ${id} not found`);
      }

      const updated: Item = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      await localStorage.saveItem(updated);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'update',
      //   entity: 'item',
      //   data: updated,
      // });

      return updated;
    }
  }

  async deleteItem(id: string): Promise<void> {
    // If server is not available, delete locally immediately
    if (!this.isServerAvailable()) {
      await localStorage.deleteItem(id);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'delete',
      //   entity: 'item',
      //   data: { id },
      // });
      return;
    }

    try {
      await this.client.delete(`/api/items/${id}`);
      await localStorage.deleteItem(id);
    } catch (error) {
      // Fallback to local storage if server request fails
      await localStorage.deleteItem(id);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'delete',
      //   entity: 'item',
      //   data: { id },
      // });
    }
  }

  /**
   * Environment APIs
   */
  async getEnvironments(workspaceId: string): Promise<Environment[]> {
    // If server is not available, return local environments immediately
    if (!this.isServerAvailable()) {
      return await localStorage.getEnvironments(workspaceId);
    }

    try {
      const response = await this.client.get(`/api/workspaces/${workspaceId}/environments`);
      const environments = response.data;

      // Save to local storage
      await localStorage.saveAllEnvironments(environments);

      return environments;
    } catch (error) {
      // Fallback to local storage if server request fails
      return await localStorage.getEnvironments(workspaceId);
    }
  }

  async createEnvironment(data: CreateEnvironmentDto): Promise<Environment> {
    // If server is not available, create locally immediately
    if (!this.isServerAvailable()) {
      const environment: Environment = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: data.workspaceId,
        name: data.name,
        variables: data.variables,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await localStorage.saveEnvironment(environment);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'create',
      //   entity: 'environment',
      //   data: environment,
      // });

      return environment;
    }

    try {
      const response = await this.client.post('/api/environments', data);
      const environment = response.data;

      // Save to local storage
      await localStorage.saveEnvironment(environment);

      return environment;
    } catch (error) {
      // Fallback to local storage if server request fails
      const environment: Environment = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: data.workspaceId,
        name: data.name,
        variables: data.variables,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await localStorage.saveEnvironment(environment);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'create',
      //   entity: 'environment',
      //   data: environment,
      // });

      return environment;
    }
  }

  async updateEnvironment(id: string, data: Partial<CreateEnvironmentDto>): Promise<Environment> {
    // If server is not available, update locally immediately
    if (!this.isServerAvailable()) {
      const existing = await localStorage.getEnvironment(id);
      if (!existing) {
        throw new Error(`Environment ${id} not found`);
      }

      const updated: Environment = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      await localStorage.saveEnvironment(updated);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'update',
      //   entity: 'environment',
      //   data: updated,
      // });

      return updated;
    }

    try {
      const response = await this.client.put(`/api/environments/${id}`, data);
      const environment = response.data;

      // Update local storage
      await localStorage.saveEnvironment(environment);

      return environment;
    } catch (error) {
      // Fallback to local storage if server request fails
      const existing = await localStorage.getEnvironment(id);
      if (!existing) {
        throw new Error(`Environment ${id} not found`);
      }

      const updated: Environment = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      await localStorage.saveEnvironment(updated);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'update',
      //   entity: 'environment',
      //   data: updated,
      // });

      return updated;
    }
  }

  async deleteEnvironment(id: string): Promise<void> {
    // If server is not available, delete locally immediately
    if (!this.isServerAvailable()) {
      await localStorage.deleteEnvironment(id);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'delete',
      //   entity: 'environment',
      //   data: { id },
      // });
      return;
    }

    try {
      await this.client.delete(`/api/environments/${id}`);
      await localStorage.deleteEnvironment(id);
    } catch (error) {
      // Fallback to local storage if server request fails
      await localStorage.deleteEnvironment(id);
      // TODO: Server sync will be implemented later
      // await localStorage.addPendingChange({
      //   type: 'delete',
      //   entity: 'environment',
      //   data: { id },
      // });
    }
  }
}

export const serverClient = new ServerClient();

import { Workspace, Item, Environment } from '@holonet/shared';

const DB_NAME = 'holonet';
const DB_VERSION = 1;

interface SyncState {
  lastSyncTime: Date | null;
  pendingChanges: PendingChange[];
  serverAvailable: boolean;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'workspace' | 'item' | 'environment';
  data: any;
  timestamp: Date;
}

class LocalStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Workspaces store
        if (!db.objectStoreNames.contains('workspaces')) {
          const workspaceStore = db.createObjectStore('workspaces', { keyPath: 'id' });
          workspaceStore.createIndex('name', 'name', { unique: false });
        }

        // Items store
        if (!db.objectStoreNames.contains('items')) {
          const itemStore = db.createObjectStore('items', { keyPath: 'id' });
          itemStore.createIndex('workspaceId', 'workspaceId', { unique: false });
          itemStore.createIndex('parentId', 'parentId', { unique: false });
        }

        // Environments store
        if (!db.objectStoreNames.contains('environments')) {
          const envStore = db.createObjectStore('environments', { keyPath: 'id' });
          envStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        }

        // Sync state store
        if (!db.objectStoreNames.contains('syncState')) {
          db.createObjectStore('syncState', { keyPath: 'id' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('workspaces');
      const request = store.getAll();
      request.onsuccess = () => {
        const workspaces = (request.result || []).map((w: any) => ({
          ...w,
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
          updatedAt: w.updatedAt ? new Date(w.updatedAt) : new Date(),
        }));
        resolve(workspaces);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('workspaces');
      const request = store.get(id);
      request.onsuccess = () => {
        const workspace = request.result;
        if (!workspace) {
          resolve(null);
          return;
        }
        resolve({
          ...workspace,
          createdAt: workspace.createdAt ? new Date(workspace.createdAt) : new Date(),
          updatedAt: workspace.updatedAt ? new Date(workspace.updatedAt) : new Date(),
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('workspaces', 'readwrite');
      // Convert Date objects to ISO strings for IndexedDB
      const serialized = {
        ...workspace,
        createdAt: workspace.createdAt instanceof Date ? workspace.createdAt.toISOString() : workspace.createdAt,
        updatedAt: workspace.updatedAt instanceof Date ? workspace.updatedAt.toISOString() : workspace.updatedAt,
      };
      const request = store.put(serialized);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWorkspace(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('workspaces', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Items
  async getItems(workspaceId: string): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('items');
      const index = store.index('workspaceId');
      const request = index.getAll(workspaceId);
      request.onsuccess = () => {
        const items = (request.result || []).map((item: any) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        }));
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getItem(id: string): Promise<Item | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('items');
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          resolve(null);
          return;
        }
        resolve({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveItem(item: Item): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('items', 'readwrite');
      const serialized = {
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
      };
      const request = store.put(serialized);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('items', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Environments
  async getEnvironments(workspaceId: string): Promise<Environment[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('environments');
      const index = store.index('workspaceId');
      const request = index.getAll(workspaceId);
      request.onsuccess = () => {
        const environments = (request.result || []).map((env: any) => ({
          ...env,
          createdAt: env.createdAt ? new Date(env.createdAt) : new Date(),
          updatedAt: env.updatedAt ? new Date(env.updatedAt) : new Date(),
        }));
        resolve(environments);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getEnvironment(id: string): Promise<Environment | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('environments');
      const request = store.get(id);
      request.onsuccess = () => {
        const environment = request.result;
        if (!environment) {
          resolve(null);
          return;
        }
        resolve({
          ...environment,
          createdAt: environment.createdAt ? new Date(environment.createdAt) : new Date(),
          updatedAt: environment.updatedAt ? new Date(environment.updatedAt) : new Date(),
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveEnvironment(environment: Environment): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('environments', 'readwrite');
      const serialized = {
        ...environment,
        createdAt: environment.createdAt instanceof Date ? environment.createdAt.toISOString() : environment.createdAt,
        updatedAt: environment.updatedAt instanceof Date ? environment.updatedAt.toISOString() : environment.updatedAt,
      };
      const request = store.put(serialized);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEnvironment(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('environments', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync State
  async getSyncState(): Promise<SyncState> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('syncState');
      const request = store.get('main');
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve({
            lastSyncTime: null,
            pendingChanges: [],
            serverAvailable: false,
          });
          return;
        }
        resolve({
          ...result,
          lastSyncTime: result.lastSyncTime ? new Date(result.lastSyncTime) : null,
          pendingChanges: (result.pendingChanges || []).map((change: any) => ({
            ...change,
            timestamp: change.timestamp ? new Date(change.timestamp) : new Date(),
          })),
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncState(updates: Partial<SyncState>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const current = await this.getSyncState();
      const updated: SyncState = {
        ...current,
        ...updates,
      };

      const store = this.getStore('syncState', 'readwrite');
      const serialized = {
        id: 'main',
        ...updated,
        lastSyncTime: updated.lastSyncTime ? updated.lastSyncTime.toISOString() : null,
        pendingChanges: (updated.pendingChanges || []).map((change) => ({
          ...change,
          timestamp: change.timestamp instanceof Date ? change.timestamp.toISOString() : change.timestamp,
        })),
      };
      const request = store.put(serialized);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Pending Changes
  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const state = await this.getSyncState();
      const newChange: PendingChange = {
        ...change,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };

      state.pendingChanges.push(newChange);
      await this.updateSyncState({ pendingChanges: state.pendingChanges });
      resolve();
    });
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    const state = await this.getSyncState();
    return state.pendingChanges;
  }

  async clearPendingChanges(): Promise<void> {
    await this.updateSyncState({ pendingChanges: [] });
  }

  // Bulk operations
  async saveAllWorkspaces(workspaces: Workspace[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('workspaces', 'readwrite');
      const transaction = store.transaction;

      let completed = 0;
      const total = workspaces.length;

      if (total === 0) {
        resolve();
        return;
      }

      workspaces.forEach((workspace) => {
        const serialized = {
          ...workspace,
          createdAt: workspace.createdAt instanceof Date ? workspace.createdAt.toISOString() : workspace.createdAt,
          updatedAt: workspace.updatedAt instanceof Date ? workspace.updatedAt.toISOString() : workspace.updatedAt,
        };
        const request = store.put(serialized);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async saveAllItems(items: Item[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('items', 'readwrite');
      const transaction = store.transaction;

      let completed = 0;
      const total = items.length;

      if (total === 0) {
        resolve();
        return;
      }

      items.forEach((item) => {
        const serialized = {
          ...item,
          createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
          updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
        };
        const request = store.put(serialized);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async saveAllEnvironments(environments: Environment[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('environments', 'readwrite');
      const transaction = store.transaction;

      let completed = 0;
      const total = environments.length;

      if (total === 0) {
        resolve();
        return;
      }

      environments.forEach((environment) => {
        const serialized = {
          ...environment,
          createdAt: environment.createdAt instanceof Date ? environment.createdAt.toISOString() : environment.createdAt,
          updatedAt: environment.updatedAt instanceof Date ? environment.updatedAt.toISOString() : environment.updatedAt,
        };
        const request = store.put(serialized);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

export const localStorage = new LocalStorageService();
export type { SyncState, PendingChange };

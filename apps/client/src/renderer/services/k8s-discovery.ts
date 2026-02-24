import { CreateItemDto } from '@holonet/shared';
import { serverClient } from './server';

export interface DiscoveredService {
  name: string;
  namespace: string;
  ports: number[];
  labels?: Record<string, string>;
}

/**
 * Convert discovered K8s services to collection items
 */
export async function syncK8sServicesToCollection(
  workspaceId: string,
  services: DiscoveredService[]
): Promise<void> {
  // Group services by namespace
  const byNamespace = new Map<string, DiscoveredService[]>();
  
  for (const service of services) {
    if (!byNamespace.has(service.namespace)) {
      byNamespace.set(service.namespace, []);
    }
    byNamespace.get(service.namespace)!.push(service);
  }

  // Fetch all items once for the entire workspace
  // This avoids N+M+1 query problem where N is namespaces and M is services
  let allItems: any[];
  try {
    allItems = await serverClient.getItems(workspaceId);
  } catch (error) {
    console.error('Failed to fetch items for workspace:', error);
    return;
  }

  // Create namespace folders and service items
  for (const [namespace, namespaceServices] of byNamespace.entries()) {
    // Create namespace folder
    let namespaceFolder: any;
    
    try {
      // Check if folder already exists (using cached items)
      const existingFolder = allItems.find(
        (item) => item.type === 'FOLDER' && item.name === `namespace:${namespace}`
      );

      if (existingFolder) {
        namespaceFolder = existingFolder;
      } else {
        namespaceFolder = await serverClient.createItem({
          workspaceId,
          parentId: null,
          type: 'FOLDER',
          name: `namespace:${namespace}`,
          sortOrder: 0,
          k8sNamespace: namespace, // Required by DTO schema
        });
        // Add to cache for subsequent checks
        allItems.push(namespaceFolder);
      }
    } catch (error) {
      console.error(`Failed to create namespace folder for ${namespace}:`, error);
      continue;
    }

    // Create service items
    for (const service of namespaceServices) {
      try {
        // Check if service item already exists (using cached items)
        const existingItem = allItems.find(
          (item) =>
            item.type === 'REQUEST' &&
            item.k8sService === service.name &&
            item.k8sNamespace === service.namespace
        );

        if (existingItem) {
          // Update existing item
          const updatedItem = await serverClient.updateItem(existingItem.id, {
            k8sPort: service.ports[0], // Use first port
          });
          // Update cache
          const index = allItems.findIndex(item => item.id === existingItem.id);
          if (index !== -1) {
            allItems[index] = updatedItem;
          }
        } else {
          // Create new service item
          const primaryPort = service.ports[0];
          
          const newItem = await serverClient.createItem({
            workspaceId,
            parentId: namespaceFolder.id,
            type: 'REQUEST',
            name: service.name,
            sortOrder: 0,
            method: 'GET',
            url: `http://${service.name}/`,
            k8sService: service.name,
            k8sNamespace: service.namespace,
            k8sPort: primaryPort,
          });
          // Add to cache
          allItems.push(newItem);
        }
      } catch (error) {
        console.error(`Failed to create item for service ${service.name}:`, error);
      }
    }
  }
}
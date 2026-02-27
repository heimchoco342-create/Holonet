import { Workspace, Item, ItemType, Protocol, HttpMethod, Environment } from '@holonet/shared';
import { randomUUID } from 'crypto';

export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
  };
  item: PostmanItem[];
  variable?: PostmanVariable[];
}

export interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  request?: {
    method?: string;
    header?: Array<{ key: string; value: string; disabled?: boolean }>;
    body?: {
      mode?: string;
      raw?: string;
      formdata?: Array<{ key: string; value: string; disabled?: boolean }>;
      urlencoded?: Array<{ key: string; value: string; disabled?: boolean }>;
    };
    url?: {
      raw?: string;
      host?: string[] | string;
      path?: string[] | string;
      query?: Array<{ key: string; value: string; disabled?: boolean }>;
    };
  };
  response?: any[];
}

export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
}

export class PostmanImporter {
  /**
   * Parse Postman collection v2.1 JSON string into a Holonet Workspace
   */
  async parse(jsonString: string): Promise<Workspace> {
    console.log('PostmanImporter: parsing collection...');
    
    let collection: PostmanCollection;
    try {
      collection = JSON.parse(jsonString);
    } catch (error) {
      console.error('PostmanImporter: Invalid JSON string', error);
      throw new Error('Invalid JSON string provided for Postman import');
    }

    if (!collection.info || !collection.item) {
      console.error('PostmanImporter: Invalid Postman collection format');
      throw new Error('Invalid Postman collection format: missing info or item');
    }

    console.log(`PostmanImporter: Found collection "${collection.info.name}"`);

    const workspaceId = randomUUID();
    const now = new Date();

    const workspace: Workspace = {
      id: workspaceId,
      name: collection.info.name,
      items: [],
      environments: [],
      createdAt: now,
      updatedAt: now,
    };

    // Convert Variables to Environment
    if (collection.variable && collection.variable.length > 0) {
      console.log(`PostmanImporter: Found ${collection.variable.length} variables`);
      const variables: Record<string, any> = {};
      for (const v of collection.variable) {
        variables[v.key] = v.value;
      }

      const env: Environment = {
        id: randomUUID(),
        workspaceId,
        name: 'Postman Variables',
        variables,
        createdAt: now,
        updatedAt: now,
      };
      workspace.environments.push(env);
    }

    // Convert Items
    workspace.items = this.convertItems(collection.item, workspaceId, null);
    
    console.log(`PostmanImporter: Parsed ${workspace.items.length} root items`);
    
    return workspace;
  }

  private convertItems(
    postmanItems: PostmanItem[],
    workspaceId: string,
    parentId: string | null
  ): Item[] {
    const items: Item[] = [];
    const now = new Date();

    postmanItems.forEach((pItem, index) => {
      const id = randomUUID();
      const sortOrder = index;

      if (pItem.item) {
        // Folder
        const folder: Item = {
          id,
          workspaceId,
          parentId,
          type: 'FOLDER',
          name: pItem.name,
          sortOrder,
          children: [],
          createdAt: now,
          updatedAt: now,
        };

        // Recursively process children
        folder.children = this.convertItems(pItem.item, workspaceId, id);
        items.push(folder);
      } else if (pItem.request) {
        // Request
        const request = pItem.request;
        const method = (request.method || 'GET').toUpperCase() as HttpMethod;
        const url = this.buildUrl(request.url);
        const headers = this.buildHeaders(request.header);
        const body = this.buildBody(request.body);

        const item: Item = {
          id,
          workspaceId,
          parentId,
          type: 'REQUEST',
          name: pItem.name,
          sortOrder,
          protocol: 'HTTP',
          method,
          url,
          headers,
          body,
          children: [],
          createdAt: now,
          updatedAt: now,
        };
        items.push(item);
      }
    });

    return items;
  }

  /**
   * Build URL from Postman URL object
   */
  private buildUrl(url?: PostmanItem['request']['url']): string | undefined {
    if (!url) return undefined;

    if (url.raw) {
      return url.raw;
    }

    // Handle object format
    // Postman 2.1 URL can be an object with host, path, query
    const host = Array.isArray(url.host) ? url.host.join('.') : (url.host || '');
    const path = Array.isArray(url.path) ? url.path.join('/') : (url.path || '');
    
    let queryString = '';
    if (url.query && Array.isArray(url.query)) {
      const params = url.query
        .filter(q => !q.disabled) // Skip disabled query params
        .map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
        .join('&');
      if (params) {
        queryString = `?${params}`;
      }
    }

    let fullUrl = host;
    if (path) {
      // Ensure host doesn't end with / and path doesn't start with / if we concat
      // But typically join('/') handles the path parts.
      // If host exists and path exists, we might need a slash.
      // However, usually host is just domain.
      fullUrl += `/${path}`;
    }
    
    return (fullUrl + queryString) || undefined;
  }

  /**
   * Build headers object from Postman header array
   */
  private buildHeaders(
    headers?: PostmanItem['request']['header']
  ): Record<string, any> | undefined {
    if (!headers || !Array.isArray(headers) || headers.length === 0) return undefined;

    const result: Record<string, any> = {};
    for (const header of headers) {
      if (!header.disabled) { // Skip disabled headers
         result[header.key] = header.value;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Build body object from Postman body
   */
  private buildBody(body?: PostmanItem['request']['body']): Record<string, any> | undefined {
    if (!body) return undefined;

    if (body.mode === 'raw' && body.raw) {
      try {
        // Try parsing JSON if possible, otherwise treat as raw string
        return JSON.parse(body.raw);
      } catch {
        return { raw: body.raw };
      }
    }

    if (body.mode === 'formdata' && body.formdata) {
      const result: Record<string, any> = {};
      for (const field of body.formdata) {
        if (!field.disabled) {
           result[field.key] = field.value;
        }
      }
      return result;
    }

    if (body.mode === 'urlencoded' && body.urlencoded) {
      const result: Record<string, any> = {};
      for (const field of body.urlencoded) {
         if (!field.disabled) {
            result[field.key] = field.value;
         }
      }
      return result;
    }

    return undefined;
  }
}

import { CreateItemDto } from '@holonet/shared';

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
    header?: Array<{ key: string; value: string }>;
    body?: {
      mode?: string;
      raw?: string;
      formdata?: Array<{ key: string; value: string }>;
      urlencoded?: Array<{ key: string; value: string }>;
    };
    url?: {
      raw?: string;
      host?: string[];
      path?: string[];
      query?: Array<{ key: string; value: string }>;
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
   * Import Postman collection v2.1 format
   */
  static import(collection: PostmanCollection, workspaceId: string): {
    items: CreateItemDto[];
    environments: Array<{ name: string; variables: Record<string, any> }>;
  } {
    const items: CreateItemDto[] = [];
    const environments: Array<{ name: string; variables: Record<string, any> }> = [];

    // Convert Postman variables to environment
    if (collection.variable && collection.variable.length > 0) {
      const variables: Record<string, any> = {};
      for (const variable of collection.variable) {
        variables[variable.key] = variable.value;
      }
      environments.push({
        name: 'Imported from Postman',
        variables,
      });
    }

    // Convert Postman items to Holonet items
    // Use temp IDs for folders that will be replaced after creation
    let tempIdCounter = 0;
    const convertItems = (
      postmanItems: PostmanItem[],
      parentId: string | null = null,
      sortOrder: number = 0
    ): CreateItemDto[] => {
      const result: CreateItemDto[] = [];

      for (const postmanItem of postmanItems) {
        if (postmanItem.item) {
          // This is a folder - assign temp ID
          const tempFolderId = `temp-folder-${tempIdCounter++}`;
          const folder: CreateItemDto & { tempId?: string } = {
            workspaceId,
            parentId,
            type: 'FOLDER',
            name: postmanItem.name,
            sortOrder: sortOrder++,
            tempId: tempFolderId,
          };
          result.push(folder);

          // Process children with temp folder ID as parent
          const children = convertItems(postmanItem.item, tempFolderId, 0);
          result.push(...children);
        } else if (postmanItem.request) {
          // This is a request
          const request = postmanItem.request;
          const url = this.buildUrl(request.url);
          const headers = this.buildHeaders(request.header);
          const body = this.buildBody(request.body);

          const item: CreateItemDto = {
            workspaceId,
            parentId,
            type: 'REQUEST',
            name: postmanItem.name,
            sortOrder: sortOrder++,
            method: (request.method || 'GET').toUpperCase() as any,
            url,
            headers: headers && Object.keys(headers).length > 0 ? headers : undefined,
            body: body && Object.keys(body).length > 0 ? body : undefined,
          };
          result.push(item);
        }
      }

      return result;
    };

    items.push(...convertItems(collection.item));

    return { items, environments };
  }

  /**
   * Build URL from Postman URL object
   */
  private static buildUrl(url?: PostmanItem['request']['url']): string | undefined {
    if (!url) return undefined;

    if (url.raw) {
      return url.raw;
    }

    const host = url.host?.join('.') || '';
    const path = url.path?.join('/') || '';
    const query = url.query
      ?.map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
      .join('&');

    let fullUrl = host;
    if (path) {
      fullUrl += `/${path}`;
    }
    if (query) {
      fullUrl += `?${query}`;
    }

    return fullUrl || undefined;
  }

  /**
   * Build headers object from Postman header array
   */
  private static buildHeaders(
    headers?: PostmanItem['request']['header']
  ): Record<string, any> | undefined {
    if (!headers || headers.length === 0) return undefined;

    const result: Record<string, any> = {};
    for (const header of headers) {
      result[header.key] = header.value;
    }
    return result;
  }

  /**
   * Build body object from Postman body
   */
  private static buildBody(body?: PostmanItem['request']['body']): Record<string, any> | undefined {
    if (!body) return undefined;

    if (body.mode === 'raw' && body.raw) {
      try {
        return JSON.parse(body.raw);
      } catch {
        return { raw: body.raw };
      }
    }

    if (body.mode === 'formdata' && body.formdata) {
      const result: Record<string, any> = {};
      for (const field of body.formdata) {
        result[field.key] = field.value;
      }
      return result;
    }

    if (body.mode === 'urlencoded' && body.urlencoded) {
      const result: Record<string, any> = {};
      for (const field of body.urlencoded) {
        result[field.key] = field.value;
      }
      return result;
    }

    return undefined;
  }
}

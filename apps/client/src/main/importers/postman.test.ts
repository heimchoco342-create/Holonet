import { describe, it, expect } from 'vitest';
import { PostmanImporter, PostmanCollection } from './postman';

describe('PostmanImporter', () => {
  const workspaceId = 'workspace-123';

  it('should correctly import a Postman v2.1 collection with folders and requests', () => {
    // 1. Create a mock Postman v2.1 JSON object
    const mockCollection: PostmanCollection = {
      info: {
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Test Folder',
          item: [
            {
              name: 'Get Users',
              request: {
                method: 'GET',
                header: [
                  { key: 'Content-Type', value: 'application/json' },
                  { key: 'Authorization', value: 'Bearer token123' }
                ],
                url: {
                  raw: 'https://api.example.com/users?page=1',
                  host: ['api', 'example', 'com'],
                  path: ['users'],
                  query: [
                    { key: 'page', value: '1' }
                  ]
                }
              }
            }
          ]
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://api.example.com',
          type: 'string'
        }
      ]
    };

    // 2. Call the import method
    const result = PostmanImporter.import(mockCollection, workspaceId);

    // 3. Verify the result structure
    expect(result).toBeDefined();
    expect(result.items).toHaveLength(2); // 1 folder + 1 request
    expect(result.environments).toHaveLength(1);

    // Verify Environment Variables
    expect(result.environments[0]).toEqual({
      name: 'Imported from Postman',
      variables: {
        baseUrl: 'https://api.example.com'
      }
    });

    // Verify Folder
    const folder = result.items.find(i => i.type === 'FOLDER');
    expect(folder).toBeDefined();
    expect(folder?.name).toBe('Test Folder');
    expect(folder?.workspaceId).toBe(workspaceId);
    expect(folder?.parentId).toBeNull();

    // Verify Request
    const request = result.items.find(i => i.type === 'REQUEST');
    expect(request).toBeDefined();
    expect(request?.name).toBe('Get Users');
    expect(request?.workspaceId).toBe(workspaceId);
    expect(request?.method).toBe('GET');
    expect(request?.url).toBe('https://api.example.com/users?page=1');
    
    // Verify Request Headers
    expect(request?.headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    });

    // Verify Parent-Child Relationship
    // The folder should have a tempId, and the request should have that tempId as parentId
    // Note: The implementation uses internal logic for tempIds, we can verify the relationship structure if exposed or implied
    // In the provided implementation, 'items' is a flat list. 
    // The implementation of 'import' generates temp IDs for folders and assigns them to children.
    
    // We can't easily predict the exact tempId string (e.g. "temp-folder-0") without knowing the internal counter state,
    // but we can check that the request's parentId matches the folder's assigned tempId (if it was added to the object).
    // Looking at the code: 
    // const folder: CreateItemDto & { tempId?: string } = { ... tempId: tempFolderId }
    // It pushes this extended object to 'result'.
    
    const folderWithTempId = folder as any;
    expect(folderWithTempId.tempId).toBeDefined();
    expect(request?.parentId).toBe(folderWithTempId.tempId);
  });

  it('should handle simple requests without folders', () => {
     const simpleCollection: PostmanCollection = {
      info: { name: 'Simple', schema: 'v2.1' },
      item: [
        {
          name: 'Simple Request',
          request: {
            method: 'POST',
            url: { raw: 'https://api.test.com' },
            body: {
              mode: 'raw',
              raw: '{"foo":"bar"}'
            }
          }
        }
      ]
    };

    const result = PostmanImporter.import(simpleCollection, workspaceId);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('REQUEST');
    expect(result.items[0].method).toBe('POST');
    expect(result.items[0].body).toEqual({ foo: 'bar' });
  });
});

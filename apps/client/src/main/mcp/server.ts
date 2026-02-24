import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { K8sBridge } from '../k8s/bridge.js';
import { serverClient } from '../../renderer/services/server.js';

export class MCPServer {
  private server: Server;
  private transport: StdioServerTransport;
  private bridge: K8sBridge | null = null;

  constructor(bridge?: K8sBridge) {
    this.bridge = bridge || null;
    this.server = new Server(
      {
        name: 'holonet',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.transport = new StdioServerTransport();
    this.setupHandlers();
  }

  setBridge(bridge: K8sBridge) {
    this.bridge = bridge;
  }

  private setupHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const workspaces = await serverClient.getWorkspaces();
        const resources = [];

        // Add collections resource
        resources.push({
          uri: 'holonet://collections',
          name: 'API Collections',
          description: 'List of all API collections',
          mimeType: 'application/json',
        });

        // Add workspace-specific resources
        for (const workspace of workspaces) {
          resources.push({
            uri: `holonet://collections/${workspace.id}`,
            name: `${workspace.name} - Collections`,
            description: `API collections in workspace: ${workspace.name}`,
            mimeType: 'application/json',
          });

          // Add OpenAPI resources for each workspace
          resources.push({
            uri: `holonet://collections/${workspace.id}/openapi`,
            name: `${workspace.name} - OpenAPI`,
            description: `OpenAPI specification for workspace: ${workspace.name}`,
            mimeType: 'application/json',
          });
        }

        return { resources };
      } catch (error) {
        console.error('Error listing resources:', error);
        return {
          resources: [
            {
              uri: 'holonet://collections',
              name: 'API Collections',
              description: 'List of all API collections',
              mimeType: 'application/json',
            },
          ],
        };
      }
    });

    // Read a resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        if (uri === 'holonet://collections') {
          const workspaces = await serverClient.getWorkspaces();
          const collections = await Promise.all(
            workspaces.map(async (ws) => {
              const items = await serverClient.getItems(ws.id);
              return {
                workspace: {
                  id: ws.id,
                  name: ws.name,
                },
                items: items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  type: item.type,
                  method: item.method,
                  url: item.url,
                })),
              };
            })
          );

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ collections }, null, 2),
              },
            ],
          };
        }

        // Workspace-specific collection
        const workspaceMatch = uri.match(/^holonet:\/\/collections\/([^\/]+)$/);
        if (workspaceMatch) {
          const workspaceId = workspaceMatch[1];
          const workspace = await serverClient.getWorkspace(workspaceId);
          const items = await serverClient.getItems(workspaceId);

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    workspace: {
                      id: workspace.id,
                      name: workspace.name,
                    },
                    items: items.map((item) => ({
                      id: item.id,
                      name: item.name,
                      type: item.type,
                      method: item.method,
                      url: item.url,
                      k8sService: item.k8sService,
                      k8sNamespace: item.k8sNamespace,
                      k8sPort: item.k8sPort,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // OpenAPI format
        const openApiMatch = uri.match(/^holonet:\/\/collections\/([^\/]+)\/openapi$/);
        if (openApiMatch) {
          const workspaceId = openApiMatch[1];
          const workspace = await serverClient.getWorkspace(workspaceId);
          const items = await serverClient.getItems(workspaceId);

          const openApi = this.convertToOpenAPI(workspace, items);

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(openApi, null, 2),
              },
            ],
          };
        }

        throw new Error(`Unknown resource: ${uri}`);
      } catch (error: any) {
        throw new Error(`Failed to read resource: ${error.message}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'execute_k8s_request',
            description: 'Execute an HTTP request through Kubernetes tunnel',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  description: 'Kubernetes service name',
                },
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace',
                  default: 'default',
                },
                path: {
                  type: 'string',
                  description: 'API path (e.g., /api/users)',
                },
                method: {
                  type: 'string',
                  description: 'HTTP method',
                  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                  default: 'GET',
                },
                body: {
                  type: 'object',
                  description: 'Request body (optional)',
                },
                headers: {
                  type: 'object',
                  description: 'Request headers (optional)',
                },
              },
              required: ['service', 'namespace', 'path', 'method'],
            },
          },
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'execute_k8s_request') {
        try {
          if (!this.bridge) {
            throw new Error('K8s Bridge not initialized');
          }

          const { service, namespace, path, method, body, headers } = args as {
            service: string;
            namespace: string;
            path: string;
            method: string;
            body?: any;
            headers?: Record<string, string>;
          };

          // Create a temporary item for the bridge
          const tempItem = {
            id: 'temp',
            workspaceId: 'temp',
            parentId: null,
            type: 'REQUEST' as const,
            name: 'MCP Request',
            sortOrder: 0,
            method: method as any,
            url: `http://${service}${path}`,
            headers,
            body,
            k8sService: service,
            k8sNamespace: namespace || 'default',
            k8sPort: 80, // Default port, should be configurable
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Process through bridge
          const bridgeResponse = await this.bridge.processRequest({
            item: tempItem,
            url: tempItem.url!,
            method: method,
            headers,
            body,
          });

          // Execute the request
          const response = await axios.request({
            url: bridgeResponse.url,
            method: method.toLowerCase() as any,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            data: body,
            timeout: 30000,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    data: response.data,
                    tunnelPort: bridgeResponse.tunnelPort,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.message,
                    stack: error.stack,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  /**
   * Convert workspace items to OpenAPI format
   */
  private convertToOpenAPI(workspace: any, items: any[]): any {
    const paths: Record<string, any> = {};

    for (const item of items) {
      if (item.type === 'REQUEST' && item.method && item.url) {
        try {
          const url = new URL(item.url);
          const pathKey = url.pathname || '/';
          const method = (item.method || 'GET').toLowerCase();

          if (!paths[pathKey]) {
            paths[pathKey] = {};
          }

          paths[pathKey][method] = {
            summary: item.name,
            operationId: `${item.id}_${method}`,
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          };

          if (item.body) {
            paths[pathKey][method].requestBody = {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    example: item.body,
                  },
                },
              },
            };
          }
        } catch {
          // Skip invalid URLs
        }
      }
    }

    return {
      openapi: '3.0.0',
      info: {
        title: workspace.name,
        version: '1.0.0',
      },
      paths,
    };
  }

  async start() {
    await this.server.connect(this.transport);
    console.log('MCP Server started');
  }
}

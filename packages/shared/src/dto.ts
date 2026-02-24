import { z } from 'zod';

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
});

export const CreateItemSchema = z.object({
  workspaceId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(['FOLDER', 'REQUEST']),
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
  protocol: z.enum(['HTTP', 'WebSocket', 'gRPC']).optional().default('HTTP'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  url: z.string().optional(), // Allow non-URL for WebSocket/gRPC
  headers: z.record(z.any()).optional(),
  body: z.record(z.any()).optional(),
  // WebSocket
  wsMessages: z.array(z.any()).optional(),
  // gRPC
  grpcService: z.string().optional(),
  grpcMethod: z.string().optional(),
  grpcProto: z.string().optional(),
  grpcMetadata: z.record(z.any()).optional(),
  // K8s
  k8sService: z.string().optional(),
  k8sNamespace: z.string().default('default'),
  k8sPort: z.number().int().positive().optional(),
});

export const CreateEnvironmentSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1),
  variables: z.record(z.any()),
});

export type CreateWorkspaceDto = z.infer<typeof CreateWorkspaceSchema>;
export type CreateItemDto = z.infer<typeof CreateItemSchema>;
export type CreateEnvironmentDto = z.infer<typeof CreateEnvironmentSchema>;

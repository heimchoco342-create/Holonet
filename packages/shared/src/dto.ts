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
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  url: z.string().url().optional(),
  headers: z.record(z.any()).optional(),
  body: z.record(z.any()).optional(),
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

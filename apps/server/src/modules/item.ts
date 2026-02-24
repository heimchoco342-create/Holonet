import { getPrismaClient } from '../lib/prisma.js';

const prisma = getPrismaClient();

export interface CreateItemInput {
  workspaceId: string;
  parentId?: string | null;
  type: 'FOLDER' | 'REQUEST';
  name: string;
  sortOrder?: number;
  method?: string;
  url?: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  k8sService?: string;
  k8sNamespace?: string;
  k8sPort?: number;
}

export class ItemService {
  async getByWorkspace(workspaceId: string) {
    return prisma.item.findMany({
      where: { workspaceId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getById(id: string) {
    return prisma.item.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async create(data: CreateItemInput) {
    return prisma.item.create({
      data: {
        workspaceId: data.workspaceId,
        parentId: data.parentId,
        type: data.type,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.body,
        k8sService: data.k8sService,
        k8sNamespace: data.k8sNamespace ?? 'default',
        k8sPort: data.k8sPort,
      },
      include: {
        children: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateItemInput>) {
    return prisma.item.update({
      where: { id },
      data,
      include: {
        children: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.item.delete({
      where: { id },
    });
  }
}

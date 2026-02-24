import { getPrismaClient } from '../lib/prisma.js';

const prisma = getPrismaClient();

export class WorkspaceService {
  async getAll() {
    return prisma.workspace.findMany({
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
        },
        environments: true,
      },
    });
  }

  async getById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
        },
        environments: true,
      },
    });
  }

  async create(data: { name: string }) {
    return prisma.workspace.create({
      data: { name: data.name },
      include: {
        items: true,
        environments: true,
      },
    });
  }

  async update(id: string, data: { name?: string }) {
    return prisma.workspace.update({
      where: { id },
      data,
      include: {
        items: true,
        environments: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.workspace.delete({
      where: { id },
    });
  }
}

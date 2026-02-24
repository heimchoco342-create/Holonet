import { getPrismaClient } from '../lib/prisma.js';

const prisma = getPrismaClient();

export interface CreateEnvironmentInput {
  workspaceId: string;
  name: string;
  variables: Record<string, any>;
}

export class EnvironmentService {
  async getByWorkspace(workspaceId: string) {
    return prisma.environment.findMany({
      where: { workspaceId },
    });
  }

  async getById(id: string) {
    return prisma.environment.findUnique({
      where: { id },
    });
  }

  async create(data: CreateEnvironmentInput) {
    return prisma.environment.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        variables: data.variables,
      },
    });
  }

  async update(id: string, data: Partial<CreateEnvironmentInput>) {
    return prisma.environment.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.environment.delete({
      where: { id },
    });
  }
}
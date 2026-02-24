import { PrismaClient } from '@prisma/client';

// Singleton pattern for PrismaClient
// Prisma recommends a single client instance per application
// to properly manage connection pooling and resources
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Export the singleton instance for convenience
export const prismaClient = getPrismaClient();

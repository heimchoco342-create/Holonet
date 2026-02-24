import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { getPrismaClient } from './lib/prisma.js';
import { WorkspaceService } from './modules/workspace.js';
import { ItemService } from './modules/item.js';
import { EnvironmentService } from './modules/environment.js';
import { setupSocketHandlers, emitToWorkspace } from './events/socket.js';

const prisma = getPrismaClient();
const workspaceService = new WorkspaceService();
const itemService = new ItemService();
const environmentService = new EnvironmentService();

const fastify = Fastify({ logger: true });
const io = new Server(fastify.server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Register CORS
await fastify.register(cors, {
  origin: true,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Workspace routes
fastify.get('/api/workspaces', async () => {
  return workspaceService.getAll();
});

fastify.get('/api/workspaces/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const workspace = await workspaceService.getById(id);
  if (!workspace) {
    return reply.code(404).send({ error: 'Workspace not found' });
  }
  return workspace;
});

fastify.post('/api/workspaces', async (request) => {
  const { name } = request.body as { name: string };
  const workspace = await workspaceService.create({ name });
  
  // Emit to all clients
  io.emit('workspace:created', workspace);
  
  return workspace;
});

fastify.put('/api/workspaces/:id', async (request) => {
  const { id } = request.params as { id: string };
  const data = request.body as { name?: string };
  const workspace = await workspaceService.update(id, data);
  
  io.emit('workspace:updated', workspace);
  
  return workspace;
});

fastify.delete('/api/workspaces/:id', async (request) => {
  const { id } = request.params as { id: string };
  await workspaceService.delete(id);
  
  io.emit('workspace:deleted', { id });
  
  return { success: true };
});

// Item routes
fastify.get('/api/workspaces/:workspaceId/items', async (request) => {
  const { workspaceId } = request.params as { workspaceId: string };
  return itemService.getByWorkspace(workspaceId);
});

fastify.post('/api/items', async (request) => {
  const data = request.body as any;
  const item = await itemService.create(data);
  
  emitToWorkspace(io, item.workspaceId, 'item:created', item);
  
  return item;
});

fastify.put('/api/items/:id', async (request) => {
  const { id } = request.params as { id: string };
  const data = request.body as any;
  const item = await itemService.update(id, data);
  
  emitToWorkspace(io, item.workspaceId, 'item:updated', item);
  
  return item;
});

fastify.delete('/api/items/:id', async (request) => {
  const { id } = request.params as { id: string };
  const item = await itemService.getById(id);
  await itemService.delete(id);
  
  if (item) {
    emitToWorkspace(io, item.workspaceId, 'item:deleted', { id });
  }
  
  return { success: true };
});

// Environment routes
fastify.get('/api/workspaces/:workspaceId/environments', async (request) => {
  const { workspaceId } = request.params as { workspaceId: string };
  return environmentService.getByWorkspace(workspaceId);
});

fastify.post('/api/environments', async (request) => {
  const data = request.body as any;
  const environment = await environmentService.create(data);
  
  io.emit('environment:created', environment);
  
  return environment;
});

fastify.put('/api/environments/:id', async (request) => {
  const { id } = request.params as { id: string };
  const data = request.body as any;
  const environment = await environmentService.update(id, data);
  
  io.emit('environment:updated', environment);
  
  return environment;
});

fastify.delete('/api/environments/:id', async (request) => {
  const { id } = request.params as { id: string };
  await environmentService.delete(id);
  
  io.emit('environment:deleted', { id });
  
  return { success: true };
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`Server listening on port ${port}`);
    console.log(`Socket.io server attached to port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

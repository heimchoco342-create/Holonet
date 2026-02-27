import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'agent-service', timestamp: new Date().toISOString() };
});

// Connectivity check
fastify.get('/status', async () => {
  try {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
    const response = await fetch(`${serverUrl}/health`);
    const data = await response.json();
    return { 
      agent: 'ok', 
      server: data.status === 'ok' ? 'connected' : 'error',
      serverUrl
    };
  } catch (error) {
    return { agent: 'ok', server: 'disconnected', error: String(error) };
  }
});

// Basic agent endpoint
fastify.post('/agent/chat', async (request, reply) => {
  const { message } = request.body as { message: string };
  // TODO: Integrate LangChain here
  return { 
    reply: `Echo from agent-service: ${message}`,
    agent: 'Holonet Agent V1'
  };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Agent Service listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

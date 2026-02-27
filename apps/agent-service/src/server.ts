import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const fastify = Fastify({ logger: true });

// Register WebSocket plugin
fastify.register(websocket);

// -- Types --
const RunTaskSchema = z.object({
  task: z.string(),
  tools: z.array(z.any()).optional(),
});

// -- Agent Logic (Simulating "createDeepAgent") --
// This simulates the logic that would be ported from the client.
// It creates a graph that can process a task using an LLM.

async function createDeepAgent(modelName: string = 'gpt-4o') {
  const model = new ChatOpenAI({
    modelName,
    temperature: 0,
    streaming: true,
  });

  // Simple StateGraph workflow
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addEdge("__start__", "agent");

  return workflow.compile();
}

// -- Routes --

fastify.post('/run', async (request, reply) => {
  const result = RunTaskSchema.safeParse(request.body);
  if (!result.success) {
    return reply.code(400).send({ error: 'Invalid body', details: result.error });
  }

  // In a real implementation, we would start a job here and return an ID.
  // The client would then connect to a WebSocket with that ID to receive updates.
  // For this Alpha, we'll just acknowledge receipt.
  
  return { status: 'started', message: 'Task received. Connect to /ws to stream thoughts.' };
});

// WebSocket for streaming thoughts
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection: any, req: any) => {
    connection.socket.on('message', async (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.task) {
          const agent = await createDeepAgent();
          const stream = await agent.stream({
            messages: [new HumanMessage(data.task)],
          });

          for await (const chunk of stream) {
            connection.socket.send(JSON.stringify(chunk));
          }
          connection.socket.send(JSON.stringify({ type: 'done' }));
        }
      } catch (err) {
        connection.socket.send(JSON.stringify({ error: String(err) }));
      }
    });
  });
});

// -- Start Server --
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://0.0.0.0:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
